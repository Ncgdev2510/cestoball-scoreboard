import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Tv, Copy, Check, ExternalLink, Wifi, HelpCircle } from 'lucide-react';
import { fetchNetworkInfo, NetworkInfo } from '../utils/storage';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'mobile' | 'obs' | 'scoreboard'>('mobile');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    void fetchNetworkInfo().then(info => {
      if (info && info.ips.length > 0) {
        setNetworkInfo(info);
        setSelectedIp(info.ips[0]);
      } else {
        setSelectedIp(window.location.hostname || 'localhost');
      }
    });
  }, [isOpen]);

  const port = networkInfo?.port || window.location.port || '5173';
  const host = selectedIp || window.location.hostname || 'localhost';
  const baseUrl = `http://${host}${port ? `:${port}` : ''}`;

  const mobileUrl = `${baseUrl}?view=mobile`;
  const obsUrl = `${baseUrl}?view=overlay&style=bar`;
  const obsBadgeUrl = `${baseUrl}?view=overlay&style=badge`;
  const scoreboardUrl = `${baseUrl}?view=scoreboard`;

  const activeUrl =
    activeTab === 'mobile'
      ? mobileUrl
      : activeTab === 'obs'
      ? obsUrl
      : scoreboardUrl;

  useEffect(() => {
    if (!activeUrl) return;
    QRCode.toDataURL(activeUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(() => setQrCodeDataUrl(''));
  }, [activeUrl]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121620] border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Smartphone size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              Conexión Remota & Enlaces
            </h2>
            <p className="text-xs text-slate-400">
              Controla el tablero desde tu celular o conéctalo a OBS Studio
            </p>
          </div>
        </div>

        {/* IP Selector if multiple IPs are detected */}
        {networkInfo && networkInfo.ips.length > 1 && (
          <div className="mb-4 flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 text-xs">
            <Wifi size={14} className="text-blue-400 shrink-0" />
            <span className="text-slate-400">IP de tu red Wi-Fi:</span>
            <select
              value={selectedIp}
              onChange={e => setSelectedIp(e.target.value)}
              className="bg-slate-800 text-white rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-blue-500 font-mono text-xs"
            >
              {networkInfo.ips.map(ip => (
                <option key={ip} value={ip}>
                  {ip}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mobile'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} /> Control Celular
          </button>
          <button
            onClick={() => setActiveTab('obs')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'obs'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv size={14} /> Overlay OBS
          </button>
          <button
            onClick={() => setActiveTab('scoreboard')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'scoreboard'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink size={14} /> Pantalla Gigante
          </button>
        </div>

        {/* Content based on Tab */}
        {activeTab === 'mobile' && (
          <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center shrink-0">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-36 h-36" />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs font-medium">
                  Generando QR...
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="flex flex-col gap-2.5 text-xs text-slate-300 flex-1">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  Conecta tu celular a la <strong>misma red Wi-Fi</strong> que esta computadora.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  <strong>Escanea el código QR</strong> con la cámara de tu celular o abre el siguiente link en Chrome/Safari:
                </span>
              </div>

              {/* Link Box */}
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-[11px] text-blue-300 overflow-hidden">
                <span className="truncate flex-1">{mobileUrl}</span>
                <button
                  onClick={() => copyToClipboard(mobileUrl, 'mobile')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  {copiedKey === 'mobile' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedKey === 'mobile' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * No hace falta instalar ninguna aplicación (APK). Funciona directamente en el navegador.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'obs' && (
          <div className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 text-xs">
            <div className="flex items-start gap-2 text-slate-300">
              <HelpCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <span>
                En OBS Studio, agrega una nueva fuente de tipo <strong>Navegador (Browser Source)</strong> y pega cualquiera de estos links:
              </span>
            </div>

            {/* Option 1: Horizontal Bar */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">
                  Opción 1: Barra Horizontal Inferior (Recomendada)
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Estilo TV
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <span className="truncate flex-1 text-blue-300">{obsUrl}</span>
                <button
                  onClick={() => copyToClipboard(obsUrl, 'obs-bar')}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                >
                  {copiedKey === 'obs-bar' ? <Check size={12} className="text-white" /> : <Copy size={12} />}
                  {copiedKey === 'obs-bar' ? 'Copiado' : 'Copiar'}
                </button>
                <a
                  href={obsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-slate-400 hover:text-white"
                  title="Abrir vista previa"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Option 2: Compact Badge */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">
                  Opción 2: Tarjeta / Badge Compacto
                </span>
                <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                  Esquina
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <span className="truncate flex-1 text-blue-300">{obsBadgeUrl}</span>
                <button
                  onClick={() => copyToClipboard(obsBadgeUrl, 'obs-badge')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                >
                  {copiedKey === 'obs-badge' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedKey === 'obs-badge' ? 'Copiado' : 'Copiar'}
                </button>
                <a
                  href={obsBadgeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-slate-400 hover:text-white"
                  title="Abrir vista previa"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* OBS Recommendation */}
            <div className="text-[11px] text-slate-400 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
              <strong>Configuración recomendada en OBS:</strong>
              <span>• Ancho: <code>1920</code> | Alto: <code>1080</code></span>
              <span>• El fondo es transparente automáticamente.</span>
            </div>
          </div>
        )}

        {activeTab === 'scoreboard' && (
          <div className="flex flex-col gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 text-xs">
            <p className="text-slate-300">
              Usa este enlace para proyectar el <strong>marcador gigante</strong> en un televisor, proyector o pantalla de estadio:
            </p>
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-blue-300">
              <span className="truncate flex-1">{scoreboardUrl}</span>
              <button
                onClick={() => copyToClipboard(scoreboardUrl, 'scoreboard')}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
              >
                {copiedKey === 'scoreboard' ? <Check size={12} className="text-white" /> : <Copy size={12} />}
                {copiedKey === 'scoreboard' ? 'Copiado' : 'Copiar'}
              </button>
              <a
                href={scoreboardUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-slate-400 hover:text-white"
                title="Abrir en pestaña nueva"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
