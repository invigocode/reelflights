"use client";

import { useId, useMemo } from "react";

interface MonthSelectProps {
  value: string | null;
  onChange: (month: string) => void;
  label: string;
}

function nextTwelveMonths(): { value: string; label: string }[] {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    months.push({ value, label });
  }
  return months;
}

export function MonthSelect({ value, onChange, label }: MonthSelectProps) {
  const options = useMemo(() => nextTwelveMonths(), []);
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-muted mb-1.5">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-11 border border-line bg-surface px-4 py-3 text-lg text-ink focus-visible:outline-2 focus-visible:outline-rust"
      >
        <option value="" disabled>
          Choose a month
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
