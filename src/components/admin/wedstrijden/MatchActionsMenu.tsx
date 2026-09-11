import type { AdminMatch, PublishMoment } from "./types";

type Props = {
  match: AdminMatch;
  approvingId: string | null;
  revertingMatchId: string | null;
  deletingMatchId: string | null;
  pendingMoments: PublishMoment[];
  onEdit: () => void;
  onApprove: (status: "APPROVED" | "REJECTED") => void;
  onAssign: (momentId: string | null) => void;
  onRevert: () => void;
  onDelete: () => void;
};

// Inhoud van het "Acties"-dropdownmenu per wedstrijdrij. Wordt gedeeld door zowel de
// mobiele kaartweergave (absolute div) als de desktoptabel (portal, zie MatchesList.tsx) —
// alleen de buitenste wrapper verschilt tussen die twee, de menu-items zelf zijn identiek.
export default function MatchActionsMenu({
  match: m,
  approvingId,
  revertingMatchId,
  deletingMatchId,
  pendingMoments,
  onEdit,
  onApprove,
  onAssign,
  onRevert,
  onDelete,
}: Props) {
  return (
    <>
      {m.status !== "PROCESSED" && (
        <button
          onClick={onEdit}
          className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Bewerken
        </button>
      )}
      <button
        onClick={onEdit}
        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
      >
        Prestaties
      </button>
      {(m.status === "PENDING" || m.status === "REJECTED") && (
        <button
          onClick={() => onApprove("APPROVED")}
          disabled={approvingId === m.id}
          className="w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Goedkeuren
        </button>
      )}
      {(m.status === "PENDING" || m.status === "APPROVED") && (
        <button
          onClick={() => onApprove("REJECTED")}
          disabled={approvingId === m.id}
          className="w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Afkeuren
        </button>
      )}
      {m.status === "APPROVED" && pendingMoments.length > 0 && (
        <div className="border-t border-slate-700">
          <p className="px-4 pt-2.5 pb-1 text-xs text-slate-500 font-semibold uppercase tracking-wide">
            Inplannen bij
          </p>
          {m.publishMomentId ? (
            <button
              onClick={() => onAssign(null)}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
            >
              Verwijder uit wachtrij
            </button>
          ) : (
            pendingMoments.map((pm) => (
              <button
                key={pm.id}
                onClick={() => onAssign(pm.id)}
                className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-slate-700 transition-colors"
              >
                {pm.label}
              </button>
            ))
          )}
        </div>
      )}
      {m.status === "PROCESSED" && (
        <button
          onClick={onRevert}
          disabled={revertingMatchId === m.id}
          className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {revertingMatchId === m.id ? "Bezig..." : "Terugdraaien"}
        </button>
      )}
      {m.status !== "PROCESSED" && (
        <>
          <div className="border-t border-slate-700" />
          <button
            onClick={onDelete}
            disabled={deletingMatchId === m.id}
            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
            Verwijderen
          </button>
        </>
      )}
    </>
  );
}
