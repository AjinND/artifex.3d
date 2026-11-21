"use client";
import { useId, useRef, useState } from "react";
import { listing, type Print } from "@/lib/shop/catalog";
import { request } from "@/lib/shop/client";
import MediaUpload from "./MediaUpload";
import PrintCard from "./PrintCard";
import ProductDetail from "./ProductDetail";
import styles from "./studio.module.css";

const listingFields = [
  ["name", "Product name"],
  ["slug", "Product URL slug"],
  ["category", "Category"],
] as const;

type FieldErrors = Record<string, string>;

function listingIssues(
  issues: { path: readonly PropertyKey[]; message: string }[],
) {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const [key, index, detail] = issue.path;
    const field = String(key ?? "listing");
    if (errors[field]) continue;
    switch (field) {
      case "slug":
        errors[field] =
          "Use up to 100 lowercase letters, numbers, or hyphens, like desk-organizer.";
        break;
      case "dimensions":
        errors[field] =
          "Enter three measurements in millimeters, like 60 × 35 × 40. Each must be greater than 0 and at most 10,000.";
        break;
      case "photos":
        errors[field] =
          typeof index !== "number"
            ? "Add one to twelve photos with descriptions."
            : detail === "url"
              ? `Photo ${index + 1} needs an uploaded image path such as /catalog/photo.png.`
              : `Photo ${index + 1} needs a description after the | separator (up to 200 characters).`;
        break;
      case "preview":
        errors[field] =
          "Use the URL returned after uploading a GLB file, or leave this optional field blank.";
        break;
      default:
        errors[field] = issue.message;
    }
  }
  return errors;
}

export default function ListingEditor({
  item,
  after,
}: {
  item?: Print;
  after: () => void;
}) {
  const [legacyId, setLegacyId] = useState("");
  const [preview, setPreview] = useState<Print | null>(null),
    [msg, set] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState(
    item?.photos.map((p) => `${p.url} | ${p.alt}`).join("\n") ?? "",
  );
  const [model, setModel] = useState(item?.preview ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const photosRef = useRef<HTMLTextAreaElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);
  const legacyRef = useRef<HTMLInputElement>(null);
  const reviewVersion = useRef(0);
  const fieldId = useId();

  function invalidate(field: string) {
    reviewVersion.current++;
    setPreview(null);
    setReviewing(false);
    setError("");
    set("");
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  function fieldState(field: string, hint?: string) {
    return {
      "aria-invalid": Boolean(fieldErrors[field]),
      "aria-describedby":
        [hint, fieldErrors[field] && `${fieldId}-${field}-error`]
          .filter(Boolean)
          .join(" ") || undefined,
    };
  }

  function fieldError(field: string) {
    return (
      fieldErrors[field] && (
        <span className="field-error" id={`${fieldId}-${field}-error`}>
          {fieldErrors[field]}
        </span>
      )
    );
  }

  function useMedia(path: string) {
    if (path.endsWith(".glb")) {
      setModel(path);
      invalidate("preview");
      modelRef.current?.focus();
    } else {
      setPhotos((current) =>
        current
          .split(/\r?\n/)
          .some((line) => line.split("|")[0].trim() === path)
          ? current
          : [current.trimEnd(), `${path} | `].filter(Boolean).join("\n"),
      );
      invalidate("photos");
      photosRef.current?.focus();
    }
  }

  async function review(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const version = ++reviewVersion.current;
    const f = new FormData(e.currentTarget);
    const parsed = listing.safeParse({
      ...Object.fromEntries(f),
      pricePaise: Math.round(Number(f.get("pricePaise")) * 100),
      leadDays: Number(f.get("leadDays")),
      dimensions: String(f.get("dimensions"))
        .split(/[x×]/i)
        .map((part) => Number(part.replace(/\s*mm\s*$/i, ""))),
      photos: photos
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line) => {
          const [url, ...alt] = line.split("|");
          return { url: url.trim(), alt: alt.join("|").trim() };
        }),
      preview: model.trim() || undefined,
      featured: f.has("featured"),
    });
    const errors = parsed.success ? {} : listingIssues(parsed.error.issues);
    if (
      legacyId &&
      (!Number.isSafeInteger(Number(legacyId)) || Number(legacyId) < 1)
    )
      errors.legacyId =
        "Enter a positive whole number, or leave this field blank.";
    setFieldErrors(errors);
    setPreview(null);
    set("");
    setError("");
    if (!parsed.success || errors.legacyId) {
      setError("Fix the highlighted fields to preview the listing.");
      const first = Object.keys(errors)[0];
      const input =
        first === "legacyId"
          ? legacyRef.current
          : formRef.current?.elements.namedItem(first);
      if (input instanceof HTMLElement) input.focus();
      return;
    }

    setReviewing(true);
    try {
      if (parsed.data.status === "published")
        await request("/api/products?preview=1", parsed.data);
      if (reviewVersion.current === version)
        setPreview({
          ...parsed.data,
          id: item?.id || "preview",
          publishedAt: "",
        });
    } catch (e) {
      if (reviewVersion.current === version) setError((e as Error).message);
    } finally {
      if (reviewVersion.current === version) setReviewing(false);
    }
  }
  async function save() {
    if (!preview || saving) return;
    setSaving(true);
    setError("");
    try {
      const data = listing.parse(
        Object.fromEntries(
          Object.keys(listing.shape).map((k) => [k, preview[k as keyof Print]]),
        ),
      );
      await request("/api/products", {
        ...data,
        ...(legacyId ? { legacyId: Number(legacyId) } : {}),
      });
      set("Listing saved");
      setPreview(null);
      after();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="listing-editor">
      {!item && (
        <label>
          Existing numeric product ID (legacy imports only)
          <input
            ref={legacyRef}
            type="number"
            min={1}
            value={legacyId}
            disabled={saving}
            {...fieldState("legacyId")}
            onChange={(e) => {
              setLegacyId(e.target.value);
              invalidate("legacyId");
            }}
          />
          {fieldError("legacyId")}
        </label>
      )}
      <form
        ref={formRef}
        className={styles.listingForm}
        onSubmit={review}
        onChange={(e) => {
          if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            e.target instanceof HTMLSelectElement
          )
            if (e.target.name) invalidate(e.target.name);
        }}
        aria-busy={saving || reviewing}
      >
        <fieldset disabled={saving}>
          <legend>
            <span className="section-number">01</span>Listing details
          </legend>
          <div className={styles.listingFields}>
            {listingFields.map(([k, label]) => (
              <label key={k}>
                {label}
                {k === "slug" && (
                  <span className="muted" id={`${fieldId}-slug-hint`}>
                    Example: desk-organizer
                  </span>
                )}
                <input
                  name={k}
                  required
                  readOnly={k === "slug" && !!item}
                  defaultValue={item?.[k]}
                  {...fieldState(
                    k,
                    k === "slug" ? `${fieldId}-slug-hint` : undefined,
                  )}
                />
                {fieldError(k)}
              </label>
            ))}
            <label className={styles.fullWidth}>
              Description
              <textarea
                name="description"
                required
                defaultValue={item?.description}
                {...fieldState("description")}
              />
              {fieldError("description")}
            </label>
          </div>
        </fieldset>
        <fieldset disabled={saving}>
          <legend>
            <span className="section-number">02</span>Specifications & pricing
          </legend>
          <div className={styles.listingFields}>
            <label>
              Material
              <input
                name="material"
                required
                defaultValue={item?.material}
                {...fieldState("material")}
              />
              {fieldError("material")}
            </label>
            <label>
              Finish
              <input
                name="finish"
                required
                defaultValue={item?.finish}
                {...fieldState("finish")}
              />
              {fieldError("finish")}
            </label>
            <label className={styles.fullWidth}>
              Dimensions in mm (L x W x H)
              <input
                name="dimensions"
                required
                defaultValue={item?.dimensions.join(" x ")}
                {...fieldState("dimensions")}
              />
              {fieldError("dimensions")}
            </label>
            <label>
              Price in rupees
              <input
                name="pricePaise"
                type="number"
                step=".01"
                min=".01"
                required
                defaultValue={item && item.pricePaise / 100}
                {...fieldState("pricePaise")}
              />
              {fieldError("pricePaise")}
            </label>
            <label>
              Production days
              <input
                name="leadDays"
                type="number"
                min={1}
                max={365}
                required
                defaultValue={item?.leadDays}
                {...fieldState("leadDays")}
              />
              {fieldError("leadDays")}
            </label>
          </div>
        </fieldset>
        <fieldset disabled={saving}>
          <legend>
            <span className="section-number">03</span>Photos & preview
          </legend>
          <MediaUpload onUse={useMedia} />
          <label>
            Approved photos
            <span className="muted" id={`${fieldId}-photo-hint`}>
              Put the cover first. Use one /catalog/filename.jpg | description
              per line.
            </span>
            <textarea
              ref={photosRef}
              name="photos"
              required
              value={photos}
              onChange={(e) => setPhotos(e.target.value)}
              {...fieldState("photos", `${fieldId}-photo-hint`)}
            />
            {fieldError("photos")}
          </label>
          <label>
            Approved public preview (optional)
            <span className="muted" id={`${fieldId}-preview-hint`}>
              Leave blank for photos only, or use the path from a separately
              uploaded GLB file.
            </span>
            <input
              ref={modelRef}
              name="preview"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              {...fieldState("preview", `${fieldId}-preview-hint`)}
            />
            {fieldError("preview")}
          </label>
        </fieldset>
        <fieldset disabled={saving}>
          <legend>
            <span className="section-number">04</span>Publication
          </legend>
          <div className={styles.listingFields}>
            <label>
              Status
              <select name="status" defaultValue={item?.status || "draft"}>
                {["draft", "published", "paused", "archived"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className={styles.checkField}>
              <input
                type="checkbox"
                name="featured"
                defaultChecked={item?.featured}
              />{" "}
              Feature on home page
            </label>
          </div>
        </fieldset>
        <button disabled={saving || reviewing}>
          {reviewing ? "Checking listing…" : "Preview listing"}
        </button>
      </form>
      {preview && (
        <div className="listing-preview">
          <h2>Review your listing</h2>
          <PrintCard item={preview} />
          <ProductDetail item={preview} previewOnly />
          <button className="shop-primary" disabled={saving} onClick={save}>
            {saving ? "Saving listing…" : "Save reviewed listing"}
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <p role="status">{msg}</p>
    </section>
  );
}
