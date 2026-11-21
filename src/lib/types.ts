// ============================================================================
// PRODUCT & CART TYPES
// ============================================================================

export interface Product {
  id: number;
  name: string;
  category?: string;
  price: number;
  image: string;
  gradient: string;
  description: string;
  size?: string;
  material?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = "success" | "error" | "info";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

// ============================================================================
// GALLERY & FILTER TYPES
// ============================================================================

export interface GalleryFilterState {
  category?: string;
  priceRange?: { min: number; max: number };
  size?: string;
  rating?: number;
}

export type CategoryFilter = "all" | "figurines" | "architecture" | "jewelry" | "art" | "custom";

export interface LegacyFilterState {
  category: CategoryFilter;
  priceRange: string;
  sortBy: string;
  searchQuery: string;
}

// ============================================================================
// ORDER FORM TYPES
// ============================================================================

export interface OrderFormData {
  // Project Details
  projectName: string;
  category: string;
  budget: string;
  description: string;

  // Specifications
  material: string;
  finish: string;
  dimensions: string;
  quantity: number;
  colors?: string[];

  // Contact Information
  fullName: string;
  email: string;
  phone: string;
  address: string;

  // Optional fields
  width?: string;
  height?: string;
  depth?: string;
  deadline?: string;
  priority?: string;
}

export interface FormErrors {
  [key: string]: string;
}

// ============================================================================
// ERROR BOUNDARY TYPES
// ============================================================================

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface UploadedFile {
  file: File;
  name: string;
  type: "image" | "model";
  size: number;
  preview?: string; // For image previews
}

export interface GalleryFiltersProps {
  filters: GalleryFilterState;
  onFilterChange: (filters: GalleryFilterState) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export interface GalleryGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  isEmpty?: boolean;
}

export interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface ProjectDetailsSectionProps {
  projectName?: string;
  description?: string;
  category?: string;
  budget?: string;
  onProjectNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
  errors?: FormErrors;
}

export interface FileUploadSectionProps {
  uploadedImages: UploadedFile[];
  uploadedModels: UploadedFile[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onModelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveModel: (index: number) => void;
}

export interface SpecificationsSectionProps {
  material?: string;
  finish?: string;
  dimensions?: string;
  quantity?: number;
  onMaterialChange: (value: string) => void;
  onFinishChange: (value: string) => void;
  onDimensionsChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  errors?: FormErrors;
}

export interface ContactInfoSectionProps {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  errors?: FormErrors;
}

export interface OrderSummaryProps {
  projectName?: string;
  category?: string;
  material?: string;
  quantity?: number;
  estimatedPrice: number;
  isSubmitting?: boolean;
  hasErrors?: boolean;
  onSubmit: () => void;
}

export interface FeaturedWorksSectionProps {
  onProductClick: (product: Product) => void;
}
