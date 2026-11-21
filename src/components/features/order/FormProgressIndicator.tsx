"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

export interface FormProgressIndicatorProps {
  sections: string[];
  currentSection: number;
  completedSections?: number[];
}

export default function FormProgressIndicator({
  sections,
  currentSection,
  completedSections = [],
}: FormProgressIndicatorProps) {
  // Calculate progress based on completed sections, not current position
  const progressPercent = (completedSections.length / sections.length) * 100;

  return (
    <div className="sticky top-0 z-40 mb-12 bg-white shadow-md rounded-b-2xl">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-text-secondary">
              {completedSections.length} of {sections.length} sections completed
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="w-full h-2 bg-lavender rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {sections.map((section, index) => (
            <div
              key={index}
              className="flex items-center gap-3 flex-shrink-0 px-4 py-2 rounded-full transition-all"
              style={{
                background:
                  completedSections.includes(index)
                    ? "rgba(184, 165, 199, 0.1)"
                    : index === currentSection
                      ? "rgba(184, 165, 199, 0.1)"
                      : "transparent",
              }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                  completedSections.includes(index)
                    ? "bg-gradient-to-r from-primary to-secondary"
                    : index === currentSection
                      ? "border-2 border-primary bg-white"
                      : "border-2 border-gray-300 bg-white"
                }`}
            >
              {completedSections.includes(index) ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <span
                  className={`text-sm font-semibold ${
                    index === currentSection
                      ? "text-primary"
                      : "text-gray-400"
                  }`}
                >
                  {index + 1}
                </span>
              )}
            </div>
            <span
              className={`text-sm font-medium whitespace-nowrap ${
                completedSections.includes(index) || index === currentSection
                  ? "text-text-primary"
                  : "text-text-secondary"
              }`}
            >
              {section}
            </span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
