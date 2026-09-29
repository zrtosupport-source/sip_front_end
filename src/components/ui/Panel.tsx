export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border border-ink-700 bg-ink-900">
      <header className="flex items-start justify-between gap-4 border-b border-ink-700 px-5 py-4">
        <div>
          <h2 className="font-serif text-lg text-paper-100">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-paper-500">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}