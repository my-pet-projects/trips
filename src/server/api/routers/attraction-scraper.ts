import { TRPCError } from "@trpc/server";
import * as cheerio from "cheerio";
import z from "zod";

import { createLogger, errMsg } from "~/lib/logger";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const log = createLogger("scraper");

const parsedAttractionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  localName: z.string().min(1, "Local name is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().min(1, "Description is required"),
});

type ParsedAttraction = z.infer<typeof parsedAttractionSchema>;

const extractCoordinates = (
  $: cheerio.CheerioAPI,
  pattern: RegExp,
): { latitude: number; longitude: number } => {
  let latitude = 0;
  let longitude = 0;

  $("script").each((_, elem) => {
    const scriptContent = $(elem).html() ?? "";
    const coordsMatch = pattern.exec(scriptContent);

    if (coordsMatch) {
      latitude = parseFloat(coordsMatch[1] ?? "0");
      longitude = parseFloat(coordsMatch[2] ?? "0");
      return false;
    }
  });

  return { latitude, longitude };
};

const normalizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, " ").replace(/\n\n+/g, "\n");
};

const parseRutravellerSiteContent = async (
  html: string,
): Promise<ParsedAttraction> => {
  const $ = cheerio.load(html);

  // Extract description
  const description = normalizeText($("[data-place-description]").text());

  // Extract name and local name from the topline
  // Format: "Name (Local Name)" or just "Name"
  const combinedName = $(".topline-hotel-sm").text().trim();
  const nameMatch = /^(.+?)\s*\((.+?)\)\s*$/.exec(combinedName);
  const name = nameMatch?.[1]?.trim() ?? combinedName;
  const localName = nameMatch?.[2]?.trim() ?? combinedName;

  // Extract coordinates
  // Pattern: "cords":["12.34567","98.76543"]
  const coordsPattern =
    /"cords"\s*:\s*\[\s*"(-?\d+\.?\d*)"\s*,\s*"(-?\d+\.?\d*)"\s*\]/;
  const { latitude, longitude } = extractCoordinates($, coordsPattern);

  if (!name || !description) {
    log.error(
      { name, description },
      "Failed to extract fields from Rutraveller",
    );
    throw new TRPCError({
      code: "PARSE_ERROR",
      message: "Failed to extract required fields from Rutraveller page",
    });
  }

  return {
    name,
    localName,
    latitude,
    longitude,
    description,
  };
};

const parseVotpuskSiteContent = async (
  html: string,
): Promise<ParsedAttraction> => {
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

  // Extract coordinates
  // Pattern: "latitude":12.34567,"longitude":98.76543
  const coordsPattern =
    /"latitude"\s*:\s*(-?\d+\.?\d*)\s*,\s*"longitude"\s*:\s*(-?\d+\.?\d*)/;
  const { latitude, longitude } = extractCoordinates($, coordsPattern);

  if (!name || !description) {
    log.error({ name, description }, "Failed to extract fields from Votpusk");
    throw new TRPCError({
      code: "PARSE_ERROR",
      message: "Failed to extract required fields from Votpusk page",
    });
  }

  return {
    name,
    localName,
    latitude,
    longitude,
    description,
  };
};

const parseOpenariumSiteContent = async (
  html: string,
): Promise<ParsedAttraction> => {
  const $ = cheerio.load(html);

  // Extract description from the <p> tags within the .page-content section
  // Join all text from <p> tags found in the .box-text section, then normalize.
  const description = normalizeText(
    $(".box-text p")
      .map((i, el) => $(el).text())
      .get()
      .join("\n"),
  );

  // Extract name from the <h1> tag
  const name = $("h1.mb-0").text().trim();

  // Extract local name from the <h2> tag
  const localName = $("h2.mt-0").text().trim();

  // Extract coordinates.
  let latitude: number = 0;
  let longitude: number = 0;

  // Search for an <em> tag in .box-text whose text matches the coordinate pattern
  $(".box-text em").each((i, el) => {
    const text = $(el).text().trim();
    const coordsMatch = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/.exec(text);
    if (coordsMatch) {
      latitude = parseFloat(coordsMatch[1] ?? "0");
      longitude = parseFloat(coordsMatch[2] ?? "0");
      return false;
    }
  });

  if (!name || !description) {
    log.error({ name, description }, "Failed to extract fields from Openarium");
    throw new TRPCError({
      code: "PARSE_ERROR",
      message: "Failed to extract required fields from Openarium page",
    });
  }

  return {
    name,
    localName,
    latitude,
    longitude,
    description,
  };
};

const fetchWithTimeout = async (
  url: string,
  options: { timeout: number; headers: Record<string, string> },
): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: options.headers,
    });
    return res.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

type SiteParser = (html: string) => Promise<ParsedAttraction>;

const SITE_PARSERS: Record<string, SiteParser> = {
  "rutraveller.ru": parseRutravellerSiteContent,
  "votpusk.ru": parseVotpuskSiteContent,
  "openarium.ru": parseOpenariumSiteContent,
};

export const attractionScraperRouter = createTRPCRouter({
  parseUrl: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      const { url } = input;
      const startTime = Date.now();

      log.info({ url }, "Starting URL parsing");

      let urlHost: string;
      try {
        urlHost = new URL(url).host;
      } catch {
        log.warn({ url }, "Invalid URL format");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid URL format: ${url}`,
        });
      }

      const parserKey = Object.keys(SITE_PARSERS).find((key) =>
        urlHost.includes(key),
      );
      if (!parserKey) {
        const supportedHosts = Object.keys(SITE_PARSERS).join(", ");
        log.warn({ urlHost, supportedHosts }, "Unsupported URL host");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported URL host: ${urlHost}. Supported hosts: ${supportedHosts}`,
        });
      }

      const parser = SITE_PARSERS[parserKey];
      if (!parser) {
        log.error({ parserKey }, "No parser found for host");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `No parser found for host: ${parserKey}`,
        });
      }

      log.debug({ parserKey }, "Using parser for host");

      let html: string;
      try {
        const FETCH_TIMEOUT = 10000; // 10 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const res = await fetch(url, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          log.error({ url, status: res.status }, "Failed to fetch URL");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch URL: ${url} (Status: ${res.status} ${res.statusText})`,
          });
        }
        html = await res.text();
        log.debug({ url, htmlLength: html.length }, "Fetched HTML content");
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        log.error(
          {
            url,
            error: errMsg(error),
          },
          "Network error",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Network error while fetching URL: ${errMsg(error)}`,
        });
      }

      try {
        const parsedData = await parser(html);
        const validated = parsedAttractionSchema.parse(parsedData);
        const durationMs = Date.now() - startTime;

        log.info(
          { url, name: validated.name, durationMs },
          "Successfully parsed attraction",
        );

        return {
          ...validated,
          url,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        if (error instanceof z.ZodError) {
          const errorMessages = error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", ");
          log.error({ url, errorMessages }, "Validation failed");
          throw new TRPCError({
            code: "PARSE_ERROR",
            message: `Validation failed: ${errorMessages}`,
          });
        }
        log.error({ url, error: errMsg(error) }, "Unexpected parsing error");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Unexpected error during parsing: ${errMsg(error)}`,
        });
      }
    }),

  fetchAttractionDetails: publicProcedure
    .input(
      z.object({
        name: z.string(),
        nameLocal: z.string().nullable().optional(),
        city: z
          .object({
            id: z.number(),
            name: z.string(),
            countryCode: z.string().optional(),
            country: z
              .object({ name: z.string(), cca2: z.string() })
              .optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const FETCH_TIMEOUT = 10000; // 10 seconds

      try {
        const imageApiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(input.nameLocal ?? input.name)}&gsrlimit=20&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=320&format=json&origin=*`;
        const articlesEnApiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(input.nameLocal ?? input.name)}&srlimit=5&srnamespace=0&format=json&origin=*`;
        const articlesRuApiUrl = `https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(input.name)}&srlimit=5&srnamespace=0&format=json&origin=*`;

        log.info(
          { articlesEnApiUrl, articlesRuApiUrl, imageApiUrl },
          "Fetching Wikimedia Commons images and Wikipedia articles",
        );

        const browserHeaders = {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "en-US,en;q=0.9",
        };

        const [imageData, articlesEnData, articlesRuData] = await Promise.all([
          fetchWithTimeout(imageApiUrl, {
            timeout: FETCH_TIMEOUT,
            headers: browserHeaders,
          }),
          fetchWithTimeout(articlesEnApiUrl, {
            timeout: FETCH_TIMEOUT,
            headers: browserHeaders,
          }),
          fetchWithTimeout(articlesRuApiUrl, {
            timeout: FETCH_TIMEOUT,
            headers: browserHeaders,
          }),
        ]);

        const parsedImages = JSON.parse(imageData) as {
          query?: {
            pages?: Record<
              string,
              { imageinfo?: { url?: string; thumburl?: string }[] }
            >;
          };
        };
        const pages = Object.values(parsedImages.query?.pages ?? {});
        const imageUrls = pages
          .flatMap((page) => page.imageinfo ?? [])
          .map((info) => info.thumburl ?? info.url ?? "")
          .filter((url) => url.startsWith("http"));

        log.info(
          {
            articlesEnDataPreview: articlesEnData.slice(0, 500),
            articlesRuDataPreview: articlesRuData.slice(0, 500),
          },
          "Wikipedia articles raw response",
        );

        type WikiSearchResponse = {
          query?: {
            search?: { title?: string; snippet?: string; pageid?: number }[];
          };
        };

        const parsedEnArticles = JSON.parse(
          articlesEnData,
        ) as WikiSearchResponse;
        const enArticles = (parsedEnArticles.query?.search ?? []).map(
          (item) => ({
            title: item.title ?? "",
            snippet: item.snippet?.replace(/<[^>]+>/g, "") ?? "",
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title ?? "")}`,
            lang: "en" as const,
          }),
        );

        const parsedRuArticles = JSON.parse(
          articlesRuData,
        ) as WikiSearchResponse;
        const ruArticles = (parsedRuArticles.query?.search ?? []).map(
          (item) => ({
            title: item.title ?? "",
            snippet: item.snippet?.replace(/<[^>]+>/g, "") ?? "",
            url: `https://ru.wikipedia.org/wiki/${encodeURIComponent(item.title ?? "")}`,
            lang: "ru" as const,
          }),
        );

        const articles = [...enArticles, ...ruArticles];

        log.info(
          {
            imageCount: imageUrls.length,
            articleCount: articles.length,
            enArticleCount: enArticles.length,
            ruArticleCount: ruArticles.length,
            imageApiUrl,
            articlesEnApiUrl,
            articlesRuApiUrl,
            imageUrls,
          },
          "Wikimedia Commons images and Wikipedia articles found",
        );

        return { imageUrls, articles };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        log.error(
          {
            name: input.name,
            nameLocal: input.nameLocal,
            city: input.city?.name,
            error: errMsg(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          "fetchAttractionDetails failed",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error fetching attraction details: ${errMsg(error)}`,
        });
      }
    }),
});
