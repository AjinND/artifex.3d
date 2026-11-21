"use client";
import { trapDialogFocus } from "@/components/ui/dialogFocus";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import { sizeBand, sizeBands, type Print } from "@/lib/shop/catalog";
import PrintCard from "./PrintCard";
const labels: Record<string, string> = {
  q: "Search",
  category: "Category",
  material: "Material",
  size: "Longest side",
  max: "Maximum price",
};
export default function Gallery({ items }: { items: Print[] }) {
  const [params, setParams] = useState(new URLSearchParams());
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const read = () => setParams(new URLSearchParams(location.search));
    read();
    addEventListener("popstate", read);
    return () => removeEventListener("popstate", read);
  }, []);
  function change(key: string, value: string) {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    history.replaceState(
      history.state,
      "",
      location.pathname + (p.size ? "?" + p : ""),
    );
    setParams(p);
  }
  const get = (k: string) => params.get(k) || "";
  const shown = items.filter(
    (p) =>
      [p.name, p.category, p.material]
        .join(" ")
        .toLowerCase()
        .includes(get("q").toLowerCase()) &&
      (!get("category") || p.category === get("category")) &&
      (!get("material") || p.material === get("material")) &&
      (!get("size") || sizeBand(Math.max(...p.dimensions)) === get("size")) &&
      (!get("max") || p.pricePaise <= Number(get("max")) * 100),
  );
  if (get("sort") === "Price ascending")
    shown.sort((a, b) => a.pricePaise - b.pricePaise);
  if (get("sort") === "Price descending")
    shown.sort((a, b) => b.pricePaise - a.pricePaise);
  function select(key: string, label: string, options: string[], all = "All") {
    return (
      <label>
        {label}
        <select value={get(key)} onChange={(e) => change(key, e.target.value)}>
          <option value="">{all}</option>
          {options.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
    );
  }
  function filters() {
    return (
      <>
        {select("category", "Category", [
          ...new Set(items.map((p) => p.category)),
        ])}
        {select("material", "Material", [
          ...new Set(items.map((p) => p.material)),
        ])}
        {select("size", "Longest side", sizeBands)}
        <label>
          Maximum price (₹)
          <input
            type="number"
            min="0"
            value={get("max")}
            onChange={(e) => change("max", e.target.value)}
          />
        </label>
      </>
    );
  }
  function clear() {
    history.replaceState(history.state, "", location.pathname);
    setParams(new URLSearchParams());
  }
  const active = [...params.entries()].filter(([key]) => key in labels);
  return (
    <main className="shop-shell">
      <header className="collection-heading">
        <p className="eyebrow">Artifex3D / Objects to make your own</p>
        <h1>Print collection</h1>
        <p>
          Explore form, material, and the little details. Every print is made to
          order.
        </p>
      </header>
      {!items.length ? (
        <section className="collection-empty">
          <p className="eyebrow">In the making</p>
          <h2>New prints are on the way.</h2>
          <p>
            The studio has no published prints yet. Have something in mind?
            Start with a custom brief.
          </p>
          <Link className="text-link" href="/order">
            Request a custom quote <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <>
          <div role="search" aria-label="Filter prints">
            <div className="collection-toolbar">
              <label>
                Search
                <span className="collection-search">
                  <Search size={18} aria-hidden="true" />
                  <input
                    value={get("q")}
                    onChange={(e) => change("q", e.target.value)}
                    placeholder="Name, category or material"
                  />
                </span>
              </label>
              {select(
                "sort",
                "Sort",
                ["Price ascending", "Price descending"],
                "Newest",
              )}
              <button
                className="shop-secondary mobile-filter-button"
                onClick={() => dialog.current?.showModal()}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filters
              </button>
            </div>
            <div className="shop-filters">{filters()}</div>
          </div>
          <dialog
            onKeyDown={trapDialogFocus}
            ref={dialog}
            className="filter-dialog"
            aria-labelledby="filter-title"
          >
            <div className="dialog-heading">
              <h2 id="filter-title">Refine the collection</h2>
              <button
                aria-label="Close filters"
                onClick={() => dialog.current?.close()}
              >
                <X size={18} />
              </button>
            </div>
            <div className="filter-fields">{filters()}</div>
            <div className="shop-actions">
              <button onClick={() => dialog.current?.close()}>
                Show {shown.length} prints
              </button>
              <button onClick={clear}>Clear filters</button>
            </div>
          </dialog>
          {!!active.length && (
            <div className="filter-chips">
              {active.map(([key, value]) => (
                <button
                  className="filter-chip"
                  key={key}
                  onClick={() => change(key, "")}
                  aria-label={`Remove ${labels[key]} filter`}
                >
                  {labels[key]}: {key === "max" ? "₹" : ""}
                  {value}
                  <X size={14} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          <div className="collection-results">
            <p role="status">
              {shown.length} {shown.length === 1 ? "print" : "prints"}
            </p>
            {!!params.size && (
              <button className="text-link" onClick={clear}>
                Clear filters
              </button>
            )}
          </div>
          <div className="print-grid">
            {shown.map((item) => (
              <PrintCard key={item.id} item={item} />
            ))}
          </div>
          {!shown.length && (
            <div className="collection-no-results">
              <h2>A little too specific?</h2>
              <p>
                No prints match these filters. Try changing the search or
                clearing the filters.
              </p>
              <button className="shop-secondary" onClick={clear}>
                Clear filters
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
