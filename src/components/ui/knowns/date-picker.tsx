"use client";

import { Input, type InputSize } from "./input";

export function DatePicker({
  id,
  value,
  onValueChange,
  size = "md",
}: {
  id: string;
  variant: "field";
  value: string;
  onValueChange: (value: string) => void;
  size?: InputSize;
}) {
  return (
    <Input
      id={id}
      type="date"
      size={size}
      value={value || ""}
      onChange={(event) => onValueChange(event.target.value)}
    />
  );
}
