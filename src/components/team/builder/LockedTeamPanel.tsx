import { BTN_PRIMARY, BTN_SECONDARY } from "./constants";

export default function LockedTeamPanel({
  hasPrediction, activeTab, setActiveTab, downloading, onDownloadImage, readOnly, onUnlock, unlocking, onOpenPredictionModal,
}: {
  hasPrediction: boolean;
  activeTab: "volgende" | "voorspellingen";
  setActiveTab: (tab: "volgende" | "voorspellingen") => void;
  downloading: boolean;
  onDownloadImage: () => void;
  readOnly: boolean;
  onUnlock: () => void;
  unlocking: boolean;
  onOpenPredictionModal: () => void;
}) {
  return (
    <div className="mb-5 bg-green-900/20 border border-green-500/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-green-500/20">
        <p className="text-green-400 font-bold text-sm">✓ Team ingediend</p>
        <p className="text-slate-400 text-xs mt-0.5">{hasPrediction ? "Voorspellingen ingediend." : "Volg de volgende stappen om je inschrijving compleet te maken."}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-green-500/20 px-5">
        <button onClick={() => setActiveTab("volgende")}
          className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === "volgende" ? "text-green-400 border-b-2 border-green-400" : "text-slate-400 hover:text-slate-300"}`}>
          Volgende stappen
        </button>
        <button onClick={() => setActiveTab("voorspellingen")}
          className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === "voorspellingen" ? "text-green-400 border-b-2 border-green-400" : "text-slate-400 hover:text-slate-300"}`}>
          Voorspellingen
        </button>
      </div>

      {/* Tab content */}
      <div className="px-5 py-4 space-y-4">
        {/* Tab: Volgende stappen */}
        {activeTab === "volgende" && (
          <div className="space-y-4">
            {/* Download */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">📸 Download je opstelling</p>
              <p className="text-xs text-slate-500 mb-2.5">Zorg dat je een screenshot of download hebt van je team — je hebt dit nodig als bewijs.</p>
              <button onClick={onDownloadImage} disabled={downloading} className={BTN_SECONDARY + " w-full"}>
                <span className="flex items-center gap-1.5 justify-center">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0">
                    <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {downloading ? "Laden..." : "Download opstelling"}
                </span>
              </button>
            </div>

            {/* Betaling */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">💳 Betaal het inschrijfgeld</p>
              <p className="text-xs text-slate-500 mb-2.5">Kies het bedrag dat je wilt betalen.</p>
              <div className="flex gap-2">
                <a href="https://betaalverzoek.rabobank.nl/betaalverzoek/?id=t1ajnGTJQROVbXhcYSYyFA" target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700">
                  Betaal €7,50
                </a>
                <a href="https://betaalverzoek.rabobank.nl/betaalverzoek/?id=fJNmXjzjQ0ao6IA4_cLn8Q" target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700">
                  Betaal €15,00
                </a>
              </div>
            </div>

            {/* WhatsApp groep */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">📱 Volg updates</p>
              <p className="text-xs text-slate-500 mb-2.5">Volg de WhatsApp-groep voor updates over het seizoen.</p>
              <a href="https://chat.whatsapp.com/Dzqab7sMXu93CriSAqrSEd" target="_blank" rel="noopener noreferrer" className="block w-full px-4 py-2.5 bg-green-900/40 hover:bg-green-900/60 text-green-400 rounded-lg font-medium text-sm transition-colors border border-green-500/30 text-center">
                Join WhatsApp groep
              </a>
            </div>

            {/* Terugtrekken */}
            {!readOnly && (
              <div className="pt-2 border-t border-green-500/20">
                <button onClick={onUnlock} disabled={unlocking} className={BTN_SECONDARY + " w-full text-red-400 hover:text-red-300 hover:border-red-500/30 border-red-500/20"}>
                  {unlocking ? "Bezig..." : "Terugtrekken"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Voorspellingen */}
        {activeTab === "voorspellingen" && (
          <div>
            {!hasPrediction && !readOnly && (
              <div className="space-y-3">
                <p className="text-sm text-slate-400">Vul je bonusvoorspellingen in voor extra punten aan het einde van het seizoen.</p>
                <button onClick={onOpenPredictionModal} className={BTN_PRIMARY + " w-full"}>
                  Voorspellingen invullen
                </button>
              </div>
            )}
            {hasPrediction && (
              <div>
                <p className="text-sm text-green-400">✓ Je voorspellingen zijn ingediend.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
