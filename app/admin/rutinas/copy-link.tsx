"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles el input sigue ahí para copiar a mano.
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input
        readOnly
        value={url}
        onFocus={(event) => event.target.select()}
        className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900"
        aria-label="Enlace del paciente"
      />
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
