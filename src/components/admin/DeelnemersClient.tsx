"use client";

import { useState, useEffect } from "react";
import AdminTeamEditModal from "./AdminTeamEditModal";
import DeelnemersList from "./deelnemers/DeelnemersList";
import DeelnemerDetailModal from "./deelnemers/DeelnemerDetailModal";
import type { Deelnemer } from "./deelnemers/types";

export default function DeelnemersClient() {
  const [deelnemers, setDeelnemers] = useState<Deelnemer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<Deelnemer | null>(null);
  const [form, setForm] = useState({ voornaam: "", achternaam: "", email: "", telefoonnummer: "", whatsappGroep: false, bonusPoints: "0" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [teamEditTarget, setTeamEditTarget] = useState<Deelnemer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/deelnemers");
    if (res.ok) setDeelnemers(await res.json());
    setLoading(false);
  }

  async function toggleBetaald(d: Deelnemer) {
    const res = await fetch(`/api/admin/deelnemers/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ betaald: !d.betaald }),
    });
    if (res.ok) {
      setDeelnemers((prev) => prev.map((x) => x.id === d.id ? { ...x, betaald: !d.betaald } : x));
      setModal((prev) => prev?.id === d.id ? { ...prev, betaald: !d.betaald } : prev);
    }
  }

  async function toggleWhatsappToegevoegd(d: Deelnemer) {
    const res = await fetch(`/api/admin/deelnemers/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsappToegevoegd: !d.whatsappToegevoegd }),
    });
    if (res.ok) {
      setDeelnemers((prev) => prev.map((x) => x.id === d.id ? { ...x, whatsappToegevoegd: !d.whatsappToegevoegd } : x));
      setModal((prev) => prev?.id === d.id ? { ...prev, whatsappToegevoegd: !d.whatsappToegevoegd } : prev);
    }
  }

  async function save() {
    if (!modal) return;
    setSaving(true);
    setSaveError("");
    setSaveMsg("");
    const res = await fetch(`/api/admin/deelnemers/${modal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voornaam: form.voornaam,
        achternaam: form.achternaam,
        email: form.email,
        telefoonnummer: form.telefoonnummer,
        whatsappGroep: form.whatsappGroep,
        bonusPoints: Number(form.bonusPoints) || 0,
      }),
    });
    setSaving(false);
    if (!res.ok) { setSaveError("Opslaan mislukt"); return; }
    setModal(null);
    await load();
  }

  async function deleteDeelnemer() {
    if (!modal) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/deelnemers/${modal.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setModal(null);
      setDeleteConfirm(false);
      await load();
    }
  }

  function openModal(d: Deelnemer) {
    setDeleteConfirm(false);
    setForm({
      voornaam: d.voornaam ?? "",
      achternaam: d.achternaam ?? "",
      email: d.email ?? "",
      telefoonnummer: d.telefoonnummer ?? "",
      whatsappGroep: d.whatsappGroep,
      bonusPoints: String(d.bonusPoints),
    });
    setSaveError("");
    setSaveMsg("");
    setModal(d);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Deelnemers */}
      <DeelnemersList
        deelnemers={deelnemers}
        loading={loading}
        onRefresh={load}
        onOpenModal={openModal}
        onToggleWhatsappToegevoegd={toggleWhatsappToegevoegd}
      />

      {/* Modal */}
      {teamEditTarget && (
        <AdminTeamEditModal
          deelnemerId={teamEditTarget.id}
          deelnemerNaam={
            teamEditTarget.voornaam || teamEditTarget.achternaam
              ? `${teamEditTarget.voornaam ?? ""} ${teamEditTarget.achternaam ?? ""}`.trim()
              : "Deelnemer"
          }
          initialFormationId={teamEditTarget.formation?.id ?? null}
          initialSlots={(() => {
            const slots: (string | null)[] = Array(11).fill(null);
            for (const tp of teamEditTarget.players) {
              slots[tp.slotIndex] = tp.player.id;
            }
            return slots;
          })()}
          initialCaptainSlot={teamEditTarget.captainSlot}
          onClose={() => setTeamEditTarget(null)}
          onSaved={async () => {
            setTeamEditTarget(null);
            setModal(null);
            await load();
          }}
        />
      )}

      {modal && (
        <DeelnemerDetailModal
          modal={modal}
          form={form}
          setForm={setForm}
          saving={saving}
          saveError={saveError}
          saveMsg={saveMsg}
          deleteConfirm={deleteConfirm}
          setDeleteConfirm={setDeleteConfirm}
          deleting={deleting}
          onClose={() => setModal(null)}
          onSave={save}
          onDelete={deleteDeelnemer}
          onToggleBetaald={toggleBetaald}
          onToggleWhatsappToegevoegd={toggleWhatsappToegevoegd}
          onOpenTeamEdit={() => setTeamEditTarget(modal)}
        />
      )}
    </div>
  );
}
