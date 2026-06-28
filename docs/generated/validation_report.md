# Pokemon Johto Reforged Explorer Validation Report

Generated: 2026-06-28T08:34:43-07:00
Status: PASS

## Counts

- pokemon: 545
- moves: 955
- abilities: 318
- items: 211
- trainers: 740
- locations: 142
- wildEncounterEntries: 3444
- staticGiftEntries: 35
- martShopCount: 2
- bossFights: 86
- legendaryDossiers: 33

## Asset Coverage

- pokemonWithIcons: 545
- pokemonWithSprites: 545
- trainersWithSprites: 740
- itemsWithIcons: 211
- missingPokemonAssets: 0
- missingTrainerAssets: 740
- missingItemAssets: 0

## Issue Counts

- bossTeamsWithMissingMovesItemsAbilities: 37
- brokenLinks: 0
- itemsMissingDescriptions: 204
- locationsWithNoLinkedContent: 7
- missingItemIcons: 0
- missingPokemonIcons: 0
- movesWithNoDescriptions: 33
- movesWithNoParsedEffects: 676
- pokemonOutsideApprovedScope: 0
- pokemonWithNoAvailability: 19

## Sample Issues

### pokemonWithNoAvailability
- `{"id": "SPECIES_PINECO", "name": "Pineco"}`
- `{"id": "SPECIES_OBSTAGOON", "name": "Obstagoon"}`
- `{"id": "SPECIES_RATICATE_ALOLAN", "name": "-----"}`
- `{"id": "SPECIES_RAICHU_ALOLAN", "name": "-----"}`
- `{"id": "SPECIES_SANDSLASH_ALOLAN", "name": "-----"}`
- `{"id": "SPECIES_NINETALES_ALOLAN", "name": "-----"}`
- `{"id": "SPECIES_DUGTRIO_ALOLAN", "name": "-----"}`
- `{"id": "SPECIES_PERSIAN_ALOLAN", "name": "-----"}`
- `{"id": "SPECIES_GOLEM_ALOLAN", "name": "-----"}`
- `{"id": "SPECIES_MUK_ALOLAN", "name": "-----"}`
- `{"id": "SPECIES_EXEGGUTOR_ALOLAN", "name": "-----"}`
- `{"id": "SPECIES_MAROWAK_ALOLAN", "name": "-----"}`
- `{"id": "SPECIES_RAPIDASH_GALARIAN", "name": "-----"}`
- `{"id": "SPECIES_SLOWBRO_GALARIAN", "name": "-----"}`
- `{"id": "SPECIES_WEEZING_GALARIAN", "name": "-----"}`
- `{"id": "SPECIES_SLOWKING_GALARIAN", "name": "-----"}`
- `{"id": "SPECIES_LINOONE_GALARIAN", "name": "-----"}`
- `{"id": "SPECIES_ARCANINE_HISUIAN", "name": "-----"}`
- `{"id": "SPECIES_ELECTRODE_HISUIAN", "name": "-----"}`

### movesWithNoParsedEffects
- `{"id": "MOVE_POUND", "name": "Pound", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_MEGA_PUNCH", "name": "Mega Punch", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_PAY_DAY", "name": "Pay Day", "effect": "MOVE_EFFECT_INCREASE_PRIZE_MONEY"}`
- `{"id": "MOVE_SCRATCH", "name": "Scratch", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_VICE_GRIP", "name": "Vise Grip", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_RAZOR_WIND", "name": "Razor Wind", "effect": "MOVE_EFFECT_CHARGE_TURN_HIGH_CRIT"}`
- `{"id": "MOVE_CUT", "name": "Cut", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_GUST", "name": "Gust", "effect": "MOVE_EFFECT_DOUBLE_DAMAGE_FLY_OR_BOUNCE"}`
- `{"id": "MOVE_WING_ATTACK", "name": "Wing Attack", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_WHIRLWIND", "name": "Whirlwind", "effect": "MOVE_EFFECT_FORCE_SWITCH"}`
- `{"id": "MOVE_FLY", "name": "Fly", "effect": "MOVE_EFFECT_FLY"}`
- `{"id": "MOVE_BIND", "name": "Bind", "effect": "MOVE_EFFECT_BIND_HIT"}`
- `{"id": "MOVE_SLAM", "name": "Slam", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_VINE_WHIP", "name": "Vine Whip", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_STOMP", "name": "Stomp", "effect": "MOVE_EFFECT_FLINCH_MINIMIZE_DOUBLE_HIT"}`
- `{"id": "MOVE_MEGA_KICK", "name": "Mega Kick", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_JUMP_KICK", "name": "Jump Kick", "effect": "MOVE_EFFECT_CRASH_ON_MISS"}`
- `{"id": "MOVE_HORN_ATTACK", "name": "Horn Attack", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_TACKLE", "name": "Tackle", "effect": "MOVE_EFFECT_HIT"}`
- `{"id": "MOVE_WRAP", "name": "Wrap", "effect": "MOVE_EFFECT_BIND_HIT"}`
- `{"id": "MOVE_THRASH", "name": "Thrash", "effect": "MOVE_EFFECT_CONTINUE_AND_CONFUSE_SELF"}`
- `{"id": "MOVE_TWINEEDLE", "name": "Twineedle", "effect": "MOVE_EFFECT_POISON_MULTI_HIT"}`
- `{"id": "MOVE_ROAR", "name": "Roar", "effect": "MOVE_EFFECT_FORCE_SWITCH"}`
- `{"id": "MOVE_SONIC_BOOM", "name": "Sonic Boom", "effect": "MOVE_EFFECT_10_DAMAGE_FLAT"}`
- `{"id": "MOVE_DISABLE", "name": "Disable", "effect": "MOVE_EFFECT_DISABLE"}`
- ... 651 more

### movesWithNoDescriptions
- `{"id": "MOVE_G_MAX_WILDFIRE", "name": "G Max Wildfire"}`
- `{"id": "MOVE_G_MAX_BEFUDDLE", "name": "G Max Befuddle"}`
- `{"id": "MOVE_G_MAX_VOLT_CRASH", "name": "G Max Volt Crash"}`
- `{"id": "MOVE_G_MAX_GOLD_RUSH", "name": "G Max Gold Rush"}`
- `{"id": "MOVE_G_MAX_CHI_STRIKE", "name": "G Max Chi Strike"}`
- `{"id": "MOVE_G_MAX_TERROR", "name": "G Max Terror"}`
- `{"id": "MOVE_G_MAX_RESONANCE", "name": "G Max Resonance"}`
- `{"id": "MOVE_G_MAX_CUDDLE", "name": "G Max Cuddle"}`
- `{"id": "MOVE_G_MAX_REPLENISH", "name": "G Max Replenish"}`
- `{"id": "MOVE_G_MAX_MALODOR", "name": "G Max Malodor"}`
- `{"id": "MOVE_G_MAX_STONESURGE", "name": "G Max Stonesurge"}`
- `{"id": "MOVE_G_MAX_WIND_RAGE", "name": "G Max Wind Rage"}`
- `{"id": "MOVE_G_MAX_STUN_SHOCK", "name": "G Max Stun Shock"}`
- `{"id": "MOVE_G_MAX_FINALE", "name": "G Max Finale"}`
- `{"id": "MOVE_G_MAX_DEPLETION", "name": "G Max Depletion"}`
- `{"id": "MOVE_G_MAX_GRAVITAS", "name": "G Max Gravitas"}`
- `{"id": "MOVE_G_MAX_VOLCALITH", "name": "G Max Volcalith"}`
- `{"id": "MOVE_G_MAX_SANDBLAST", "name": "G Max Sandblast"}`
- `{"id": "MOVE_G_MAX_SNOOZE", "name": "G Max Snooze"}`
- `{"id": "MOVE_G_MAX_TARTNESS", "name": "G Max Tartness"}`
- `{"id": "MOVE_G_MAX_SWEETNESS", "name": "G Max Sweetness"}`
- `{"id": "MOVE_G_MAX_SMITE", "name": "G Max Smite"}`
- `{"id": "MOVE_G_MAX_STEELSURGE", "name": "G Max Steelsurge"}`
- `{"id": "MOVE_G_MAX_MELTDOWN", "name": "G Max Meltdown"}`
- `{"id": "MOVE_G_MAX_FOAM_BURST", "name": "G Max Foam Burst"}`
- ... 8 more

### itemsMissingDescriptions
- `{"id": "ITEM_ULTRA_BALL", "name": "Ultra Ball"}`
- `{"id": "ITEM_GREAT_BALL", "name": "Great Ball"}`
- `{"id": "ITEM_POKE_BALL", "name": "Poké Ball"}`
- `{"id": "ITEM_POTION", "name": "Potion"}`
- `{"id": "ITEM_ANTIDOTE", "name": "Antidote"}`
- `{"id": "ITEM_BURN_HEAL", "name": "Burn Heal"}`
- `{"id": "ITEM_ICE_HEAL", "name": "Ice Heal"}`
- `{"id": "ITEM_AWAKENING", "name": "Awakening"}`
- `{"id": "ITEM_PARALYZE_HEAL", "name": "Paralyze Heal"}`
- `{"id": "ITEM_FULL_RESTORE", "name": "Full Restore"}`
- `{"id": "ITEM_MAX_POTION", "name": "Max Potion"}`
- `{"id": "ITEM_HYPER_POTION", "name": "Hyper Potion"}`
- `{"id": "ITEM_SUPER_POTION", "name": "Super Potion"}`
- `{"id": "ITEM_FULL_HEAL", "name": "Full Heal"}`
- `{"id": "ITEM_REVIVE", "name": "Revive"}`
- `{"id": "ITEM_MAX_REVIVE", "name": "Max Revive"}`
- `{"id": "ITEM_MOOMOO_MILK", "name": "Moomoo Milk"}`
- `{"id": "ITEM_BERRY_JUICE", "name": "Berry Juice"}`
- `{"id": "ITEM_SACRED_ASH", "name": "Sacred Ash"}`
- `{"id": "ITEM_HP_UP", "name": "HP Up"}`
- `{"id": "ITEM_PROTEIN", "name": "Protein"}`
- `{"id": "ITEM_IRON", "name": "Iron"}`
- `{"id": "ITEM_CARBOS", "name": "Carbos"}`
- `{"id": "ITEM_CALCIUM", "name": "Calcium"}`
- `{"id": "ITEM_ZINC", "name": "Zinc"}`
- ... 179 more

### locationsWithNoLinkedContent
- `{"id": "ENCDATA_UNUSED_045_UNKNOWN_045", "name": "Unused 045 Unknown 045"}`
- `{"id": "ENCDATA_UNUSED_047_UNKNOWN_047", "name": "Unused 047 Unknown 047"}`
- `{"id": "ENCDATA_UNUSED_049_UNKNOWN_049", "name": "Unused 049 Unknown 049"}`
- `{"id": "ENCDATA_UNUSED_050_UNKNOWN_050", "name": "Unused 050 Unknown 050"}`
- `{"id": "ENCDATA_UNUSED_064_UNKNOWN_064", "name": "Unused 064 Unknown 064"}`
- `{"id": "ENCDATA_UNUSED_090_UNKNOWN_090", "name": "Unused 090 Unknown 090"}`
- `{"id": "ENCDATA_UNUSED_138_UNKNOWN_138", "name": "Unused 138 Unknown 138"}`

### bossTeamsWithMissingMovesItemsAbilities
- `{"boss": "Silver", "pokemon": "Gastly", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Zubat", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Bayleef", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Cyndaquil", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Totodile", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Chikorita", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Gastly", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Zubat", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Quilava", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Gastly", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Zubat", "field": "moves"}`
- `{"boss": "Silver", "pokemon": "Croconaw", "field": "moves"}`
- `{"boss": "Ariana", "pokemon": "Arbok", "field": "moves"}`
- `{"boss": "Ariana", "pokemon": "Gloom", "field": "moves"}`
- `{"boss": "Ariana", "pokemon": "Murkrow", "field": "moves"}`
- `{"boss": "Ariana", "pokemon": "Golbat", "field": "moves"}`
- `{"boss": "Ariana", "pokemon": "Vileplume", "field": "moves"}`
- `{"boss": "Ariana", "pokemon": "Honchkrow", "field": "moves"}`
- `{"boss": "Proton", "pokemon": "Zubat", "field": "moves"}`
- `{"boss": "Proton", "pokemon": "Koffing", "field": "moves"}`
- `{"boss": "Proton", "pokemon": "Ekans", "field": "moves"}`
- `{"boss": "Proton", "pokemon": "Raticate", "field": "moves"}`
- `{"boss": "Petrel", "pokemon": "Golbat", "field": "moves"}`
- `{"boss": "Petrel", "pokemon": "Raticate", "field": "moves"}`
- `{"boss": "Petrel", "pokemon": "Koffing", "field": "moves"}`
- ... 12 more
