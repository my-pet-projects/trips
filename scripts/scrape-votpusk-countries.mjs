/**
 * Scraper for votpusk.ru attraction detail pages.
 *
 * For each file in scripts/output/votpusk-countries/, for each data element
 * with isScraped=false, fetches the URL and parses the content using the
 * same logic as parseVotpuskSiteContent in attraction-scraper.ts.
 *
 * Results are stored in the `scrape` object in each data element and
 * isScraped is set to true.
 *
 * Rate limiting: processes CONCURRENCY items in parallel with a shared
 * token-bucket style throttle to avoid overwhelming the server.
 * Extra delays and backoff on errors.
 *
 * Usage:
 *   node scripts/scrape-votpusk-countries.mjs
 *   node scripts/scrape-votpusk-countries.mjs --country AD
 *   node scripts/scrape-votpusk-countries.mjs --dry-run
 *   node scripts/scrape-votpusk-countries.mjs --concurrency 5
 */

import * as cheerio from "cheerio";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "output", "votpusk-countries");

// Parse CLI args
const args = process.argv.slice(2);
const countryFilter = args.includes("--country")
  ? args[args.indexOf("--country") + 1]
  : null;
const dryRun = args.includes("--dry-run");
const CONCURRENCY = args.includes("--concurrency")
  ? parseInt(args[args.indexOf("--concurrency") + 1], 10)
  : 5;

// Rate limiting config
// With 5 parallel workers we space them so we don't burst too hard.
// Each worker waits 2-4s after completing its request before starting the next.
const MIN_DELAY_MS = 2000; // minimum delay per worker after each request
const MAX_DELAY_MS = 4000; // maximum delay per worker after each request
const ERROR_DELAY_MS = 15000; // delay after an error (per worker)
const RATE_LIMIT_DELAY_MS = 60000; // 1 minute after a global 429
const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 15000; // 15 seconds per request

// Save every N completed items (across all workers)
const SAVE_EVERY = 10;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  return sleep(Math.round(ms));
}

function normalizeText(text) {
  return text.trim().replace(/\s+/g, " ").replace(/\n\n+/g, "\n");
}

/**
 * Parse the votpusk.ru attraction page HTML.
 * Mirrors parseVotpuskSiteContent from attraction-scraper.ts
 */
function parseVotpuskHtml(html) {
  const $ = cheerio.load(html);

  // Extract description from first .ln-hl element
  const description = normalizeText($(".ln-hl").first().text());

  // Extract name
  const name = $(".separate-title__name").text().trim();

  // Extract local name from subtitle
  // Format: "Название на английском языке - Local Name."
  const subText = $(".block-head__subtitle").text().trim();
  const localNameMatch = /Название на английском языке\s*[-–—]\s*(.+?)\./.exec(
    subText,
  );
  const localName = localNameMatch?.[1]?.trim() ?? name;

  // Extract coordinates from script tags
  // Pattern: "latitude":12.34567,"longitude":98.76543
  const coordsPattern =
    /"latitude"\s*:\s*(-?\d+\.?\d*)\s*,\s*"longitude"\s*:\s*(-?\d+\.?\d*)/;
  let latitude = 0;
  let longitude = 0;

  $("script").each((_, elem) => {
    const scriptContent = $(elem).html() ?? "";
    const coordsMatch = coordsPattern.exec(scriptContent);
    if (coordsMatch) {
      latitude = parseFloat(coordsMatch[1] ?? "0");
      longitude = parseFloat(coordsMatch[2] ?? "0");
      return false; // break
    }
  });

  return { name, localName, description, latitude, longitude };
}

/**
 * Fetch a URL with timeout and retry logic.
 * Returns { html, status } or throws.
 */
async function fetchWithRetry(url, attempt = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: "https://www.votpusk.ru/",
      },
    });

    clearTimeout(timeoutId);

    if (res.status === 429) {
      return { html: null, status: 429 };
    }

    if (!res.ok) {
      return { html: null, status: res.status };
    }

    const html = await res.text();
    return { html, status: res.status };
  } catch (err) {
    clearTimeout(timeoutId);
    if (attempt < MAX_RETRIES) {
      console.log(
        `    ⚠️  Fetch error (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`,
      );
      await sleep(ERROR_DELAY_MS);
      return fetchWithRetry(url, attempt + 1);
    }
    throw err;
  }
}

/**
 * Scrape a single item. Returns a result object.
 * The `state` object is shared across workers for coordination.
 */
async function scrapeItem(item, state) {
  if (!item.url) {
    item.isScraped = true;
    item.scrape = { error: "no URL" };
    return { ok: false, reason: "no URL" };
  }

  if (dryRun) {
    return { ok: true, dryRun: true };
  }

  // If a global rate-limit pause is active, wait it out
  if (state.rateLimitedUntil > Date.now()) {
    const wait = state.rateLimitedUntil - Date.now();
    await sleep(wait);
  }

  try {
    const { html, status } = await fetchWithRetry(item.url);

    if (status === 429) {
      // Global rate-limit: pause all workers
      const until = Date.now() + RATE_LIMIT_DELAY_MS;
      if (until > state.rateLimitedUntil) {
        state.rateLimitedUntil = until;
        console.log(
          `\n  🚫 RATE LIMITED! All workers pausing ${RATE_LIMIT_DELAY_MS / 1000}s...`,
        );
      }
      await sleep(state.rateLimitedUntil - Date.now());
      // Retry after pause
      return scrapeItem(item, state);
    }

    if (!html || status !== 200) {
      item.isScraped = true;
      item.scrape = { error: `HTTP ${status}` };
      state.consecutiveErrors++;
      return { ok: false, reason: `HTTP ${status}` };
    }

    // Check if page is a JS challenge / bot detection
    if (
      html.includes("Выполняется проверка") ||
      html.includes("Enable JavaScript") ||
      html.length < 1000
    ) {
      // Don't mark as scraped - item will remain isScraped=false for retry
      const blockWait = RATE_LIMIT_DELAY_MS;
      const until = Date.now() + blockWait;
      if (until > state.rateLimitedUntil) {
        state.rateLimitedUntil = until;
        console.log(
          `\n  ⛔ JS challenge / blocked! All workers pausing ${blockWait / 1000}s...`,
        );
      }
      await sleep(state.rateLimitedUntil - Date.now());
      return { ok: false, reason: "JS challenge / blocked" };
    }

    // Parse the content
    const parsed = parseVotpuskHtml(html);

    if (!parsed.name && !parsed.description) {
      item.isScraped = true;
      item.scrape = { error: "no content parsed", ...parsed };
      state.consecutiveErrors++;
      return { ok: false, reason: "no content parsed" };
    }

    item.isScraped = true;
    item.scrape = parsed;
    state.consecutiveErrors = 0;
    return { ok: true, parsed };
  } catch (err) {
    item.isScraped = true;
    item.scrape = { error: err.message };
    state.consecutiveErrors++;
    return { ok: false, reason: err.message };
  }
}

async function scrapeFile(filePath, countryCode) {
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  const items = data.data ?? [];
  const toScrape = items.filter((item) => item.isScraped === false);

  if (toScrape.length === 0) {
    console.log(
      `  ✅ ${countryCode}: all ${items.length} items already scraped`,
    );
    return { scraped: 0, failed: 0, skipped: items.length };
  }

  console.log(
    `\n📁 ${countryCode}: ${toScrape.length} items to scrape (${items.length - toScrape.length} already done)`,
  );

  // Shared state for worker coordination
  const state = {
    rateLimitedUntil: 0,
    consecutiveErrors: 0,
  };

  let scraped = 0;
  let failed = 0;
  let completed = 0; // scraped + failed
  let unsavedCount = 0;

  // Build queue of items to process (only unscraped ones)
  const queue = toScrape.slice();
  let queueIndex = 0;

  // Save helper - called after batches
  const save = () => {
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  };

  if (dryRun) {
    for (const item of toScrape) {
      console.log(
        `  [dry-run] ${item.id} - ${item.url?.split("/").slice(-1)[0]}`,
      );
    }
    return { scraped: 0, failed: 0, skipped: items.length - toScrape.length };
  }

  // Worker function - each worker pulls items from the shared queue
  const worker = async (workerId) => {
    while (true) {
      // Grab next item atomically
      if (queueIndex >= queue.length) break;
      const item = queue[queueIndex++];
      const itemNum = queueIndex;
      const total = toScrape.length;

      process.stdout.write(
        `  [${itemNum}/${total}] w${workerId} ${item.id} - ${item.url?.split("/").slice(-1)[0] ?? "?"} ... `,
      );

      const result = await scrapeItem(item, state);

      if (result.ok) {
        console.log(
          `✓ "${item.scrape?.name}" (${item.scrape?.description?.length ?? 0} chars)`,
        );
        scraped++;
      } else {
        console.log(`✗ ${result.reason}`);
        failed++;
      }

      completed++;
      unsavedCount++;

      // Periodic save (approximate - multiple workers may trigger close together)
      if (unsavedCount >= SAVE_EVERY) {
        save();
        unsavedCount = 0;
        console.log(
          `    💾 Progress saved (${scraped} scraped, ${failed} failed so far)`,
        );
      }

      // Too many consecutive errors → brief pause for this worker
      if (state.consecutiveErrors >= 5) {
        console.log(
          `  ⛔ w${workerId}: ${state.consecutiveErrors} consecutive errors, pausing 30s...`,
        );
        state.consecutiveErrors = 0;
        await sleep(30000);
      }

      // Per-worker delay between requests (rate limiting)
      await randomDelay();
    }
  };

  // Launch CONCURRENCY workers
  const workers = [];
  for (let w = 1; w <= CONCURRENCY; w++) {
    // Stagger worker start times slightly to spread initial requests
    workers.push(sleep((w - 1) * 400).then(() => worker(w)));
  }
  await Promise.all(workers);

  // Final save
  save();
  console.log(`  💾 ${countryCode} done: ${scraped} scraped, ${failed} failed`);

  return { scraped, failed, skipped: items.length - toScrape.length };
}

async function main() {
  console.log("🌍 Votpusk countries scraper");
  console.log(`📁 Output dir: ${OUTPUT_DIR}`);
  console.log(`⚡ Concurrency: ${CONCURRENCY} parallel workers`);
  if (dryRun) console.log("🔍 DRY RUN - no actual requests will be made");
  if (countryFilter) console.log(`🔍 Filtering to country: ${countryFilter}`);
  console.log(
    `⏱️  Per-worker delay between requests: ${MIN_DELAY_MS}-${MAX_DELAY_MS}ms\n`,
  );

  if (!existsSync(OUTPUT_DIR)) {
    console.error(`❌ Output directory not found: ${OUTPUT_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const filteredFiles = countryFilter
    ? files.filter((f) => f === `${countryFilter.toUpperCase()}.json`)
    : files;

  if (filteredFiles.length === 0) {
    console.error(
      `❌ No files found${countryFilter ? ` for country ${countryFilter}` : ""}`,
    );
    process.exit(1);
  }

  console.log(`📋 Processing ${filteredFiles.length} country files...\n`);

  let totalScraped = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (let fi = 0; fi < filteredFiles.length; fi++) {
    const fileName = filteredFiles[fi];
    const countryCode = fileName.replace(".json", "");
    const filePath = resolve(OUTPUT_DIR, fileName);

    console.log(
      `\n[${fi + 1}/${filteredFiles.length}] Processing ${countryCode}...`,
    );

    try {
      const { scraped, failed, skipped } = await scrapeFile(
        filePath,
        countryCode,
      );
      totalScraped += scraped;
      totalFailed += failed;
      totalSkipped += skipped;
    } catch (err) {
      console.error(`❌ Failed to process ${countryCode}: ${err.message}`);
      totalFailed++;
    }

    // Small delay between country files
    if (fi < filteredFiles.length - 1) {
      await sleep(1000);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Done!");
  console.log(`   Scraped: ${totalScraped}`);
  console.log(`   Failed:  ${totalFailed}`);
  console.log(`   Skipped: ${totalSkipped} (already done)`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
