"use client";

import { CATEGORIES, type Category } from "@/utils/posts";

// 글쓰기·수정에서 쓰는 다이어트 단계 선택 (필수)
export function CategoryPicker({
  value,
  onChange,
}: {
  value: Category | null;
  onChange: (value: Category) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold">
        다이어트 단계 <span className="text-coral">*</span>
      </legend>
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((c) => {
          const checked = value === c.value;
          return (
            <label
              key={c.value}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center text-sm transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20 ${
                checked
                  ? "border-brand bg-brand-soft font-semibold text-brand"
                  : "border-line bg-white text-muted hover:border-brand hover:text-brand"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={c.value}
                checked={checked}
                onChange={() => onChange(c.value)}
                required
                className="sr-only"
              />
              <span aria-hidden="true" className="text-2xl">
                {c.emoji}
              </span>
              <span className="whitespace-nowrap">{c.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
