export type NamedRef = {
  id: string;
  name: string;
  [key: string]: any;
};

export type Pokemon = {
  id: string;
  dexNo: number;
  name: string;
  types: string[];
  baseStats: Record<string, number>;
  bst: number;
  abilities: NamedRef[];
  heldItems: Record<string, string>;
  evYield: Record<string, number>;
  eggGroups: string[];
  assets: { icon?: string | null; sprite?: string | null };
  learnsets: Record<string, any[]>;
  evolvesTo: any[];
  evolvesFrom: any[];
  encounters: string[];
  staticsGifts: string[];
  trainerUsage: any[];
  availability: Record<string, any>;
  validationFlags: string[];
  [key: string]: any;
};

export type Move = {
  id: string;
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  target: string;
  flags: string[];
  description: string;
  effect: string;
  effectSummary?: string | null;
  learners: any[];
  [key: string]: any;
};

export type ExplorerData = {
  pokemon: Pokemon[];
  moves: Move[];
  abilities: any[];
  items: any[];
  locations: any[];
  encounters: any[];
  trainers: any[];
  bossFights: any[];
  championCircuit: any[];
  staticsGifts: any[];
  legendaryDossiers: any[];
  marts: any[];
  evolutions: any[];
  features: any[];
  version: any;
  versionLog: any[];
  randomLegendary: any;
  knownRisks: any;
  assetsManifest: any;
  validationReport: any;
};

export type Route = {
  section: string;
  id?: string;
};
