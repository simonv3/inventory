"use client";

import { ReactNode } from "react";
import React from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="modal modal-open" role="dialog">
      <div className="modal-box max-w-md max-h-[90vh] flex flex-col p-0">
        <div className="flex justify-between items-center p-6 border-b border-base-300 shrink-0">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
      <div className="modal-backdrop" onClick={() => onOpenChange(false)} />
    </div>
  );
}

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
}

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-neutral btn-outline",
    danger: "btn-error",
  };

  return (
    <button
      className={`btn ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  className?: string;
  required?: boolean;
  textarea?: boolean;
  step?: string;
  min?: string;
  max?: string;
}

export function Input({
  label,
  type = "text",
  className = "",
  textarea = false,
  ...props
}: InputProps) {
  return (
    <div className="mb-4">
      {label && <label className="block font-medium mb-1">{label}</label>}
      {textarea ? (
        <textarea className={`textarea w-full ${className}`} {...props} />
      ) : (
        <input type={type} className={`input w-full ${className}`} {...props} />
      )}
    </div>
  );
}

interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  className?: string;
  required?: boolean;
}

export function Select({
  label,
  options,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="mb-4">
      {label && <label className="block font-medium mb-1">{label}</label>}
      <select
        className={`select w-full ${className}`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
