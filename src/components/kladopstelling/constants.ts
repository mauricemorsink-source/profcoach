export const STEP_NAMES: Record<number, string> = {
  1: "team_samenstellen",
  2: "aanvoerder_kiezen",
  3: "voorspellingen",
  4: "gegevens_en_indienen",
};

export const SLOTS_KEY = "profcoach_team_slots";
export const FORMATION_KEY = "profcoach_team_formation";

export const POSITION_LABEL: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};
export const CLUB_ORDER = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];
export const POS_ORDER = ["GK", "DEF", "MID", "ATT"];

export const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
export const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700 disabled:opacity-50";
export const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
