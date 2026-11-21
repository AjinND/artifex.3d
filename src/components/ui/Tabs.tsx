"use client";
import { useRef, type KeyboardEvent } from "react";
export default function Tabs({
  tabs,
  value,
  onChange,
  label,
  prefix,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  prefix: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function key(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  }
  return (
    <div role="tablist" aria-label={label} className="account-tabs">
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          role="tab"
          id={`${prefix}-${tab.id}`}
          aria-controls={`${prefix}-${tab.id}-panel`}
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => key(e, i)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
