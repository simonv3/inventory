"use client";

import {
  UseFormRegister,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import { Button, Dialog } from "@/components";

export interface CustomerFormInputs {
  name: string;
  email: string;
}

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  register: UseFormRegister<CustomerFormInputs>;
  errors: FieldErrors<CustomerFormInputs>;
  handleSubmit: UseFormHandleSubmit<CustomerFormInputs>;
  onSubmit: (data: CustomerFormInputs) => void;
}

const FIELD = "input w-full";
const ERROR = "text-error text-sm mt-1";

export function CustomerFormDialog({
  open,
  onOpenChange,
  editing,
  register,
  errors,
  handleSubmit,
  onSubmit,
}: CustomerFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Customer" : "New Customer"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            {...register("name", { required: "Name is required" })}
            className={FIELD}
          />
          {errors.name && <p className={ERROR}>{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
            className={FIELD}
          />
          {errors.email && <p className={ERROR}>{errors.email.message}</p>}
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
