"use client";

import React from "react";
import { Upload, Image as ImageIcon, Box, X } from "lucide-react";
import { FileUploadSectionProps } from "@/lib/types";

export default function FileUploadSection({
  uploadedImages,
  uploadedModels,
  onImageUpload,
  onModelUpload,
  onRemoveImage,
  onRemoveModel,
}: FileUploadSectionProps) {
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-black/5">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-peach flex items-center justify-center">
          <span className="text-lg font-display font-semibold text-secondary">
            2
          </span>
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold text-text-primary">
            Upload Files
          </h2>
          <p className="text-sm text-text-secondary">
            Share reference images or 3D models
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-4">
            Reference Images (Optional)
          </label>
          <label
            className="block border-2 border-dashed border-lavender rounded-[20px] p-8 text-center cursor-pointer transition-all hover:border-primary hover:bg-lavender/5"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
            <ImageIcon aria-hidden="true" className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium text-text-primary">
              Click to upload images
            </p>
            <p className="text-xs text-text-secondary mt-1">
              JPG, PNG up to 10MB each
            </p>
          </label>

          {/* Uploaded Images List */}
          {uploadedImages.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedImages.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-lavender/10 rounded-lg"
                >
                  <span className="text-sm text-text-primary truncate">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Model Upload */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-4">
            3D Model Files (Optional)
          </label>
          <label
            className="block border-2 border-dashed border-lavender rounded-[20px] p-8 text-center cursor-pointer transition-all hover:border-primary hover:bg-lavender/5"
          >
            <input
              type="file"
              multiple
              accept=".stl,.obj,.step,.stp,.3mf"
              onChange={onModelUpload}
              className="hidden"
            />
            <Box className="w-8 h-8 mx-auto mb-2 text-secondary" />
            <p className="text-sm font-medium text-text-primary">
              Click to upload models
            </p>
            <p className="text-xs text-text-secondary mt-1">
              STL, OBJ, STEP, 3MF up to 50MB each
            </p>
          </label>

          {/* Uploaded Models List */}
          {uploadedModels.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedModels.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg"
                >
                  <span className="text-sm text-text-primary truncate">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveModel(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
