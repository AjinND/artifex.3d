"use client";
import type { DetailedHTMLProps, HTMLAttributes, RefObject } from "react";
type Viewer = HTMLElement & { cameraOrbit: string; fieldOfView: string };
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<Viewer>, Viewer> & {
        src: string;
        poster?: string;
        alt: string;
        "camera-controls"?: boolean;
        "touch-action"?: string;
      };
    }
  }
}
export default function ModelView({
  viewer,
  src,
  poster,
  alt,
}: {
  viewer: RefObject<Viewer | null>;
  src: string;
  poster?: string;
  alt: string;
}) {
  return (
    <model-viewer
      ref={viewer}
      src={src}
      poster={poster}
      alt={alt}
      camera-controls
      touch-action="pan-y"
      tabIndex={0}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
