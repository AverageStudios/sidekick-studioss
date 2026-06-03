"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Globe, MessageCircle, MoreHorizontal, PlayCircle, Share2, ThumbsUp, X } from "lucide-react";
import { resolveTemplateCtaLabel } from "@/data/template-taxonomy";
import { buildResolvedPlaceholderMap, replacePlaceholdersInString } from "@/lib/template-placeholders";
import { cn } from "@/lib/utils";
import { TemplateSeed } from "@/types";

type FacebookAdPreviewProps = {
  template?: TemplateSeed | null;
  pageName?: string;
  pageAvatarUrl?: string | null;
  primaryText?: string;
  headline?: string;
  description?: string;
  ctaLabel?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  className?: string;
  showMetaHeader?: boolean;
  showMetaBar?: boolean;
  showReactionsBar?: boolean;
  showActionsRow?: boolean;
  compact?: boolean;
  interactiveControls?: boolean;
  mediaFit?: "cover" | "contain";
  mediaAspectMode?: "uniform" | "adaptive";
  placeholderValues?: Record<string, string>;
  fillHeight?: boolean;
  collapsedPrimaryLines?: number;
};

type MediaAspectBucket = "portrait" | "square" | "landscape" | "wide";
type ResolvedMediaAspect = {
  bucket: MediaAspectBucket;
  ratio: number;
};

const HEADLINE_MAX_LENGTH = 25;

const previewLayoutContract = {
  pageNameFallback: "Your Page Name",
  primaryTextFallback:
    "A Facebook-style ad preview helps users see the template as they will actually launch it.",
  headlineFallback: "Template headline",
  ctaFallback: "Learn more",
  compactPrimaryLines: "line-clamp-3",
  regularPrimaryLines: "line-clamp-5",
  compactHeadlineLines: "line-clamp-1",
  regularHeadlineLines: "line-clamp-2",
  compactDescriptionLines: "line-clamp-2",
  regularDescriptionLines: "line-clamp-3",
} as const;

function formatCount(count: number) {
  return count >= 1000 ? `${Math.round(count / 100) / 10}k` : String(count);
}

function normalizePreviewText(value?: string | null, fallback?: string) {
  const normalized = (value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalized || fallback || "";
}

function normalizeCollapsedPreviewText(value: string) {
  return value
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function normalizeSingleLine(value?: string | null, fallback?: string) {
  const normalized = normalizePreviewText(value, fallback).replace(/\s+/g, " ").trim();
  return normalized || fallback || "";
}

function capPreviewLength(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength).trimEnd();
}

function normalizeHeadlineText(value?: string | null, fallback?: string) {
  return capPreviewLength(normalizePreviewText(value, fallback), HEADLINE_MAX_LENGTH);
}

function getHeadlineFontSize(value: string, compact: boolean) {
  const effectiveLength = Math.min(value.length, HEADLINE_MAX_LENGTH);
  const baseSize = compact ? 0.97 : 1.06;
  const minSize = compact ? 0.84 : 0.94;
  const shrink = Math.max(0, effectiveLength - 10) * (compact ? 0.008 : 0.006);
  return `${Math.max(minSize, baseSize - shrink)}rem`;
}

function getPageBadge(pageName: string) {
  const characters = pageName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return characters || "SP";
}

function resolveMedia(template?: TemplateSeed | null, imageUrl?: string | null, videoUrl?: string | null) {
  if (videoUrl) {
    return { kind: "video" as const, url: videoUrl };
  }

  if (imageUrl) {
    return { kind: "image" as const, url: imageUrl };
  }

  const templateVideo = template?.creativeAssets?.videoUrls?.[0];
  if (templateVideo) {
    return { kind: "video" as const, url: templateVideo };
  }

  const templateImage = template?.creativeAssets?.imageUrls?.[0] || template?.previewImage;
  return templateImage ? { kind: "image" as const, url: templateImage } : null;
}

function resolveCarouselImages(template?: TemplateSeed | null, imageUrl?: string | null) {
  const images = [
    imageUrl,
    ...(template?.creativeAssets?.imageUrls || []),
    template?.previewImage || null,
  ]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, array) => array.indexOf(value) === index);

  return images.slice(0, 3);
}

function resolveDisplayLink(template?: TemplateSeed | null) {
  const rawValue = template?.displayLink || process.env.NEXT_PUBLIC_APP_URL || "";
  const normalized = rawValue
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .trim();

  return normalized || "sidekickstudioss.com";
}

function normalizeFeedMediaAspectRatio(rawRatio?: number | null): ResolvedMediaAspect {
  if (!rawRatio || !Number.isFinite(rawRatio) || rawRatio <= 0) {
    return { bucket: "square", ratio: 1 };
  }

  if (rawRatio <= 0.9) {
    return { bucket: "portrait", ratio: 4 / 5 };
  }

  if (rawRatio <= 1.08) {
    return { bucket: "square", ratio: 1 };
  }

  if (rawRatio >= 1.7) {
    return { bucket: "wide", ratio: 1.91 };
  }

  return {
    bucket: "landscape",
    ratio: Math.min(Math.max(rawRatio, 1.18), 1.6),
  };
}

export function FacebookAdPreview({
  template,
  pageName,
  pageAvatarUrl,
  primaryText,
  headline,
  description,
  ctaLabel,
  imageUrl,
  videoUrl,
  className,
  showMetaHeader = true,
  showMetaBar = true,
  showReactionsBar = true,
  showActionsRow = true,
  compact = false,
  interactiveControls = true,
  mediaFit = "cover",
  mediaAspectMode = compact ? "uniform" : "adaptive",
  placeholderValues,
  fillHeight = true,
  collapsedPrimaryLines,
}: FacebookAdPreviewProps) {
  const resolvedMedia = resolveMedia(template, imageUrl, videoUrl);
  const resolvedCarouselImages = resolveCarouselImages(template, imageUrl);
  const resolvedPlaceholderValues = useMemo(
    () => buildResolvedPlaceholderMap(placeholderValues || {}),
    [placeholderValues],
  );
  const hasResolvedPlaceholderValues = Object.keys(resolvedPlaceholderValues).length > 0;
  const applyPreviewPlaceholderValues = (value: string) =>
    hasResolvedPlaceholderValues
      ? replacePlaceholdersInString(value, resolvedPlaceholderValues, { preserveMissing: true })
      : value;
  const resolvedPageName = normalizeSingleLine(
    applyPreviewPlaceholderValues(pageName || template?.name || ""),
    previewLayoutContract.pageNameFallback,
  );
  const resolvedPageBadge = getPageBadge(resolvedPageName);
  const resolvedPrimaryText = normalizePreviewText(
    applyPreviewPlaceholderValues(primaryText || template?.adCopy.primary || template?.description || ""),
    previewLayoutContract.primaryTextFallback,
  );
  const collapsedPrimaryText = useMemo(
    () => normalizeCollapsedPreviewText(resolvedPrimaryText),
    [resolvedPrimaryText],
  );
  const resolvedHeadline = normalizeHeadlineText(
    applyPreviewPlaceholderValues(headline || template?.adCopy.headlines?.[0] || template?.name || ""),
    previewLayoutContract.headlineFallback,
  );
  const resolvedDescription = normalizePreviewText(
    applyPreviewPlaceholderValues(description || template?.promoDetails || ""),
  );
  const resolvedCta = normalizeSingleLine(
    applyPreviewPlaceholderValues(
      ctaLabel ||
        template?.ctaLabel ||
        resolveTemplateCtaLabel(template, previewLayoutContract.ctaFallback),
    ) ||
      template?.ctaLabel ||
      resolveTemplateCtaLabel(template, previewLayoutContract.ctaFallback),
    previewLayoutContract.ctaFallback,
  );
  const resolvedDisplayLink = resolveDisplayLink(template);
  const metrics = compact ? { likes: 29, comments: 4, shares: 2 } : { likes: 129, comments: 12, shares: 8 };
  const [avatarErrorKey, setAvatarErrorKey] = useState("");
  const [isPrimaryExpanded, setIsPrimaryExpanded] = useState(false);
  const [isPrimaryTruncated, setIsPrimaryTruncated] = useState(false);
  const [loadedMediaAspectByUrl, setLoadedMediaAspectByUrl] = useState<{
    url: string;
    aspect: ResolvedMediaAspect;
  } | null>(null);
  const primaryTextRef = useRef<HTMLParagraphElement | null>(null);
  const avatarImageKey = `${pageAvatarUrl || ""}:${resolvedPageName}`;
  const avatarFailed = avatarErrorKey === avatarImageKey;
  const mediaFitClass = mediaFit === "contain" ? "object-contain bg-[#f7f8fb]" : "object-cover";
  const resolvedCollapsedPrimaryLines = collapsedPrimaryLines ?? (compact ? 3 : 5);
  const collapsedPrimaryMaxHeight = `${resolvedCollapsedPrimaryLines * (compact ? 1.35 : 1.6)}em`;
  const resolvedMediaAspect = useMemo(() => {
    if (mediaAspectMode === "uniform") {
      return compact
        ? { bucket: "square" as const, ratio: 1 }
        : { bucket: "square" as const, ratio: 1 };
    }

    if (
      resolvedMedia?.kind === "image" &&
      loadedMediaAspectByUrl &&
      loadedMediaAspectByUrl.url === resolvedMedia.url
    ) {
      return loadedMediaAspectByUrl.aspect;
    }

    if (resolvedMedia?.kind === "video") {
      return compact
        ? { bucket: "portrait" as const, ratio: 4 / 5 }
        : { bucket: "square" as const, ratio: 1 };
    }

    return compact
      ? { bucket: "portrait" as const, ratio: 4 / 5 }
      : { bucket: "square" as const, ratio: 1 };
  }, [compact, loadedMediaAspectByUrl, mediaAspectMode, resolvedMedia]);
  const mediaFrameStyle = useMemo(
    () => ({ aspectRatio: `${resolvedMediaAspect.ratio}` }),
    [resolvedMediaAspect.ratio],
  );

  useEffect(() => {
    setIsPrimaryExpanded(false);
  }, [resolvedPrimaryText, compact, template?.id]);

  useLayoutEffect(() => {
    const element = primaryTextRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      setIsPrimaryTruncated(element.scrollHeight > element.clientHeight + 1);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("resize", measure);
      };
    }

    const observer = new ResizeObserver(() => measure());
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isPrimaryExpanded, collapsedPrimaryText, compact, resolvedPrimaryText]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    console.debug("[FacebookAdPreview CTA]", {
      pageName: resolvedPageName,
      rawCtaLabel: ctaLabel,
      templateCtaType: template?.ctaType,
      templateCtaLabel: template?.ctaLabel,
      templateCtaDefault: template?.ctaDefault,
      resolvedCta,
    });
  }, [ctaLabel, resolvedCta, resolvedPageName, template?.ctaDefault, template?.ctaLabel, template?.ctaType]);

  const handlePrimaryToggle = (event: import("react").MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsPrimaryExpanded((current) => !current);
  };

  useEffect(() => {
    if (mediaAspectMode !== "adaptive" || resolvedMedia?.kind !== "image" || !resolvedMedia.url) {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      setLoadedMediaAspectByUrl({
        url: resolvedMedia.url,
        aspect: normalizeFeedMediaAspectRatio(image.naturalWidth / image.naturalHeight),
      });
    };
    image.onerror = () => {
      if (cancelled) return;
      setLoadedMediaAspectByUrl(null);
    };
    image.src = resolvedMedia.url;

    return () => {
      cancelled = true;
    };
  }, [mediaAspectMode, resolvedMedia]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[28px] bg-transparent p-0",
        fillHeight ? "h-full" : "h-auto",
        className,
      )}
    >
      {showMetaHeader ? (
        <div className="overflow-hidden rounded-[14px] border border-[rgba(17,18,22,0.08)] bg-white shadow-[0_12px_28px_rgba(17,24,39,0.06)]">
          <div className={cn("flex items-start justify-between gap-3 px-4", compact ? "py-3" : "py-4")}>
            <div className="flex min-w-0 items-center gap-3">
              <div className={cn(
                "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_30%,#7650d8_0%,#4c258c_55%,#2f124f_100%)] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
                compact ? "h-10 w-10 text-[0.72rem]" : "h-12 w-12 text-sm",
              )}>
                {pageAvatarUrl && !avatarFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={avatarImageKey}
                    src={pageAvatarUrl}
                    alt={resolvedPageName}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarErrorKey(avatarImageKey)}
                  />
                ) : (
                  resolvedPageBadge
                )}
              </div>
              <div className="min-w-0">
                <p className={cn("truncate font-semibold tracking-[-0.03em] text-[var(--ink)]", compact ? "text-[0.98rem]" : "text-[1.08rem]")}>
                  {resolvedPageName}
                </p>
                <div className={cn("mt-0.5 flex items-center gap-2 text-[var(--muted-strong)]", compact ? "text-[0.85rem]" : "text-[0.98rem]")}>
                  <span>Sponsored</span>
                  <span>•</span>
                  <Globe className={cn("text-[var(--muted)]", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-1 text-[var(--muted-strong)]">
              <button
                type="button"
                className="mt-0.5 rounded-full p-1.5 transition hover:bg-[#f0f2f5]"
                aria-label="Close preview"
                tabIndex={interactiveControls ? 0 : -1}
              >
                <X className="h-5 w-5" />
              </button>
              {interactiveControls ? (
                <button
                  type="button"
                  className="mt-0.5 rounded-full p-1.5 transition hover:bg-[#f0f2f5]"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              ) : (
                <div className="mt-0.5 rounded-full p-1.5" aria-hidden="true">
                  <MoreHorizontal className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>

          <div className={cn("bg-white px-4", compact ? "pb-2.5 pt-1.5" : "pb-4 pt-2")}>
            <div className="relative">
              <p
                ref={primaryTextRef}
                className={cn(
                "whitespace-pre-line break-words [overflow-wrap:anywhere] text-[var(--ink)]",
                compact ? "text-[0.88rem] leading-[1.35]" : "text-[1.04rem] leading-[1.6]",
                isPrimaryTruncated ? (compact ? "pr-16 pb-5" : "pr-20 pb-6") : "",
                isPrimaryExpanded
                  ? "min-h-0 overflow-visible"
                  : compact
                      ? "min-h-[3.2rem] overflow-hidden"
                      : "min-h-[8rem] overflow-hidden",
              )}
                style={
                  isPrimaryExpanded
                    ? { display: "block" }
                    : { maxHeight: collapsedPrimaryMaxHeight }
                }
              >
                {isPrimaryExpanded ? resolvedPrimaryText : collapsedPrimaryText}
              </p>
              {isPrimaryTruncated || isPrimaryExpanded ? (
                <button
                  type="button"
                  className={cn(
                    "absolute bottom-0 right-0 z-10 rounded-sm bg-white/96 pl-2 font-semibold text-[#1677ff] transition hover:text-[#0f64d8]",
                    compact ? "text-[0.74rem]" : "text-[0.88rem]",
                  )}
                  onClick={handlePrimaryToggle}
                  aria-expanded={isPrimaryExpanded}
                >
                  {isPrimaryExpanded ? "See less" : "See more"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="relative overflow-hidden border border-[rgba(17,18,22,0.08)] bg-[#eef1f6]"
        style={mediaFrameStyle}
        data-media-bucket={resolvedMediaAspect.bucket}
      >
        {resolvedMedia ? (
          resolvedMedia.kind === "video" ? (
            <video className={cn("h-full w-full", mediaFitClass)} controls playsInline muted>
              <source src={resolvedMedia.url} />
              Your browser does not support the video tag.
            </video>
          ) : resolvedCarouselImages.length > 1 ? (
            <div className="h-full overflow-hidden">
              <div className="flex h-full gap-2 px-2.5 py-2">
                {resolvedCarouselImages.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className={cn(
                      "relative h-full shrink-0 overflow-hidden rounded-[11px] bg-white shadow-[0_8px_18px_rgba(17,24,39,0.08)]",
                      index === 0 ? "w-[72%]" : "w-[28%]",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={template ? `${template.name} preview ${index + 1}` : `Template preview ${index + 1}`}
                      className={cn("h-full w-full", mediaFitClass)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedMedia.url}
              alt={template ? `${template.name} preview` : "Template preview"}
              className={cn("h-full w-full", mediaFitClass)}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(145deg,#266cf1_0%,#2f87ff_42%,#f2f6fb_100%)] text-white">
            <div className="text-center">
              <p className={cn("font-black tracking-[-0.06em]", compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl")}>Template preview</p>
              <p className={cn("mt-2 text-white/80", compact ? "text-xs" : "text-sm")}>Upload image or video assets to populate this ad.</p>
            </div>
          </div>
        )}

        {resolvedCarouselImages.length > 1 ? (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {resolvedCarouselImages.map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === 0 ? "w-7 bg-white" : "w-2.5 bg-white/60",
                )}
              />
            ))}
          </div>
        ) : null}

        {resolvedMedia?.kind === "video" ? (
          <div className="absolute bottom-4 right-4 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <PlayCircle className="inline h-3.5 w-3.5" /> Video
          </div>
        ) : null}
      </div>

      {showMetaBar ? (
        <div
          className={cn(
            "border-b border-[rgba(17,18,22,0.08)] bg-[#f0f2f5] px-4 py-4",
            "box-border w-full self-stretch",
            compact ? "min-h-[5.1rem] flex-1 rounded-b-[28px]" : "min-h-[5.1rem]",
          )}
        >
          <div className={cn("grid h-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-stretch", compact ? "gap-3" : "gap-3.5")}>
            <div className="flex min-w-0 flex-col justify-center overflow-hidden">
              <p className="truncate text-[0.78rem] font-medium leading-[1.05] text-[var(--muted-strong)] sm:text-[0.84rem]">
                {resolvedDisplayLink}
              </p>
              <p
                className={cn(
                  "mt-0.25 min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] font-semibold tracking-[-0.05em] text-[var(--ink)]",
                  compact ? previewLayoutContract.compactHeadlineLines : "line-clamp-2",
                )}
                style={{
                  fontSize: getHeadlineFontSize(resolvedHeadline, compact),
                  lineHeight: compact ? 1.03 : 1.08,
                }}
              >
                {resolvedHeadline}
              </p>
              {resolvedDescription && !compact ? (
                <p
                  className={cn(
                    "mt-0.5 break-words [overflow-wrap:anywhere] leading-[1.32] text-[var(--muted-strong)]",
                    "text-[0.88rem] sm:text-[0.92rem]",
                    previewLayoutContract.regularDescriptionLines,
                  )}
                >
                  {resolvedDescription}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className={cn(
                "justify-self-end self-center inline-flex min-w-0 shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-[9px] bg-[#dbe1e9] px-3 text-center font-semibold leading-none text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
                compact
                  ? "h-[2.05rem] w-fit max-w-[8rem] text-[0.56rem] tracking-[-0.02em] sm:text-[0.6rem]"
                  : "h-[2.75rem] w-[7.1rem] text-[0.9rem] sm:text-[0.94rem]",
              )}
              title={resolvedCta}
            >
              <span className={cn("block min-w-0 overflow-hidden text-center", compact ? "whitespace-nowrap truncate" : "w-full")}>{resolvedCta}</span>
            </button>
          </div>
        </div>
      ) : null}

      {showReactionsBar ? (
        <div className="flex items-center justify-between gap-4 border-b border-[rgba(17,18,22,0.08)] bg-white px-4 py-3 text-[0.88rem] text-[var(--muted-strong)] sm:text-[0.95rem]">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex -space-x-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877f2] text-[11px] text-white">👍</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f03d5f] text-[11px] text-white">❤</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f7b125] text-[11px] text-white">😮</span>
            </div>
            <span className="truncate">{formatCount(metrics.likes)}</span>
          </div>
          <div className="min-w-0 text-right">
            <span className="block truncate">{formatCount(metrics.comments)} Comments {formatCount(metrics.shares)} Shares</span>
          </div>
        </div>
      ) : null}

      {showActionsRow ? (
        <div className="grid grid-cols-3 gap-1.5 bg-white px-2.5 py-2 text-[0.92rem] font-medium text-[var(--ink)] sm:gap-2 sm:px-3 sm:py-2.5 sm:text-[1rem]">
          <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[var(--muted-strong)] transition hover:bg-[#f0f2f5] sm:gap-2 sm:px-3">
            <ThumbsUp className="h-4 w-4" />
            <span className="truncate">Like</span>
          </div>
          <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[var(--muted-strong)] transition hover:bg-[#f0f2f5] sm:gap-2 sm:px-3">
            <MessageCircle className="h-4 w-4" />
            <span className="truncate">Comment</span>
          </div>
          <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[var(--muted-strong)] transition hover:bg-[#f0f2f5] sm:gap-2 sm:px-3">
            <Share2 className="h-4 w-4" />
            <span className="truncate">Share</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
