"use client";

import Image, { ImageProps } from "next/image";

const allowedRemoteHostnames = new Set([
  "graph.facebook.com",
  "lh3.googleusercontent.com",
]);

function isOptimizableSrc(src: ImageProps["src"]) {
  if (typeof src !== "string") return true;
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    if (allowedRemoteHostnames.has(url.hostname)) return true;
    if (url.hostname.endsWith(".fbcdn.net")) return true;
    if (url.pathname.startsWith("/storage/v1/object/public/")) return true;
    return false;
  } catch {
    return false;
  }
}

export function OptimizedImage(props: ImageProps) {
  if (isOptimizableSrc(props.src)) {
    return <Image {...props} alt={props.alt} />;
  }

  const fallbackProps = { ...props } as Omit<ImageProps, "src"> & {
    blurDataURL?: string;
    placeholder?: ImageProps["placeholder"];
    priority?: boolean;
    quality?: ImageProps["quality"];
    sizes?: string;
    src: ImageProps["src"];
  };
  delete fallbackProps.blurDataURL;
  delete fallbackProps.placeholder;
  delete fallbackProps.priority;
  delete fallbackProps.quality;
  delete fallbackProps.sizes;

  const {
    alt,
    className,
    fill,
    height,
    loading,
    onError,
    src,
    style,
    width,
    ...rest
  } = fallbackProps;

  const fallbackClassName = fill
    ? `absolute inset-0 h-full w-full ${className || ""}`.trim()
    : className;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={typeof src === "string" ? src : ""}
      alt={alt}
      className={fallbackClassName}
      height={height ? Number(height) : undefined}
      loading={loading === "eager" ? "eager" : "lazy"}
      onError={onError}
      style={style}
      width={width ? Number(width) : undefined}
    />
  );
}
