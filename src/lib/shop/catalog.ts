import { z } from "zod";
const asset = z
  .string()
  .regex(/^\/catalog\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$/);
export const listing = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    name: z.string().trim().min(1).max(120),
    category: z.string().trim().min(1).max(60),
    description: z.string().trim().min(1).max(3000),
    material: z.string().min(1).max(80),
    finish: z.string().min(1).max(80),
    dimensions: z.tuple([
      z.number().positive().max(10000),
      z.number().positive().max(10000),
      z.number().positive().max(10000),
    ]),
    pricePaise: z.number().int().positive().max(100000000),
    leadDays: z.number().int().min(1).max(365),
    photos: z
      .array(z.object({ url: asset, alt: z.string().trim().min(1).max(200) }))
      .min(1)
      .max(12),
    preview: z
      .string()
      .regex(/^\/catalog\/[a-zA-Z0-9_-]+\.glb$/)
      .optional(),
    featured: z.boolean(),
    status: z.enum(["draft", "published", "paused", "archived"]),
  })
  .strict();
export type Listing = z.infer<typeof listing>;
export type Print = Listing & {
  id: string;
  publishedAt: string;
  legacyId?: number;
};
export const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
export const dimensions = (p: Listing) => p.dimensions.join(" × ") + " mm";
export function sizeBand(mm: number) {
  return mm < 50
    ? "Under 50 mm"
    : mm < 100
      ? "50–99 mm"
      : mm < 200
        ? "100–199 mm"
        : "200 mm and up";
}
export const sizeBands = [0, 50, 100, 200].map(sizeBand);
