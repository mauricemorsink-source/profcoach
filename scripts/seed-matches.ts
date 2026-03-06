/**
 * Reset wedstrijden + prestaties + statistieken en voeg 3 wedstrijden per team in.
 * Alleen actieve spelers worden gebruikt.
 * Status: APPROVED (klaar om verwerkt te worden door admin)
 *
 * Uitvoeren: npx tsx scripts/seed-matches.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const SEASON_ID = "season-2526";

// ─── SPELERS (alleen actieve, per team) ────────────────────────────────────────
const P = {
  ONE: {
    GK: { niels_bouwman: "cmmb6zeui000004jygmspwwtg" },
    DEF: {
      bas_essink: "cmmb6zeyx000104jyws99gp8c",
      dylen_tijdhof: "cmmb6zf3c000204jyx6kfopuo",
      frank_geerdink: "cmmb6zf7r000304jy614v26o8",
      martijn_leferink: "cmmb6zfc8000404jyiwjy4m94",
      quint_ter_haar: "cmmb6zfgo000504jyur8bme69",
      twan_tenhagen: "cmmb6zfl2000604jyar37l7p7",
    },
    MID: {
      koen_ten_dam: "cmmb6zgbi000c04jydfmh57ch",
      niels_te_lintelo: "cmmb6zfpk000704jy2dos4dm0",
      sander_te_rietmole: "cmmb6zftz000804jyw9mnz12m",
      thijmen_grootholt: "cmmb6zfyd000904jyurk6vtbs",
      wesley_meulenkamp: "cmmb6zg2r000a04jy3dtboglv",
      wouter_te_rietmole: "cmmb6zg74000b04jy003gc0ys",
    },
    ATT: {
      collin_ter_braack: "cmmb6zgfy000d04jy4vf664c2",
      harm_vogt: "cmmb6zgos000f04jysyhv8uie",
      jorrick_de_lange: "cmmb6zgxl000h04jyack8zfq4",
      marco_kroeze: "cmmb6zgkd000e04jywpdr13wb",
      milan_eichelsheim: "cmmb6zh20000i04jynbzsy5oo",
      richard_nales: "cmmb6zgt6000g04jywwror7pn",
    },
  },
  TWO: {
    GK: {
      bas_ten_dam: "cmmb6zhb2000k04jykirrww0d",
      jeroen_hartgerink: "cmmb6zh6o000j04jykzt40d2z",
    },
    DEF: {
      christiaan_vlierhaar: "cmmb6zi1l000q04jy1yp02d40",
      koen_te_lintelo: "cmmb6zhjx000m04jycxad00bk",
      lars_vollenbroek: "cmmb6zi5z000r04jygbzxqm58",
      lucas_essink: "cmmb6zhsr000o04jydpj7dfuv",
      mees_geerdink: "cmmb6zhx6000p04jyz9tqx70i",
      rick_ter_braak: "cmmb6zhoc000n04jy7xa8glzn",
      sven_hardeman: "cmmb6zhfi000l04jyzz9r63v3",
    },
    MID: {
      brent_ter_haar: "cmmb6zies000t04jyvuqqf0nb",
      dennis_vrielink: "cmmb6zino000v04jywkvnhj0p",
      patriek_piepers: "cmmb6ziaf000s04jym1pqqv7v",
    },
    ATT: {
      brian_renskers: "cmmb6zj0x000y04jybuxcpvcg",
      desley_nienhuis: "cmmb6zis3000w04jy6gu3e8q7",
      joren_vrielink: "cmmb6zjmx001304jy3f26ttuo",
      ozan_kazan: "cmmb6zj9r001004jy1o8o5nzr",
      sil_overmeen: "cmmb6ziwj000x04jy7xmnzme9",
      stan_bauhuis: "cmmb6zija000u04jy8pnbxe9t",
      tijn_spikker: "cmmb6zj5c000z04jyygzoy09b",
      wisse_vogt: "cmmb6zje4001104jyn9gwsffu",
      wouter_lansink: "cmmb6zjij001204jyc5mjfusd",
    },
  },
  THREE: {
    // Geen GK actief
    DEF: {
      arjan_koppelman: "cmmb6zk4i001704jyi6vcbfxn",
      frank_koppelman: "cmmb6zk04001604jylryyptuz",
      luuk_busschers: "cmmb6zjrd001404jy0on6n69m",
      marijn_kormelink: "cmmb6zk8w001804jy5kb4cqt0",
      mark_ten_vregelaar: "cmmb6zkda001904jy9k5kndhj",
      rik_koppelman: "cmmb6zjvq001504jy9kyej1u2",
    },
    MID: {
      job_vogt: "cmmb6zkm4001b04jy7yu7ft59",
      rick_lansink: "cmmb6zkhq001a04jy5aicdlpr",
    },
    ATT: {
      denzel_dekkers: "cmmb6zkqi001c04jybi9iahbe",
      job_kleinsman: "cmmb6zkzo001e04jyxnhda685",
      lars_koldeweij: "cmmb6zl4c001f04jydp530nt3",
      roeland_nales: "cmmb6zl8p001g04jyja4w12pn",
      thijs_eppink: "cmmb6zkuw001d04jyfd92vuzv",
    },
  },
  FOUR: {
    GK: { thom_lansink: "cmmb6zld5001h04jy38neumvt" },
    DEF: {
      arjan_vlierhaar: "cmmb6zm3j001n04jysm8g428r",
      lars_simmelink: "cmmb6zlz5001m04jybcbtktwv",
      mart_bekkedam: "cmmb6zlhk001i04jygrjfiql6",
      maurice_schroer: "cmmb6zluq001l04jy9c9p7uxk",
      rody_huistede: "cmmb6zlqd001k04jy45ddxjmt",
      william_ten_hoopen: "cmmb6zlly001j04jyo4rbfaon",
    },
    MID: {
      dylan_essink: "cmmb6zmgt001q04jyr4vhpbr1",
      guus_waanders: "cmmb6zmpm001s04jygpmc50nn",
      luc_bouwman: "cmmb6zmce001p04jyaeqytu4z",
      mart_franssen: "cmmb6zml8001r04jyxzcya0eg",
      max_knoop: "cmmb6zm7z001o04jymsonxdf1",
    },
    ATT: {
      brian_meulenkamp: "cmmb6zng0001y04jy95qpx9xk",
      daan_te_morsche: "cmmb6zmyf001u04jyq5a88cld",
      dirk_arkink: "cmmb6zn2t001v04jy3ay72puv",
      joost_lansink: "cmmb6znbm001x04jyophtst9f",
      nick_grefte: "cmmb6zmu2001t04jyksav68f4",
      rudy_landewee: "cmmb6zn77001w04jyzbgl6yks",
    },
  },
  FIVE: {
    GK: {
      dennis_kuiper: "cmmb6znot002004jy6yipfuhq",
      wouter_ter_braak: "cmmb6znkf001z04jydnw1i2j5",
    },
    DEF: {
      allard_kooy: "cmmb6zntc002104jyt9dqbtyq",
      bert_knoop: "cmmb6zo2b002304jycsku8sui",
      joren_hogenkamp: "cmmb6znxq002204jygp6owtb1",
      jos_knoop: "cmmb6zo6p002404jyrjn1nsxh",
    },
    MID: {
      jordy_ter_hofte: "cmmb6zoob002804jy4ovrgn1s",
      jos_vogt: "cmmb6zojx002704jya6nkey8s",
      kevin_nales: "cmmb6zosp002904jyasmjgkrm",
      luc_borgelink: "cmmb6zob5002504jy1mlqmalm",
      raymond_roerink: "cmmb6zofj002604jy38tud0zj",
    },
    ATT: {
      bennie_nijhuis: "cmmb6zp1j002b04jy772wyzmi",
      jos_tenhagen: "cmmb6zpab002d04jyzplexq1q",
      luuk_wielens: "cmmb6zpng002g04jy4yz2uppo",
      nick_ten_vregelaar: "cmmb6zpeo002e04jyar6bawis",
      robert_wegdam: "cmmb6zpj2002f04jylbqkl5m9",
      ruben_nijhuis: "cmmb6zp5x002c04jypp3du13a",
      tim_bouwman: "cmmb6zox4002a04jyluqgo7gw",
    },
  },
  DAMES: {
    GK: { sophie_te_morsche: "cmmb6zprw002h04jy9uafgdx8" },
    DEF: {
      anoek_meijer: "cmmb6zq9g002l04jy83c15fip",
      merel_jolink: "cmmb6zq0o002j04jya3bg3pxk",
      ruth_knoop: "cmmb6zq52002k04jyaj8hgsqm",
      sara_nijhof: "cmmb6zqdv002m04jy5zkxzvmk",
      sterre_bloemerg: "cmmb6zpwb002i04jy4vfdpxid",
    },
    MID: {
      anne_ter_braak: "cmmb6zqr2002p04jycppp137u",
      camiela_eldeib: "cmmb6zqvf002q04jyub46xkxl",
      eva_bauhuis: "cmmb6zqia002n04jyt1adu0mw",
      fleur_hondelink: "cmmb6zqzt002r04jyt5jzsomm",
      floor_nijhof: "cmmb6zr46002s04jy12sl0c6s",
      lizan_spikker: "cmmb6zrd1002u04jydkvjjkpu",
      loes_bolks: "cmmb6zqmn002o04jyjazw8itb",
      renske_nijhof: "cmmb6zr8m002t04jy8764nmv6",
    },
    ATT: {
      anouk_ten_elsen: "cmmb6zrhh002v04jy6ct5v5eg",
      erienne_nijhuis: "cmmb6zrum002y04jyswgdsx4p",
      imke_nijhuis: "cmmb6zrz0002z04jyfp87bi2l",
      lot_schurink: "cmmb6zs3k003004jyb8wr88it",
      manon_grootholt: "cmmb6zrlu002w04jyj1ozpfab",
      sanne_te_lintelo: "cmmb6zrq9002x04jy57bzcmc6",
    },
  },
};

// ─── HELPER ─────────────────────────────────────────────────────────────────────
type Perf = { playerId: string; goals?: number; penaltyGoals?: number; assists?: number; ownGoals?: number; yellowCards?: number; redCard?: boolean };

function played(id: string, extra: Partial<Omit<Perf, "playerId">> = {}): Perf {
  return { playerId: id, ...extra };
}

// ─── WEDSTRIJDEN DATA ─────────────────────────────────────────────────────────
interface MatchDef {
  clubTeam: string;
  name: string;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  matchDate: Date;
  goalsScored: number;
  goalsConceded: number;
  performances: Perf[];
}

const matches: MatchDef[] = [
  // ──── ONE ────────────────────────────────────────────────────────────────────
  {
    clubTeam: "ONE", name: "VV Neede 1", homeAway: "HOME",
    matchDate: new Date("2026-01-14T14:00:00Z"),
    goalsScored: 3, goalsConceded: 1,
    performances: [
      played(P.ONE.GK.niels_bouwman),
      played(P.ONE.DEF.bas_essink),
      played(P.ONE.DEF.dylen_tijdhof, { yellowCards: 1 }),
      played(P.ONE.DEF.frank_geerdink),
      played(P.ONE.DEF.martijn_leferink),
      played(P.ONE.MID.niels_te_lintelo, { assists: 1 }),
      played(P.ONE.MID.sander_te_rietmole, { assists: 1 }),
      played(P.ONE.MID.thijmen_grootholt),
      played(P.ONE.ATT.collin_ter_braack, { goals: 2 }),
      played(P.ONE.ATT.harm_vogt, { goals: 1 }),
      played(P.ONE.ATT.jorrick_de_lange),
    ],
  },
  {
    clubTeam: "ONE", name: "SC Hupsel 1", homeAway: "AWAY",
    matchDate: new Date("2026-01-21T14:00:00Z"),
    goalsScored: 1, goalsConceded: 2,
    performances: [
      played(P.ONE.GK.niels_bouwman),
      played(P.ONE.DEF.bas_essink),
      played(P.ONE.DEF.frank_geerdink),
      played(P.ONE.DEF.quint_ter_haar),
      played(P.ONE.DEF.twan_tenhagen, { yellowCards: 1 }),
      played(P.ONE.MID.koen_ten_dam),
      played(P.ONE.MID.wesley_meulenkamp),
      played(P.ONE.MID.wouter_te_rietmole),
      played(P.ONE.ATT.marco_kroeze, { goals: 1 }),
      played(P.ONE.ATT.milan_eichelsheim),
      played(P.ONE.ATT.richard_nales),
    ],
  },
  {
    clubTeam: "ONE", name: "VV Borculo 1", homeAway: "HOME",
    matchDate: new Date("2026-01-28T14:00:00Z"),
    goalsScored: 4, goalsConceded: 0,
    performances: [
      played(P.ONE.GK.niels_bouwman),
      played(P.ONE.DEF.dylen_tijdhof),
      played(P.ONE.DEF.frank_geerdink),
      played(P.ONE.DEF.quint_ter_haar),
      played(P.ONE.DEF.twan_tenhagen),
      played(P.ONE.MID.niels_te_lintelo, { assists: 1 }),
      played(P.ONE.MID.sander_te_rietmole, { assists: 2 }),
      played(P.ONE.MID.wesley_meulenkamp),
      played(P.ONE.ATT.collin_ter_braack, { goals: 2 }),
      played(P.ONE.ATT.milan_eichelsheim, { goals: 1 }),
      played(P.ONE.ATT.richard_nales, { goals: 1, assists: 1 }),
    ],
  },

  // ──── TWO ────────────────────────────────────────────────────────────────────
  {
    clubTeam: "TWO", name: "SC Hupsel 2", homeAway: "AWAY",
    matchDate: new Date("2026-01-11T13:30:00Z"),
    goalsScored: 2, goalsConceded: 2,
    performances: [
      played(P.TWO.GK.bas_ten_dam),
      played(P.TWO.DEF.rick_ter_braak),
      played(P.TWO.DEF.sven_hardeman, { yellowCards: 1 }),
      played(P.TWO.DEF.koen_te_lintelo),
      played(P.TWO.DEF.lucas_essink),
      played(P.TWO.MID.brent_ter_haar, { assists: 1 }),
      played(P.TWO.MID.dennis_vrielink),
      played(P.TWO.MID.patriek_piepers, { assists: 1 }),
      played(P.TWO.ATT.brian_renskers, { goals: 1 }),
      played(P.TWO.ATT.ozan_kazan),
      played(P.TWO.ATT.stan_bauhuis, { goals: 1 }),
    ],
  },
  {
    clubTeam: "TWO", name: "VV Borculo 2", homeAway: "HOME",
    matchDate: new Date("2026-01-18T13:30:00Z"),
    goalsScored: 4, goalsConceded: 1,
    performances: [
      played(P.TWO.GK.jeroen_hartgerink),
      played(P.TWO.DEF.christiaan_vlierhaar),
      played(P.TWO.DEF.mees_geerdink),
      played(P.TWO.DEF.lars_vollenbroek),
      played(P.TWO.DEF.rick_ter_braak),
      played(P.TWO.MID.dennis_vrielink, { assists: 1 }),
      played(P.TWO.MID.patriek_piepers, { goals: 1, assists: 1 }),
      played(P.TWO.MID.brent_ter_haar, { assists: 1 }),
      played(P.TWO.ATT.desley_nienhuis, { goals: 1 }),
      played(P.TWO.ATT.wisse_vogt, { goals: 2 }),
      played(P.TWO.ATT.joren_vrielink),
    ],
  },
  {
    clubTeam: "TWO", name: "Haarlo 2", homeAway: "HOME",
    matchDate: new Date("2026-01-25T13:30:00Z"),
    goalsScored: 3, goalsConceded: 0,
    performances: [
      played(P.TWO.GK.bas_ten_dam),
      played(P.TWO.DEF.sven_hardeman),
      played(P.TWO.DEF.koen_te_lintelo),
      played(P.TWO.DEF.mees_geerdink),
      played(P.TWO.DEF.lars_vollenbroek),
      played(P.TWO.MID.brent_ter_haar, { assists: 2 }),
      played(P.TWO.MID.patriek_piepers),
      played(P.TWO.MID.dennis_vrielink, { goals: 1 }),
      played(P.TWO.ATT.stan_bauhuis, { goals: 1, assists: 1 }),
      played(P.TWO.ATT.tijn_spikker, { goals: 1 }),
      played(P.TWO.ATT.wouter_lansink),
    ],
  },

  // ──── THREE ──────────────────────────────────────────────────────────────────
  {
    clubTeam: "THREE", name: "VV Neede 3", homeAway: "HOME",
    matchDate: new Date("2026-01-12T14:00:00Z"),
    goalsScored: 2, goalsConceded: 1,
    performances: [
      played(P.THREE.DEF.frank_koppelman),
      played(P.THREE.DEF.luuk_busschers),
      played(P.THREE.DEF.marijn_kormelink),
      played(P.THREE.DEF.mark_ten_vregelaar),
      played(P.THREE.DEF.rik_koppelman),
      played(P.THREE.MID.rick_lansink, { assists: 1 }),
      played(P.THREE.MID.job_vogt, { goals: 1, assists: 1 }),
      played(P.THREE.ATT.thijs_eppink),
      played(P.THREE.ATT.denzel_dekkers, { goals: 1 }),
      played(P.THREE.ATT.roeland_nales),
      played(P.THREE.ATT.lars_koldeweij),
    ],
  },
  {
    clubTeam: "THREE", name: "De Hoeve 3", homeAway: "AWAY",
    matchDate: new Date("2026-01-19T14:00:00Z"),
    goalsScored: 0, goalsConceded: 1,
    performances: [
      played(P.THREE.DEF.arjan_koppelman, { yellowCards: 1 }),
      played(P.THREE.DEF.frank_koppelman),
      played(P.THREE.DEF.luuk_busschers),
      played(P.THREE.DEF.rik_koppelman),
      played(P.THREE.DEF.mark_ten_vregelaar),
      played(P.THREE.MID.rick_lansink),
      played(P.THREE.MID.job_vogt),
      played(P.THREE.ATT.denzel_dekkers),
      played(P.THREE.ATT.job_kleinsman),
      played(P.THREE.ATT.lars_koldeweij),
      played(P.THREE.ATT.thijs_eppink),
    ],
  },
  {
    clubTeam: "THREE", name: "Eibergen 3", homeAway: "HOME",
    matchDate: new Date("2026-01-26T14:00:00Z"),
    goalsScored: 3, goalsConceded: 2,
    performances: [
      played(P.THREE.DEF.frank_koppelman),
      played(P.THREE.DEF.luuk_busschers),
      played(P.THREE.DEF.marijn_kormelink),
      played(P.THREE.DEF.rik_koppelman),
      played(P.THREE.DEF.arjan_koppelman),
      played(P.THREE.MID.job_vogt, { goals: 2 }),
      played(P.THREE.MID.rick_lansink, { assists: 1 }),
      played(P.THREE.ATT.denzel_dekkers),
      played(P.THREE.ATT.job_kleinsman, { assists: 1 }),
      played(P.THREE.ATT.roeland_nales, { goals: 1, assists: 1 }),
      played(P.THREE.ATT.thijs_eppink),
    ],
  },

  // ──── FOUR ───────────────────────────────────────────────────────────────────
  {
    clubTeam: "FOUR", name: "De Hoeve 4", homeAway: "HOME",
    matchDate: new Date("2026-01-13T14:00:00Z"),
    goalsScored: 2, goalsConceded: 0,
    performances: [
      played(P.FOUR.GK.thom_lansink),
      played(P.FOUR.DEF.arjan_vlierhaar),
      played(P.FOUR.DEF.lars_simmelink),
      played(P.FOUR.DEF.mart_bekkedam),
      played(P.FOUR.DEF.maurice_schroer),
      played(P.FOUR.MID.max_knoop, { assists: 1 }),
      played(P.FOUR.MID.dylan_essink),
      played(P.FOUR.MID.luc_bouwman, { assists: 1 }),
      played(P.FOUR.ATT.nick_grefte, { goals: 1 }),
      played(P.FOUR.ATT.daan_te_morsche, { goals: 1 }),
      played(P.FOUR.ATT.dirk_arkink),
    ],
  },
  {
    clubTeam: "FOUR", name: "Lochuizen 4", homeAway: "AWAY",
    matchDate: new Date("2026-01-20T14:00:00Z"),
    goalsScored: 2, goalsConceded: 2,
    performances: [
      played(P.FOUR.GK.thom_lansink),
      played(P.FOUR.DEF.rody_huistede),
      played(P.FOUR.DEF.william_ten_hoopen, { yellowCards: 1 }),
      played(P.FOUR.DEF.lars_simmelink),
      played(P.FOUR.DEF.mart_bekkedam),
      played(P.FOUR.MID.mart_franssen),
      played(P.FOUR.MID.guus_waanders, { assists: 1 }),
      played(P.FOUR.MID.luc_bouwman),
      played(P.FOUR.ATT.brian_meulenkamp, { goals: 1 }),
      played(P.FOUR.ATT.joost_lansink, { goals: 1, assists: 1 }),
      played(P.FOUR.ATT.rudy_landewee),
    ],
  },
  {
    clubTeam: "FOUR", name: "Haarlo 4", homeAway: "HOME",
    matchDate: new Date("2026-01-27T14:00:00Z"),
    goalsScored: 1, goalsConceded: 0,
    performances: [
      played(P.FOUR.GK.thom_lansink),
      played(P.FOUR.DEF.arjan_vlierhaar),
      played(P.FOUR.DEF.rody_huistede),
      played(P.FOUR.DEF.lars_simmelink),
      played(P.FOUR.DEF.william_ten_hoopen),
      played(P.FOUR.MID.max_knoop),
      played(P.FOUR.MID.dylan_essink, { assists: 1 }),
      played(P.FOUR.MID.guus_waanders),
      played(P.FOUR.ATT.daan_te_morsche),
      played(P.FOUR.ATT.dirk_arkink, { goals: 1 }),
      played(P.FOUR.ATT.rudy_landewee),
    ],
  },

  // ──── FIVE ───────────────────────────────────────────────────────────────────
  {
    clubTeam: "FIVE", name: "FC Borculo 5", homeAway: "AWAY",
    matchDate: new Date("2026-01-10T13:00:00Z"),
    goalsScored: 3, goalsConceded: 1,
    performances: [
      played(P.FIVE.GK.dennis_kuiper),
      played(P.FIVE.DEF.allard_kooy),
      played(P.FIVE.DEF.bert_knoop),
      played(P.FIVE.DEF.joren_hogenkamp),
      played(P.FIVE.DEF.jos_knoop),
      played(P.FIVE.MID.jordy_ter_hofte, { assists: 1 }),
      played(P.FIVE.MID.jos_vogt, { assists: 1 }),
      played(P.FIVE.MID.kevin_nales, { goals: 1 }),
      played(P.FIVE.ATT.bennie_nijhuis, { goals: 1 }),
      played(P.FIVE.ATT.ruben_nijhuis, { goals: 1 }),
      played(P.FIVE.ATT.tim_bouwman),
    ],
  },
  {
    clubTeam: "FIVE", name: "VV Neede 5", homeAway: "HOME",
    matchDate: new Date("2026-01-17T13:00:00Z"),
    goalsScored: 1, goalsConceded: 3,
    performances: [
      played(P.FIVE.GK.wouter_ter_braak),
      played(P.FIVE.DEF.allard_kooy),
      played(P.FIVE.DEF.bert_knoop, { yellowCards: 1 }),
      played(P.FIVE.DEF.jos_knoop),
      played(P.FIVE.MID.luc_borgelink),
      played(P.FIVE.MID.raymond_roerink),
      played(P.FIVE.MID.kevin_nales),
      played(P.FIVE.ATT.jos_tenhagen),
      played(P.FIVE.ATT.luuk_wielens, { goals: 1 }),
      played(P.FIVE.ATT.nick_ten_vregelaar),
      played(P.FIVE.ATT.robert_wegdam),
    ],
  },
  {
    clubTeam: "FIVE", name: "Hupsel 5", homeAway: "HOME",
    matchDate: new Date("2026-01-24T13:00:00Z"),
    goalsScored: 2, goalsConceded: 0,
    performances: [
      played(P.FIVE.GK.dennis_kuiper),
      played(P.FIVE.DEF.allard_kooy),
      played(P.FIVE.DEF.joren_hogenkamp),
      played(P.FIVE.DEF.bert_knoop),
      played(P.FIVE.MID.luc_borgelink),
      played(P.FIVE.MID.jordy_ter_hofte, { assists: 1 }),
      played(P.FIVE.MID.jos_vogt, { assists: 1 }),
      played(P.FIVE.MID.raymond_roerink),
      played(P.FIVE.ATT.jos_tenhagen, { goals: 1 }),
      played(P.FIVE.ATT.bennie_nijhuis, { goals: 1 }),
      played(P.FIVE.ATT.ruben_nijhuis),
    ],
  },

  // ──── DAMES ──────────────────────────────────────────────────────────────────
  {
    clubTeam: "DAMES", name: "Eibergen D1", homeAway: "AWAY",
    matchDate: new Date("2026-01-15T11:00:00Z"),
    goalsScored: 2, goalsConceded: 1,
    performances: [
      played(P.DAMES.GK.sophie_te_morsche),
      played(P.DAMES.DEF.merel_jolink),
      played(P.DAMES.DEF.ruth_knoop),
      played(P.DAMES.DEF.sara_nijhof),
      played(P.DAMES.DEF.sterre_bloemerg),
      played(P.DAMES.MID.eva_bauhuis, { assists: 1 }),
      played(P.DAMES.MID.fleur_hondelink),
      played(P.DAMES.MID.loes_bolks, { assists: 1 }),
      played(P.DAMES.ATT.anouk_ten_elsen, { goals: 2 }),
      played(P.DAMES.ATT.erienne_nijhuis),
      played(P.DAMES.ATT.manon_grootholt),
    ],
  },
  {
    clubTeam: "DAMES", name: "Haarlo VR1", homeAway: "HOME",
    matchDate: new Date("2026-01-22T11:00:00Z"),
    goalsScored: 3, goalsConceded: 0,
    performances: [
      played(P.DAMES.GK.sophie_te_morsche),
      played(P.DAMES.DEF.anoek_meijer),
      played(P.DAMES.DEF.ruth_knoop),
      played(P.DAMES.DEF.sara_nijhof),
      played(P.DAMES.DEF.sterre_bloemerg),
      played(P.DAMES.MID.anne_ter_braak, { assists: 2 }),
      played(P.DAMES.MID.camiela_eldeib),
      played(P.DAMES.MID.renske_nijhof, { goals: 1 }),
      played(P.DAMES.ATT.imke_nijhuis, { goals: 2 }),
      played(P.DAMES.ATT.lot_schurink),
      played(P.DAMES.ATT.sanne_te_lintelo),
    ],
  },
  {
    clubTeam: "DAMES", name: "Borculo D1", homeAway: "AWAY",
    matchDate: new Date("2026-01-29T11:00:00Z"),
    goalsScored: 1, goalsConceded: 1,
    performances: [
      played(P.DAMES.GK.sophie_te_morsche),
      played(P.DAMES.DEF.merel_jolink),
      played(P.DAMES.DEF.anoek_meijer),
      played(P.DAMES.DEF.sara_nijhof),
      played(P.DAMES.DEF.sterre_bloemerg),
      played(P.DAMES.MID.eva_bauhuis),
      played(P.DAMES.MID.lizan_spikker),
      played(P.DAMES.MID.loes_bolks, { assists: 1 }),
      played(P.DAMES.ATT.anouk_ten_elsen, { goals: 1 }),
      played(P.DAMES.ATT.manon_grootholt),
      played(P.DAMES.ATT.sanne_te_lintelo),
    ],
  },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🗑️  Verwijder bestaande wedstrijddata...");
  await prisma.matchPerformance.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.playerSeasonStats.deleteMany({});
  console.log("   ✓ Wedstrijden, prestaties en statistieken verwijderd");

  console.log("\n⚽ Voeg nieuwe wedstrijden in...");
  let matchCount = 0;
  let perfCount = 0;

  for (const m of matches) {
    const match = await prisma.match.create({
      data: {
        seasonId: SEASON_ID,
        clubTeam: m.clubTeam as any,
        name: m.name,
        homeAway: m.homeAway as any,
        matchDate: m.matchDate,
        goalsScored: m.goalsScored,
        goalsConceded: m.goalsConceded,
        status: "APPROVED",
      },
    });

    for (const perf of m.performances) {
      await prisma.matchPerformance.create({
        data: {
          matchId: match.id,
          playerId: perf.playerId,
          played: true,
          goals: perf.goals ?? 0,
          penaltyGoals: perf.penaltyGoals ?? 0,
          assists: perf.assists ?? 0,
          ownGoals: perf.ownGoals ?? 0,
          yellowCards: perf.yellowCards ?? 0,
          redCard: perf.redCard ?? false,
        },
      });
      perfCount++;
    }

    matchCount++;
    console.log(`   ✓ ${m.clubTeam} vs ${m.name} (${m.goalsScored}-${m.goalsConceded} ${m.homeAway}) — ${m.performances.length} spelers`);
  }

  console.log(`\n✅ Klaar! ${matchCount} wedstrijden + ${perfCount} prestaties ingevoerd.`);
  console.log("   Status: APPROVED — gebruik 'Verwerk goedgekeurde' in admin om punten te berekenen.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
