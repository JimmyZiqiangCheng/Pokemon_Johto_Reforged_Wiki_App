import { useEffect, useMemo, useState, type ReactNode } from "react";
import Fuse from "fuse.js";
import {
  BadgeInfo,
  Boxes,
  ChevronRight,
  CircuitBoard,
  Eye,
  EyeOff,
  Home,
  Info,
  ListFilter,
  Map as MapIcon,
  Package,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  X,
  UserRound,
  Zap,
  type LucideIcon
} from "lucide-react";
import { loadExplorerData } from "./data";
import type { ExplorerData, Move, Pokemon, Route } from "./types";
import {
  STAT_LABELS,
  TYPE_COLORS,
  assetUrl,
  cleanDescription,
  compactNumber,
  displayPokemonName,
  groupBy,
  href,
  itemIsUseful,
  levelRange,
  normalize,
  progressionScore,
  readableAbilitySlot,
  readableLabel,
  routeFromHash,
  trainerProgressionScore,
  unique
} from "./utils";

const NAV: Array<{ section: string; label: string; icon: LucideIcon }> = [
  { section: "overview", label: "Overview", icon: Home },
  { section: "features", label: "Features", icon: Info },
  { section: "pokemon", label: "Pokemon", icon: Sparkles },
  { section: "moves", label: "Moves", icon: Zap },
  { section: "abilities", label: "Abilities", icon: Shield },
  { section: "locations", label: "Locations", icon: MapIcon },
  { section: "statics", label: "Events", icon: Boxes },
  { section: "trainers", label: "Trainers", icon: UserRound },
  { section: "items", label: "Items", icon: Package },
  { section: "marts", label: "Shops", icon: ShoppingBag },
  { section: "version", label: "Version", icon: BadgeInfo },
  { section: "version-log", label: "Version Log", icon: CircuitBoard }
];

type Indexes = {
  pokemon: Map<string, Pokemon>;
  moves: Map<string, Move>;
  items: Map<string, any>;
  abilities: Map<string, any>;
  locations: Map<string, any>;
  encounters: Map<string, any>;
  trainers: Map<string, any>;
};

function canonicalSection(section: string): string {
  if (section === "encounters" || section === "rare-finds") return "locations";
  if (section === "bosses" || section === "champion-circuit") return "trainers";
  if (section === "dossiers" || section === "validation") return "features";
  return section;
}

export function App() {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<Route>(() => routeFromHash());
  const [hideSpoilers, setHideSpoilers] = useState(() => localStorage.getItem("jr-hide-spoilers") === "1");

  useEffect(() => {
    loadExplorerData().then(setData).catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    localStorage.setItem("jr-hide-spoilers", hideSpoilers ? "1" : "0");
  }, [hideSpoilers]);

  const indexes = useMemo<Indexes | null>(() => {
    if (!data) return null;
    return {
      pokemon: new Map(data.pokemon.map((item) => [item.id, item])),
      moves: new Map(data.moves.map((item) => [item.id, item])),
      items: new Map(data.items.map((item) => [item.id, item])),
      abilities: new Map(data.abilities.map((item) => [item.id, item])),
      locations: new Map(data.locations.map((item) => [item.id, item])),
      encounters: new Map(data.encounters.map((item) => [item.id, item])),
      trainers: new Map(data.trainers.map((item) => [item.id, item]))
    };
  }, [data]);

  const active = NAV.find((item) => item.section === canonicalSection(route.section)) || NAV[0];
  const ActiveIcon = active.icon;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href={href("overview")}>
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <strong>Johto Reforged</strong>
            <small>Static explorer</small>
          </span>
        </a>
        <nav className="nav-list" aria-label="Explorer sections">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.section} className={`nav-link ${item.section === active.section ? "is-active" : ""}`} href={href(item.section)}>
                <Icon size={17} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        {data ? (
          <div className="sidebar-meta">
            <span>{data.version.versionLabel}</span>
            <span>{data.pokemon.length} Pokemon profiles</span>
          </div>
        ) : null}
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              <ActiveIcon size={15} /> {active.label}
            </p>
            <h1>Pokemon Johto Reforged</h1>
          </div>
          <button className="icon-text-button" type="button" onClick={() => setHideSpoilers((value) => !value)}>
            {hideSpoilers ? <EyeOff size={17} /> : <Eye size={17} />}
            {hideSpoilers ? "Spoilers hidden" : "Spoilers shown"}
          </button>
        </header>
        {error ? <StatePanel title="Data load failed" body={error} /> : null}
        {!data || !indexes ? <StatePanel title="Loading explorer data" body="Reading generated JSON exports." /> : renderPage(data, indexes, route, hideSpoilers)}
      </main>
    </div>
  );
}

function renderPage(data: ExplorerData, indexes: Indexes, route: Route, hideSpoilers: boolean) {
  switch (route.section) {
    case "features":
      return <FeaturesPage data={data} />;
    case "pokemon":
      return <PokemonPage data={data} indexes={indexes} route={route} />;
    case "moves":
      return <MovesPage data={data} indexes={indexes} route={route} />;
    case "abilities":
      return <AbilitiesPage data={data} indexes={indexes} route={route} />;
    case "items":
      return <ItemsPage data={data} indexes={indexes} route={route} />;
    case "locations":
      return <LocationsPage data={data} indexes={indexes} route={route} />;
    case "encounters":
      return <LocationsPage data={data} indexes={indexes} route={{ section: "locations", id: route.id ? indexes.encounters.get(route.id)?.locationId : undefined }} />;
    case "rare-finds":
      return <LocationsPage data={data} indexes={indexes} route={{ section: "locations" }} />;
    case "trainers":
      return <TrainersPage data={data} indexes={indexes} route={route} hideSpoilers={hideSpoilers} />;
    case "champion-circuit":
      return <TrainersPage data={data} indexes={indexes} route={{ ...route, section: "trainers" }} hideSpoilers={hideSpoilers} />;
    case "statics":
      return <StaticsPage data={data} indexes={indexes} route={route} hideSpoilers={hideSpoilers} />;
    case "marts":
      return <MartsPage data={data} indexes={indexes} route={route} />;
    case "version":
      return <VersionPage data={data} />;
    case "version-log":
      return <VersionLogPage data={data} />;
    case "bosses":
      return <TrainersPage data={data} indexes={indexes} route={{ ...route, section: "trainers" }} hideSpoilers={hideSpoilers} />;
    case "dossiers":
    case "validation":
      return <FeaturesPage data={data} />;
    default:
      return <OverviewPage data={data} />;
  }
}

function StatePanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="state-panel">
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}

function OverviewPage({ data }: { data: ExplorerData }) {
  const visibleFeatures = data.features.filter((feature) => normalize(feature.tag) !== "validation");
  const trainers = allTrainerRecords(data);
  return (
    <div className="page-stack">
      <section className="overview-hero">
        <div>
          <p className="eyebrow">Companion data site</p>
          <h2>Pokemon Johto Reforged</h2>
          <p>
            A fast reference for Pokemon, moves, locations, trainers, items, events, and postgame content in Johto Reforged.
          </p>
        </div>
        <div className="coverage-grid">
          <Metric label="Pokemon" value={data.pokemon.length} />
          <Metric label="Locations" value={data.locations.length} />
          <Metric label="Trainers" value={trainers.length} />
          <Metric label="Items" value={data.items.filter(itemIsUseful).length} />
        </div>
      </section>
      <section className="card-grid overview-feature-grid">
        {visibleFeatures.map((feature) => (
          <FeatureCard feature={feature} compact key={feature.title} />
        ))}
      </section>
      <section className="quick-links">
        {NAV.filter((item) => item.section !== "overview").map((item) => (
          <a key={item.section} href={href(item.section)}>
            <item.icon size={18} />
            {item.label}
            <ChevronRight size={16} />
          </a>
        ))}
      </section>
    </div>
  );
}

function FeaturesPage({ data }: { data: ExplorerData }) {
  const features = data.features
    .filter((feature) => normalize(feature.tag) !== "validation")
    .map((feature) => ({ ...feature, body: playerFacingFeatureCopy(feature.body) }));
  return (
    <div className="page-stack">
      <section className="band">
        <h2>Features</h2>
        <p>What changes while you play: richer route hunting, broader team building, smarter battles, earlier training tools, and a postgame with real targets to chase.</p>
      </section>
      <section className="card-grid feature-detail-grid">
        {features.map((feature) => (
          <FeatureCard feature={feature} key={feature.title} />
        ))}
      </section>
      <section className="band">
        <h2>Useful References</h2>
        <div className="quick-grid">
          {[
            ["Pokemon", "Check typing, stats, abilities, learnsets, evolutions, and where each Pokemon can be found."],
            ["Locations", "Plan route hunts by seeing wild Pokemon, rare finds, trainers, shops, items, and events together."],
            ["Trainers", "Preview regular trainers, boss teams, rematches, and Champion Circuit fights when you want to prepare."],
            ["Items and shops", "Track when important training, customization, and evolution items become available."]
          ].map(([title, body]) => (
            <div className="info-row" key={title}>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ feature, compact = false }: { feature: any; compact?: boolean }) {
  const body = compact ? feature.summary || firstFeatureSentence(feature.body) : feature.body;
  const Icon = featureIcon(feature);
  return (
    <article className={`feature-card ${compact ? "is-compact" : ""} ${featureToneClass(feature.tag)}`}>
      <div className="feature-card-title">
        <span className="feature-card-icon" aria-hidden="true">
          <Icon size={22} strokeWidth={2.35} />
        </span>
        <div>
          <span className="tag">{feature.tag}</span>
          <h3>{feature.title}</h3>
        </div>
      </div>
      <p>{playerFacingFeatureCopy(body)}</p>
    </article>
  );
}

function firstFeatureSentence(value: string): string {
  const text = playerFacingFeatureCopy(value);
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return match ? match[0].trim() : text;
}

function featureToneClass(tag: string): string {
  return `feature-tone-${normalize(tag).replace(/[^a-z0-9]+/g, "-")}`;
}

function featureIcon(feature: any): LucideIcon {
  const tag = normalize(feature.tag);
  const title = normalize(feature.title);
  if (title.includes("rare wild")) return Search;
  if (title.includes("wild pokemon variety")) return MapIcon;
  if (tag.includes("legendar")) return Sparkles;
  if (tag.includes("qol") && title.includes("flow")) return Zap;
  if (tag.includes("qol") && title.includes("information")) return ListFilter;
  if (tag.includes("qol") && title.includes("catching")) return Sparkles;
  if (tag.includes("qol")) return ShoppingBag;
  if (title.includes("evolution")) return Zap;
  if (tag.includes("item")) return ShoppingBag;
  if (tag.includes("scope")) return Boxes;
  if (title.includes("boss") || title.includes("rematch")) return BadgeInfo;
  if (tag.includes("trainer")) return UserRound;
  if (tag.includes("postgame")) return CircuitBoard;
  if (tag.includes("pokemon")) return Shield;
  return Info;
}

function playerFacingFeatureCopy(value: string): string {
  return String(value || "")
    .replace(/dossiers?/gi, "special encounters")
    .replace(/exported|exports?/gi, "available")
    .replace(/validation/gi, "reference");
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function StatLine({ label, value, max, accent = false }: { label: string; value: number; max: number; accent?: boolean }) {
  return (
    <div className={`stat-line ${accent ? "is-bst" : ""}`}>
      <span>{label}</span>
      <meter min={0} max={max} value={value} />
      <strong>{value}</strong>
    </div>
  );
}

const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
};

function typeMultiplier(attackType: string, defenderTypes: string[]): number {
  return defenderTypes.reduce((multiplier, defenderType) => multiplier * (TYPE_EFFECTIVENESS[attackType]?.[defenderType] ?? 1), 1);
}

function WeaknessTable({ types }: { types: string[] }) {
  const rows = TYPE_COLORS_KEYS()
    .map((type) => ({ type, multiplier: typeMultiplier(type, types) }))
    .sort((a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type));
  return (
    <div className="matchup-table" aria-label="Type matchup damage taken">
      {rows.map((row) => (
        <div key={row.type} className={`matchup-row m-${String(row.multiplier).replace(".", "_")}`}>
          <span className="type-chip" style={{ background: TYPE_COLORS[row.type] || TYPE_COLORS.Unknown }}>{row.type}</span>
          <strong>{formatMultiplier(row.multiplier)}</strong>
        </div>
      ))}
    </div>
  );
}

function formatMultiplier(value: number): string {
  if (value === 0.25) return "1/4x";
  if (value === 0.5) return "1/2x";
  return `${value}x`;
}

function PopupPill({ label, children }: { label: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="popup-pill">
      <button className="pill pill-link" type="button" onClick={() => setOpen((value) => !value)}>
        {label}
      </button>
      {open ? (
        <span className="popup-panel" role="dialog">
          <button className="popup-close" type="button" aria-label="Close" onClick={() => setOpen(false)}>
            <X size={14} />
          </button>
          {children}
        </span>
      ) : null}
    </span>
  );
}

function MovePopupPill({ moveId, fallbackName, moves, prefix }: { moveId?: string | null; fallbackName: string; moves?: Map<string, Move>; prefix?: string }) {
  const move = moveId ? moves?.get(moveId) : undefined;
  const label = `${prefix ? `${prefix} ` : ""}${move?.name || fallbackName}`;
  return (
    <PopupPill label={label}>
      {move ? <MovePreview move={move} /> : <p>No move details available.</p>}
    </PopupPill>
  );
}

function MovePreview({ move }: { move: Move }) {
  return (
    <div className="popup-content">
      <strong>{move.name}</strong>
      <div className="move-preview-meta">
        <MoveBadge move={move} />
        <span>{move.category}</span>
        <span>{compactNumber(move.power)} power</span>
        <span>{move.accuracy ? `${move.accuracy}%` : "-"} accuracy</span>
      </div>
      <p>{move.effectSummary || cleanDescription(move.description) || "No description available."}</p>
    </div>
  );
}

type BrowserPageProps<T> = {
  title: string;
  section: string;
  route: Route;
  items: T[];
  getId: (item: T) => string;
  searchKeys: string[];
  filters: string[];
  filterLabel?: string;
  filterFn?: (item: T, filter: string) => boolean;
  sorters: Record<string, (a: T, b: T) => number>;
  renderCard: (item: T, selected: boolean) => ReactNode;
  renderDetail: (item: T) => ReactNode;
  emptyText?: string;
  maxList?: number;
};

function BrowserPage<T extends Record<string, any>>(props: BrowserPageProps<T>) {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sort, setSort] = useState(Object.keys(props.sorters)[0]);
  const fuse = useMemo(
    () => new Fuse(props.items, { keys: props.searchKeys, threshold: 0.34, ignoreLocation: true }),
    [props.items, props.searchKeys.join("|")]
  );
  const visible = useMemo(() => {
    const trimmedQuery = query.trim();
    const searchOrder = new Map<string, number>();
    const searched = trimmedQuery
      ? fuse.search(trimmedQuery).filter((result, _, results) => {
          const hasDirectMatches = results.some((candidate) => browserSearchRank(candidate.item, trimmedQuery, props.getId) < 9);
          return !hasDirectMatches || browserSearchRank(result.item, trimmedQuery, props.getId) < 9;
        }).map((result, index) => {
          searchOrder.set(props.getId(result.item), browserSearchRank(result.item, trimmedQuery, props.getId) * 10000 + index);
          return result.item;
        })
      : props.items;
    const filtered = activeFilters.length ? searched.filter((item) => activeFilters.every((filter) => props.filterFn?.(item, filter) ?? true)) : searched;
    return [...filtered].sort((a, b) => {
      if (trimmedQuery) {
        const rank = (searchOrder.get(props.getId(a)) ?? 999999) - (searchOrder.get(props.getId(b)) ?? 999999);
        if (rank) return rank;
      }
      return props.sorters[sort](a, b);
    });
  }, [activeFilters, fuse, props, query, sort]);
  const routeSelected = props.items.find((item) => props.getId(item) === props.route.id);
  const routeSelectedVisible = routeSelected && visible.some((item) => props.getId(item) === props.getId(routeSelected));
  const selected = routeSelectedVisible ? routeSelected : visible[0] || routeSelected || props.items[0];
  const maxList = props.maxList ?? 900;
  const rendered = visible.slice(0, maxList);
  const filterChoices = props.filters.filter((value) => value !== "All");
  const toggleFilter = (value: string) => {
    setActiveFilters((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };
  return (
    <div className="browser-page">
      <section className="toolbar">
        <label className="searchbox">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={`Search ${props.title.toLowerCase()}...`}
            type="search"
          />
        </label>
        <label className="select-control">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.currentTarget.value)}>
            {Object.keys(props.sorters).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        {filterChoices.length ? (
          <details className="filter-menu">
            <summary>
              <ListFilter size={16} />
              <span>{props.filterLabel || "Filters"}</span>
              <strong>{activeFilters.length ? activeFilters.length : "Any"}</strong>
            </summary>
            <div className="filter-panel" role="group" aria-label={props.filterLabel || "Filters"}>
              {filterChoices.map((value) => (
                <label key={value} className="filter-option">
                  <input type="checkbox" checked={activeFilters.includes(value)} onChange={() => toggleFilter(value)} />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </details>
        ) : null}
      </section>
      {activeFilters.length ? (
        <div className="active-filters" aria-label="Active filters">
          {activeFilters.map((value) => (
            <button key={value} type="button" onClick={() => toggleFilter(value)}>
              {value}
              <X size={13} />
            </button>
          ))}
          <button className="clear-filters" type="button" onClick={() => setActiveFilters([])}>
            Clear all
          </button>
        </div>
      ) : null}
      <div className="result-count">
        {visible.length} result{visible.length === 1 ? "" : "s"}
        {activeFilters.length ? ` matching ${activeFilters.join(" + ")}` : ""}
        {visible.length > rendered.length ? ` - showing first ${rendered.length}; search or filter to narrow` : ""}
      </div>
      <section className="split-view">
        <div className="browse-list">
          {rendered.map((item) => {
            const id = props.getId(item);
            return (
              <a key={id} className="list-link" href={href(props.section, id)}>
                {props.renderCard(item, selected && props.getId(selected) === id)}
              </a>
            );
          })}
          {!rendered.length ? <EmptyState text={props.emptyText || "No records match the current search."} /> : null}
        </div>
        <section className="detail-pane">{selected ? props.renderDetail(selected) : <EmptyState text="No record selected." />}</section>
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty">
      <strong>{text}</strong>
    </div>
  );
}

function browserSearchRank<T extends Record<string, any>>(item: T, query: string, getId: (item: T) => string): number {
  const q = normalize(query).trim();
  const name = normalize(item.name || item.title || item.label || "");
  const id = normalize(getId(item)).replace(/^item_/, "");
  const words = name.split(/[^a-z0-9]+/).filter(Boolean);
  const idWords = id.split(/[^a-z0-9]+/).filter(Boolean);
  if (name === q || id === q) return 0;
  if (name.startsWith(q)) return 1;
  if (words.includes(q)) return 2;
  if (idWords.includes(q)) return 3;
  if (name.includes(q) || id.includes(q)) return 4;
  return 9;
}

function PokemonPage({ data, indexes, route }: { data: ExplorerData; indexes: Indexes; route: Route }) {
  const pokemonItems = useMemo(
    () => data.pokemon.map((item) => ({ ...item, name: displayPokemonName(item.name, item.id), searchName: displayPokemonName(item.name, item.id) })),
    [data.pokemon]
  );
  const filters = ["All", ...TYPE_COLORS_KEYS(), "Wild", "Static/Gift", "Evolution-only", "Has egg moves"];
  return (
    <BrowserPage<Pokemon>
      title="Pokemon"
      section="pokemon"
      route={route}
      items={pokemonItems}
      getId={(item) => item.id}
      searchKeys={["name", "searchName", "id", "types", "abilities.name", "eggGroups", "availability.summary", "scopeStatus"]}
      filters={filters}
      filterFn={(item, filter) =>
        item.types.includes(filter) ||
        (filter === "Wild" && item.availability.wildCount > 0) ||
        (filter === "Static/Gift" && item.availability.staticGiftCount > 0) ||
        (filter === "Evolution-only" && normalize(item.availability.summary).includes("evolution-only")) ||
        (filter === "Has egg moves" && item.learnsets.egg.length > 0)
      }
      sorters={{
        "Dex #": (a, b) => a.dexNo - b.dexNo,
        Name: (a, b) => a.name.localeCompare(b.name),
        BST: (a, b) => b.bst - a.bst
      }}
      renderCard={(item, selected) => (
        <CardShell selected={selected}>
          <AssetImage src={item.assets.icon} label={item.name} />
          <div className="card-main">
            <strong>#{item.dexNo} {item.name}</strong>
            <TypeRow types={item.types} />
            <small>{item.availability.summary}</small>
          </div>
          <span className="bst-chip">BST {item.bst}</span>
        </CardShell>
      )}
      renderDetail={(item) => <PokemonDetail pokemon={item} indexes={indexes} />}
    />
  );
}

function PokemonDetail({ pokemon, indexes }: { pokemon: Pokemon; indexes: Indexes }) {
  const encounterRows = pokemon.encounters.map((id) => indexes.encounters.get(id)).filter(Boolean);
  const pokemonName = displayPokemonName(pokemon.name, pokemon.id);
  return (
    <div className="detail-stack pokemon-profile">
      <header className="profile-header pokemon-hero">
        <div className="sprite-well">
          <AssetImage src={pokemon.assets.sprite || pokemon.assets.icon} label={pokemonName} size="large" />
        </div>
        <div className="profile-copy">
          <p className="eyebrow">Pokemon #{pokemon.dexNo}</p>
          <h2>{pokemonName}</h2>
          <TypeRow types={pokemon.types} />
          <p>{pokemon.availability.summary}</p>
        </div>
      </header>
      <Section title="Base Stats">
        <div className="stat-grid">
          {Object.entries(pokemon.baseStats).map(([key, value]) => (
            <StatLine key={key} label={STAT_LABELS[key] || readableLabel(key)} value={value} max={180} />
          ))}
          <StatLine label="BST" value={pokemon.bst} max={720} accent />
        </div>
      </Section>
      <Section title="Abilities">
        <div className="pill-row">
          {pokemon.abilities.length ? pokemon.abilities.map((ability) => {
            const abilityDetail = indexes.abilities.get(ability.id);
            return (
              <PopupPill key={ability.id + ability.slot} label={`${ability.name} ${readableAbilitySlot(ability.slot)}`}>
                <strong>{ability.name}</strong>
                <p>{abilityDetail?.description || "No description available."}</p>
              </PopupPill>
            );
          }) : <Muted>None exported</Muted>}
        </div>
      </Section>
      <Section title="Breeding">
        <div className="pill-row">
          {pokemon.eggGroups.length ? [...new Set(pokemon.eggGroups)].map((group, index) => <Pill key={`${group}-${index}`}>{group}</Pill>) : <Muted>No egg group exported.</Muted>}
        </div>
      </Section>
      <Section title="Type Matchups">
        <WeaknessTable types={pokemon.types} />
      </Section>
      <Section title="Evolution">
        <EvolutionRows rows={[...pokemon.evolvesFrom, ...pokemon.evolvesTo]} current={pokemon.id} />
      </Section>
      <Section title="Learnsets">
        <LearnsetBlock title="Level-up" rows={pokemon.learnsets.level} moves={indexes.moves} />
        <MoveChipList title="Machine" rows={pokemon.learnsets.machine} moves={indexes.moves} />
        <MoveChipList title="Tutor" rows={pokemon.learnsets.tutor} moves={indexes.moves} />
        <MoveChipList title="Egg" rows={pokemon.learnsets.egg} moves={indexes.moves} />
      </Section>
      <Section title="Where To Get It">
        <EncounterMiniList rows={encounterRows.slice(0, 40)} />
        {pokemon.staticsGifts.map((id) => {
          const entry = indexes.encounters.get(id);
          return entry ? <div key={id}>{entry.location}</div> : null;
        })}
      </Section>
      <ValidationFlags flags={pokemon.validationFlags} />
    </div>
  );
}

function MovesPage({ data, route }: { data: ExplorerData; indexes: Indexes; route: Route }) {
  const filters = ["All", ...TYPE_COLORS_KEYS(), ...unique(data.moves.map((move) => move.category))];
  return (
    <BrowserPage<Move>
      title="Moves"
      section="moves"
      route={route}
      items={data.moves}
      getId={(item) => item.id}
      searchKeys={["name", "id", "type", "category", "description", "effect", "effectSummary", "flags", "learners.pokemonName"]}
      filters={filters}
      filterFn={(item, filter) => item.type === filter || item.category === filter}
      sorters={{
        Name: (a, b) => a.name.localeCompare(b.name),
        Power: (a, b) => (b.power || 0) - (a.power || 0),
        Learners: (a, b) => b.learners.length - a.learners.length
      }}
      renderCard={(item, selected) => (
        <CardShell selected={selected} className="move-record-card">
          <MoveBadge move={item} />
          <div className="card-main">
            <strong>{item.name}</strong>
            <small>{item.category} - {compactNumber(item.power)} pow - {item.learners.length} learners</small>
          </div>
        </CardShell>
      )}
      renderDetail={(item) => <MoveDetail move={item} />}
    />
  );
}

function MoveDetail({ move }: { move: Move }) {
  return (
    <div className="detail-stack">
      <header className="profile-header compact">
        <MoveBadge move={move} />
        <div>
          <p className="eyebrow">{move.category} - {move.target}</p>
          <h2>{move.name}</h2>
        </div>
      </header>
      <div className="metric-row">
        <Metric label="Category" value={move.category} />
        <Metric label="Power" value={compactNumber(move.power)} />
        <Metric label="Accuracy" value={move.accuracy ? `${move.accuracy}%` : "-"} />
        <Metric label="PP" value={compactNumber(move.pp)} />
        <Metric label="Priority" value={move.priority} />
      </div>
      <Section title="Effect">
        <p>{move.effectSummary || readableLabel(move.effect)}</p>
        <p>{cleanDescription(move.description) || "Description missing from source data."}</p>
      </Section>
      <Section title="Flags">
        <div className="pill-row">{move.flags.length ? move.flags.map((flag) => <Pill key={flag}>{readableLabel(flag)}</Pill>) : <Muted>No flags exported.</Muted>}</div>
      </Section>
      <Section title="Learners">
        <GroupedLearners learners={move.learners} />
      </Section>
      <ValidationFlags flags={move.validationFlags || []} />
    </div>
  );
}

function AbilitiesPage({ data, route }: { data: ExplorerData; indexes: Indexes; route: Route }) {
  return (
    <BrowserPage<any>
      title="Abilities"
      section="abilities"
      route={route}
      items={data.abilities}
      getId={(item) => item.id}
      searchKeys={["name", "id", "description", "pokemon.name", "pokemon.types"]}
      filters={["All", "Has Pokemon", "No Pokemon", "Missing description"]}
      filterFn={(item, filter) => (filter === "Has Pokemon" ? item.pokemon.length > 0 : filter === "No Pokemon" ? item.pokemon.length === 0 : !item.description)}
      sorters={{
        Name: (a, b) => a.name.localeCompare(b.name),
        Pokemon: (a, b) => b.pokemon.length - a.pokemon.length
      }}
      renderCard={(item, selected) => (
        <CardShell selected={selected}>
          <Shield size={22} />
          <div className="card-main">
            <strong>{item.name}</strong>
            <small>{item.pokemon.length} Pokemon - {item.description || "Description missing"}</small>
          </div>
        </CardShell>
      )}
      renderDetail={(item) => <AbilityDetail ability={item} />}
    />
  );
}

function AbilityDetail({ ability }: { ability: any }) {
  return (
    <div className="detail-stack">
      <h2>{ability.name}</h2>
      <Section title="Description">
        <p>{ability.description || "Description missing from source text."}</p>
      </Section>
      <Section title="Pokemon">
        <div className="entity-grid">
          {ability.pokemon.map((mon: any) => (
            <LinkCard key={`${mon.id}-${mon.slot}`} className="ability-pokemon-card" section="pokemon" id={mon.id}>
              <AssetImage src={mon.icon} label={displayPokemonName(mon.name, mon.id)} />
              <span className="ability-card-body">
                <strong>{displayPokemonName(mon.name, mon.id)}</strong>
                <TypeRow types={mon.types} />
                <small>{readableAbilitySlot(mon.slot)}</small>
              </span>
            </LinkCard>
          ))}
          {!ability.pokemon.length ? <Muted>No Pokemon currently export this ability.</Muted> : null}
        </div>
      </Section>
      <ValidationFlags flags={ability.validationFlags || []} />
    </div>
  );
}

function ItemsPage({ data, route }: { data: ExplorerData; indexes: Indexes; route: Route }) {
  const items = useMemo(() => data.items.filter(itemIsUseful), [data.items]);
  const filters = ["All", ...unique(items.map((item) => item.pocket)), "Purchased", "Evolution usage", "Missing description"];
  return (
    <BrowserPage<any>
      title="Items"
      section="items"
      route={route}
      items={items}
      getId={(item) => item.id}
      searchKeys={["name", "id", "pocket", "description", "useEffect", "availability.summary", "evolutionUsage.fromName"]}
      filters={filters}
      filterFn={(item, filter) => item.pocket === filter || (filter === "Purchased" && item.availability.marts.length) || (filter === "Evolution usage" && item.evolutionUsage.length) || (filter === "Missing description" && !item.description)}
      sorters={{
        Name: (a, b) => a.name.localeCompare(b.name),
        Price: (a, b) => (b.price || 0) - (a.price || 0),
        "Item #": (a, b) => a.number - b.number
      }}
      renderCard={(item, selected) => (
        <CardShell selected={selected}>
          <AssetImage src={item.asset} label={item.name} />
          <div className="card-main">
            <strong>{item.name}</strong>
            <small>{item.pocket} - {item.availability.summary}</small>
          </div>
        </CardShell>
      )}
      renderDetail={(item) => <ItemDetail item={item} />}
    />
  );
}

function ItemDetail({ item }: { item: any }) {
  return (
    <div className="detail-stack">
      <header className="profile-header compact">
        <AssetImage src={item.asset} label={item.name} size="large" />
        <div>
          <p className="eyebrow">Item #{item.number} - {item.pocket}</p>
          <h2>{item.name}</h2>
          <p>{cleanDescription(item.useEffect) || cleanDescription(item.description) || "No effect text available."}</p>
          {!item.asset ? <p className="muted">Icon asset missing from ROM item graphics.</p> : null}
        </div>
      </header>
      <div className="metric-row">
        <Metric label="Price" value={compactNumber(item.price)} />
        <Metric label="Sell" value={compactNumber(item.sellPrice)} />
        <Metric label="Mart rows" value={item.availability.marts.length} />
      </div>
      <Section title="Availability">
        <p>{item.availability.summary}</p>
        <div className="pill-row">
          {asArray(item.availability.relevanceSources).map((source: string) => <Pill key={source}>{source}</Pill>)}
        </div>
        {item.availability.marts.map((mart: any, index: number) => (
          <div className="info-row" key={index}>
            <strong>{readableMartLocation(mart)}</strong>
            <span>{compactNumber(mart.price)} currency - {mart.requiredBadges ?? "?"} badge(s)</span>
          </div>
        ))}
      </Section>
      <Section title="Trainer Held By">
        <div className="pill-row">
          {asArray(item.availability.trainerHeldBy).slice(0, 40).map((row: any, index: number) => (
            <Pill key={`${row.trainerId}-${row.pokemonName}-${index}`}>{row.trainerName} - {row.pokemonName}</Pill>
          ))}
          {asArray(item.availability.trainerHeldBy).length > 40 ? <Pill>+{asArray(item.availability.trainerHeldBy).length - 40} more</Pill> : null}
          {!asArray(item.availability.trainerHeldBy).length ? <Muted>No trainer held usage exported.</Muted> : null}
        </div>
      </Section>
      <Section title="Evolution Usage">
        <div className="pill-row">
          {item.evolutionUsage.map((evo: any) => (
            <span className="pill" key={`${evo.from}-${evo.to}`}>{displayPokemonName(evo.fromName, evo.from)} {"->"} {displayPokemonName(evo.toName, evo.to)}</span>
          ))}
          {!item.evolutionUsage.length ? <Muted>No evolution usage exported.</Muted> : null}
        </div>
      </Section>
      <Section title="Source Description">
        <p>{cleanDescription(item.description) || "No source description available."}</p>
      </Section>
      <ValidationFlags flags={item.validationFlags || []} />
    </div>
  );
}

type LocationView = {
  id: string;
  name: string;
  region: string;
  mapType: string;
  tags: string[];
  encounterRows: any[];
  trainerRows: any[];
  itemRows: any[];
  eventRows: any[];
  martRows: any[];
  validationFlags: string[];
  searchText: string;
};

type LocationLink = {
  name: string;
  region?: string;
  mapType?: string;
  tag?: string;
  note?: string;
};

const LOCATION_CONTENT_FILTERS = ["Has wild Pokemon", "Has trainers", "Has items", "Has events"];

const TRAINER_LOCATION_BY_NAME: Record<string, string> = {
  Falkner: "Violet City",
  Bugsy: "Azalea Town",
  Whitney: "Goldenrod City",
  Morty: "Ecruteak City",
  Chuck: "Cianwood City",
  Jasmine: "Olivine City",
  Pryce: "Mahogany Town",
  Clair: "Blackthorn City",
  Brock: "Pewter City",
  Misty: "Cerulean City",
  "Lt. Surge": "Vermilion City",
  Erika: "Celadon City",
  Janine: "Fuchsia City",
  Sabrina: "Saffron City",
  Blaine: "Cinnabar Island",
  Blue: "Viridian City",
  Will: "Pokemon League",
  Koga: "Pokemon League",
  Bruno: "Pokemon League",
  Karen: "Pokemon League",
  Lance: "Pokemon League",
  Red: "Saffron Fighting Dojo",
  Steven: "Saffron Fighting Dojo",
  Wallace: "Saffron Fighting Dojo",
  Cynthia: "Saffron Fighting Dojo"
};

function allTrainerRecords(data: ExplorerData): any[] {
  const byKey = new Map<string, any>();
  [...data.trainers, ...data.bossFights].forEach((trainer) => {
    const key = trainerDedupeKey(trainer);
    const existing = byKey.get(key);
    if (!existing || String(trainer.id).startsWith("TRAINER_")) byKey.set(key, trainer);
  });
  return [...byKey.values()];
}

function trainerDedupeKey(trainer: any): string {
  const party = (trainer.party || []).map((member: any) => `${member.species}:${member.level}`).join(",");
  return [trainer.name, trainer.className, trainer.category, trainer.minLevel, trainer.maxLevel, party].join("|");
}

function buildLocationViews(data: ExplorerData, indexes: Indexes): LocationView[] {
  const records = new Map<string, LocationView>();
  const idByName = new Map<string, string>();

  const register = (record: LocationView) => {
    records.set(record.id, record);
    idByName.set(locationNameKey(record.name), record.id);
  };

  data.locations.forEach((location) => {
    const record: LocationView = {
      id: location.id,
      name: readableText(location.name),
      region: readableText(location.region) || "Other",
      mapType: readableText(location.mapType) || "area",
      tags: asArray(location.tags).map(readableText).filter(Boolean),
      encounterRows: asArray(location.encounters).map((id: string) => indexes.encounters.get(id)).filter(Boolean),
      trainerRows: [],
      itemRows: asArray(location.items).map((item: any) => normalizeLocationItem(item, indexes)),
      eventRows: [],
      martRows: [],
      validationFlags: asArray(location.validationFlags),
      searchText: ""
    };
    register(record);
  });

  const ensureLocation = (name: string, seed: Partial<LocationLink> = {}) => {
    const displayName = readableText(name);
    const directId = idByName.get(locationNameKey(displayName));
    if (directId) return records.get(directId)!;

    const fuzzy = findLocationByName(records, displayName);
    if (fuzzy) return fuzzy;

    const id = syntheticLocationId(displayName);
    const existing = records.get(id);
    if (existing) return existing;

    const record: LocationView = {
      id,
      name: displayName,
      region: seed.region || inferLocationRegion(displayName),
      mapType: seed.mapType || inferLocationMapType(displayName),
      tags: seed.tag ? [seed.tag] : [],
      encounterRows: [],
      trainerRows: [],
      itemRows: [],
      eventRows: [],
      martRows: [],
      validationFlags: [],
      searchText: ""
    };
    register(record);
    return record;
  };

  allTrainerRecords(data).forEach((trainer) => {
    const link = inferTrainerLocation(trainer);
    if (!link) return;
    const record = ensureLocation(link.name, link);
    if (!record.trainerRows.some((row) => row.id === trainer.id)) {
      record.trainerRows.push({ ...trainer, locationNote: link.note });
    }
  });

  data.marts.forEach((mart) => {
    const record = ensureLocation(readableMartLocation(mart), {
      region: readableText(mart.region) || "Johto/Kanto",
      mapType: "shop",
      tag: "Items"
    });
    record.martRows.push(mart);
    asArray(mart.items)
      .filter((item: any) => itemIsUseful({ id: item.item, name: item.itemName }))
      .forEach((item: any) => {
        record.itemRows.push({
          itemId: item.item,
          itemName: readableText(item.itemName || readableLabel(item.item)),
          asset: item.asset,
          price: item.price,
          requiredBadges: item.requiredBadges,
          source: readableShopType(mart.shopType),
          note: readableText(mart.unlockRules)
        });
      });
  });

  data.staticsGifts.forEach((event) => {
    const link = inferEventLocation(event);
    const record = ensureLocation(link.name, link);
    if (!record.eventRows.some((row) => row.id === event.id)) {
      record.eventRows.push({
        ...event,
        displayCategory: readableEventCategory(event.category),
        displayLocation: readableText(event.location),
        locationNote: link.note
      });
    }
  });

  records.forEach((record) => {
    record.trainerRows.sort((a, b) => trainerProgressionScore(a) - trainerProgressionScore(b) || (a.minLevel || 0) - (b.minLevel || 0) || a.name.localeCompare(b.name));
    record.itemRows.sort((a, b) => (a.requiredBadges ?? 99) - (b.requiredBadges ?? 99) || a.itemName.localeCompare(b.itemName));
    record.eventRows.sort((a, b) => (a.level || 0) - (b.level || 0) || displayPokemonName(a.pokemonName, a.species).localeCompare(displayPokemonName(b.pokemonName, b.species)));
    record.searchText = [
      record.name,
      record.region,
      record.mapType,
      ...record.tags,
      ...record.encounterRows.flatMap((row) => [row.pokemonName, row.species, row.method, row.rarity, ...(row.types || [])]),
      ...record.trainerRows.flatMap((trainer) => [trainer.name, trainer.className, trainer.category]),
      ...record.itemRows.flatMap((item) => [item.itemName, item.source]),
      ...record.eventRows.flatMap((event) => [event.pokemonName, event.category, event.requirements])
    ].join(" ");
  });

  return [...records.values()];
}

function asArray<T = any>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function readableText(value: unknown): string {
  return cleanDescription(value)
    .replace(/Pok\S*(?=\s+Ball\b)/g, "Poke")
    .replace(/dossiers?/gi, "special encounter")
    .replace(/stationary scripted Dojo special encounter/gi, "Dojo special encounter")
    .replace(/statics? & gifts?/gi, "events")
    .replace(/statics?\/gifts?/gi, "events");
}

function readableEventCategory(value: unknown): string {
  const text = readableText(value);
  if (normalize(text) === "roaming") return "Roaming Pokemon";
  return text || "Event";
}

function readableMartLocation(mart: any): string {
  const location = readableText(mart.location);
  if (normalize(location) === "badge-gated standard mart") {
    return "Customization and Evolution Shop";
  }
  return location || "Shop";
}

function readableShopType(value: unknown): string {
  const text = readableText(value);
  if (normalize(text) === "badge-gated standard mart") return "Standard mart stock";
  if (normalize(text).includes("customization and evolution economy")) return "Customization and evolution stock";
  return text || "Shop stock";
}

function normalizeLocationItem(item: any, indexes: Indexes) {
  const itemId = item.itemId || item.item || item.id;
  const exported = itemId ? indexes.items.get(itemId) : undefined;
  return {
    itemId,
    itemName: readableText(item.itemName || item.name || exported?.name || readableLabel(itemId)),
    asset: item.asset || exported?.asset,
    price: item.price,
    requiredBadges: item.requiredBadges,
    source: readableText(item.source || item.method || item.kind || "Location item"),
    note: readableText(item.note || item.requirements || item.description || "")
  };
}

function locationNameKey(name: string): string {
  return normalize(name).replace(/[.']/g, "").replace(/\s+/g, " ").trim();
}

function syntheticLocationId(name: string): string {
  const slug = locationNameKey(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `location-${slug || "unknown"}`;
}

function findLocationByName(records: Map<string, LocationView>, name: string): LocationView | undefined {
  const key = locationNameKey(name);
  if (!key) return undefined;
  return [...records.values()].find((record) => {
    const recordKey = locationNameKey(record.name);
    return recordKey === key || recordKey.startsWith(`${key} `);
  });
}

function inferLocationRegion(name: string): string {
  if (/saffron|cerulean|vermilion|celadon|fuchsia|pewter|cinnabar|viridian|pallet|power plant|seafoam|faraway|embedded tower/i.test(name)) return "Kanto";
  if (/pokemon league|victory road/i.test(name)) return "Other";
  if (/violet|azalea|goldenrod|ecruteak|olivine|cianwood|mahogany|blackthorn|burned tower|ilex|slowpoke|rocket|radio tower|tohjo|battle frontier|new bark/i.test(name)) return "Johto";
  return "Other";
}

function inferLocationMapType(name: string): string {
  if (/mart|shop/i.test(name)) return "shop";
  if (/city|town|dojo|league|frontier/i.test(name)) return "town";
  if (/^route\s+\d+/i.test(name)) return "route";
  if (/cave|tower|forest|island|well|den|tunnel|falls|path|hideout/i.test(name)) return "dungeon";
  return "area";
}

function inferTrainerLocation(trainer: any): LocationLink | null {
  const explicit = readableText(trainer.location);
  if (explicit && normalize(explicit) !== "unknown") {
    return { name: explicit, region: readableText(trainer.region) || inferLocationRegion(explicit), note: "Listed location" };
  }

  const name = String(trainer.name || "");
  const category = normalize(trainer.category);
  const className = normalize(trainer.className);
  const progression = normalize(trainer.progression);

  if (progression.includes("saffron fighting dojo") || category.includes("champion circuit")) {
    return { name: "Saffron Fighting Dojo", region: "Kanto", mapType: "town", tag: "Postgame" };
  }
  if (/rocket|executive/.test(className) || name === "Giovanni") return inferRocketLocation(trainer);
  if (["Palmer", "Argenta", "Thorton", "Dahlia", "Darach"].includes(name)) {
    return { name: "Battle Frontier", region: "Johto", mapType: "town", tag: "Postgame" };
  }
  if (category.includes("gym leader")) {
    const location = TRAINER_LOCATION_BY_NAME[name];
    return location ? { name: location, region: inferLocationRegion(location), mapType: "town" } : null;
  }
  if (category.includes("rival") && name === "Silver") return inferSilverLocation(trainer);
  if (category.includes("elite four") || category === "champion" || progression.includes("pokemon league") || progression.includes("champion battle")) {
    return { name: "Pokemon League", region: "Other", mapType: "area" };
  }
  return null;
}

function inferSilverLocation(trainer: any): LocationLink {
  const maxLevel = Number(trainer.maxLevel ?? trainer.minLevel ?? 0);
  if (maxLevel <= 5) return { name: "New Bark Town", region: "Johto", mapType: "town", note: "Rival starter battle" };
  if (maxLevel <= 18) return { name: "Azalea Town", region: "Johto", mapType: "town", note: "Rival battle" };
  if (maxLevel <= 22) return { name: "Burned Tower 1F", region: "Johto", mapType: "dungeon", note: "Rival battle" };
  if (maxLevel <= 36) return { name: "Goldenrod Underground", region: "Johto", mapType: "dungeon", note: "Rival battle" };
  if (maxLevel <= 52) return { name: "Victory Road 2F", region: "Other", mapType: "dungeon", note: "Rival battle" };
  return { name: "Pokemon League", region: "Other", mapType: "area", note: "Rival rematch" };
}

function inferRocketLocation(trainer: any): LocationLink {
  const maxLevel = Number(trainer.maxLevel ?? trainer.minLevel ?? 0);
  if (trainer.name === "Giovanni") return { name: "Tohjo Falls", region: "Johto", mapType: "dungeon", tag: "Postgame" };
  if (maxLevel <= 16) return { name: "Slowpoke Well 1F", region: "Johto", mapType: "dungeon", note: "Team Rocket battle" };
  if (maxLevel <= 27) return { name: "Rocket Hideout", region: "Johto", mapType: "dungeon", note: "Team Rocket battle" };
  return { name: "Radio Tower", region: "Johto", mapType: "dungeon", note: "Team Rocket battle" };
}

function inferEventLocation(event: any): LocationLink {
  const source = readableText(event.location);
  if (/burned tower/i.test(source)) return { name: "Burned Tower 1F", region: "Johto", mapType: "dungeon", note: "Roamer release" };
  if (/saffron fighting dojo/i.test(source)) return { name: "Saffron Fighting Dojo", region: "Kanto", mapType: "town", tag: "Postgame" };
  if (/seafoam/i.test(source)) return { name: "Seafoam Islands 1F", region: "Kanto", mapType: "dungeon" };
  if (/power plant/i.test(source)) return { name: "Power Plant", region: "Kanto", mapType: "area" };
  if (/mt\.? silver/i.test(source)) return { name: "Mt. Silver Moltres Room", region: "Johto", mapType: "area" };
  if (/cerulean cave/i.test(source)) return { name: "Cerulean Cave 1F", region: "Kanto", mapType: "dungeon" };
  if (/whirl islands/i.test(source)) return { name: "Whirl Islands B2F", region: "Johto", mapType: "dungeon" };
  if (/bell tower/i.test(source)) return { name: "Bell Tower 10F", region: "Johto", mapType: "dungeon" };
  return { name: source || "Special Events", region: readableText(event.region) || "Other", mapType: "area", tag: "Events" };
}

function locationMetric(location: LocationView, filter: string): number {
  if (filter === "Has wild Pokemon") return location.encounterRows.length;
  if (filter === "Has trainers") return location.trainerRows.length;
  if (filter === "Has items") return location.itemRows.length;
  if (filter === "Has events") return location.eventRows.length;
  return 0;
}

function locationTotal(location: LocationView): number {
  return location.encounterRows.length + location.trainerRows.length + location.itemRows.length + location.eventRows.length;
}

function LocationMetricBadges({ location }: { location: LocationView }) {
  const badges = [
    ["Wild", location.encounterRows.length],
    ["Trainers", location.trainerRows.length],
    ["Items", location.itemRows.length],
    ["Events", location.eventRows.length]
  ].filter(([, count]) => Number(count) > 0);
  if (!badges.length) return null;
  return (
    <span className="location-metrics">
      {badges.map(([label, count]) => (
        <span className="location-metric" key={label}>
          {label} <strong>{count}</strong>
        </span>
      ))}
    </span>
  );
}

function EncounterGroups({ rows }: { rows: any[] }) {
  if (!rows.length) return <Muted>No wild encounter rows exported.</Muted>;
  const groups = groupBy(rows, (row) => row.method || "Wild");
  return (
    <div className="encounter-groups">
      {Object.entries(groups).map(([method, group]) => {
        const splitByTime = shouldSplitEncounterTime(group);
        return (
          <div className="encounter-group" key={method}>
            <h4>{method}</h4>
            {splitByTime ? (
              <div className="encounter-time-grid">
                {["Day", "Night"].map((time) => {
                  const timeRows = group.filter((row) => encounterMatchesTime(row, time)).map((row) => ({ ...row, time }));
                  return (
                    <div className="encounter-time-panel" key={`${method}-${time}`}>
                      <h5>{time}</h5>
                      <LocationEncounterList rows={aggregateEncounterRows(timeRows)} compact />
                    </div>
                  );
                })}
              </div>
            ) : (
              <LocationEncounterList rows={aggregateEncounterRows(group)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function shouldSplitEncounterTime(rows: any[]): boolean {
  const times = new Set(rows.flatMap((row) => String(row.time || "").split("/").map((item) => item.trim()).filter(Boolean)));
  return times.has("Day") || times.has("Night");
}

function encounterMatchesTime(row: any, time: string): boolean {
  const tokens = new Set(String(row.time || "Any").split("/").map((item) => item.trim()));
  if (time === "Day") return tokens.has("Day") || tokens.has("Morning") || tokens.has("All day") || tokens.has("Any");
  if (time === "Night") return tokens.has("Night") || tokens.has("All day") || tokens.has("Any");
  return tokens.has(time);
}

type AggregatedEncounter = {
  id: string;
  species: string;
  pokemonName: string;
  pokemonIcon?: string | null;
  method: string;
  time: string;
  minLevel: number | null;
  maxLevel: number | null;
  chance: number | null;
  firstIndex: number;
};

function aggregateEncounterRows(rows: any[]): AggregatedEncounter[] {
  const bySlot = new Map<string, AggregatedEncounter>();
  rows.forEach((row, index) => {
    const species = row.species || row.pokemonName || "unknown";
    const time = row.time || "Any";
    const key = `${species}|${time}`;
    const minLevel = Number(row.minLevel ?? row.level ?? row.maxLevel);
    const maxLevel = Number(row.maxLevel ?? row.level ?? row.minLevel);
    const chance = Number(row.chance);
    const existing = bySlot.get(key);
    if (!existing) {
      bySlot.set(key, {
        id: row.id || `${species}-${time}`,
        species,
        pokemonName: row.pokemonName,
        pokemonIcon: row.pokemonIcon,
        method: row.method || "Wild",
        time,
        minLevel: Number.isFinite(minLevel) ? minLevel : null,
        maxLevel: Number.isFinite(maxLevel) ? maxLevel : null,
        chance: Number.isFinite(chance) ? chance : null,
        firstIndex: index
      });
      return;
    }
    if (Number.isFinite(minLevel)) existing.minLevel = existing.minLevel === null ? minLevel : Math.min(existing.minLevel, minLevel);
    if (Number.isFinite(maxLevel)) existing.maxLevel = existing.maxLevel === null ? maxLevel : Math.max(existing.maxLevel, maxLevel);
    if (Number.isFinite(chance)) existing.chance = (existing.chance ?? 0) + chance;
  });
  return [...bySlot.values()].sort((a, b) => a.firstIndex - b.firstIndex);
}

function encounterChanceLabel(chance: number | null): string {
  if (chance === null || !Number.isFinite(chance)) return "?";
  const rounded = Math.round(chance * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

function LocationEncounterList({ rows, compact = false }: { rows: any[]; compact?: boolean }) {
  if (!rows.length) return <Muted>No encounters for this time.</Muted>;
  return (
    <div className="compact-table">
      {rows.map((row) => (
        <a key={row.id} className={`compact-row ${compact ? "is-encounter-compact" : ""}`} href={href("pokemon", row.species)}>
          <AssetImage src={row.pokemonIcon} label={displayPokemonName(row.pokemonName, row.species)} />
          <strong>{displayPokemonName(row.pokemonName, row.species)}</strong>
          {compact ? null : <span>{row.method}</span>}
          {compact ? null : <span>{row.time}</span>}
          <span>{levelRange(row)}</span>
          <span>{encounterChanceLabel(row.chance)}</span>
        </a>
      ))}
    </div>
  );
}

function LocationTrainerList({ trainers }: { trainers: any[] }) {
  if (!trainers.length) return <Muted>No trainer parties linked to this location yet.</Muted>;
  return (
    <div className="location-card-list">
      {trainers.map((trainer) => (
        <a className="location-trainer-card" href={href("trainers", trainer.id)} key={trainer.id}>
          <TrainerAvatar trainer={trainer} />
          <div>
            <strong>{trainer.className} {trainer.name}</strong>
            <small>{trainer.category} - Lv. {trainer.minLevel ?? "?"}-{trainer.maxLevel ?? "?"}{trainer.locationNote ? ` - ${trainer.locationNote}` : ""}</small>
            <div className="location-party-strip">
              {asArray(trainer.party).slice(0, 6).map((member: any, index: number) => (
                <span key={`${trainer.id}-${member.species}-${index}`}>
                  <AssetImage src={member.pokemonIcon} label={displayPokemonName(member.pokemonName, member.species)} />
                  <span>Lv. {member.level ?? "?"}</span>
                </span>
              ))}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function LocationItemList({ items }: { items: any[] }) {
  if (!items.length) return <Muted>No item or shop rows linked to this location yet.</Muted>;
  return (
    <div className="shop-grid">
      {items.slice(0, 120).map((item, index) => (
        <LinkCard key={`${item.itemId}-${item.requiredBadges ?? "field"}-${index}`} section="items" id={item.itemId}>
          <AssetImage src={item.asset} label={item.itemName} />
          <span>{item.itemName}</span>
          <small>
            {item.source}
            {item.price !== undefined ? ` - ${compactNumber(item.price)}` : ""}
            {item.requiredBadges !== undefined ? ` - ${item.requiredBadges} badge(s)` : ""}
          </small>
        </LinkCard>
      ))}
      {items.length > 120 ? <Muted>+{items.length - 120} more item rows.</Muted> : null}
    </div>
  );
}

function LocationEventList({ events }: { events: any[] }) {
  if (!events.length) return <Muted>No events linked to this location yet.</Muted>;
  return (
    <div className="entity-grid">
      {events.map((event) => (
        <LinkCard key={event.id} section="statics" id={event.id}>
          <AssetImage src={event.pokemonIcon} label={displayPokemonName(event.pokemonName, event.species)} />
          <span>{displayPokemonName(event.pokemonName, event.species)}</span>
          <small>{event.displayCategory} - Lv. {compactNumber(event.level, "?")}{event.locationNote ? ` - ${event.locationNote}` : ""}</small>
        </LinkCard>
      ))}
    </div>
  );
}

function LocationsPage({ data, indexes, route }: { data: ExplorerData; indexes: Indexes; route: Route }) {
  const locations = useMemo(() => buildLocationViews(data, indexes), [data, indexes]);
  const filters = ["All", "Johto", "Kanto", "Other", "route", "dungeon", "town", "shop", "Postgame", ...LOCATION_CONTENT_FILTERS];
  return (
    <BrowserPage<LocationView>
      title="Locations"
      section="locations"
      route={route}
      items={locations}
      getId={(item) => item.id}
      searchKeys={["name", "id", "region", "mapType", "tags", "searchText"]}
      filters={filters}
      filterLabel="Location filters"
      filterFn={(item, filter) =>
        item.region === filter ||
        item.mapType === filter ||
        item.tags.includes(filter) ||
        (filter === "Postgame" && (progressionScore(item.name, item.region) >= 50 || normalize(item.name).includes("saffron fighting dojo"))) ||
        locationMetric(item, filter) > 0
      }
      sorters={{
        Progression: (a, b) => progressionScore(a.name, a.region) - progressionScore(b.name, b.region) || a.name.localeCompare(b.name),
        Name: (a, b) => a.name.localeCompare(b.name),
        Region: (a, b) => `${a.region}${a.name}`.localeCompare(`${b.region}${b.name}`),
        Content: (a, b) => locationTotal(b) - locationTotal(a) || a.name.localeCompare(b.name)
      }}
      renderCard={(item, selected) => (
        <CardShell selected={selected}>
          <MapIcon size={22} />
          <div className="card-main">
            <strong>{item.name}</strong>
            <small>{item.region} - {item.mapType}</small>
            <LocationMetricBadges location={item} />
          </div>
        </CardShell>
      )}
      renderDetail={(item) => <LocationDetail location={item} indexes={indexes} />}
    />
  );
}

function LocationDetail({ location, indexes }: { location: LocationView; indexes: Indexes }) {
  return (
    <div className="detail-stack">
      <header className="profile-header compact">
        <MapIcon size={30} />
        <div>
          <p className="eyebrow">{location.region} location</p>
          <h2>{location.name}</h2>
          <div className="pill-row">
            <Pill>{location.mapType}</Pill>
            {location.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
          </div>
        </div>
      </header>
      <div className="metric-row">
        <Metric label="Region" value={location.region} />
        <Metric label="Map type" value={location.mapType} />
        <Metric label="Wild rows" value={location.encounterRows.length} />
        <Metric label="Trainers" value={location.trainerRows.length} />
        <Metric label="Items" value={location.itemRows.length} />
        <Metric label="Events" value={location.eventRows.length} />
      </div>
      <Section title="Wild Pokemon">
        <EncounterGroups rows={location.encounterRows.slice(0, 120)} />
      </Section>
      <Section title="Trainers">
        <LocationTrainerList trainers={location.trainerRows} />
      </Section>
      <Section title="Items And Shops">
        <LocationItemList items={location.itemRows} />
      </Section>
      <Section title="Events">
        <LocationEventList events={location.eventRows} />
      </Section>
      <ValidationFlags flags={location.validationFlags || []} />
    </div>
  );
}

function EncountersPage({ data, route, rareOnly }: { data: ExplorerData; indexes: Indexes; route: Route; rareOnly: boolean }) {
  const items = rareOnly ? data.encounters.filter((item) => item.rarity !== "Common" || item.tags.includes("pseudo")) : data.encounters;
  const filters = ["All", "Johto", "Kanto", "Very rare", "Rare", "Grass/Cave", "Surf", "Old Rod", "Good Rod", "Super Rod", "pseudo", ...TYPE_COLORS_KEYS()];
  return (
    <BrowserPage<any>
      title={rareOnly ? "Rare Finds" : "Wild Encounters"}
      section={rareOnly ? "rare-finds" : "encounters"}
      route={route}
      items={items}
      getId={(item) => item.id}
      searchKeys={["pokemonName", "species", "locationName", "region", "method", "time", "rarity", "tags", "types", "rareNotes.raw"]}
      filters={filters}
      filterFn={(item, filter) => item.region === filter || item.rarity === filter || item.method === filter || item.tags.includes(normalize(filter)) || item.types.includes(filter)}
      sorters={{
        Progression: (a, b) => progressionScore(a.locationName, a.region) - progressionScore(b.locationName, b.region) || (a.minLevel || 0) - (b.minLevel || 0) || a.pokemonName.localeCompare(b.pokemonName),
        Location: (a, b) => `${progressionScore(a.locationName, a.region)}${a.locationName}${a.method}`.localeCompare(`${progressionScore(b.locationName, b.region)}${b.locationName}${b.method}`),
        Pokemon: (a, b) => displayPokemonName(a.pokemonName, a.species).localeCompare(displayPokemonName(b.pokemonName, b.species)),
        Chance: (a, b) => (a.chance || 99) - (b.chance || 99),
        Level: (a, b) => (a.minLevel || 0) - (b.minLevel || 0)
      }}
      renderCard={(item, selected) => (
        <CardShell selected={selected}>
          <AssetImage src={item.pokemonIcon} label={displayPokemonName(item.pokemonName, item.species)} />
          <div className="card-main">
            <strong>{displayPokemonName(item.pokemonName, item.species)}</strong>
            <small>{item.locationName} - {item.method} - {levelRange(item)} - {item.chance ?? "?"}%</small>
          </div>
          <span className={`rarity ${normalize(item.rarity).replace(" ", "-")}`}>{item.rarity}</span>
        </CardShell>
      )}
      renderDetail={(item) => <EncounterDetail encounter={item} />}
      maxList={650}
    />
  );
}

function EncounterDetail({ encounter }: { encounter: any }) {
  return (
    <div className="detail-stack">
      <header className="profile-header compact">
        <AssetImage src={encounter.pokemonIcon} label={encounter.pokemonName} size="large" />
        <div>
          <p className="eyebrow">{encounter.rarity} encounter</p>
          <h2>{displayPokemonName(encounter.pokemonName, encounter.species)}</h2>
          <TypeRow types={encounter.types} />
        </div>
      </header>
      <div className="metric-row">
        <Metric label="Location" value={encounter.locationName} />
        <Metric label="Region" value={encounter.region} />
        <Metric label="Method" value={encounter.method} />
        <Metric label="Time" value={encounter.time} />
        <Metric label="Chance" value={`${encounter.chance ?? "?"}%`} />
      </div>
      <Section title="Rare Notes">
        {encounter.rareNotes.length ? encounter.rareNotes.map((note: any, index: number) => <p key={index}>{note.note || note.raw}</p>) : <Muted>No rare note attached.</Muted>}
      </Section>
      <div className="pill-row">
        <LinkPill section="pokemon" id={encounter.species}>Pokemon profile</LinkPill>
        <LinkPill section="locations" id={encounter.locationId}>Location</LinkPill>
      </div>
    </div>
  );
}

function TrainersPage({ data, indexes, route, hideSpoilers }: { data: ExplorerData; indexes: Indexes; route: Route; hideSpoilers: boolean }) {
  const trainers = useMemo(() => allTrainerRecords(data), [data]);
  const filters = ["All", ...unique(trainers.map((item) => item.category))];
  return (
    <BrowserPage<any>
      title="Trainers"
      section="trainers"
      route={route}
      items={trainers}
      getId={(item) => item.id}
      searchKeys={["name", "className", "classId", "category", "party.pokemonName", "party.moves.name", "party.abilityName", "party.moveSource", "progression"]}
      filters={filters}
      filterFn={(item, filter) => item.category === filter}
      sorters={{
        Progression: (a, b) => trainerProgressionScore(a) - trainerProgressionScore(b) || (a.minLevel || 0) - (b.minLevel || 0) || a.name.localeCompare(b.name),
        Category: (a, b) => `${a.category}${a.maxLevel || 0}${a.name}`.localeCompare(`${b.category}${b.maxLevel || 0}${b.name}`),
        Name: (a, b) => a.name.localeCompare(b.name),
        Level: (a, b) => (b.maxLevel || 0) - (a.maxLevel || 0)
      }}
      renderCard={(item, selected) => <TrainerCard trainer={item} selected={selected} />}
      renderDetail={(item) => <TrainerDetail trainer={item} hideSpoilers={hideSpoilers} indexes={indexes} />}
    />
  );
}

function BossesPage({ data, indexes, route, hideSpoilers }: { data: ExplorerData; indexes: Indexes; route: Route; hideSpoilers: boolean }) {
  const filters = ["All", ...unique(data.bossFights.map((item) => item.category))];
  return (
    <BrowserPage<any>
      title="Boss Fights"
      section="bosses"
      route={route}
      items={data.bossFights}
      getId={(item) => item.id}
      searchKeys={["name", "className", "category", "party.pokemonName", "party.moves.name", "party.abilityName", "party.moveSource", "progression"]}
      filters={filters}
      filterFn={(item, filter) => item.category === filter}
      sorters={{
        Progression: (a, b) => (a.minLevel || 0) - (b.minLevel || 0),
        Name: (a, b) => a.name.localeCompare(b.name),
        Level: (a, b) => (b.maxLevel || 0) - (a.maxLevel || 0)
      }}
      renderCard={(item, selected) => <TrainerCard trainer={item} selected={selected} />}
      renderDetail={(item) => <BossDetail boss={item} hideSpoilers={hideSpoilers} indexes={indexes} />}
    />
  );
}

function ChampionCircuitPage({ data, indexes, route, hideSpoilers }: { data: ExplorerData; indexes: Indexes; route: Route; hideSpoilers: boolean }) {
  return (
    <BrowserPage<any>
      title="Champion Circuit"
      section="champion-circuit"
      route={route}
      items={data.championCircuit}
      getId={(item) => item.id}
      searchKeys={["name", "className", "party.pokemonName", "party.moves.name", "party.abilityName", "party.moveSource"]}
      filters={["All", "Red", "Blue", "Lance", "Steven", "Wallace", "Cynthia"]}
      filterFn={(item, filter) => item.name === filter}
      sorters={{
        Level: (a, b) => (a.minLevel || 0) - (b.minLevel || 0),
        Name: (a, b) => a.name.localeCompare(b.name)
      }}
      renderCard={(item, selected) => <TrainerCard trainer={item} selected={selected} />}
      renderDetail={(item) => <BossDetail boss={item} hideSpoilers={hideSpoilers} indexes={indexes} circuit />}
    />
  );
}

function TrainerCard({ trainer, selected }: { trainer: any; selected: boolean }) {
  return (
    <CardShell selected={selected}>
      <TrainerAvatar trainer={trainer} />
      <div className="card-main">
        <strong>{trainer.name}</strong>
        <small>{trainer.category} - {trainer.partySize} Pokemon - {trainer.minLevel ?? "?"}-{trainer.maxLevel ?? "?"}</small>
      </div>
    </CardShell>
  );
}

function TrainerAvatar({ trainer }: { trainer: any }) {
  const resolved = assetUrl(trainer.sprite);
  if (resolved) {
    return (
      <span className="trainer-avatar trainer-avatar-image" aria-label={`${trainer.className || trainer.name} sprite`}>
        <img src={resolved} alt="" loading="lazy" />
      </span>
    );
  }
  const initials = `${trainer.className || trainer.name || "T"}`
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span className={`trainer-avatar ${normalize(trainer.category).replace(/\s+/g, "-")}`}>
      <UserRound size={14} />
      <strong>{initials || "TR"}</strong>
    </span>
  );
}

function TrainerDetail({ trainer, hideSpoilers, indexes }: { trainer: any; hideSpoilers: boolean; indexes: Indexes }) {
  return (
    <div className="detail-stack">
      <header className="profile-header compact">
        <TrainerAvatar trainer={trainer} />
        <div>
          <p className="eyebrow">{trainer.className}</p>
          <h2>{trainer.name}</h2>
        </div>
      </header>
      <div className="metric-row">
        <Metric label="Class" value={trainer.className} />
        <Metric label="Category" value={trainer.category} />
        <Metric label="Party" value={trainer.partySize} />
        <Metric label="Levels" value={`${trainer.minLevel ?? "?"}-${trainer.maxLevel ?? "?"}`} />
      </div>
      <SpoilerGate hide={hideSpoilers} label={trainer.category}>
        <PartyGrid party={trainer.party} moves={indexes.moves} abilities={indexes.abilities} />
      </SpoilerGate>
      <ValidationFlags flags={trainer.validationFlags || []} />
    </div>
  );
}

function BossDetail({ boss, hideSpoilers, indexes, circuit = false }: { boss: any; hideSpoilers: boolean; indexes: Indexes; circuit?: boolean }) {
  return (
    <div className="detail-stack">
      <header className="profile-header compact">
        <TrainerAvatar trainer={boss} />
        <div>
          <p className="eyebrow">{boss.className || boss.category}</p>
          <h2>{boss.name}</h2>
        </div>
      </header>
      <p>{circuit ? "Saffron Fighting Dojo Champion Circuit battle." : boss.progression || "Boss encounter."}</p>
      <div className="metric-row">
        <Metric label="Category" value={boss.category} />
        <Metric label="Party" value={boss.partySize} />
        <Metric label="Levels" value={`${boss.minLevel ?? "?"}-${boss.maxLevel ?? "?"}`} />
        <Metric label="Rematch" value={boss.rematch ? "Yes" : "No"} />
      </div>
      <SpoilerGate hide={hideSpoilers} label={boss.category}>
        <PartyGrid party={boss.party} moves={indexes.moves} abilities={indexes.abilities} />
      </SpoilerGate>
      <Section title="Type Coverage">
        <div className="pill-row">{boss.typeCoverage.map((item: any) => <Pill key={item.type}>{item.type} x{item.count}</Pill>)}</div>
        <Muted>{boss.weaknessSummary}</Muted>
      </Section>
      <ValidationFlags flags={boss.validationFlags || []} />
    </div>
  );
}

function StaticsPage({ data, route, hideSpoilers }: { data: ExplorerData; indexes: Indexes; route: Route; hideSpoilers: boolean }) {
  return <StaticBrowser title="Events" section="statics" items={data.staticsGifts} route={route} hideSpoilers={hideSpoilers} />;
}

function DossiersPage({ data, route, hideSpoilers }: { data: ExplorerData; indexes: Indexes; route: Route; hideSpoilers: boolean }) {
  return <StaticBrowser title="Legendary/Mythical Dossiers" section="dossiers" items={data.legendaryDossiers} route={route} hideSpoilers={hideSpoilers} />;
}

function StaticBrowser({ title, section, items, route, hideSpoilers }: { title: string; section: string; items: any[]; route: Route; hideSpoilers: boolean }) {
  const filters = ["All", "Johto", "Kanto", "Other", ...unique(items.map((item) => item.category))];
  return (
    <BrowserPage<any>
      title={title}
      section={section}
      route={route}
      items={items}
      getId={(item) => item.id}
      searchKeys={["pokemonName", "species", "location", "region", "category", "requirements", "caughtFlag"]}
      filters={filters}
      filterFn={(item, filter) => item.region === filter || item.category === filter}
      sorters={{
        Pokemon: (a, b) => a.pokemonName.localeCompare(b.pokemonName),
        Region: (a, b) => `${a.region}${a.location}`.localeCompare(`${b.region}${b.location}`),
        Level: (a, b) => (a.level || 0) - (b.level || 0)
      }}
      renderCard={(item, selected) => (
        <CardShell selected={selected}>
          <AssetImage src={item.pokemonIcon} label={displayPokemonName(item.pokemonName, item.species)} />
          <div className="card-main">
            <strong>{displayPokemonName(item.pokemonName, item.species)}</strong>
            <small>{readableEventCategory(item.category)} - {readableText(item.location)} - Lv. {item.level ?? "?"}</small>
          </div>
        </CardShell>
      )}
      renderDetail={(item) => (
        <SpoilerGate hide={hideSpoilers} label={title}>
          <StaticDetail entry={item} />
        </SpoilerGate>
      )}
    />
  );
}

function StaticDetail({ entry }: { entry: any }) {
  return (
    <div className="detail-stack">
      <header className="profile-header compact">
        <AssetImage src={entry.pokemonIcon} label={displayPokemonName(entry.pokemonName, entry.species)} size="large" />
        <div>
          <p className="eyebrow">{readableEventCategory(entry.category)}</p>
          <h2>{displayPokemonName(entry.pokemonName, entry.species)}</h2>
          <TypeRow types={entry.types} />
        </div>
      </header>
      <div className="metric-row">
        <Metric label="Location" value={readableText(entry.location) || "Unknown"} />
        <Metric label="Region" value={entry.region} />
        <Metric label="Level" value={compactNumber(entry.level)} />
        <Metric label="One-time" value={entry.oneTime === null ? "Unknown" : entry.oneTime ? "Yes" : "No"} />
      </div>
      <Section title="Requirements And Flags">
        <p>{entry.requirements || "Requirements missing from exports."}</p>
        <div className="pill-row">
          <Pill>{entry.caughtFlag || "Caught flag unknown"}</Pill>
          <Pill>{entry.retryBehavior || "Retry behavior unknown"}</Pill>
          <Pill>{entry.shinyLock === null ? "Shiny lock unknown" : entry.shinyLock ? "Shiny locked" : "Not shiny locked"}</Pill>
        </div>
      </Section>
      <LinkPill section="pokemon" id={entry.species}>Pokemon profile</LinkPill>
      <ValidationFlags flags={entry.validationFlags || []} />
    </div>
  );
}

function MartsPage({ data, route }: { data: ExplorerData; indexes: Indexes; route: Route }) {
  return (
    <BrowserPage<any>
      title="Marts / Shops"
      section="marts"
      route={route}
      items={data.marts}
      getId={(item) => item.id}
      searchKeys={["location", "shopType", "unlockRules", "items.itemName", "items.requiredBadges"]}
      filters={["All", "Standard mart stock", "Customization and evolution stock"]}
      filterFn={(item, filter) => readableShopType(item.shopType) === filter}
      sorters={{
        Location: (a, b) => a.location.localeCompare(b.location),
        Items: (a, b) => b.items.length - a.items.length
      }}
      renderCard={(item, selected) => (
        <CardShell selected={selected}>
          <ShoppingBag size={22} />
          <div className="card-main">
            <strong>{readableMartLocation(item)}</strong>
            <small>{readableShopType(item.shopType)} - {item.items.length} items</small>
          </div>
        </CardShell>
      )}
      renderDetail={(item) => <MartDetail mart={item} />}
    />
  );
}

function MartDetail({ mart }: { mart: any }) {
  return (
    <div className="detail-stack">
      <h2>{readableMartLocation(mart)}</h2>
      <p>{mart.unlockRules}</p>
      <div className="shop-grid">
        {mart.items.map((item: any) => (
          <LinkCard key={`${item.item}-${item.requiredBadges}`} section="items" id={item.item}>
            <AssetImage src={item.asset} label={item.itemName} />
            <span>{item.itemName}</span>
            <small>{item.price ?? "?"} - {item.requiredBadges ?? "?"} badge(s)</small>
          </LinkCard>
        ))}
      </div>
    </div>
  );
}

function VersionPage({ data }: { data: ExplorerData }) {
  return <VersionSummary version={data.version} />;
}

function VersionSummary({ version }: { version: any }) {
  return (
    <div className="page-stack">
      <section className="band">
        <h2>{version.versionLabel}</h2>
        <div className="metric-row">
          <Metric label="Source updated" value={version.sourceLastUpdated || "Unknown"} />
          <Metric label="Export date" value={version.exportDate} />
        </div>
        <p>{version.exportStatus}</p>
      </section>
      <section className="two-col">
        <div>
          <h3>Completed Systems</h3>
          <ul>{version.completedSystems.map((item: string) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <h3>Known Incomplete Data</h3>
          <ul>{version.knownIncompleteSystems.map((item: string) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>
    </div>
  );
}

function VersionLogPage({ data }: { data: ExplorerData }) {
  return <VersionLogList entries={data.versionLog} />;
}

function VersionLogList({ entries }: { entries: any[] }) {
  return (
    <div className="timeline">
      {entries.map((entry) => (
        <article className="timeline-item" key={entry.phase}>
          <span>{entry.date || "Date in project ledger"}</span>
          <h2>{entry.phase}</h2>
          <ul>{entry.highlights.map((item: string) => <li key={item}>{item}</li>)}</ul>
          <div className="pill-row">{entry.links.map((link: string) => <Pill key={link}>{link}</Pill>)}</div>
        </article>
      ))}
    </div>
  );
}

function ValidationPage({ data }: { data: ExplorerData }) {
  const report = data.validationReport;
  return (
    <div className="page-stack">
      <section className="band">
        <h2>Validation Status: {report.summary.status}</h2>
        <div className="coverage-grid">
          {Object.entries(report.summary.counts).map(([key, value]) => <Metric key={key} label={key} value={String(value)} />)}
        </div>
      </section>
      <section className="band">
        <h2>Asset Coverage</h2>
        <div className="coverage-grid">
          {Object.entries(report.summary.assetCoverage).map(([key, value]) => <Metric key={key} label={key} value={String(value)} />)}
        </div>
      </section>
      <section className="band">
        <h2>Issue Counts</h2>
        <div className="issue-list">
          {Object.entries(report.summary.issueCounts).map(([key, value]) => (
            <div className="info-row" key={key}>
              <strong>{key}</strong>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function CardShell({ selected, children, className = "" }: { selected: boolean; children: ReactNode; className?: string }) {
  return <div className={`record-card ${selected ? "is-selected" : ""} ${className}`.trim()}>{children}</div>;
}

function AssetImage({ src, label, size = "normal" }: { src?: string | null; label: string; size?: "normal" | "large" }) {
  const [failed, setFailed] = useState(false);
  const resolved = !failed ? assetUrl(src) : undefined;
  return resolved ? (
    <span className={`asset-frame ${size}`} aria-label={label}>
      <img className="asset-img" src={resolved} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  ) : (
    <span className={`asset-fallback ${size}`} aria-hidden="true">{label.slice(0, 2).toUpperCase()}</span>
  );
}

function TypeRow({ types }: { types: string[] }) {
  return <div className="type-row">{[...new Set(types.filter(Boolean))].map((type) => <span key={type} className="type-chip" style={{ background: TYPE_COLORS[type] || TYPE_COLORS.Unknown }}>{type}</span>)}</div>;
}

function TYPE_COLORS_KEYS() {
  return Object.keys(TYPE_COLORS).filter((type) => type !== "Unknown");
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="pill">{children}</span>;
}

function LinkPill({ section, id, children }: { section: string; id?: string | number | null; children: ReactNode }) {
  if (!id) return <span className="pill">{children}</span>;
  return <a className="pill pill-link" href={href(section, id)}>{children}</a>;
}

function LinkCard({ section, id, children, className = "" }: { section: string; id?: string | number | null; children: ReactNode; className?: string }) {
  return <a className={`entity-card ${className}`.trim()} href={id ? href(section, id) : "#"}>{children}</a>;
}

function MoveBadge({ move }: { move: Move }) {
  const color = TYPE_COLORS[move.type] || TYPE_COLORS.Unknown;
  return <span className="move-badge" style={{ borderColor: color, background: color, color: "#fff" }}>{move.type}</span>;
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="muted">{children}</span>;
}

function EvolutionRows({ rows, current }: { rows: any[]; current: string }) {
  if (!rows.length) return <Muted>No evolution rows exported.</Muted>;
  return (
    <div className="evo-list">
      {rows.map((row) => (
        <div className="info-row" key={`${row.from}-${row.to}-${row.method}`}>
          <strong>
            <LinkPill section="pokemon" id={row.from}>{displayPokemonName(row.fromName, row.from)}</LinkPill>
            {" -> "}
            <LinkPill section="pokemon" id={row.to}>{displayPokemonName(row.toName, row.to)}</LinkPill>
          </strong>
          <span>{cleanDescription(row.methodReadable) || readableLabel(row.method)}</span>
        </div>
      ))}
    </div>
  );
}

function LearnsetBlock({ title, rows, moves }: { title: string; rows: any[]; moves?: Map<string, Move> }) {
  return (
    <div className="learnset-group">
      <h4>{title}</h4>
      <div className="learnset-grid">
        {rows.slice(0, 80).map((row) => (
          <MovePopupPill key={`${row.level}-${row.moveId}`} moveId={row.moveId} fallbackName={row.moveName} moves={moves} prefix={`Lv. ${row.level}`} />
        ))}
        {!rows.length ? <Muted>No entries exported.</Muted> : null}
      </div>
    </div>
  );
}

function MoveChipList({ title, rows, moves }: { title: string; rows: any[]; moves?: Map<string, Move> }) {
  return (
    <div className="learnset-group">
      <h4>{title}</h4>
      <div className="pill-row">
        {rows.slice(0, 60).map((row) => <MovePopupPill key={`${title}-${row.moveId}`} moveId={row.moveId} fallbackName={row.moveName} moves={moves} />)}
        {rows.length > 60 ? <Pill>+{rows.length - 60} more</Pill> : null}
        {!rows.length ? <Muted>No entries exported.</Muted> : null}
      </div>
    </div>
  );
}

function EncounterMiniList({ rows }: { rows: any[] }) {
  if (!rows.length) return <Muted>No wild encounter rows exported.</Muted>;
  return (
    <div className="compact-table">
      {rows.map((row) => (
        <a key={row.id} className="compact-row" href={href("locations", row.locationId)}>
          <AssetImage src={row.pokemonIcon} label={displayPokemonName(row.pokemonName, row.species)} />
          <strong>{displayPokemonName(row.pokemonName, row.species)}</strong>
          <span>{row.locationName}</span>
          <span>{row.method} {row.time}</span>
          <span>{levelRange(row)}</span>
          <span>{row.chance ?? "?"}%</span>
        </a>
      ))}
    </div>
  );
}

function learnerMethodRank(method: string): number {
  const normalized = normalize(method);
  if (normalized.includes("level")) return 0;
  if (normalized.includes("machine") || normalized === "tm" || normalized === "hm") return 1;
  if (normalized.includes("tutor")) return 2;
  if (normalized.includes("egg")) return 3;
  return 9;
}

function readableLearnerMethod(method: string): string {
  const normalized = normalize(method);
  if (normalized === "level") return "Level Up";
  if (normalized === "machine") return "Machine";
  if (normalized === "egg") return "Egg";
  if (normalized === "tutor") return "Tutor";
  return readableLabel(method);
}

function GroupedLearners({ learners }: { learners: any[] }) {
  if (!learners.length) return <Muted>No learners exported.</Muted>;
  const groups = groupBy(learners, (item) => item.method);
  return (
    <div className="learner-groups">
      {Object.entries(groups).sort(([a], [b]) => learnerMethodRank(a) - learnerMethodRank(b) || readableLearnerMethod(a).localeCompare(readableLearnerMethod(b))).map(([method, rows]) => (
        <div key={method}>
          <h4>{readableLearnerMethod(method)}</h4>
          <div className="entity-grid">
            {[...rows].sort((a, b) => (a.level ?? 999) - (b.level ?? 999) || displayPokemonName(a.pokemonName, a.pokemonId).localeCompare(displayPokemonName(b.pokemonName, b.pokemonId))).slice(0, 60).map((row) => (
              <LinkCard key={`${method}-${row.pokemonId}-${row.level || ""}`} section="pokemon" id={row.pokemonId}>
                <AssetImage src={row.icon} label={displayPokemonName(row.pokemonName, row.pokemonId)} />
                <span>{displayPokemonName(row.pokemonName, row.pokemonId)}</span>
                <small>{row.level ? `Lv. ${row.level}` : readableLearnerMethod(method)}</small>
              </LinkCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AbilityPopupPill({ ability, abilities }: { ability?: any; abilities?: Map<string, any> }) {
  if (!ability) return <Muted>Ability not exported.</Muted>;
  const detail = ability.id ? abilities?.get(ability.id) : undefined;
  const label = ability.name || ability.slotName || "Ability";
  return (
    <PopupPill label={label}>
      <div className="popup-content">
        <strong>{label}</strong>
        <div className="move-preview-meta">
          <span>{ability.slotName || readableAbilitySlot(ability.slot)}</span>
          <span>{ability.source || "Trainer source"}</span>
        </div>
        <p>{detail?.description || (ability.resolved === false ? "Ability slot is present in the trainer source, but no species ability entry resolved for it." : "No ability description available.")}</p>
      </div>
    </PopupPill>
  );
}

function formatStatSpread(values: Record<string, unknown> | null | undefined, emptyText: string): string {
  if (!values || typeof values !== "object") return emptyText;
  const entries = Object.entries(STAT_LABELS)
    .map(([key, label]) => ({ key, label, value: values[key] }))
    .filter((entry) => entry.value !== null && entry.value !== undefined && entry.value !== "");
  if (!entries.length) return emptyText;
  const nonZero = entries.filter((entry) => Number(entry.value) !== 0);
  const shown = nonZero.length ? nonZero : entries;
  return shown.map((entry) => `${entry.label} ${entry.value}`).join(" / ");
}

function ivSummary(member: any): string {
  if (member.ivSummary) return member.ivSummary;
  if (member.setIvs) return formatStatSpread(member.setIvs, "No IV override");
  return formatStatSpread(member.ivs, "No IV setting exported");
}

function evSummary(member: any): string {
  return formatStatSpread(member.evs, member.evSummary || "No explicit EV spread");
}

function PartyMetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="party-meta-row">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

function PartyGrid({ party, moves, abilities }: { party: any[]; moves?: Map<string, Move>; abilities?: Map<string, any> }) {
  if (!party.length) return <Muted>No party data exported.</Muted>;
  return (
    <div className="party-grid">
      {party.map((member, index) => (
        <div className="party-card" key={`${member.species}-${member.level}-${index}`}>
          <div className="party-head">
            <AssetImage src={member.pokemonIcon} label={displayPokemonName(member.pokemonName, member.species)} />
            <div>
              <LinkPill section="pokemon" id={member.species}>{displayPokemonName(member.pokemonName, member.species)}</LinkPill>
              <small>Lv. {member.level ?? "?"}</small>
            </div>
          </div>
          <TypeRow types={member.types || []} />
          <div className="party-meta-grid">
            <PartyMetaRow label="Ability">
              <AbilityPopupPill ability={member.ability} abilities={abilities} />
            </PartyMetaRow>
            <PartyMetaRow label="IVs">{ivSummary(member)}</PartyMetaRow>
            <PartyMetaRow label="EVs">{evSummary(member)}</PartyMetaRow>
            <PartyMetaRow label="Held item">
              {member.itemName ? <LinkPill section="items" id={member.item}>{member.itemName}</LinkPill> : <Muted>None</Muted>}
            </PartyMetaRow>
          </div>
          <small className="party-source-note">Moves: {member.moveSource || "Trainer source"}</small>
          <div className="move-list">
            {asArray(member.moves).length ? asArray(member.moves).map((move: any) => <MovePopupPill key={move.id} moveId={move.id} fallbackName={move.name} moves={moves} />) : <Muted>Moves not exported.</Muted>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpoilerGate({ hide, label, children }: { hide: boolean; label: string; children: ReactNode }) {
  if (!hide) return <>{children}</>;
  return (
    <section className="spoiler-box">
      <EyeOff size={18} />
      <div>
        <strong>{label} hidden</strong>
        <span>Use the spoiler toggle in the header to reveal this content.</span>
      </div>
    </section>
  );
}

function ValidationFlags({ flags }: { flags: string[] }) {
  void flags;
  return null;
}
