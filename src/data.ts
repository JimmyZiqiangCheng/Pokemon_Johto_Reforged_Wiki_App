import type { ExplorerData } from "./types";

const DATA_FILES: Record<keyof ExplorerData, string> = {
  pokemon: "pokemon.json",
  moves: "moves.json",
  abilities: "abilities.json",
  items: "items.json",
  locations: "locations.json",
  encounters: "encounters.json",
  trainers: "trainers.json",
  bossFights: "boss_fights.json",
  championCircuit: "champion_circuit.json",
  staticsGifts: "statics_gifts.json",
  legendaryDossiers: "legendary_dossiers.json",
  marts: "marts.json",
  evolutions: "evolutions.json",
  features: "features.json",
  version: "version.json",
  versionLog: "version_log.json",
  randomLegendary: "random_legendary.json",
  knownRisks: "known_risks.json",
  assetsManifest: "assets_manifest.json",
  validationReport: "validation_report.json"
};

export async function loadExplorerData(): Promise<ExplorerData> {
  const base = `${import.meta.env.BASE_URL}data/`;
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, file]) => {
      const response = await fetch(`${base}${file}`, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load ${file}: ${response.status}`);
      }
      return [key, await response.json()];
    })
  );
  return Object.fromEntries(entries) as ExplorerData;
}
