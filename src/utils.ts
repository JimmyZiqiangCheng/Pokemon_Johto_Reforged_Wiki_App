import type { Route } from "./types";

export const TYPE_COLORS: Record<string, string> = {
  Normal: "#7c8490",
  Fire: "#c4472d",
  Water: "#2d72b8",
  Electric: "#a87908",
  Grass: "#2f7d50",
  Ice: "#238192",
  Fighting: "#9a3a2f",
  Poison: "#7a4aa0",
  Ground: "#876a3e",
  Flying: "#5b76b7",
  Psychic: "#b33f72",
  Bug: "#647f2d",
  Rock: "#756548",
  Ghost: "#5d5485",
  Dragon: "#4f60a8",
  Dark: "#4c4746",
  Steel: "#667987",
  Fairy: "#b95b8f",
  Unknown: "#6f7884"
};

export const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  spAttack: "SpA",
  spDefense: "SpD",
  speed: "Spe"
};

const SPECIAL_NAME_PARTS: Record<string, string> = {
  HO_OH: "Ho-Oh",
  MR_MIME: "Mr. Mime",
  MIME_JR: "Mime Jr.",
  FARFETCHD: "Farfetch'd",
  NIDORAN_F: "Nidoran F",
  NIDORAN_M: "Nidoran M"
};

const FORM_PREFIXES: Record<string, string> = {
  ALOLAN: "Alolan",
  GALARIAN: "Galarian",
  HISUIAN: "Hisuian",
  PALDEAN: "Paldean"
};

const LOCATION_ORDER: Array<[RegExp, number]> = [
  [/new bark town/i, 1],
  [/^route 29\b/i, 2],
  [/cherrygrove city/i, 3],
  [/^route 30\b/i, 4],
  [/^route 31\b/i, 5],
  [/dark cave route 31/i, 6],
  [/violet city/i, 7],
  [/sprout tower/i, 8],
  [/^route 32\b/i, 9],
  [/ruins of alph/i, 10],
  [/union cave/i, 11],
  [/^route 33\b/i, 12],
  [/azalea town/i, 13],
  [/slowpoke well/i, 14],
  [/ilex forest/i, 15],
  [/^route 34\b/i, 16],
  [/goldenrod city/i, 17],
  [/^route 35\b/i, 18],
  [/national park/i, 19],
  [/^route 36\b/i, 20],
  [/^route 37\b/i, 21],
  [/ecruteak city/i, 22],
  [/burned tower/i, 23],
  [/^route 38\b/i, 24],
  [/^route 39\b/i, 25],
  [/olivine city/i, 26],
  [/^route 40\b/i, 27],
  [/^route 41\b/i, 28],
  [/cianwood city/i, 29],
  [/^route 42\b/i, 30],
  [/mt\.? mortar/i, 31],
  [/mahogany town/i, 32],
  [/^route 43\b/i, 33],
  [/lake of rage/i, 34],
  [/rocket hideout/i, 35],
  [/radio tower/i, 36],
  [/^route 44\b/i, 37],
  [/ice path/i, 38],
  [/blackthorn city/i, 39],
  [/dragon'?s den/i, 40],
  [/^route 45\b/i, 41],
  [/dark cave route 45/i, 42],
  [/^route 46\b/i, 43],
  [/^route 47\b/i, 44],
  [/^route 48\b/i, 45],
  [/bell tower/i, 46],
  [/whirl islands/i, 47],
  [/^route 27\b/i, 48],
  [/^route 26\b/i, 49],
  [/victory road/i, 50],
  [/pokemon league/i, 51],
  [/vermilion city/i, 101],
  [/^route 6\b/i, 102],
  [/saffron city/i, 103],
  [/^route 5\b/i, 104],
  [/cerulean city/i, 105],
  [/^route 24\b/i, 106],
  [/^route 25\b/i, 107],
  [/^route 9\b/i, 108],
  [/^route 10\b/i, 109],
  [/power plant/i, 110],
  [/rock tunnel/i, 111],
  [/lavender town/i, 112],
  [/^route 8\b/i, 113],
  [/celadon city/i, 114],
  [/^route 16\b/i, 115],
  [/^route 17\b/i, 116],
  [/^route 18\b/i, 117],
  [/fuchsia city/i, 118],
  [/^route 15\b/i, 119],
  [/^route 14\b/i, 120],
  [/^route 13\b/i, 121],
  [/^route 12\b/i, 122],
  [/^route 11\b/i, 123],
  [/diglett'?s cave/i, 124],
  [/^route 2\b/i, 125],
  [/viridian city/i, 126],
  [/^route 1\b/i, 127],
  [/pallet town/i, 128],
  [/^route 21\b/i, 129],
  [/cinnabar island/i, 130],
  [/^route 20\b/i, 131],
  [/seafoam islands/i, 132],
  [/^route 19\b/i, 133],
  [/^route 3\b/i, 134],
  [/^route 4\b/i, 135],
  [/^route 7\b/i, 136],
  [/^route 22\b/i, 137],
  [/^route 28\b/i, 138],
  [/mt\.? silver/i, 139]
];

const TRAINER_NAME_ORDER: Record<string, number> = {
  Falkner: 7,
  Bugsy: 13,
  Whitney: 17,
  Morty: 22,
  Chuck: 29,
  Jasmine: 30,
  Pryce: 34,
  Clair: 40,
  Will: 52,
  Koga: 53,
  Bruno: 54,
  Karen: 55,
  Lance: 56,
  "Lt. Surge": 103,
  Sabrina: 104,
  Misty: 107,
  Erika: 114,
  Janine: 118,
  Brock: 126,
  Blaine: 130,
  Blue: 138,
  Red: 140
};

export function routeFromHash(hash = window.location.hash): Route {
  const clean = hash.replace(/^#\/?/, "");
  const [section = "overview", ...rest] = clean.split("/").filter(Boolean);
  return { section, id: rest.length ? decodeURIComponent(rest.join("/")) : undefined };
}

export function href(section: string, id?: string | number): string {
  return `#/${section}${id !== undefined && id !== "" ? `/${encodeURIComponent(String(id))}` : ""}`;
}

export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return `${import.meta.env.BASE_URL}${path}`.replace(/\/+/g, "/");
}

export function normalize(value: unknown): string {
  return String(value ?? "").toLowerCase();
}

export function readableLabel(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw
    .replace(/^(SPECIES|MOVE|ITEM|ABILITY|TRAINERCLASS|TRAINER|BOSS|ENCDATA|MOVE_EFFECT|EFFECT)_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bHp\b/g, "HP")
    .replace(/\bPp\b/g, "PP")
    .replace(/\bTm\b/g, "TM")
    .replace(/\bHm\b/g, "HM")
    .replace(/\bOh\b/g, "Oh");
}

export function cleanDescription(value: unknown): string {
  return String(value ?? "")
    .replace(/\\+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayPokemonName(name?: string | null, speciesId?: string | null): string {
  const cleanName = cleanDescription(name);
  if (cleanName && cleanName !== "-----" && cleanName !== "???") return cleanName;

  const raw = String(speciesId ?? "").replace(/^SPECIES_/, "");
  if (!raw) return cleanName || "Unknown Pokemon";
  const parts = raw.split("_");
  const form = parts[parts.length - 1] || "";
  const prefix = FORM_PREFIXES[form];
  const baseParts = prefix ? parts.slice(0, -1) : parts;
  const joined = baseParts.join("_");
  const base = SPECIAL_NAME_PARTS[joined] || baseParts.map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ");
  return prefix ? `${prefix} ${base}` : base;
}

export function readableAbilitySlot(slot: unknown): string {
  const value = normalize(slot);
  if (!value) return "";
  if (value.includes("hidden") || value === "h") return "Hidden";
  return `Ability ${String(slot)}`;
}

export function itemIsUseful(item: { id?: string; name?: string; slug?: string }): boolean {
  const name = String(item.name ?? "").trim();
  const id = String(item.id ?? "");
  const slug = String(item.slug ?? "");
  return (
    name !== "???" &&
    !/^\u2605/.test(name) &&
    !/^ITEM_UNKNOWN_/i.test(id) &&
    !/^ITEM_[A-Z]{3,}\d+$/i.test(id) &&
    !/^unknown/i.test(slug)
  );
}

export function progressionScore(locationName?: string | null, region?: string | null): number {
  const name = String(locationName ?? "");
  const explicit = LOCATION_ORDER.find(([pattern]) => pattern.test(name));
  if (explicit) return explicit[1];

  const route = name.match(/route\s+(\d+)/i);
  if (route) {
    const routeNo = Number(route[1]);
    if (routeNo >= 29 && routeNo <= 48) return 2 + routeNo - 29;
    if (routeNo === 26) return 49;
    if (routeNo === 27) return 48;
    if (routeNo >= 1 && routeNo <= 25) return 100 + routeNo;
    if (routeNo === 28) return 138;
  }

  const regionRank = normalize(region).includes("kanto") ? 200 : normalize(region).includes("johto") ? 80 : 400;
  return regionRank + name.localeCompare("");
}

export function trainerProgressionScore(trainer: { name?: string; category?: string; minLevel?: number | null; maxLevel?: number | null; location?: string | null; region?: string | null }): number {
  const orderedName = trainer.name ? TRAINER_NAME_ORDER[trainer.name] : undefined;
  if (orderedName !== undefined && /leader|elite|champion|rival/i.test(`${trainer.category ?? ""} ${trainer.name ?? ""}`)) return orderedName;
  if (trainer.location) return progressionScore(trainer.location, trainer.region);
  const categoryBoost = normalize(trainer.category).includes("route") ? 0 : 20;
  return categoryBoost + (trainer.minLevel ?? trainer.maxLevel ?? 999);
}

export function stringifySearch(value: unknown): string {
  return JSON.stringify(value ?? "").toLowerCase();
}

export function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));
}

export function groupBy<T>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item) || "Other";
    groups[key] ||= [];
    groups[key].push(item);
    return groups;
  }, {});
}

export function levelRange(item: { minLevel?: number | null; maxLevel?: number | null; level?: number | null }): string {
  if (item.level) return `Lv. ${item.level}`;
  if (item.minLevel && item.maxLevel && item.minLevel !== item.maxLevel) return `Lv. ${item.minLevel}-${item.maxLevel}`;
  if (item.minLevel || item.maxLevel) return `Lv. ${item.minLevel || item.maxLevel}`;
  return "Level unknown";
}

export function compactNumber(value: unknown, fallback = "-"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function sortByName<T extends { name?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}
