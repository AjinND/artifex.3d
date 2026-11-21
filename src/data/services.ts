import { Lightbulb, Palette, Package } from "lucide-react";

export const services = [
  {
    id: "custom-design",
    icon: Lightbulb,
    title: "Custom Design",
    description:
      "Share your vision and we'll create a unique 3D model tailored to your exact specifications.",
    bgColor: "bg-lavender",
    iconColor: "text-primary",
  },
  {
    id: "premium-printing",
    icon: Palette,
    title: "Premium Printing",
    description:
      "High-resolution printing with premium materials. Multiple finish options available.",
    bgColor: "bg-peach",
    iconColor: "text-secondary",
  },
  {
    id: "ready-models",
    icon: Package,
    title: "Ready Models",
    description:
      "Browse our curated collection of ready-to-print 3D models in various categories.",
    bgColor: "bg-mint",
    iconColor: "text-green-600",
  },
];
