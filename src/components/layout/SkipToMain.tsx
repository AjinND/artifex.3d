"use client";

import React from "react";

export default function SkipToMain() {
  return (
    <a
      href="#main-content"
      onClick={(event) => {
        const main = Array.from(document.querySelectorAll("main")).find(
          (element) => element.getClientRects().length > 0,
        );
        if (main) {
          event.preventDefault();
          main.tabIndex = -1;
          main.focus();
          main.scrollIntoView({ block: "start" });
        }
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-2 focus:outline-offset-2 focus:outline-white"
    >
      Skip to main content
    </a>
  );
}
