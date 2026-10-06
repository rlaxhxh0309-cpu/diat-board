import { categoryInfo, type Category } from "@/utils/posts";

const STYLES: Record<Category, string> = {
  start: "bg-brand-soft text-brand",
  progress: "bg-coral-soft text-ink",
  success: "bg-brand text-white",
};

export function CategoryBadge({ category, className = "" }: { category: Category; className?: string }) {
  const { label, emoji } = categoryInfo(category);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STYLES[category]} ${className}`}
    >
      <span aria-hidden="true">{emoji}</span>
      {label}
    </span>
  );
}
