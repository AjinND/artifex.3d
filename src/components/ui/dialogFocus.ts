import type { KeyboardEvent } from "react";

/** Keep Tab inside a modal, including the last-to-first keyboard boundary. */
export function trapDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const elements = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getClientRects().length > 0);
  const first = elements[0];
  const last = elements.at(-1);
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === event.currentTarget)
  ) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
