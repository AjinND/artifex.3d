"use client";

import React from "react";
import { ContactInfoSectionProps } from "@/lib/types";

export default function ContactInfoSection({
  fullName = "",
  email = "",
  phone = "",
  address = "",
  onFullNameChange,
  onEmailChange,
  onPhoneChange,
  onAddressChange,
  errors = {},
}: ContactInfoSectionProps) {
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-black/5">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-sky flex items-center justify-center">
          <span className="text-lg font-display font-semibold text-blue-600">
            4
          </span>
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold text-text-primary">
            Contact Information
          </h2>
          <p className="text-sm text-text-secondary">
            How can we reach you?
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
            Full Name <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="John Doe"
            required
            aria-required="true"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.fullName
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none`}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-red-500 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
            Email <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="john@example.com"
            required
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.email
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none`}
          />
          {errors.email && (
            <p id="email-error" className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
            Phone Number <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+1 (555) 000-0000"
            required
            aria-required="true"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.phone
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none`}
          />
          {errors.phone && (
            <p id="phone-error" className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-2">
            City / Country <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="New York, USA"
            required
            aria-required="true"
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? "address-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
              errors.address
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-lavender focus:border-primary bg-white"
            } focus:outline-none`}
          />
          {errors.address && (
            <p id="address-error" className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>
      </div>
    </div>
  );
}
