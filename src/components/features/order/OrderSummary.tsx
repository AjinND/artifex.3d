"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { OrderSummaryProps } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export default function OrderSummary({
  projectName = "",
  category = "",
  material = "",
  quantity = 0,
  estimatedPrice,
  isSubmitting = false,
  hasErrors = false,
  onSubmit,
}: OrderSummaryProps) {
  const isComplete = projectName && category && material && quantity > 0;

  return (
    <div className="bg-gradient-to-br from-lavender/30 via-peach/20 to-mint/20 rounded-[32px] p-8">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-display font-semibold text-text-primary">
          Order Summary
        </h3>
      </div>

      <div className="space-y-4 mb-8">
        {projectName && (
          <div className="flex justify-between items-center py-2 border-b border-white/40">
            <span className="text-text-secondary">Project</span>
            <span className="font-medium text-text-primary">{projectName}</span>
          </div>
        )}

        {category && (
          <div className="flex justify-between items-center py-2 border-b border-white/40">
            <span className="text-text-secondary">Category</span>
            <span className="font-medium text-text-primary">{category}</span>
          </div>
        )}

        {material && (
          <div className="flex justify-between items-center py-2 border-b border-white/40">
            <span className="text-text-secondary">Material</span>
            <span className="font-medium text-text-primary">{material}</span>
          </div>
        )}

        {quantity > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-white/40">
            <span className="text-text-secondary">Quantity</span>
            <span className="font-medium text-text-primary">{quantity} unit(s)</span>
          </div>
        )}

        <div className="flex justify-between items-center py-4 pt-6 border-t-2 border-white/60">
          <span className="text-lg font-semibold text-text-primary">
            Estimated Cost
          </span>
          <span className="text-2xl font-display font-semibold text-primary">
            ${estimatedPrice}
          </span>
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={!isComplete || hasErrors}
        isLoading={isSubmitting}
        className="w-full py-6 rounded-full text-lg"
        variant={!isComplete || hasErrors ? "secondary" : "primary-dark"}
      >
        Submit Order
      </Button>

      <p className="text-xs text-text-secondary text-center mt-4">
        We&apos;ll review your order and contact you within 24 hours with a detailed quote.
      </p>
    </div>
  );
}
