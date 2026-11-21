"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.href && !item.isCurrent ? (
              <Link
                href={item.href}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  item.isCurrent
                    ? "text-text-primary font-medium"
                    : "text-text-secondary"
                }
              >
                {item.label}
              </span>
            )}
            {index < items.length - 1 && (
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
