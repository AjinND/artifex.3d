"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullscreen?: boolean;
}

export default function LoadingSpinner({
  size = "md",
  text,
  fullscreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className={`${sizeClasses[size]} rounded-full border-4 border-lavender border-t-primary animate-spin mx-auto mb-4`} />
          {text && <p className="text-text-secondary">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} rounded-full border-4 border-lavender border-t-primary animate-spin`} />
      {text && <p className="text-text-secondary text-sm">{text}</p>}
    </div>
  );
}
