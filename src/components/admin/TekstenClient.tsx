"use client";

import { useState, useEffect } from "react";

type ContentItem = {
  key: string;
  label: string;
  group: string;
  multiline: boolean;
  value: string;
};

const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const LABEL = "block text-sm font-medium text-slate-400 mb-1";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";

export default function TekstenClient() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/content");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((it) => ({ key: it.key, value: it.value })) }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg({ type: "err", text: "Opslaan mislukt" });
    } else {
      setMsg({ type: "ok", text: "Teksten opgeslagen" });
    }
  }

  function updateValue(key: string, value: string) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, value } : it)));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl">
        <p className="text-slate-500 text-sm">Laden...</p>
      </div>
    );
  }

  const groups = Array.from(new Set(items.map((it) => it.group)));

  return (
    <div className="max-w-4xl space-y-4">
      {groups.map((group) => (
        <section key={group} className="bg-slate-900 neon-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">{group}</h2>
          <div className="space-y-4">
            {items
              .filter((it) => it.group === group)
              .map((it) => (
                <div key={it.key}>
                  <label className={LABEL}>{it.label}</label>
                  {it.multiline ? (
                    <textarea
                      value={it.value}
                      onChange={(e) => updateValue(it.key, e.target.value)}
                      rows={it.key.startsWith("juridisch.") ? 10 : 3}
                      className={INPUT + " resize-y font-mono text-sm"}
                    />
                  ) : (
                    <input
                      type="text"
                      value={it.value}
                      onChange={(e) => updateValue(it.key, e.target.value)}
                      className={INPUT}
                    />
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}

      {msg && (
        <p
          className={`text-sm px-3 py-2 rounded-lg border ${
            msg.type === "ok"
              ? "bg-green-900/20 text-green-400 border-green-500/30"
              : "bg-red-900/20 text-red-400 border-red-500/30"
          }`}
        >
          {msg.text}
        </p>
      )}
      <button onClick={save} disabled={saving} className={BTN_PRIMARY}>
        {saving ? "Opslaan..." : "Teksten opslaan"}
      </button>
    </div>
  );
}
