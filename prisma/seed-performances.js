// Seed script: MatchPerformance rows for 10 fictional matches
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);

let counter = 0;
const id = () => `seed-perf-${++counter}`;

// Each entry: { matchId, playerId, played, goals, penaltyGoals, assists, ownGoals, yellowCards, redCard }
const performances = [

  // ─── Match 1: seed-one-1757246400000 ── ONE vs SV Neede (H 3-1) WIN ───────
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zeui000004jygmspwwtg', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Niels Bouwman GK
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zfl2000604jyar37l7p7', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Twan Tenhagen DEF
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zf7r000304jy614v26o8', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Frank Geerdink DEF
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zfc8000404jyiwjy4m94', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 1, redCard: false },   // Martijn Leferink DEF (gele kaart)
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zfgo000504jyur8bme69', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Quint ter Haar DEF
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zg2r000a04jy3dtboglv', played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },   // Wesley Meulenkamp MID (assist)
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zg74000b04jy003gc0ys', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Wouter te Rietmole MID
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zfyd000904jyurk6vtbs', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Thijmen Grootholt MID
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zftz000804jyw9mnz12m', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Sander te Rietmole MID
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zh20000i04jynbzsy5oo', played: true, goals: 2, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Milan Eichelsheim ATT (2 goals)
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zgkd000e04jywpdr13wb', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Marco Kroeze ATT (1 goal)
  { matchId: 'seed-one-1757246400000', playerId: 'cmmb6zj9r001004jy1o8o5nzr', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Ozan Kazan ATT (gast van TWO)

  // ─── Match 2: seed-two-1757853000000 ── TWO vs VV Eibergen (A 2-2) DRAW ──
  { matchId: 'seed-two-1757853000000', playerId: 'cmmb6zhb2000k04jykirrww0d', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Bas ten Dam GK
  { matchId: 'seed-two-1757853000000', playerId: 'player-rik-koppelman',       played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Rik Koppelman DEF
  { matchId: 'seed-two-1757853000000', playerId: 'cmmb6zi5z000r04jygbzxqm58', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Lars Vollenbroek DEF
  { matchId: 'seed-two-1757853000000', playerId: 'cmmb6zhsr000o04jydpj7dfuv', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 1, redCard: false },   // Lucas Essink DEF (gele kaart)
  { matchId: 'seed-two-1757853000000', playerId: 'cmmb6zhx6000p04jyz9tqx70i', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Mees Geerdink DEF
  { matchId: 'seed-two-1757853000000', playerId: 'cmmb6zino000v04jywkvnhj0p', played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },   // Dennis Vrielink MID (assist)
  { matchId: 'seed-two-1757853000000', playerId: 'cmmb6zies000t04jyvuqqf0nb', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Brent ter Haar MID
  { matchId: 'seed-two-1757853000000', playerId: 'player-rick-ter-braak-(jr.)', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Rick ter Braak jr. MID
  { matchId: 'seed-two-1757853000000', playerId: 'cmmb6zija000u04jy8pnbxe9t', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Stan Bauhuis ATT (1 goal)
  { matchId: 'seed-two-1757853000000', playerId: 'cmmb6ziwj000x04jy7xmnzme9', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Sil Overmeen ATT (1 goal)
  { matchId: 'seed-two-1757853000000', playerId: 'cmmb6zj5c000z04jyygzoy09b', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Tijn Spikker ATT
  { matchId: 'seed-two-1757853000000', playerId: 'cmmb6zkm4001b04jy7yu7ft59', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },   // Job Vogt MID (gast van THREE)

  // ─── Match 3: seed-three-1758450600000 ── THREE vs SC Haaksbergen (H 1-0) WIN, clean sheet ──
  { matchId: 'seed-three-1758450600000', playerId: 'player-thom-lansink',       played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Thom Lansink GK (clean sheet!)
  { matchId: 'seed-three-1758450600000', playerId: 'cmmb6zk4i001704jyi6vcbfxn', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Arjan Koppelman DEF
  { matchId: 'seed-three-1758450600000', playerId: 'player-jos-vogt',            played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Jos Vogt DEF
  { matchId: 'seed-three-1758450600000', playerId: 'cmmb6zjrd001404jy0on6n69m', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Luuk Busschers DEF
  { matchId: 'seed-three-1758450600000', playerId: 'cmmb6zk8w001804jy5kb4cqt0', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Marijn Kormelink DEF
  { matchId: 'seed-three-1758450600000', playerId: 'player-mike-lammers',        played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Mike Lammers MID
  { matchId: 'seed-three-1758450600000', playerId: 'player-rob-bollen',          played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },  // Rob Bollen MID (assist)
  { matchId: 'seed-three-1758450600000', playerId: 'cmmb6zkhq001a04jy5aicdlpr', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Rick Lansink MID
  { matchId: 'seed-three-1758450600000', playerId: 'player-nando-temmink',       played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Nando Temmink MID
  { matchId: 'seed-three-1758450600000', playerId: 'player-bjorn-bekkedam',      played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Bjorn Bekkedam ATT (1 goal)
  { matchId: 'seed-three-1758450600000', playerId: 'cmmb6zl4c001f04jydp530nt3', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Lars Koldeweij ATT
  { matchId: 'seed-three-1758450600000', playerId: 'player-chris-lammers',       played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Chris Lammers DEF (gast van FOUR)

  // ─── Match 4: seed-dames-1759050000000 ── DAMES vs VV Borculo (A 4-2) WIN ──
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zprw002h04jy9uafgdx8', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Sophie te Morsche GK
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zpwb002i04jy4vfdpxid', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Sterre Bloemerg DEF
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zq0o002j04jya3bg3pxk', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Merel Jolink DEF
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zq52002k04jyaj8hgsqm', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Ruth Knoop DEF
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zqdv002m04jy5zkxzvmk', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 1, redCard: false },  // Sara Nijhof DEF (gele kaart)
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zqia002n04jyt1adu0mw', played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },  // Eva Bauhuis MID (assist)
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zqmn002o04jyjazw8itb', played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },  // Loes Bolks MID (assist)
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zqr2002p04jycppp137u', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Anne ter Braak MID
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zqvf002q04jyub46xkxl', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Camiela Eldeib MID
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zrlu002w04jyj1ozpfab', played: true, goals: 2, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Manon Grootholt ATT (2 goals)
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zrhh002v04jy6ct5v5eg', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Anouk ten Elsen ATT (1 goal)
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zrq9002x04jy57bzcmc6', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Sanne te Lintelo ATT (1 goal)
  { matchId: 'seed-dames-1759050000000', playerId: 'cmmb6zgbi000c04jydfmh57ch', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Koen ten Dam MID (gast van ONE)

  // ─── Match 5: seed-four-1759665600000 ── FOUR vs VV Groenlo (H 0-3) LOSS ──
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6zld5001h04jy38neumvt', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Thom Lansink GK (FOUR)
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6zlhk001i04jygrjfiql6', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Mart Bekkedam DEF
  { matchId: 'seed-four-1759665600000', playerId: 'player-tonnie-nienhuis',      played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Tonnie Nienhuis DEF
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6zm3j001n04jysm8g428r', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Arjan Vlierhaar DEF
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6zlqd001k04jy45ddxjmt', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 1, redCard: false },  // Rody Huistede DEF (gele kaart)
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6zm7z001o04jymsonxdf1', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Max Knoop MID
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6zml8001r04jyxzcya0eg', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 1, redCard: false },  // Mart Franssen MID (gele kaart)
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6zmce001p04jyaeqytu4z', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Luc Bouwman MID
  { matchId: 'seed-four-1759665600000', playerId: 'player-david-piepers',        played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // David Piepers MID
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6znbm001x04jyophtst9f', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Joost Lansink ATT (FOUR)
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6zng0001y04jy95qpx9xk', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Brian Meulenkamp ATT (FOUR)
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6zmyf001u04jyq5a88cld', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Daan te Morsche ATT
  { matchId: 'seed-four-1759665600000', playerId: 'cmmb6zofj002604jy38tud0zj', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Raymond Roerink MID (gast van FIVE)

  // ─── Match 6: seed-five-1760272200000 ── FIVE vs SV Ruurlo (A 2-1) WIN ──
  { matchId: 'seed-five-1760272200000', playerId: 'player-wouter-ter-braak',    played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Wouter ter Braak GK
  { matchId: 'seed-five-1760272200000', playerId: 'cmmb6zo6p002404jyrjn1nsxh', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Jos Knoop DEF
  { matchId: 'seed-five-1760272200000', playerId: 'cmmb6zo2b002304jycsku8sui', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Bert Knoop DEF
  { matchId: 'seed-five-1760272200000', playerId: 'cmmb6znxq002204jygp6owtb1', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Joren Hogenkamp DEF
  { matchId: 'seed-five-1760272200000', playerId: 'cmmb6zntc002104jyt9dqbtyq', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Allard Kooy DEF
  { matchId: 'seed-five-1760272200000', playerId: 'cmmb6zob5002504jy1mlqmalm', played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },  // Luc Borgelink MID (assist)
  { matchId: 'seed-five-1760272200000', playerId: 'cmmb6zosp002904jyasmjgkrm', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Kevin Nales MID
  { matchId: 'seed-five-1760272200000', playerId: 'cmmb6zoob002804jy4ovrgn1s', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Jordy ter Hofte MID
  { matchId: 'seed-five-1760272200000', playerId: 'player-bennie-nijhuis',       played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Bennie Nijhuis MID
  { matchId: 'seed-five-1760272200000', playerId: 'player-luuk-wielens',         played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Luuk Wielens ATT (1 goal)
  { matchId: 'seed-five-1760272200000', playerId: 'cmmb6zpab002d04jyzplexq1q', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Jos Tenhagen ATT (1 goal)
  { matchId: 'seed-five-1760272200000', playerId: 'player-timo-sonderen',        played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Timo Sonderen ATT
  { matchId: 'seed-five-1760272200000', playerId: 'player-wouter-te-rietmole',  played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Wouter te Rietmole MID (gast van TWO)

  // ─── Match 7: seed-one-1760875200000 ── ONE vs VV Lichtenvoorde (A 1-1) DRAW ──
  { matchId: 'seed-one-1760875200000', playerId: 'player-jeroen-hartgerink',    played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Jeroen Hartgerink GK (ONE)
  { matchId: 'seed-one-1760875200000', playerId: 'cmmb6zeyx000104jyws99gp8c', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Bas Essink DEF
  { matchId: 'seed-one-1760875200000', playerId: 'cmmb6zf3c000204jyx6kfopuo', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Dylen Tijdhof DEF
  { matchId: 'seed-one-1760875200000', playerId: 'player-koen-waanders',        played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Koen Waanders DEF
  { matchId: 'seed-one-1760875200000', playerId: 'player-bart-wielens',         played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Bart Wielens DEF
  { matchId: 'seed-one-1760875200000', playerId: 'cmmb6zfpk000704jy2dos4dm0', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Niels te Lintelo MID
  { matchId: 'seed-one-1760875200000', playerId: 'player-patriek-piepers',      played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Patriek Piepers MID (ONE)
  { matchId: 'seed-one-1760875200000', playerId: 'player-frank-vogt',           played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Frank Vogt MID
  { matchId: 'seed-one-1760875200000', playerId: 'player-tim-ten-beitel',       played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Tim ten Beitel MID
  { matchId: 'seed-one-1760875200000', playerId: 'cmmb6zgxl000h04jyack8zfq4', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Jorrick de Lange ATT (1 goal)
  { matchId: 'seed-one-1760875200000', playerId: 'player-harm-waanders',        played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Harm Waanders ATT
  { matchId: 'seed-one-1760875200000', playerId: 'player-nick-hogenkamp',       played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 1, redCard: false },  // Nick Hogenkamp ATT (gele kaart)
  { matchId: 'seed-one-1760875200000', playerId: 'cmmb6zkzo001e04jyxnhda685', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Job Kleinsman ATT (gast van THREE)

  // ─── Match 8: seed-two-1762086600000 ── TWO vs SC Hupsel (H 5-0) WIN, clean sheet ──
  { matchId: 'seed-two-1762086600000', playerId: 'cmmb6zh6o000j04jykzt40d2z', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Jeroen Hartgerink GK (TWO, clean sheet!)
  { matchId: 'seed-two-1762086600000', playerId: 'player-jan-tenhagen',         played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Jan Tenhagen DEF
  { matchId: 'seed-two-1762086600000', playerId: 'cmmb6zhfi000l04jyzz9r63v3', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Sven Hardeman DEF
  { matchId: 'seed-two-1762086600000', playerId: 'cmmb6zhjx000m04jycxad00bk', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Koen te Lintelo DEF (TWO)
  { matchId: 'seed-two-1762086600000', playerId: 'player-thijs-eppink',         played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Thijs Eppink DEF (TWO)
  { matchId: 'seed-two-1762086600000', playerId: 'player-wouter-te-rietmole',  played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },  // Wouter te Rietmole MID (assist)
  { matchId: 'seed-two-1762086600000', playerId: 'player-twan-tenhagen',        played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },  // Twan Tenhagen MID (assist)
  { matchId: 'seed-two-1762086600000', playerId: 'player-dennis-hermelink',     played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Dennis Hermelink MID
  { matchId: 'seed-two-1762086600000', playerId: 'cmmb6ziaf000s04jym1pqqv7v', played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },  // Patriek Piepers MID (TWO, assist)
  { matchId: 'seed-two-1762086600000', playerId: 'cmmb6zija000u04jy8pnbxe9t', played: true, goals: 2, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Stan Bauhuis ATT (2 goals)
  { matchId: 'seed-two-1762086600000', playerId: 'cmmb6zjij001204jyc5mjfusd', played: true, goals: 2, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Wouter Lansink ATT (TWO, 2 goals)
  { matchId: 'seed-two-1762086600000', playerId: 'cmmb6zjmx001304jy3f26ttuo', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Joren Vrielink ATT (1 goal)
  { matchId: 'seed-two-1762086600000', playerId: 'cmmb6zgfy000d04jy4vf664c2', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Collin ter Braack ATT (gast van ONE)

  // ─── Match 9: seed-three-1762687800000 ── THREE vs SV Vorden (A 0-2) LOSS ──
  { matchId: 'seed-three-1762687800000', playerId: 'player-thom-lansink',        played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Thom Lansink GK (THREE)
  { matchId: 'seed-three-1762687800000', playerId: 'player-frank-koppelman',     played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Frank Koppelman DEF
  { matchId: 'seed-three-1762687800000', playerId: 'player-jeroen-siemerink',    played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Jeroen Siemerink DEF
  { matchId: 'seed-three-1762687800000', playerId: 'player-peter-ten-beitel',    played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Peter ten Beitel DEF
  { matchId: 'seed-three-1762687800000', playerId: 'cmmb6zkda001904jy9k5kndhj', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Mark ten Vregelaar DEF
  { matchId: 'seed-three-1762687800000', playerId: 'player-guus-waanders',       played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Guus Waanders MID (THREE)
  { matchId: 'seed-three-1762687800000', playerId: 'player-nando-temmink',       played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 1, redCard: false },  // Nando Temmink MID (gele kaart)
  { matchId: 'seed-three-1762687800000', playerId: 'cmmb6zkm4001b04jy7yu7ft59', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Job Vogt MID
  { matchId: 'seed-three-1762687800000', playerId: 'cmmb6zkhq001a04jy5aicdlpr', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Rick Lansink MID
  { matchId: 'seed-three-1762687800000', playerId: 'cmmb6zkqi001c04jybi9iahbe', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Denzel Dekkers ATT
  { matchId: 'seed-three-1762687800000', playerId: 'player-ruben-nijhuis',       played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Ruben Nijhuis ATT (THREE)
  { matchId: 'seed-three-1762687800000', playerId: 'player-tim-bouwman',         played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Tim Bouwman ATT (THREE)
  { matchId: 'seed-three-1762687800000', playerId: 'player-marco-siemerink',     played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Marco Siemerink MID (gast van FOUR)

  // ─── Match 10: seed-dames-1763287200000 ── DAMES vs VV Lochem (H 3-3) DRAW ──
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zprw002h04jy9uafgdx8', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Sophie te Morsche GK
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zq9g002l04jy83c15fip', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Anoek Meijer DEF
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zpwb002i04jy4vfdpxid', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Sterre Bloemerg DEF
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zq52002k04jyaj8hgsqm', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Ruth Knoop DEF
  { matchId: 'seed-dames-1763287200000', playerId: 'player-ivo-overbeek',        played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Ivo Overbeek DEF (gast)
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zrd1002u04jydkvjjkpu', played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },  // Lizan Spikker MID (assist)
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zr46002s04jy12sl0c6s', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Floor Nijhof MID
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zr8m002t04jy8764nmv6', played: true, goals: 0, penaltyGoals: 0, assists: 1, ownGoals: 0, yellowCards: 0, redCard: false },  // Renske Nijhof MID (assist)
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zqzt002r04jyt5jzsomm', played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Fleur Hondelink MID
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zrz0002z04jyfp87bi2l', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Imke Nijhuis ATT (1 goal)
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zrum002y04jyswgdsx4p', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Eriënne Nijhuis ATT (1 goal)
  { matchId: 'seed-dames-1763287200000', playerId: 'cmmb6zs3k003004jyb8wr88it', played: true, goals: 1, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Lot Schurink ATT (1 goal)
  { matchId: 'seed-dames-1763287200000', playerId: 'player-luuk-wielens',        played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false },  // Luuk Wielens ATT (gast van FIVE)
];

async function main() {
  console.log(`Inserting ${performances.length} performances...`);
  let inserted = 0;
  let skipped = 0;

  for (const p of performances) {
    const perfId = id();
    try {
      const result = await sql`
        INSERT INTO "MatchPerformance" (id, "matchId", "playerId", played, goals, "penaltyGoals", assists, "ownGoals", "yellowCards", "redCard")
        VALUES (${perfId}, ${p.matchId}, ${p.playerId}, ${p.played}, ${p.goals}, ${p.penaltyGoals}, ${p.assists}, ${p.ownGoals}, ${p.yellowCards}, ${p.redCard})
        ON CONFLICT ("matchId", "playerId") DO NOTHING
        RETURNING id
      `;
      if (result.length > 0) {
        inserted++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`  ERROR for matchId=${p.matchId} playerId=${p.playerId}:`, err.message);
      skipped++;
    }
  }

  console.log(`Done. Inserted: ${inserted}, skipped/conflict: ${skipped}`);
}

main().catch(console.error);
