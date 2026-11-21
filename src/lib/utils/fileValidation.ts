// ============================================================================
// FILE VALIDATION TYPES & UTILITIES
// ============================================================================

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export interface UploadedFileData {
    file: File;
    name: string;
    type: "image" | "model";
    size: number;
    preview?: string;
}

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
    IMAGE: 10 * 1024 * 1024, // 10MB
    MODEL: 50 * 1024 * 1024, // 50MB
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
    IMAGE: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    MODEL: [
        "model/stl",
        "application/sla",
        "application/octet-stream", // STL files sometimes have this MIME type
        "model/obj",
        "application/x-tgif", // OBJ files
    ],
} as const;

// File extensions
export const ALLOWED_EXTENSIONS = {
    IMAGE: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    MODEL: [".stl", ".obj", ".3mf", ".ply"],
} as const;

/**
 * Validates file type based on MIME type and extension
 */
export function validateFileType(
    file: File,
    type: "image" | "model"
): FileValidationResult {
    const allowedTypes = ALLOWED_FILE_TYPES[type === "image" ? "IMAGE" : "MODEL"];
    const allowedExts = ALLOWED_EXTENSIONS[type === "image" ? "IMAGE" : "MODEL"];

    // Check MIME type
    const mimeValid = (allowedTypes as readonly string[]).includes(file.type);

    // Check extension
    const fileName = file.name.toLowerCase();
    const extValid = allowedExts.some((ext) => fileName.endsWith(ext));

    if (!mimeValid && !extValid) {
        const typeLabel = type === "image" ? "image" : "3D model";
        return {
            valid: false,
            error: `Invalid file type. Please upload a valid ${typeLabel} file (${allowedExts.join(", ")})`,
        };
    }

    return { valid: true };
}

/**
 * Validates file size
 */
export function validateFileSize(
    file: File,
    type: "image" | "model"
): FileValidationResult {
    const maxSize = FILE_SIZE_LIMITS[type === "image" ? "IMAGE" : "MODEL"];

    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return {
            valid: false,
            error: `File size exceeds ${maxSizeMB}MB limit`,
        };
    }

    return { valid: true };
}

/**
 * Validates a file for upload
 */
export function validateFile(
    file: File,
    type: "image" | "model"
): FileValidationResult {
    // Check file type
    const typeValidation = validateFileType(file, type);
    if (!typeValidation.valid) {
        return typeValidation;
    }

    // Check file size
    const sizeValidation = validateFileSize(file, type);
    if (!sizeValidation.valid) {
        return sizeValidation;
    }

    return { valid: true };
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Creates a preview URL for image files
 */
export function createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result as string);
            } else {
                reject(new Error("Failed to read file"));
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}
