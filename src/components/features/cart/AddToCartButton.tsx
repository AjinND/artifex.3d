"use client";

import React, { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export interface AddToCartButtonProps {
  onAddToCart: () => void;
  isLoading?: boolean;
  productName?: string;
}

export default function AddToCartButton({
  onAddToCart,
  isLoading = false,
  productName = "Product",
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);

  const handleClick = () => {
    onAddToCart();
    setIsAdded(true);

    // Reset the added state after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isAdded}
      isLoading={isLoading}
      className={cn(
        "w-full py-6 rounded-full font-semibold transition-all",
        isAdded
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 text-white"
      )}
      aria-label={
        isAdded
          ? `${productName} added to cart`
          : `Add ${productName} to cart`
      }
      title={
        isAdded
          ? `${productName} added to cart! Click to add another`
          : `Add ${productName} to cart`
      }
      leftIcon={
        !isAdded ? <ShoppingBag className="w-5 h-5" aria-hidden="true" /> : undefined
      }
      rightIcon={
        isAdded ? (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ) : undefined
      }
    >
      {isAdded ? "Added to Cart!" : "Add to Cart"}
    </Button>
  );
}
