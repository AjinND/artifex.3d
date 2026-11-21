"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { takePurchase } from "@/lib/shop/cartReceipt";
import { request } from "@/lib/shop/client";
import type { Print } from "@/lib/shop/catalog";
type Item = { item: Print; quantity: number };
type Cart = {
  items: Item[];
  totalItems: number;
  isOpen: boolean;
  toggleCart: () => void;
  closeCart: () => void;
  addPrint: (p: Print, n: number) => void;
  setQuantity: (id: string, n: number) => void;
  remove: (id: string) => void;
  notice: string;
  acknowledge: () => void;
  ready: boolean;
  refresh: () => void;
  settle: (id: string) => void;
};
const Context = createContext<Cart | null>(null);
const key = "artifex3d_cart";
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, set] = useState<Item[]>([]),
    [isOpen, open] = useState(false),
    [ready, loaded] = useState(false),
    [notice, warn] = useState(""),
    [tick, reload] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      let saved: unknown;
      try {
        saved = JSON.parse(localStorage.getItem(key) || "[]");
      } catch {
        saved = [];
      }
      if (!Array.isArray(saved) || !saved.length) {
        if (active) {
          set([]);
          loaded(true);
        }
        return;
      }
      try {
        const prints = await request<Print[]>("/api/products");
        let changed = false;
        const valid: Item[] = [];
        for (const row of saved) {
          const item = prints.find(
            (p) =>
              p.id === row?.id ||
              (typeof row?.id === "number" && p.legacyId === row.id),
          );
          if (!item || !Number.isInteger(row.quantity) || row.quantity < 1) {
            changed = true;
            continue;
          }
          if (row.pricePaise !== item.pricePaise || row.quantity > 100)
            changed = true;
          valid.push({ item, quantity: Math.min(100, row.quantity) });
        }
        if (active) {
          set(valid);
          if (changed)
            warn("Availability or pricing changed. Review the updated cart.");
          loaded(true);
        }
      } catch {
        if (active) warn("Could not refresh the cart. Please retry.");
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [tick]);
  useEffect(() => {
    if (ready)
      localStorage.setItem(
        key,
        JSON.stringify(
          items.map(({ item, quantity }) => ({
            id: item.id,
            quantity,
            pricePaise: item.pricePaise,
          })),
        ),
      );
  }, [items, ready]);
  function addPrint(item: Print, n: number) {
    if (!ready) return;
    set((old) => {
      const has = old.some((v) => v.item.id === item.id);
      return has
        ? old.map((v) =>
            v.item.id === item.id
              ? { item, quantity: Math.min(100, v.quantity + n) }
              : v,
          )
        : [...old, { item, quantity: n }];
    });
    open(true);
  }
  return (
    <Context.Provider
      value={{
        items,
        totalItems: items.reduce((s, v) => s + v.quantity, 0),
        isOpen,
        toggleCart: () => open(!isOpen),
        closeCart: () => open(false),
        addPrint,
        setQuantity: (id, n) => {
          if (Number.isInteger(n) && n > 0 && n <= 100)
            set((old) =>
              old.map((v) => (v.item.id === id ? { ...v, quantity: n } : v)),
            );
        },
        remove: (id) => set((old) => old.filter((v) => v.item.id !== id)),
        notice,
        acknowledge: () => warn(""),
        ready,
        refresh: () => {
          loaded(false);
          reload((t) => t + 1);
        },
        settle: (id) => {
          const lines = takePurchase(id);
          if (lines.length)
            set((old) =>
              old
                .map((v) => ({
                  ...v,
                  quantity:
                    v.quantity -
                    (lines.find((l) => l.id === v.item.id)?.quantity || 0),
                }))
                .filter((v) => v.quantity > 0),
            );
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCart() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Cart provider required");
  return ctx;
}
