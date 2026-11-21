export const COMPANY_NAME = "Artifex3D";
export const COMPANY_TAGLINE = "Bespoke 3D Printed Creations";
export const COMPANY_YEAR = new Date().getFullYear();

export const TOAST_DURATION = 3000; // milliseconds
export const MODAL_ANIMATION_DURATION = 300; // milliseconds

// ============================================================================
// FORM VALIDATION RULES
// ============================================================================

export const FORM_VALIDATION = {
  PROJECT_NAME_MIN: 3,
  PROJECT_NAME_MAX: 100,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DESCRIPTION_MIN: 20,
  DESCRIPTION_MAX: 2000,
  NAME_MIN: 2,
  NAME_MAX: 50,
  PHONE_PATTERN: /^[\d\s\-\+\(\)]+$/,
  ADDRESS_MIN: 5,
  QUANTITY_MIN: 1,
  QUANTITY_MAX: 100,
};

// ============================================================================
// FILE UPLOAD CONSTANTS
// ============================================================================

export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_MODEL_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGES: 10,
  MAX_MODELS: 5,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  ALLOWED_MODEL_TYPES: ["model/stl", "application/sla", "application/octet-stream"],
  ALLOWED_IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  ALLOWED_MODEL_EXTENSIONS: [".stl", ".obj", ".3mf", ".ply"],
};

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const IMAGE_SIZES = {
  HERO_EMOJI: "text-7xl",
  FEATURED_EMOJI: "text-[120px] lg:text-[180px]",
  CARD_EMOJI: "text-6xl",
};

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
};

export const STAT_ITEMS = [
  { value: "500+", label: "Creations" },
  { value: "98%", label: "Happy Clients" },
  { value: "24h", label: "Turnaround" },
];

export const FEATURED_CATEGORY_CARDS = [
  { icon: "🗿", label: "Miniatures" },
  { icon: "🏮", label: "Lamshades" },
  { icon: "🪴", label: "Planters" },
  { icon: "🎨", label: "Custom Art" },
];
