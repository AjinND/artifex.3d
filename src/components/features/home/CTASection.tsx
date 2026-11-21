"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-[48px] pastel-gradient p-12 md:p-16">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/30 rounded-full blur-2xl" />

          <div className="relative text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-text-primary mb-6">
              Ready to Create Something Beautiful?
            </h2>
            <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto">
              Turn your imagination into reality. Start your custom 3D printing
              order today and receive a free consultation.
            </p>
            <Link
              href="/order"
              className="px-10 py-5 bg-text-primary text-white rounded-full font-semibold text-lg hover:bg-text-primary/90 transition-colors inline-flex items-center gap-3 group hover:shadow-lg"
            >
              Start Your Order
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
