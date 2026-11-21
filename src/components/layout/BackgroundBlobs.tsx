"use client";

import React from "react";

export default function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <div
        className="absolute -top-40 -right-40 w-96 h-96 bg-lavender opacity-60 animate-blob"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute top-1/3 -left-32 w-72 h-72 bg-peach opacity-50 animate-blob"
        style={{ animationDelay: "-2s" }}
      />
      <div
        className="absolute bottom-20 right-1/4 w-64 h-64 bg-mint opacity-40 animate-blob"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-sky opacity-50 animate-blob"
        style={{ animationDelay: "-6s" }}
      />
    </div>
  );
}
