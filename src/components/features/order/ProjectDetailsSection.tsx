"use client";

import React from "react";
import { ProjectDetailsSectionProps } from "@/lib/types";

const categories = [
  "Architecture",
  "Fantasy & Games",
  "Engineering",
  "Jewelry",
  "Collectibles",
  "Other",
];

const budgets = ["Under $100", "$100-$500", "$500-$1000", "$1000-$5000", "$5000+"];

export default function ProjectDetailsSection({
  projectName = "",
  description = "",
  category = "",
  budget = "",
  onProjectNameChange,
  onDescriptionChange,
  onCategoryChange,
  onBudgetChange,
  errors = {},
}: ProjectDetailsSectionProps) {
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-black/5">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center">
          <span className="text-lg font-display font-semibold text-primary">
            1
          </span>
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold text-text-primary">
            Project Details
          </h2>
          <p className="text-sm text-text-secondary">
            Tell us about what you&apos;d like to create
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Project Name */}
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-text-primary mb-2">
            Project Name <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="e.g., Dragon Sculpture"
            required
            aria-required="true"
            aria-invalid={!!errors.projectName}
            aria-describedby={errors.projectName ? "projectName-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.projectName
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none`}
          />
          {errors.projectName && (
            <p id="projectName-error" className="text-red-500 text-sm mt-1">{errors.projectName}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-2">
            Category <span className="text-red-600" aria-label="required">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            required
            aria-required="true"
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? "category-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.category
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none cursor-pointer`}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p id="category-error" className="text-red-500 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        {/* Budget */}
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-text-primary mb-2">
            Budget Range <span className="text-red-600" aria-label="required">*</span>
          </label>
          <select
            id="budget"
            value={budget}
            onChange={(e) => onBudgetChange(e.target.value)}
            required
            aria-required="true"
            aria-invalid={!!errors.budget}
            aria-describedby={errors.budget ? "budget-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.budget
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none cursor-pointer`}
          >
            <option value="">Select budget range</option>
            {budgets.map((budget) => (
              <option key={budget} value={budget}>
                {budget}
              </option>
            ))}
          </select>
          {errors.budget && (
            <p id="budget-error" className="text-red-500 text-sm mt-1">{errors.budget}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
          Project Description <span className="text-red-600" aria-label="required">*</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your project in detail. Include dimensions, style preferences, materials, and any other details..."
          rows={5}
          required
          aria-required="true"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : "description-count"}
          className={`w-full px-4 py-3 rounded-lg border-2 transition-all resize-none ${
            errors.description
              ? "border-red-500 focus:border-red-600 bg-red-50"
              : "border-lavender focus:border-primary bg-white"
          } focus:outline-none`}
        />
        {errors.description && (
          <p id="description-error" className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
        <p id="description-count" className="text-xs text-text-secondary mt-2">
          {description.length}/2000 characters
        </p>
      </div>
    </div>
  );
}
