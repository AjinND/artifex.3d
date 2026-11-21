"use client";
import { trapDialogFocus } from "@/components/ui/dialogFocus";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    if (isOpen) ref.current?.showModal();
    else ref.current?.close();
  }, [isOpen]);
  return (
    <dialog
      onKeyDown={trapDialogFocus}
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={id}
      aria-describedby={id + "-description"}
      onCancel={(e) => {
        if (isLoading) e.preventDefault();
        else onCancel();
      }}
    >
      <h2 className="font-display text-3xl mb-4" id={id}>
        {title}
      </h2>
      <p className="text-text-secondary" id={id + "-description"}>
        {message}
      </p>
      <div className="shop-actions">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={isDangerous ? "destructive" : "default"}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </dialog>
  );
}
