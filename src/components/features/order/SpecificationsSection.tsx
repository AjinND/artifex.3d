"use client";

import React from "react";
import { SpecificationsSectionProps } from "@/lib/types";

const materials = [
  "PLA (Standard)",
  "PETG (Durable)",
  "TPU (Flexible)",
  "Nylon (Strong)",
  "Resin (Detailed)",
];

const finishes = ["Raw Print", "Sanded", "Painted", "Glossy", "Matte"];

export default function SpecificationsSection({
  material = "",
  finish = "",
  dimensions = "",
  quantity = 1,
  onMaterialChange,
  onFinishChange,
  onDimensionsChange,
  onQuantityChange,
  errors = {},
}: SpecificationsSectionProps) {
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-black/5">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-mint flex items-center justify-center">
          <span className="text-lg font-display font-semibold text-green-600">
            3
          </span>
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold text-text-primary">
            Specifications
          </h2>
          <p className="text-sm text-text-secondary">
            Choose your material and finish preferences
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Material */}
        <div>
          <label htmlFor="material" className="block text-sm font-medium text-text-primary mb-2">
            Material <span className="text-red-600" aria-label="required">*</span>
          </label>
          <select
            id="material"
            value={material}
            onChange={(e) => onMaterialChange(e.target.value)}
            required
            aria-required="true"
            aria-invalid={!!errors.material}
            aria-describedby={errors.material ? "material-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.material
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none cursor-pointer`}
          >
            <option value="">Select material</option>
            {materials.map((mat) => (
              <option key={mat} value={mat}>
                {mat}
              </option>
            ))}
          </select>
          {errors.material && (
            <p id="material-error" className="text-red-500 text-sm mt-1">{errors.material}</p>
          )}
        </div>

        {/* Finish */}
        <div>
          <label htmlFor="finish" className="block text-sm font-medium text-text-primary mb-2">
            Finish <span className="text-red-600" aria-label="required">*</span>
          </label>
          <select
            id="finish"
            value={finish}
            onChange={(e) => onFinishChange(e.target.value)}
            required
            aria-required="true"
            aria-invalid={!!errors.finish}
            aria-describedby={errors.finish ? "finish-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.finish
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none cursor-pointer`}
          >
            <option value="">Select finish</option>
            {finishes.map((fin) => (
              <option key={fin} value={fin}>
                {fin}
              </option>
            ))}
          </select>
          {errors.finish && (
            <p id="finish-error" className="text-red-500 text-sm mt-1">{errors.finish}</p>
          )}
        </div>

        {/* Dimensions */}
        <div className="md:col-span-2">
          <label htmlFor="dimensions" className="block text-sm font-medium text-text-primary mb-2">
            Approximate Dimensions <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            id="dimensions"
            type="text"
            value={dimensions}
            onChange={(e) => onDimensionsChange(e.target.value)}
            placeholder="e.g., 100mm x 200mm x 50mm (L x W x H)"
            required
            aria-required="true"
            aria-invalid={!!errors.dimensions}
            aria-describedby={errors.dimensions ? "dimensions-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.dimensions
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none`}
          />
          {errors.dimensions && (
            <p id="dimensions-error" className="text-red-500 text-sm mt-1">{errors.dimensions}</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-text-primary mb-2">
            Quantity <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
            required
            aria-required="true"
            aria-invalid={!!errors.quantity}
            aria-describedby={errors.quantity ? "quantity-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.quantity
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none`}
          />
          {errors.quantity && (
            <p id="quantity-error" className="text-red-500 text-sm mt-1">{errors.quantity}</p>
          )}
        </div>
      </div>
    </div>
  );
}
