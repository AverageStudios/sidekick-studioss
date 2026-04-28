import { ChevronLeft, ChevronRight, Globe, Image as ImageIcon, MessageCircle, MoreHorizontal, PlayCircle, Share2, ThumbsUp } from "lucide-react";
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
  compact?: boolean;
  interactiveControls?: boolean;
};

const previewLayoutContract = {
  pageNameFallback: "Your Page Name",
  primaryTextFallback:
    "A Facebook-style ad preview helps users see the template as they will actually launch it.",
  headlineFallback: "Template headline",
  ctaFallback: "Learn more",
  compactPrimaryLines: "line-clamp-3",
  regularPrimaryLines: "line-clamp-5",
  compactHeadlineLines: "line-clamp-2",
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

function normalizeSingleLine(value?: string | null, fallback?: string) {
  const normalized = normalizePreviewText(value, fallback).replace(/\s+/g, " ").trim();
  return normalized || fallback || "";
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
  compact = false,
  interactiveControls = true,
}: FacebookAdPreviewProps) {
  const resolvedMedia = resolveMedia(template, imageUrl, videoUrl);
  const resolvedPageName = normalizeSingleLine(
    pageName || template?.name,
    previewLayoutContract.pageNameFallback,
  );
  const resolvedPageBadge = getPageBadge(resolvedPageName);
  const resolvedPrimaryText = normalizePreviewText(
    primaryText || template?.adCopy.primary || template?.description,
    previewLayoutContract.primaryTextFallback,
  );
  const resolvedHeadline = normalizePreviewText(
    headline || template?.adCopy.headlines?.[0] || template?.name,
    previewLayoutContract.headlineFallback,
  );
  const resolvedDescription = normalizePreviewText(
    description || template?.promoDetails,
  );
  const resolvedCta = normalizeSingleLine(ctaLabel || template?.ctaDefault, previewLayoutContract.ctaFallback);
  const metrics = compact ? { likes: 29, comments: 4, shares: 2 } : { likes: 129, comments: 12, shares: 8 };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[28px] border border-[rgba(17,18,22,0.08)] bg-[#f5f6f8] p-4 sm:p-6",
        className,
      )}
    >
      {showMetaBar ? (
        <div className="mb-5 flex items-center justify-between gap-3 px-1.5 sm:px-2">
          <p className="text-[1.3rem] font-semibold uppercase tracking-[-0.03em] text-[rgba(17,18,22,0.56)] sm:text-[1.45rem]">
            AD PREVIEW
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <span className="rounded-full border border-[rgba(24,119,242,0.12)] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1877f2]">
              Meta
            </span>
            {template ? (
              <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
                {template.offerType || "Lead Gen"}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {showMetaHeader ? (
        <div className="overflow-hidden border border-[rgba(17,18,22,0.08)] bg-white shadow-[0_12px_28px_rgba(17,24,39,0.06)]">
          <div className="flex items-start justify-between gap-3 border-b border-[rgba(17,18,22,0.08)] px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_30%,#7650d8_0%,#4c258c_55%,#2f124f_100%)] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                {pageAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pageAvatarUrl} alt={resolvedPageName} className="h-full w-full object-cover" />
                ) : (
                  resolvedPageBadge
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[1.08rem] font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  {resolvedPageName}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[0.98rem] text-[var(--muted-strong)]">
                  <span>Sponsored</span>
                  <span>•</span>
                  <Globe className="h-4 w-4 text-[var(--muted)]" />
                </div>
              </div>
            </div>
            {interactiveControls ? (
              <button
                type="button"
                className="mt-1 rounded-full p-1.5 text-[var(--muted-strong)] transition hover:bg-[#f0f2f5]"
                aria-label="More options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            ) : (
              <div className="mt-1 rounded-full p-1.5 text-[var(--muted-strong)]" aria-hidden="true">
                <MoreHorizontal className="h-5 w-5" />
              </div>
            )}
          </div>

          <div className="border-b border-[rgba(17,18,22,0.08)] bg-white px-4 pb-4 pt-3">
            <p
              className={cn(
                "whitespace-pre-line break-words [overflow-wrap:anywhere] text-[1.04rem] leading-[1.6] text-[var(--ink)]",
                compact
                  ? `${previewLayoutContract.compactPrimaryLines} min-h-[4.8rem]`
                  : `${previewLayoutContract.regularPrimaryLines} min-h-[8rem]`,
              )}
            >
              {resolvedPrimaryText}
            </p>
            <div className="mt-2 flex justify-end">
              <span className="shrink-0 text-[0.98rem] font-semibold text-[#1677ff]">see more</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative overflow-hidden border-b border-[rgba(17,18,22,0.08)] bg-[#eef1f6]">
        {resolvedMedia ? (
          resolvedMedia.kind === "video" ? (
            <video className={cn("w-full object-cover", compact ? "aspect-[1.02/1]" : "aspect-[1/1]")} controls playsInline muted>
              <source src={resolvedMedia.url} />
              Your browser does not support the video tag.
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedMedia.url}
              alt={template ? `${template.name} preview` : "Template preview"}
              className={cn("w-full object-cover", compact ? "aspect-[1.02/1]" : "aspect-[1/1]")}
            />
          )
        ) : (
          <div className={cn("flex items-center justify-center bg-[linear-gradient(145deg,#266cf1_0%,#2f87ff_42%,#f2f6fb_100%)] text-white", compact ? "aspect-[1.02/1]" : "aspect-[1/1]")}>
            <div className="text-center">
              <p className="text-3xl font-black tracking-[-0.06em] sm:text-4xl">Template preview</p>
              <p className="mt-2 text-sm text-white/80">Upload image or video assets to populate this ad.</p>
            </div>
          </div>
        )}

        {interactiveControls ? (
          <>
            <button
              type="button"
              className="absolute left-4 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/72 text-[var(--ink)] shadow-[0_10px_18px_rgba(17,24,39,0.12)] backdrop-blur"
              aria-label="Previous creative"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button
              type="button"
              className="absolute right-4 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/72 text-[var(--ink)] shadow-[0_10px_18px_rgba(17,24,39,0.12)] backdrop-blur"
              aria-label="Next creative"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </>
        ) : (
          <>
            <div
              className="absolute left-4 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/72 text-[var(--ink)] shadow-[0_10px_18px_rgba(17,24,39,0.12)] backdrop-blur"
              aria-hidden="true"
            >
              <ChevronLeft className="h-7 w-7" />
            </div>
            <div
              className="absolute right-4 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/72 text-[var(--ink)] shadow-[0_10px_18px_rgba(17,24,39,0.12)] backdrop-blur"
              aria-hidden="true"
            >
              <ChevronRight className="h-7 w-7" />
            </div>
          </>
        )}

        <div className="absolute left-6 top-5 flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-2 rounded-full",
                index === 0 ? "w-10 bg-[#1677ff]" : "w-2.5 bg-white/72",
              )}
            />
          ))}
        </div>

        {resolvedMedia?.kind === "video" ? (
          <div className="absolute bottom-4 right-4 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <PlayCircle className="inline h-3.5 w-3.5" /> Video
          </div>
        ) : resolvedMedia?.kind === "image" ? (
          <div className="absolute right-4 top-4 rounded-full bg-white/70 p-2.5 text-[var(--muted-strong)] shadow-[0_8px_18px_rgba(17,24,39,0.12)] backdrop-blur">
            <ImageIcon className="h-4 w-4" />
          </div>
        ) : null}
      </div>

      <div className="border-b border-[rgba(17,18,22,0.08)] bg-[#f0f2f5] px-4 py-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
          <div className="min-w-0">
            <p
              className={cn(
                "mt-0.5 break-words [overflow-wrap:anywhere] text-[0.96rem] font-semibold leading-[1.2] tracking-[-0.04em] text-[var(--ink)] sm:text-[1rem]",
                compact ? previewLayoutContract.compactHeadlineLines : previewLayoutContract.regularHeadlineLines,
              )}
            >
              {resolvedHeadline}
            </p>
            {resolvedDescription ? (
              <p
                className={cn(
                  "mt-0.5 break-words [overflow-wrap:anywhere] text-[0.88rem] leading-[1.32] text-[var(--muted-strong)] sm:text-[0.92rem]",
                  compact ? previewLayoutContract.compactDescriptionLines : previewLayoutContract.regularDescriptionLines,
                )}
              >
                {resolvedDescription}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="inline-flex h-auto w-fit min-w-0 max-w-none shrink-0 self-center whitespace-nowrap rounded-[10px] bg-[#dbe1e9] px-2.5 py-2 text-center text-[0.72rem] font-semibold leading-none text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
            title={resolvedCta}
          >
            {resolvedCta}
          </button>
        </div>
      </div>

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
    </div>
  );
}
