import { prisma } from "@/lib/prisma";

export type ContentDef = {
  key: string;
  label: string;
  group: string;
  default: string;
  multiline?: boolean;
};

export const CONTENT_DEFS: ContentDef[] = [
  {
    key: "home.tagline",
    label: "Tagline onder het logo",
    group: "Homepage",
    default: "Stel jouw droomteam samen en strijd om de beste opstelling",
  },
  {
    key: "tussenstand.title",
    label: "Titel boven Tussenstand / Statistieken / Deelnemers",
    group: "Tussenstand",
    default: "Tussenstand",
  },
  {
    key: "tussenstand.hidden_message",
    label: "Melding wanneer de tussenstand verborgen is",
    group: "Tussenstand",
    default: "De tussenstand is momenteel niet te bekijken.",
    multiline: true,
  },
  {
    key: "statistieken.hidden_message",
    label: "Melding wanneer de statistieken verborgen zijn",
    group: "Tussenstand",
    default: "De statistieken zijn momenteel niet te bekijken.",
    multiline: true,
  },
  {
    key: "meldingen.whatsapp_follow",
    label: "Subtekst bij verborgen tussenstand/statistieken",
    group: "Tussenstand",
    default: "Volg de updates op Whatsapp om op de hoogte van de tussenstand en alle statistieken te blijven.",
    multiline: true,
  },
  {
    key: "meldingen.registratie_gesloten_titel",
    label: "Titel — inschrijving gesloten",
    group: "Meldingen",
    default: "Transfermarkt gesloten",
  },
  {
    key: "meldingen.registratie_gesloten_tekst",
    label: "Tekst — inschrijving gesloten",
    group: "Meldingen",
    default:
      "Net te laat! Inschrijven kan niet meer — de transferperiode voor dit seizoen zit erop. Bekijk de tussenstand om te zien wie de sterkste opstelling heeft neergezet.",
    multiline: true,
  },
  {
    key: "juridisch.spelregels",
    label: "Spelregels (markdown, /spelregels)",
    group: "Juridisch",
    default: "",
    multiline: true,
  },
  {
    key: "juridisch.voorwaarden",
    label: "Algemene voorwaarden (markdown, /voorwaarden)",
    group: "Juridisch",
    default: "",
    multiline: true,
  },
  {
    key: "juridisch.privacybeleid",
    label: "Privacybeleid (markdown, /privacy)",
    group: "Juridisch",
    default: "",
    multiline: true,
  },
];

const DEFAULTS_BY_KEY = new Map(CONTENT_DEFS.map((d) => [d.key, d.default]));

export async function getContentMap(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.siteContent.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const result: Record<string, string> = {};
  for (const key of keys) {
    result[key] = byKey.get(key) ?? DEFAULTS_BY_KEY.get(key) ?? "";
  }
  return result;
}

export async function getContent(key: string): Promise<string> {
  const map = await getContentMap([key]);
  return map[key];
}
