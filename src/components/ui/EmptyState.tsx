export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded border border-dashed border-ink-600 px-4 py-6 text-center text-sm text-paper-500">
      {children}
    </p>
  );
}