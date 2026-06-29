# Pokemon Johto Reforged Explorer

Static React/TypeScript companion wiki for Pokemon Johto Reforged.

The explorer is separate from the ROM hack implementation. It reads live source tables, project docs, and supplemental generated exports from:

```text
C:\Users\jimmy\Documents\pokemon_romhacks\perfect_johto
```

It does not add an interactive explorer to the ROM hack repo and it does not include a type chart page.

## What Is Included

- Overview with feature cards, app-wide search, version tab, concise version log, data coverage, caveats, and quick links.
- Pokemon profiles for Gen 1-4 plus approved later family exceptions only.
- Move, ability, item, location, wild encounter, grouped rare-find, trainer, boss, Champion Circuit, event/gift/trade, legendary event, and mart browsers.
- Hash routes such as `#/pokemon/SPECIES_BULBASAUR` for static hosting.
- Spoiler toggle for boss teams, Champion Circuit, statics/gifts, and dossiers.
- Generated JSON data in `public/data/`.
- Copied sprite/icon assets in `public/assets/`.
- Validation outputs in `public/data/validation_report.json` and `docs/generated/validation_report.md`.

## Project Structure

```text
scripts/build_data.py        Extracts, normalizes, validates, and copies assets
src/                         React/TypeScript app
public/data/                 Generated static JSON files
public/assets/               Generated copied PNG assets
docs/generated/              Generated schema and validation docs
netlify.toml                 Netlify static config
vercel.json                  Vercel static config
```

## Data Pipeline

```powershell
python scripts/build_data.py
```

The script is source-first. For frequently edited gameplay data, the live source files are authoritative even if `exports/perfect_johto` has not been regenerated yet.

Primary live sources:

- `FEATURES_AND_CHANGES.md`
- `docs/phase6_obtainability_report.md`
- `docs/phase7_trainer_report.md`
- `docs/phase8_postgame_report.md`
- `hg-engine-main/hg-engine-main/data/Species.c`
- `hg-engine-main/hg-engine-main/data/Moves.c`
- `hg-engine-main/hg-engine-main/data/Encounters.c`
- `hg-engine-main/hg-engine-main/data/HiddenAbilityTable.c`
- `hg-engine-main/hg-engine-main/data/Evolutions.c`
- `hg-engine-main/hg-engine-main/data/learnsets/learnsets.json`
- `hg-engine-main/hg-engine-main/data/itemdata/itemdata.c`
- `hg-engine-main/hg-engine-main/src/item.c` for TM/HM move labels
- `pokeheartgold-master/files/fielddata/script/scr_seq/*.s`
- `pokeheartgold-master/files/a/1/1/2` NPC trade data
- `pokeheartgold-master/src/scrcmd_fossils.c`
- source text archives and graphics folders

Supplemental generated exports are still read from `exports/perfect_johto/*.json` for systems that are not fully parsed from source yet, such as boss/rematch group metadata, marts/custom shop rows, rare-note annotations, static/dossier rows, postgame/champion-circuit metadata, known risks, and version-supporting reports.

Generated files include `pokemon.json`, `moves.json`, `abilities.json`, `items.json`, `locations.json`, `encounters.json`, `trainers.json`, `boss_fights.json`, `statics_gifts.json`, `legendary_dossiers.json`, `marts.json`, `evolutions.json`, `version.json`, `version_log.json`, `assets_manifest.json`, and `validation_report.json`.

## Encounter Display Notes

- Land encounters are normalized to Day and Night only. If an older export still has a morning field, it is treated as Day for display.
- Location pages split Grass/Cave encounter data into separate Day and Night tables.
- Each Day/Night table aggregates duplicate Pokemon rows, merging the visible level range and summing chance across slots so a species appears once per table.
- Rare Finds groups low-rate encounter slots by Pokemon, so each species appears once with all locations, methods, levels, and chances listed in the detail pane.
- Trainer sprites are copied from the ROM project's assembled trainer graphics (`*_enc.png`) with the keyed background removed and the visible portrait cropped for avatar display.

## Event Display Notes

- `statics_gifts.json` combines the ROM hack static/dossier export with script-derived gifts, eggs, prizes, fossils, loans, and NPC trades from `pokeheartgold-master`.
- NPC trade records include the requested Pokemon, nickname, OT name, held item, ability, and IV spread from `files/a/1/1/2`.
- Legendary event prerequisites are expanded into player-facing notes where the source uses shorthand such as lake trio, creation trio, or Red defeated.

## Item Display Notes

- The item export is player-facing, not a raw HG-Engine item constant dump.
- `items.json` includes only items referenced by exported game data: shop stock, wild held items, trainer held items, evolution methods, and explicit custom systems such as Max Candy.
- Placeholder names, unknown item constants, and unused modern engine filler items are excluded from the item browser.
- Missing item icons are surfaced as validation flags. Regenerating explorer data copies newly added ROM item icons into `public/assets/items/`.

## Development

Use the bundled Node runtime in Codex if system Node is not on PATH.

```powershell
pnpm install
pnpm run data
pnpm run dev
pnpm run build
```

Local dev server:

```text
http://127.0.0.1:5173/
```

## Updating Data

1. If Pokemon stats, typing, regular abilities, hidden abilities, moves, learnsets, or wild encounter tables changed, regenerate explorer data directly from source:

   ```powershell
   python scripts/build_data.py
   ```

   TM/HM learnset labels are read from `hg-engine-main/hg-engine-main/src/item.c` (`sMachineMoves[]`). The app only displays machine learnset rows that map to an actual numbered TM/HM in that table.

2. If a supplemental system changed and only exists in `exports/perfect_johto`, refresh the ROM hack exports, then rerun the explorer generator:

   ```powershell
   cd C:\Users\jimmy\Documents\pokemon_romhacks\perfect_johto
   python tools/perfect_johto/validate_project.py --write
   cd C:\Users\jimmy\Documents\pokemon_romhacks\Pokemon_Johto_Reforged_WebApp
   python scripts/build_data.py
   ```

3. Check validation:

   ```powershell
   pnpm run build
   ```

## Known Limitations

- Trainer map locations are not fully exported by the current ROM hack data.
- Some static event mechanics still rely on script-derived source references when the main `exports/perfect_johto` JSON does not expose a structured row.
- Item descriptions are intentionally missing unless a reliable project source was found.
- Hidden ability data is read directly from `hg-engine-main/hg-engine-main/data/HiddenAbilityTable.c`.
- Shiny lock status is not exported for static/dossier encounters.
- Team weakness summaries are not computed because this app intentionally has no type chart page.

## Deployment

The generated `public/data` and `public/assets` directories are committed/deployed with the app. Netlify and Vercel can run:

```powershell
pnpm run build
```

Publish/output directory:

```text
dist
```

If cloud build machines cannot access the local ROM hack path, regenerate and include `public/data` plus `public/assets` before deploying.
