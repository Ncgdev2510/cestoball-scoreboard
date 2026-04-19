import { useState } from 'react';
import { Copy, Check, RefreshCw, FolderOpen } from 'lucide-react';
import type { LicenseBootstrap } from '../../types/licenseBootstrap';

interface Props {
  bootstrap: LicenseBootstrap;
  onRecheck: () => Promise<LicenseBootstrap>;
  onQuit: () => void;
}

export default function LicenseGate({ bootstrap, onRecheck, onQuit }: Props) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyHwid = async () => {
    try {
      await navigator.clipboard.writeText(bootstrap.machineId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const recheck = async () => {
    setBusy(true);
    try {
      await onRecheck();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-2xl shadow-black/40 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Activación requerida
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Esta copia de Scoreboard Cestoball no tiene una licencia válida para este
            equipo. Copiá el ID de hardware y enviámelo para recibir el archivo{' '}
            <code className="text-amber-200/90">license.lic</code>. Luego
            colocá ese archivo en una de las rutas indicadas abajo y pulsá{' '}
            <strong className="text-slate-200">Reintentar</strong>.
          </p>
        </div>

        {bootstrap.reason ? (
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100/90 whitespace-pre-wrap">
            {bootstrap.reason}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            ID de hardware
          </label>
          <div className="flex gap-2">
            <code className="flex-1 break-all rounded-lg bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-emerald-300/95 font-mono">
              {bootstrap.machineId}
            </code>
            <button
              type="button"
              onClick={() => void copyHwid()}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            <FolderOpen className="w-3.5 h-3.5" />
            Ubicaciones de license.lic
          </label>
          <ul className="space-y-2 text-sm text-slate-400">
            {bootstrap.searchedPaths.map((p) => (
              <li
                key={p}
                className="rounded-lg bg-slate-950/80 border border-slate-800 px-3 py-2 font-mono text-xs break-all"
              >
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void recheck()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            Reintentar
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="rounded-lg border border-slate-600 bg-transparent hover:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
