import { Schema, model, models } from "mongoose";
const schema = new Schema(
  {
    id: Number,
    slug: { type: String, index: { unique: true, sparse: true } },
    name: String,
    category: String,
    description: String,
    material: String,
    finish: String,
    dimensions: [Number],
    pricePaise: Number,
    leadDays: Number,
    photos: [{ _id: false, url: String, alt: String }],
    preview: String,
    featured: Boolean,
    status: { type: String, index: true },
    publishedAt: Date,
  },
  { timestamps: true },
);
export const Product = models.Product || model("Product", schema);
