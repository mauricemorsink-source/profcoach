export const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

export const CLUB_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

export const POSITION_LABEL: Record<string, string> = { GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN" };
export const POSITION_COLOR: Record<string, string> = {
  GK:  "text-amber-400 bg-amber-900/30 border-amber-500/40",
  DEF: "text-blue-400 bg-blue-900/30 border-blue-500/40",
  MID: "text-green-400 bg-green-900/30 border-green-500/40",
  ATT: "text-red-400 bg-red-900/30 border-red-500/40",
};

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Ingediend", APPROVED: "Goedgekeurd", REJECTED: "Afgekeurd", PROCESSED: "Verwerkt",
};

export const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-900/40 text-amber-400 border border-amber-500/30",
  APPROVED: "bg-green-900/40 text-green-400 border border-green-500/30",
  REJECTED: "bg-red-900/40 text-red-400 border border-red-500/30",
  PROCESSED: "bg-cyan-900/40 text-cyan-400 border border-cyan-500/30",
};

export const INPUT = "w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50";
export const LABEL = "block text-xs font-medium text-slate-400 mb-1";
export const NUM_INPUT = "w-10 bg-slate-800 border border-slate-600 text-white rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed";
