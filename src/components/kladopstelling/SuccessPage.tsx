import type { Formation, Player, SlotDef } from "@/components/team/types";
import { CLUB_LABEL } from "@/components/team/validate";
import Pitch from "@/components/team/Pitch";
import GoalConfetti from "@/components/GoalConfetti";
import type { PersonInfo } from "./types";
import { BTN_SECONDARY, POS_ORDER } from "./constants";

export default function SuccessPage({
  personInfo, formation, slots, playersById, slotValues, captainEnabled, captainSlot,
  showPaymentOptions, setShowPaymentOptions,
}: {
  personInfo: PersonInfo;
  formation: Formation | undefined;
  slots: SlotDef[];
  playersById: Record<string, Player>;
  slotValues: (string | null)[];
  captainEnabled: boolean;
  captainSlot: number | null;
  showPaymentOptions: boolean;
  setShowPaymentOptions: (value: boolean) => void;
}) {
  return (
    <div className="min-h-screen bg-[#060b14]">
      <GoalConfetti />
      <div className="max-w-xl mx-auto px-4 py-8 pb-16">
        {/* Bevestiging */}
        <div className="mb-5 bg-green-900/20 border border-green-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="text-green-400 text-xl shrink-0">✓</span>
          <div>
            <p className="text-green-400 font-bold text-sm">Team ingediend</p>
            <p className="text-slate-400 text-xs mt-0.5">Je inschrijving is ontvangen voor {personInfo.voornaam} {personInfo.achternaam}.</p>
          </div>
        </div>

        {/* WhatsApp-groep */}
        {personInfo.whatsappGroep && (
          <div className="mb-5 bg-green-900/15 border border-green-500/25 rounded-2xl px-5 py-4">
            <p className="text-green-400 font-semibold text-sm mb-1">Doe mee met de WhatsApp-groep</p>
            <p className="text-slate-400 text-sm mb-3">
              Je hebt aangegeven lid te willen worden van de WhatsApp-groep. Klik hieronder om je aan te sluiten.
            </p>
            <a
              href="https://chat.whatsapp.com/Dzqab7sMXu93CriSAqrSEd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Word lid van de WhatsApp-groep
            </a>
          </div>
        )}

        {/* Betaling */}
        <div className="mb-5 bg-cyan-900/15 border border-cyan-500/25 rounded-2xl px-5 py-4 space-y-3">
          <p className="text-cyan-400 font-semibold text-sm">Inschrijfgeld betalen</p>

          <div className="space-y-2">
            <button
              onClick={() => setShowPaymentOptions(true)}
              className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                showPaymentOptions
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-200"
              }`}
            >
              Ik wil nu betalen
            </button>
            <button
              onClick={() => setShowPaymentOptions(false)}
              className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                !showPaymentOptions
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-200"
              }`}
            >
              Ik betaal later
            </button>
          </div>

          {/* Accordeon: betaallinks */}
          {showPaymentOptions && (
            <div className="bg-slate-900/50 rounded-xl p-4 space-y-3 border border-cyan-500/20">
              <p className="text-slate-400 text-xs font-medium">Kies het bedrag en betaal:</p>

              <div className="space-y-2">
                <button
                  onClick={() => window.open("https://betaalverzoek.rabobank.nl/betaalverzoek/?id=t1ajnGTJQROVbXhcYSYyFA", "_blank")}
                  className="block w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-sm transition-colors text-center"
                >
                  Inschrijfgeld €7,50 (jongeren &lt;18 jaar)
                </button>
                <button
                  onClick={() => window.open("https://betaalverzoek.rabobank.nl/betaalverzoek/?id=fJNmXjzjQ0ao6IA4_cLn8Q", "_blank")}
                  className="block w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-sm transition-colors text-center"
                >
                  Inschrijfgeld €15,00 (18+)
                </button>
              </div>

              <div className="bg-amber-900/30 border border-amber-500/20 rounded-lg p-3">
                <p className="text-amber-300 text-xs font-semibold mb-1">⚠️ Belangrijk</p>
                <p className="text-amber-200 text-xs">
                  Het betaalverzoek opent in een nieuw tabblad. <span className="font-semibold">Je moet zelf terugkeren naar deze pagina</span>. Je wordt niet automatisch teruggestuurd.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Screenshot tip */}
        <div className="mb-5 bg-amber-900/15 border border-amber-500/25 rounded-2xl px-5 py-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Tip: maak een screenshot</p>
          <p className="text-slate-400 text-sm">
            Bewaar een foto of screenshot van je team hieronder, zodat je altijd kunt terugzien welke spelers je hebt gekozen.
          </p>
        </div>

        {/* Team overzicht header */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Jouw team — {formation?.code}</p>
          <span className="text-xs bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold">Ingediend</span>
        </div>

        {/* Pitch */}
        <Pitch
          slots={slots}
          selectedSlot={null}
          playersById={playersById}
          slotValues={slotValues}
          onSlotClick={() => {}}
          locked={true}
          captainSlot={captainEnabled ? captainSlot : null}
        />

        {/* Spelerlijst */}
        <div className="mt-5 bg-slate-900 neon-border rounded-2xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-2.5 font-semibold">Speler</th>
                <th className="px-4 py-2.5 font-semibold">Elftal</th>
                <th className="px-4 py-2.5 font-semibold text-right">Waarde</th>
              </tr>
            </thead>
            <tbody>
              {slots
                .filter((s) => slotValues[s.slotIndex])
                .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position))
                .map((s) => {
                  const player = playersById[slotValues[s.slotIndex]!];
                  if (!player) return null;
                  const isCaptain = captainEnabled && captainSlot === s.slotIndex;
                  return (
                    <tr key={s.slotIndex} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-medium text-white">
                        {player.name}
                        {isCaptain && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">C</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{CLUB_LABEL[player.clubTeam] ?? player.clubTeam}</td>
                      <td className="px-4 py-2.5 text-right text-cyan-400 font-bold">€{player.value}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => { window.location.href = "/"; }}
          className={BTN_SECONDARY + " w-full"}
        >
          Terug naar de homepage
        </button>
      </div>
    </div>
  );
}
