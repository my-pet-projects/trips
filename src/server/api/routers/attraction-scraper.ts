import { TRPCError } from "@trpc/server";
import * as cheerio from "cheerio";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

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

type SiteParser = (html: string) => Promise<ParsedAttraction>;

const SITE_PARSERS: Record<string, SiteParser> = {
  "rutraveller.ru": parseRutravellerSiteContent,
  "votpusk.ru": parseVotpuskSiteContent,
};

export const attractionScraperRouter = createTRPCRouter({
  parseUrl: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      const { url } = input;

      let urlHost: string;
      try {
        urlHost = new URL(url).host;
      } catch {
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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported URL host: ${urlHost}. Supported hosts: ${supportedHosts}`,
        });
      }

      const parser = SITE_PARSERS[parserKey];
      if (!parser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Parser not found for host: ${parserKey}`,
        });
      }

      let html: string;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch URL: ${url} (Status: ${res.status} ${res.statusText})`,
          });
        }
        html = await res.text();
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Network error while fetching URL: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }

      try {
        const parsedData = await parser(html);

        const validated = parsedAttractionSchema.parse(parsedData);
        return {
          ...validated,
          url,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", ");
          throw new TRPCError({
            code: "PARSE_ERROR",
            message: `Validation failed: ${errorMessages}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Unexpected error during parsing: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),
});
