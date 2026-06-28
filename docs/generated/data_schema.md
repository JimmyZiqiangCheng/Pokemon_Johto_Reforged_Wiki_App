# Data Schema

Generated JSON lives in `public/data/`. Source records are copied from the Pokemon Johto Reforged repo and normalized for static browsing.

- `pokemon.json`: species profile records with stats, typing, abilities, learnsets, evolutions, availability links, and asset references.
- `moves.json`: move records with type/category/power/accuracy/PP/flags/descriptions/effect summaries and linked learners.
- `abilities.json`: ability names/descriptions and linked Pokemon slots.
- `items.json`: item constants, names, prices, pockets, mart availability, held/evolution usage, technical fields, and icons when available.
- `locations.json`: inferred location records linked to encounters and future location-scoped exports.
- `encounters.json`: flattened wild encounter slots with method, time, level range, chance, rarity, Pokemon, and location links.
- `trainers.json`: trainer records with enriched party Pokemon, held items, game-scaled IV spreads plus the raw difficulty byte, explicit EV spreads when present, resolved ability slots, and explicit-or-derived moves.
- `boss_fights.json`: boss-oriented subset linked back to trainer records with the same enriched party structure.
- `statics_gifts.json`: static, roaming, gift, and dossier-style exported encounters.
- `legendary_dossiers.json`: Phase 8 dossier subset with flags/requirements where exported.
- `marts.json`: badge-gated shop exports.
- `evolutions.json`: normalized evolution rows and validation flags.
- `features.json`, `version.json`, `version_log.json`: docs-derived overview and release state.
- `assets_manifest.json`: copied asset coverage summary.
- `validation_report.json`: machine-readable validation output.

Unknown fields are intentionally represented as `null`, empty arrays, or validation flags instead of guessed values.
