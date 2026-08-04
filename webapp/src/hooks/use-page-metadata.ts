import { useEffect } from "react";

interface PageMetadata {
  canonicalUrl: string;
  description: string;
  structuredData?: string;
  title: string;
}

interface MetaTag {
  attribute: "name" | "property";
  key: string;
  value: string;
}

const updateMetaTag = ({ attribute, key, value }: MetaTag) => {
  const selector = `meta[${attribute}="${key}"]`;
  const existingTag = document.head.querySelector<HTMLMetaElement>(selector);
  const tag = existingTag ?? document.createElement("meta");
  const previousContent = existingTag?.content;

  if (!existingTag) {
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = value;

  return () => {
    if (!existingTag) tag.remove();
    else tag.content = previousContent ?? "";
  };
};

export const usePageMetadata = ({
  canonicalUrl,
  description,
  structuredData,
  title,
}: PageMetadata) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const metaTags: MetaTag[] = [
      { attribute: "name", key: "description", value: description },
      { attribute: "property", key: "og:type", value: "website" },
      { attribute: "property", key: "og:title", value: title },
      { attribute: "property", key: "og:description", value: description },
      { attribute: "property", key: "og:url", value: canonicalUrl },
      { attribute: "name", key: "twitter:card", value: "summary" },
      { attribute: "name", key: "twitter:title", value: title },
      { attribute: "name", key: "twitter:description", value: description },
    ];
    const restoreMetaTags = metaTags.map(updateMetaTag);

    const existingCanonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    const canonical = existingCanonical ?? document.createElement("link");
    const previousCanonical = existingCanonical?.href;
    if (!existingCanonical) {
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const existingStructuredData =
      document.head.querySelector<HTMLScriptElement>(
        'script[data-strapd-page-metadata="true"]',
      );
    const structuredDataScript =
      existingStructuredData ?? document.createElement("script");
    const previousStructuredData = existingStructuredData?.textContent;
    if (structuredData) {
      structuredDataScript.type = "application/ld+json";
      structuredDataScript.dataset.strapdPageMetadata = "true";
      structuredDataScript.textContent = structuredData;
      if (!existingStructuredData)
        document.head.appendChild(structuredDataScript);
    }

    return () => {
      document.title = previousTitle;
      for (const restoreMetaTag of restoreMetaTags) restoreMetaTag();

      if (!existingCanonical) canonical.remove();
      else canonical.href = previousCanonical ?? "";

      if (!structuredData) return;
      if (!existingStructuredData) structuredDataScript.remove();
      else structuredDataScript.textContent = previousStructuredData ?? "";
    };
  }, [canonicalUrl, description, structuredData, title]);
};
