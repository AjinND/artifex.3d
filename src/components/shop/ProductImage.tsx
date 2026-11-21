"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
export default function ProductImage(props: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(
    null,
  );
  if (failedSource === props.src)
    return (
      <span
        className="image-fallback"
        role="img"
        aria-label={props.alt || "Image unavailable"}
      >
        Image unavailable
      </span>
    );
  return (
    <Image
      {...props}
      alt={props.alt}
      onError={() => setFailedSource(props.src)}
    />
  );
}
