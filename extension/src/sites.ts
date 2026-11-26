import type { ExtensionSettings } from "./types";

export const DEFAULT_SITES = [
  "https://chatgpt.com/*",
  "https://claude.ai/*",
  "https://gemini.google.com/*",
] as const;

interface OriginPattern {
  scheme: string;
  host: string;
  port: string | null;
  path: string;
}

function parseOriginPattern(pattern: string): OriginPattern | null {
  const match =
    /^(https?):\/\/(\[[^\]]+\]|[^/:]+)(?::(\d+))?(\/.*)$/i.exec(pattern);
  if (!match) {
    return null;
  }

  const [, scheme, host, port, path] = match;
  return { scheme: scheme.toLowerCase(), host, port: port ?? null, path };
}

function defaultPort(protocol: string): string {
  return protocol === "https:" ? "443" : "80";
}

export function originPatternForUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const port = parsed.port || defaultPort(parsed.protocol);
    return `${parsed.protocol}//${parsed.hostname}:${port}/*`;
  } catch {
    return null;
  }
}

export function labelForPattern(pattern: string): string | null {
  const parsed = parseOriginPattern(pattern);
  if (!parsed) {
    return null;
  }

  return parsed.port ? `${parsed.host}:${parsed.port}` : parsed.host;
}

export function isDefaultSitePattern(pattern: string): boolean {
  const parsed = parseOriginPattern(pattern);
  if (!parsed) {
    return false;
  }

  return DEFAULT_SITES.some((site) => {
    const pinned = parseOriginPattern(site);
    return (
      pinned !== null &&
      parsed.scheme === pinned.scheme &&
      parsed.host.toLowerCase() === pinned.host.toLowerCase()
    );
  });
}

export function matchesOriginPattern(url: string, pattern: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const parsedPattern = parseOriginPattern(pattern);
    if (!parsedPattern) {
      return false;
    }

    if (parsedUrl.protocol.toLowerCase() !== `${parsedPattern.scheme}:`) {
      return false;
    }
    if (parsedUrl.hostname.toLowerCase() !== parsedPattern.host.toLowerCase()) {
      return false;
    }

    const effectivePort = parsedUrl.port || defaultPort(parsedUrl.protocol);
    if (parsedPattern.port !== null && effectivePort !== parsedPattern.port) {
      return false;
    }

    const { path } = parsedPattern;
    return (
      path === "/*" || (path.endsWith("*") && parsedUrl.pathname.startsWith(path.slice(0, -1)))
    );
  } catch {
    return false;
  }
}

export function isSiteProtected(settings: ExtensionSettings, url: string): boolean {
  return [...DEFAULT_SITES, ...settings.customSites].some((pattern) =>
    matchesOriginPattern(url, pattern),
  );
}
