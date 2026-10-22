export type SeoMetadata = {
  title: string;
  description: string;
  image?: string | null;
  type?: "website" | "product";
};

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

function setCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.append(element);
  }
  element.href = url;
}

export function updateSeoMetadata({ title, description, image, type = "website" }: SeoMetadata) {
  const canonical = `${window.location.origin}${window.location.pathname}`;
  const imageUrl = new URL(image || "/smg-pluq-logo.png", window.location.origin).href;
  document.title = title;
  setMeta("name", "description", description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:type", type);
  setMeta("property", "og:site_name", "Manaaf");
  setMeta("property", "og:locale", "fr_BJ");
  setMeta("property", "og:url", canonical);
  setMeta("property", "og:image", imageUrl);
  setMeta("property", "og:image:alt", title);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", imageUrl);
  setMeta("name", "twitter:image:alt", title);
  setCanonical(canonical);
}
