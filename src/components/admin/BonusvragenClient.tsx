"use client";

import { useState, useEffect } from "react";
import type { Player, PredConfig, PredPreview } from "./bonusvragen/types";
import BonusQuestionsForm from "./bonusvragen/BonusQuestionsForm";
import ProcessPreviewModal from "./bonusvragen/ProcessPreviewModal";

export default function BonusvragenClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [predConfig, setPredConfig] = useState<PredConfig | null>(null);
  const [loadingPredConfig, setLoadingPredConfig] = useState(false);
  const [predConfigSaving, setPredConfigSaving] = useState(false);
  const [predConfigMsg, setPredConfigMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [predProcessing, setPredProcessing] = useState(false);
  const [predConfigForm, setPredConfigForm] = useState({
    topScorerId: "",
    assistKoningId: "",
    yellowCardsMin: "",
    yellowCardsMax: "",
    totalGoalsMin: "",
    totalGoalsMax: "",
    topScorerPoints: "5",
    assistKoningPoints: "5",
    yellowCardsPoints: "5",
    totalGoalsPoints: "5",
    showPointsToParticipants: false,
  });
  const [predPlayerSearch, setPredPlayerSearch] = useState("");
  const [predActiveField, setPredActiveField] = useState<"topscorer" | "assistkoning" | null>(null);
  const [showPredPreview, setShowPredPreview] = useState(false);
  const [loadingPredPreview, setLoadingPredPreview] = useState(false);
  const [predPreview, setPredPreview] = useState<PredPreview | null>(null);

  async function loadPlayers() {
    const res = await fetch("/api/admin/players");
    if (res.ok) setPlayers(await res.json());
  }

  async function loadPredConfig() {
    setLoadingPredConfig(true);
    const res = await fetch("/api/admin/prediction-config");
    if (res.ok) {
      const data = await res.json();
      setPredConfig(data);
      setPredConfigForm({
        topScorerId: data.topScorerId ?? "",
        assistKoningId: data.assistKoningId ?? "",
        yellowCardsMin: data.yellowCardsMin != null ? String(data.yellowCardsMin) : "",
        yellowCardsMax: data.yellowCardsMax != null ? String(data.yellowCardsMax) : "",
        totalGoalsMin: data.totalGoalsMin != null ? String(data.totalGoalsMin) : "",
        totalGoalsMax: data.totalGoalsMax != null ? String(data.totalGoalsMax) : "",
        topScorerPoints: String(data.topScorerPoints ?? 5),
        assistKoningPoints: String(data.assistKoningPoints ?? 5),
        yellowCardsPoints: String(data.yellowCardsPoints ?? 5),
        totalGoalsPoints: String(data.totalGoalsPoints ?? 5),
        showPointsToParticipants: data.showPointsToParticipants ?? false,
      });
    }
    setLoadingPredConfig(false);
  }

  // Gedeeld door savePredConfig (expliciete "Opslaan"-knop) en openPredPreview: de
  // bevestigingspopup moet ALTIJD de punten laten zien die net in het formulier staan, niet
  // een eerder opgeslagen stand — anders zag je daar (zoals gemeld) nog de oude/standaard 5 pt
  // als je de puntenvelden had aangepast maar nog niet apart had opgeslagen.
  async function saveConfigToServer(): Promise<{ ok: boolean; data: PredConfig | { error?: string } }> {
    const res = await fetch("/api/admin/prediction-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topScorerId: predConfigForm.topScorerId || null,
        assistKoningId: predConfigForm.assistKoningId || null,
        yellowCardsMin: predConfigForm.yellowCardsMin !== "" ? Number(predConfigForm.yellowCardsMin) : null,
        yellowCardsMax: predConfigForm.yellowCardsMax !== "" ? Number(predConfigForm.yellowCardsMax) : null,
        totalGoalsMin: predConfigForm.totalGoalsMin !== "" ? Number(predConfigForm.totalGoalsMin) : null,
        totalGoalsMax: predConfigForm.totalGoalsMax !== "" ? Number(predConfigForm.totalGoalsMax) : null,
        topScorerPoints: Number(predConfigForm.topScorerPoints) || 5,
        assistKoningPoints: Number(predConfigForm.assistKoningPoints) || 5,
        yellowCardsPoints: Number(predConfigForm.yellowCardsPoints) || 5,
        totalGoalsPoints: Number(predConfigForm.totalGoalsPoints) || 5,
        showPointsToParticipants: predConfigForm.showPointsToParticipants,
      }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }

  async function savePredConfig() {
    setPredConfigSaving(true);
    setPredConfigMsg(null);
    const { ok, data } = await saveConfigToServer();
    setPredConfigSaving(false);
    if (!ok) {
      setPredConfigMsg({ type: "err", text: (data as { error?: string }).error || "Opslaan mislukt" });
      return;
    }
    setPredConfig(data as PredConfig);
    setPredConfigMsg({ type: "ok", text: "Opgeslagen" });
  }

  async function openPredPreview() {
    setLoadingPredPreview(true);
    setShowPredPreview(true);
    setPredPreview(null);
    setPredConfigMsg(null);
    const { ok, data } = await saveConfigToServer();
    if (!ok) {
      setLoadingPredPreview(false);
      setShowPredPreview(false);
      setPredConfigMsg({ type: "err", text: (data as { error?: string }).error || "Opslaan mislukt" });
      return;
    }
    setPredConfig(data as PredConfig);
    const res = await fetch("/api/admin/prediction-config/preview");
    if (res.ok) setPredPreview(await res.json());
    setLoadingPredPreview(false);
  }

  async function processBonusPoints() {
    setPredProcessing(true);
    setPredConfigMsg(null);
    const res = await fetch("/api/admin/prediction-config/process", { method: "POST" });
    const data = await res.json();
    setPredProcessing(false);
    setShowPredPreview(false);
    if (!res.ok) {
      setPredConfigMsg({ type: "err", text: data.error || "Verwerken mislukt" });
      return;
    }
    setPredConfigMsg({
      type: "ok",
      text: `Verwerkt: ${data.processed} van ${data.total} deelnemers kregen bonuspunten`,
    });
    loadPredConfig();
  }

  async function retractBonusPoints() {
    setPredProcessing(true);
    setPredConfigMsg(null);
    const res = await fetch("/api/admin/prediction-config/retract", { method: "POST" });
    const data = await res.json();
    setPredProcessing(false);
    if (!res.ok) {
      setPredConfigMsg({ type: "err", text: data.error || "Intrekken mislukt" });
      return;
    }
    setPredConfigMsg({ type: "ok", text: "Bonuspunten ingetrokken" });
    loadPredConfig();
  }

  useEffect(() => {
    loadPlayers();
    loadPredConfig();
  }, []);

  return (
    <div className="max-w-4xl">
      <BonusQuestionsForm
        predConfig={predConfig}
        loadingPredConfig={loadingPredConfig}
        predConfigForm={predConfigForm}
        setPredConfigForm={setPredConfigForm}
        players={players}
        predPlayerSearch={predPlayerSearch}
        setPredPlayerSearch={setPredPlayerSearch}
        predActiveField={predActiveField}
        setPredActiveField={setPredActiveField}
        predConfigMsg={predConfigMsg}
        predConfigSaving={predConfigSaving}
        predProcessing={predProcessing}
        onSave={savePredConfig}
        onOpenPreview={openPredPreview}
        onRetract={retractBonusPoints}
      />

      {/* Modal: Bonuspunten bevestiging */}
      {showPredPreview && (
        <ProcessPreviewModal
          loadingPredPreview={loadingPredPreview}
          predPreview={predPreview}
          predProcessing={predProcessing}
          onClose={() => setShowPredPreview(false)}
          onConfirm={processBonusPoints}
        />
      )}
    </div>
  );
}
