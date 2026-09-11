import type { PlayerForm } from "./types";

export const POSITIONS = ["GK", "DEF", "MID", "ATT"];
export const TEAMS = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];

export const POSITION_LABEL: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};

export const POSITION_SHORT: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};

export const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

export const emptyForm: PlayerForm = { name: "", shortName: "", position: "GK", clubTeam: "ONE", altTeam: "", value: "" };

export const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
export const LABEL = "block text-sm font-medium text-slate-400 mb-1";
export const SELECT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
export const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
export const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700";
export const BTN_DANGER = "px-3 py-2 text-xs bg-red-900/40 text-red-400 rounded hover:bg-red-900/60 font-medium border border-red-500/30 transition-colors";
export const BTN_SMALL = "px-3 py-2 text-xs bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-medium border border-slate-700 transition-colors";
