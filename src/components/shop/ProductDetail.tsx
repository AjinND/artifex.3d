"use client";
import { trapDialogFocus } from "@/components/ui/dialogFocus";
import Image from "./ProductImage";
import { useEffect, useRef, useState } from "react";
import ModelView from "./ModelView";
import Link from "next/link";
import { money, dimensions, type Print } from "@/lib/shop/catalog";
import { useCart } from "@/components/features/cart/CartContext";
export default function ProductDetail({
  item,
  previewOnly = false,
}: {
  item: Print;
  previewOnly?: boolean;
}) {
  const [index, pick] = useState(0),
    [mode, setMode] = useState(false),
    [ready, setReady] = useState(false),
    [error, fail] = useState(""),
    [qty, count] = useState(1),
    [retry, nextTry] = useState(0);
  const zoom = useRef<HTMLDialogElement>(null);
  const viewer = useRef<
    HTMLElement & { cameraOrbit: string; fieldOfView: string }
  >(null);
  const { addPrint, ready: cartReady } = useCart();
  const photo = item.photos[index] || item.photos[0];
  useEffect(() => {
    if (!mode) return;
    let active = true;
    import("@google/model-viewer")
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) {
          fail("3D view unavailable.");
          setMode(false);
        }
      });
    return () => {
      active = false;
    };
  }, [mode]);
  useEffect(() => {
    const el = viewer.current;
    if (!el) return;
    const failed = () => {
      fail("3D view unavailable.");
      setMode(false);
      nextTry((n) => n + 1);
    };
    el.addEventListener("error", failed);
    return () => el.removeEventListener("error", failed);
  }, [mode, ready]);
  const Container = previewOnly ? "div" : "main";
  return (
    <Container className="shop-shell detail">
      <section>
        <div className="print-stage">
          {mode && ready ? (
            <ModelView
              viewer={viewer}
              src={item.preview! + (retry ? "?retry=" + retry : "")}
              poster={photo.url}
              alt={item.name + " rotatable preview"}
            />
          ) : (
            <button
              onClick={() => zoom.current?.showModal()}
              aria-label={"Enlarge " + photo.alt}
            >
              <Image
                width={960}
                height={960}
                sizes="(max-width: 800px) 92vw, 640px"
                src={photo.url}
                alt={photo.alt}
              />
            </button>
          )}
        </div>
        <div className="shop-actions">
          {item.photos.map((p, i) => (
            <button
              aria-pressed={!mode && index === i}
              key={p.url + i}
              onClick={() => {
                pick(i);
                setMode(false);
              }}
              className="thumb"
            >
              <Image
                width={960}
                height={960}
                sizes="52px"
                src={p.url}
                alt={p.alt}
              />
            </button>
          ))}
          {item.preview && (
            <button
              className="shop-secondary"
              onClick={() => {
                fail("");
                setMode(!mode);
              }}
            >
              {mode ? "Back to photos" : "View in 3D"}
            </button>
          )}
          {mode && (
            <button
              className="shop-secondary"
              disabled={!ready}
              onClick={() => {
                if (viewer.current) {
                  viewer.current.cameraOrbit = "auto auto auto";
                  viewer.current.fieldOfView = "auto";
                }
              }}
            >
              Reset view
            </button>
          )}
        </div>
        <p role="status">
          {error || (mode && !ready ? "Loading 3D preview…" : "")}
        </p>
        <dialog
          onKeyDown={trapDialogFocus}
          ref={zoom}
          className="photo-dialog"
          aria-label={item.name + " photo preview"}
        >
          <button autoFocus onClick={() => zoom.current?.close()}>
            Close photo
          </button>
          <Image
            width={960}
            height={960}
            sizes="(max-width: 800px) 92vw, 640px"
            src={photo.url}
            alt={photo.alt}
          />
        </dialog>
      </section>
      <section className="product-info">
        <Link className="text-link" href="/gallery">
          ← Back to collection
        </Link>
        <p className="eyebrow">{item.category}</p>
        <h1>{item.name}</h1>
        <strong>{money(item.pricePaise)}</strong>
        <p>{item.description}</p>
        <dl>
          {Object.entries({
            "Dimensions (L × W × H)": dimensions(item),
            Material: item.material,
            Finish: item.finish,
            "Production time": item.leadDays + " days before dispatch",
          }).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {!previewOnly && (
          <>
            <label>
              Quantity
              <input
                type="number"
                min={1}
                max={100}
                value={qty}
                onChange={(e) => count(Number(e.target.value))}
              />
            </label>
            <button
              className="shop-primary"
              disabled={
                !cartReady || !Number.isInteger(qty) || qty < 1 || qty > 100
              }
              onClick={() => addPrint(item, qty)}
            >
              Add to cart
            </button>
            <Link
              className="shop-secondary"
              href={"/order?product=" + item.slug}
            >
              Request a variation
            </Link>
          </>
        )}
      </section>
    </Container>
  );
}
