type Tone = "gain" | "loss" | "neutral" | "brass";

const TONE_CLASSES: Record<Tone, string> = {
  gain: "bg-gain-600/15 text-gain-500",
  loss: "bg-loss-600/15 text-loss-500",
  neutral: "bg-ink-700 text-paper-300",
  brass: "bg-brass-500/15 text-brass-400",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}