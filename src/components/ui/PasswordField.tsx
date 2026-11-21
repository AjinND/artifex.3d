"use client";
import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
  hint?: string;
};
export default function PasswordField({ label, error, hint, ...props }: Props) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="account-password">
        <input
          {...props}
          id={id}
          required
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={error || hint ? id + "-help" : undefined}
        />
        <button
          className="account-toggle"
          type="button"
          aria-label={(show ? "Hide " : "Show ") + label.toLowerCase()}
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {(error || hint) && (
        <p
          id={id + "-help"}
          className={error ? "field-error" : "muted"}
          style={{ fontSize: 13 }}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
