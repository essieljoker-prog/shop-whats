import { useState, useRef } from "react";
import { trpc } from "@/providers/trpc";

/**
 * Affiche une image stockée (clé → URL signée temporaire).
 * Sans image : placeholder dessiné en code (remplaçable depuis l'admin).
 */
export function ImageView({
  imageKey,
  alt,
  label,
  className = "",
  imgClassName = "",
  fit = "contain",
  onImageLoad,
}: {
  imageKey?: string | null;
  alt: string;
  label?: string;
  className?: string;
  imgClassName?: string;
  fit?: "contain" | "cover";
  onImageLoad?: (imageKey: string) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const query = trpc.catalog.imageUrls.useQuery(
    { keys: [imageKey!] },
    { enabled: !!imageKey, staleTime: 5 * 60 * 1000 },
  );
  const url = imageKey ? (query.data as Record<string, string> | undefined)?.[imageKey] : null;
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";

  if (!imageKey || !url) {
    return (
      <div
        className={`image-stage flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg viewBox="0 0 120 200" className="h-3/5 w-auto text-brand-blue-700/15" fill="none" aria-hidden>
          <rect x="18" y="8" width="84" height="184" rx="18" stroke="currentColor" strokeWidth="4" />
          <rect x="46" y="20" width="28" height="6" rx="3" fill="currentColor" />
          <circle cx="60" cy="176" r="6" fill="currentColor" />
        </svg>
        {label && (
          <span className="sr-only">{label}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`image-stage overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={url}
        alt={alt}
        loading="lazy"
        onLoad={() => {
          setLoaded(true);
          onImageLoad?.(imageKey);
        }}
        onError={() => console.error("[ImageView error]", { src: url })}
        className={`h-full w-full ${fitClass} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${imgClassName}`}
      />
    </div>
  );
}
