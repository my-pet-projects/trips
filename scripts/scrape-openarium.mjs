/**
 * Scraper for openarium.ru - Austria (Австрия) attractions.
 *
 * Step 1: Fetch https://openarium.ru/Австрия/
 *         Parse all links in .open-view elements → city name + attraction count
 *
 * Step 2: For each city, fetch its /Фото/ (photo) subpage and
 *         collect attraction links: name + /poi/XXXXXXXX url
 *
 * Output: scripts/output/openarium/AT.json
 *
 * Rate limiting: sequential requests with 2-4s random delay between each.
 * Extra 15s delay on errors, 60s pause on 429.
 *
 * Usage:
 *   node scripts/scrape-openarium.mjs
 *   node scripts/scrape-openarium.mjs --dry-run
 *   node scripts/scrape-openarium.mjs --city Зальцбург
 */

import * as cheerio from "cheerio";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "output", "openarium");
const BASE_URL = "https://openarium.ru";
const COUNTRY_URL = `${BASE_URL}/%D0%90%D0%B2%D1%81%D1%82%D1%80%D0%B8%D1%8F/`;
const OUTPUT_FILE = resolve(OUTPUT_DIR, "AT.json");

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const cityFilter = args.includes("--city")
  ? args[args.indexOf("--city") + 1]
  : null;

// Rate limiting config
const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 4000;
const ERROR_DELAY_MS = 15000;
const RATE_LIMIT_DELAY_MS = 60000;
const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 20000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  console.log(`  ⏳ Waiting ${Math.round(ms)}ms...`);
  return sleep(Math.round(ms));
}

/**
 * Fetch a URL with timeout and retry logic.
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
        Referer: BASE_URL + "/",
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
 * Fetch a URL with rate-limit handling.
 * Returns html string or null on failure.
 */
async function fetchPage(url) {
  console.log(`  🌐 Fetching: ${url}`);

  let { html, status } = await fetchWithRetry(url);

  if (status === 429) {
    console.log(
      `\n  🚫 RATE LIMITED! Pausing ${RATE_LIMIT_DELAY_MS / 1000}s...`,
    );
    await sleep(RATE_LIMIT_DELAY_MS);
    ({ html, status } = await fetchWithRetry(url));
  }

  if (!html || status !== 200) {
    console.log(`  ✗ HTTP ${status} for ${url}`);
    return null;
  }

  // Check for JS challenge / bot detection
  if (
    html.includes("Выполняется проверка") ||
    html.includes("Enable JavaScript") ||
    html.length < 500
  ) {
    console.log(
      `  ⛔ JS challenge / blocked! Pausing ${RATE_LIMIT_DELAY_MS / 1000}s...`,
    );
    await sleep(RATE_LIMIT_DELAY_MS);
    return null;
  }

  return html;
}

/**
 * Step 1: Parse the country page to get cities.
 * Finds all links inside .open-view elements.
 * Returns array of { cityName, count, href }
 */
function parseCityList(html) {
  const $ = cheerio.load(html);
  const cities = [];

  // .open-view contains <li> elements with:
  //   <a href="...">City Name</a> <small>N</small>
  $(".open-view li").each((_, li) => {
    const $li = $(li);
    const $a = $li.find("a").first();
    const href = $a.attr("href");
    if (!href) return;

    const cityName = $a.text().trim();
    if (!cityName) return;

    // Count is in the <small> sibling right after the <a>
    const countText = $li.find("small").first().text().trim();
    const count = countText ? parseInt(countText, 10) : null;

    cities.push({ cityName, count, href });
  });

  return cities;
}

/**
 * Step 2: Parse a city's photo page to get attraction links.
 * Returns array of { name, url }
 * e.g. { name: "Кафедральный собор, Зальцбург, Австрия", url: "/poi/85406247" }
 */
function parseAttractionLinks(html, cityName) {
  const $ = cheerio.load(html);
  const attractions = [];

  // Attraction links on photo pages typically follow a pattern.
  // Look for links containing /poi/ in href
  $("a[href*='/poi/']").each((_, a) => {
    const $a = $(a);
    const href = $a.attr("href");
    if (!href) return;

    // Extract just the /poi/XXXXXXXX part
    const poiMatch = /(\/poi\/\d+)/.exec(href);
    if (!poiMatch) return;

    const poiUrl = poiMatch[1];

    // Get the name from the link text or nearby text
    const name = $a.text().trim().replace(/\s+/g, " ");

    if (name && poiUrl) {
      // Avoid duplicates
      if (!attractions.find((a) => a.url === poiUrl)) {
        attractions.push({ name, url: poiUrl });
      }
    }
  });

  return attractions;
}

/**
 * Build the photo page URL for a city.
 * City href from the country page is like /Австрия/Зальцбург/Достопримечательности/
 * Photo page is like /Австрия/Зальцбург/Фото/
 * So we strip the last path segment (e.g. Достопримечательности) and replace with Фото.
 */
function buildPhotoUrl(cityHref) {
  // Ensure trailing slash
  let base = cityHref.endsWith("/") ? cityHref : cityHref + "/";
  // Remove the last non-empty path segment (e.g. /Достопримечательности/)
  // e.g. /Австрия/Зальцбург/Достопримечательности/ -> /Австрия/Зальцбург/
  base = base.replace(/[^/]+\/$/, "");
  // Append encoded Фото
  return BASE_URL + base + "%D0%A4%D0%BE%D1%82%D0%BE/";
}

async function main() {
  console.log("🏔️  Openarium Austria (Австрия) scraper");
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  if (dryRun) console.log("🔍 DRY RUN - no actual requests will be made");
  if (cityFilter) console.log(`🔍 Filtering to city: ${cityFilter}`);
  console.log(
    `⏱️  Delay between requests: ${MIN_DELAY_MS}-${MAX_DELAY_MS}ms\n`,
  );

  // Ensure output dir exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load existing output if present (for resumability)
  let output = { country: "AT", countryName: "Австрия", cities: [] };
  if (existsSync(OUTPUT_FILE)) {
    try {
      output = JSON.parse(readFileSync(OUTPUT_FILE, "utf-8"));
      console.log(
        `📂 Loaded existing output: ${output.cities.length} cities already saved\n`,
      );
    } catch {
      console.log("⚠️  Could not parse existing output file, starting fresh\n");
    }
  }

  const save = () => {
    writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");
    console.log(`  💾 Saved to ${OUTPUT_FILE}`);
  };

  // ── Step 1: Fetch country page and parse city list ──────────────────────────
  console.log(
    "── Step 1: Fetching country page ──────────────────────────────\n",
  );

  let cities = [];

  if (dryRun) {
    console.log(`[dry-run] Would fetch: ${COUNTRY_URL}`);
    return;
  }

  const countryHtml = await fetchPage(COUNTRY_URL);
  if (!countryHtml) {
    console.error("❌ Failed to fetch country page");
    process.exit(1);
  }

  cities = parseCityList(countryHtml);

  if (cities.length === 0) {
    console.error(
      "❌ No cities found on country page - check .open-view selector",
    );
    // Save the raw HTML for debugging
    writeFileSync(
      resolve(OUTPUT_DIR, "AT-country-debug.html"),
      countryHtml,
      "utf-8",
    );
    console.log("📄 Saved debug HTML to AT-country-debug.html");
    process.exit(1);
  }

  console.log(`✅ Found ${cities.length} cities:\n`);
  for (const c of cities) {
    console.log(
      `   ${c.cityName}${c.count !== null ? " " + c.count : ""} → ${c.href}`,
    );
  }

  // Update output with city list
  output.cityList = cities;
  save();

  await randomDelay();

  // ── Step 2: For each city, fetch photo page and scrape attraction links ──────
  console.log(
    "\n── Step 2: Scraping city photo pages ──────────────────────────\n",
  );

  const citiesToProcess = cityFilter
    ? cities.filter((c) => c.cityName === cityFilter)
    : cities;

  if (citiesToProcess.length === 0) {
    console.error(`❌ No cities match filter: ${cityFilter}`);
    process.exit(1);
  }

  let totalAttractions = 0;

  for (let i = 0; i < citiesToProcess.length; i++) {
    const city = citiesToProcess[i];
    const photoUrl = buildPhotoUrl(city.href);

    console.log(
      `\n[${i + 1}/${citiesToProcess.length}] ${city.cityName} (${city.count ?? "?"} attractions)`,
    );
    console.log(`  📸 Photo URL: ${photoUrl}`);

    // Check if already scraped in existing output
    const existing = output.cities.find((c) => c.cityName === city.cityName);
    if (existing && existing.attractions && existing.attractions.length > 0) {
      console.log(
        `  ✅ Already scraped (${existing.attractions.length} attractions) - skipping`,
      );
      totalAttractions += existing.attractions.length;
      continue;
    }

    const photoHtml = await fetchPage(photoUrl);

    if (!photoHtml) {
      console.log(`  ✗ Failed to fetch photo page for ${city.cityName}`);
      // Record failure but continue
      const idx = output.cities.findIndex((c) => c.cityName === city.cityName);
      const cityEntry = {
        ...city,
        photoUrl,
        attractions: [],
        error: "fetch failed",
        scrapedAt: new Date().toISOString(),
      };
      if (idx >= 0) {
        output.cities[idx] = cityEntry;
      } else {
        output.cities.push(cityEntry);
      }
      save();
      await randomDelay();
      continue;
    }

    const attractions = parseAttractionLinks(photoHtml, city.cityName);
    console.log(`  ✓ Found ${attractions.length} attraction links`);

    for (const attr of attractions) {
      console.log(`    • ${attr.name} → ${attr.url}`);
    }

    if (attractions.length === 0) {
      // Save debug HTML for empty pages
      const debugFile = resolve(
        OUTPUT_DIR,
        `${city.cityName}-photo-debug.html`,
      );
      writeFileSync(debugFile, photoHtml, "utf-8");
      console.log(
        `  ⚠️  No attractions found - saved debug HTML to ${debugFile}`,
      );
    }

    totalAttractions += attractions.length;

    const cityEntry = {
      cityName: city.cityName,
      count: city.count,
      href: city.href,
      photoUrl,
      attractions,
      scrapedAt: new Date().toISOString(),
    };

    const idx = output.cities.findIndex((c) => c.cityName === city.cityName);
    if (idx >= 0) {
      output.cities[idx] = cityEntry;
    } else {
      output.cities.push(cityEntry);
    }

    save();

    // Rate limiting delay between city requests
    if (i < citiesToProcess.length - 1) {
      await randomDelay();
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Done!");
  console.log(`   Cities processed: ${citiesToProcess.length}`);
  console.log(`   Total attractions found: ${totalAttractions}`);
  console.log(`   Output: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
