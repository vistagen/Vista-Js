interface CodeProps {
  title?: string;
  language: string;
  code: string;
}

export function Code({ title, language, code }: CodeProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{title || language}</p>
        <span className="text-[11px] uppercase tracking-[0.1em] text-zinc-600">{language}</span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-7 text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}
