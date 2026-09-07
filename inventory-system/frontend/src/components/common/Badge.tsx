type BadgeTone = "success" | "danger" | "steel" | "accent" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  steel: "bg-steel-soft text-steel",
  accent: "bg-accent-soft text-accent-dark",
  neutral: "bg-line/60 text-ink-soft",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
