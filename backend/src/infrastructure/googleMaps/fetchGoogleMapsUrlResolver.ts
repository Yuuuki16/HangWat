import type {
  GoogleMapsUrlResolver,
  ResolvedGoogleMapsLocation,
} from "../../domain/services/googleMapsUrlResolver.js";

const userAgent =
  "Mozilla/5.0 (compatible; HangWat/1.0; +https://github.com/Yuuuki16/HangWat)";
const FETCH_TIMEOUT_MS = 10_000;

export class FetchGoogleMapsUrlResolver implements GoogleMapsUrlResolver {
  async resolve(url: string): Promise<ResolvedGoogleMapsLocation | null> {
    let resolvedUrl = url;
    let html = "";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": userAgent },
        signal: controller.signal,
      });
      resolvedUrl = response.url || url;

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        html = await response.text();
      }
    } catch {
      return parseGoogleMapsLocation(resolvedUrl, html);
    } finally {
      clearTimeout(timer);
    }

    return parseGoogleMapsLocation(resolvedUrl, html);
  }
}

function parseGoogleMapsLocation(
  googleMapsUrl: string,
  html: string,
): ResolvedGoogleMapsLocation | null {
  const name =
    parseNameFromUrl(googleMapsUrl) ?? parseMetaContent(html, "og:title");
  const coordinates =
    parseCoordinatesFromUrl(googleMapsUrl) ?? parseCoordinatesFromText(html);
  const googlePlaceId = parseGooglePlaceId(`${googleMapsUrl}\n${html}`);
  const address = parseMetaContent(html, "og:description");

  if (
    name === null &&
    address === null &&
    googlePlaceId === null &&
    coordinates === null
  ) {
    return null;
  }

  return {
    name: normalizeName(name),
    address,
    googlePlaceId,
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    googleMapsUrl,
  };
}

function parseNameFromUrl(url: string): string | null {
  const match = url.match(/\/maps\/place\/([^/?#]+)/);
  if (match === null) return null;

  return decodeUrlText(match[1]);
}

function parseCoordinatesFromUrl(
  url: string,
): { latitude: number; longitude: number } | null {
  const atMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|z)/);
  if (atMatch !== null) {
    return toCoordinates(atMatch[1], atMatch[2]);
  }

  const dataMatch = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (dataMatch !== null) {
    return toCoordinates(dataMatch[1], dataMatch[2]);
  }

  return null;
}

function parseCoordinatesFromText(
  text: string,
): { latitude: number; longitude: number } | null {
  const match = text.match(/"(-?\d{1,2}\.\d+)","(-?\d{1,3}\.\d+)"/);
  if (match === null) return null;

  return toCoordinates(match[1], match[2]);
}

function toCoordinates(
  latitudeText: string,
  longitudeText: string,
): { latitude: number; longitude: number } | null {
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function parseGooglePlaceId(text: string): string | null {
  const match = text.match(/\bChIJ[A-Za-z0-9_-]+\b/);
  return match?.[0] ?? null;
}

function parseMetaContent(html: string, property: string): string | null {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<meta\\s+(?:property|name)=["']${escapedProperty}["']\\s+content=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(pattern);
  if (match === null) return null;

  const value = decodeHtmlEntities(match[1]).trim();
  return value.length > 0 ? value : null;
}

function normalizeName(value: string | null): string | null {
  if (value === null) return null;

  const normalized = value.replace(/\s+-\s+Google Maps$/i, "").trim();
  return normalized.length > 0 ? normalized : null;
}

function decodeUrlText(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value.replace(/\+/g, " ")).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
