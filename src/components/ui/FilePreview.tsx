"use client";
import Image from "next/image";

import React from "react";
import { X, FileImage, File as FileIcon } from "lucide-react";
import { formatFileSize } from "@/lib/utils/fileValidation";

interface FilePreviewProps {
  file: File;
  type: "image" | "model";
  preview?: string;
  onRemove: () => void;
}

export default function FilePreview({
  file,
  type,
  preview,
  onRemove,
}: FilePreviewProps) {
  return (
    <div className="relative group bg-white rounded-2xl p-4 border-2 border-lavender hover:border-primary transition-all">
      {/* Preview or Icon */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {type === "image" && preview ? (
            <Image
              unoptimized
              width={64}
              height={64}
              src={preview}
              alt={file.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-lavender rounded-lg flex items-center justify-center">
              {type === "image" ? (
                <FileImage className="w-8 h-8 text-primary" />
              ) : (
                <FileIcon className="w-8 h-8 text-primary" />
              )}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-medium text-text-primary truncate"
            title={file.name}
          >
            {file.name}
          </p>
          <p className="text-sm text-text-secondary mt-1">
            {formatFileSize(file.size)}
          </p>
          <div className="mt-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-lavender text-primary rounded-full">
              {type === "image" ? "Image" : "3D Model"}
            </span>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors"
          aria-label={`Remove ${file.name}`}
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
