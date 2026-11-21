"use client";

import React from "react";

interface FormTableOfContentsProps {
  sections: string[];
  currentSection: number;
  onSectionClick: (index: number) => void;
}

export default function FormTableOfContents({
  sections,
  currentSection,
  onSectionClick,
}: FormTableOfContentsProps) {
  return (
    <aside className="mb-8 p-6 bg-white rounded-2xl shadow-sm sticky top-32">
      <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
        Form Sections
      </h2>
      <nav aria-label="Form sections">
        <ol className="space-y-2">
          {sections.map((section, index) => (
            <li key={index}>
              <button
                onClick={() => onSectionClick(index)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                  currentSection === index
                    ? "bg-primary text-white shadow-md"
                    : "text-text-secondary hover:bg-lavender/50"
                }`}
                aria-current={currentSection === index ? "step" : undefined}
              >
                <span className="inline-flex items-center gap-3 w-full">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lavender/50 flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </span>
                  {section}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <p className="text-xs text-text-secondary/60 mt-4 text-center">
        {currentSection + 1} of {sections.length}
      </p>
    </aside>
  );
}
