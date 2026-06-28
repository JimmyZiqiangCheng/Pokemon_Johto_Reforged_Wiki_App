from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import shutil
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

try:
    from PIL import Image
except ImportError:  # pragma: no cover - asset copying still works without Pillow.
    Image = None


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ROMHACK_ROOT = Path(r"C:\Users\jimmy\Documents\pokemon_romhacks\perfect_johto")
PUBLIC_DIR = PROJECT_ROOT / "public"
DATA_DIR = PUBLIC_DIR / "data"
ASSET_DIR = PUBLIC_DIR / "assets"
DOCS_DIR = PROJECT_ROOT / "docs" / "generated"

STAT_FIELDS = ("hp", "attack", "defense", "spAttack", "spDefense", "speed")
STAT_LABELS = {
    "hp": "HP",
    "attack": "Attack",
    "defense": "Defense",
    "spAttack": "Sp. Atk",
    "spDefense": "Sp. Def",
    "speed": "Speed",
    "atk": "Attack",
    "def": "Defense",
    "sp_atk": "Sp. Atk",
    "sp_def": "Sp. Def",
    "acc": "Accuracy",
    "eva": "Evasion",
}
TYPE_ORDER = [
    "Normal",
    "Fire",
    "Water",
    "Electric",
    "Grass",
    "Ice",
    "Fighting",
    "Poison",
    "Ground",
    "Flying",
    "Psychic",
    "Bug",
    "Rock",
    "Ghost",
    "Dragon",
    "Dark",
    "Steel",
    "Fairy",
]
PSEUDO_BASE_SPECIES = {
    "SPECIES_DRATINI",
    "SPECIES_LARVITAR",
    "SPECIES_BAGON",
    "SPECIES_BELDUM",
    "SPECIES_GIBLE",
}
KANTO_TOKENS = {
    "Pallet",
    "Viridian",
    "Pewter",
    "Cerulean",
    "Vermilion",
    "Lavender",
    "Celadon",
    "Fuchsia",
    "Cinnabar",
    "Saffron",
    "Seafoam",
    "Power Plant",
    "Rock Tunnel",
    "Diglett",
    "Mt. Moon",
    "Cerulean Cave",
    "Viridian Forest",
    "Route 1",
    "Route 2",
    "Route 3",
    "Route 4",
    "Route 5",
    "Route 6",
    "Route 7",
    "Route 8",
    "Route 9",
    "Route 10",
    "Route 11",
    "Route 12",
    "Route 13",
    "Route 14",
    "Route 15",
    "Route 16",
    "Route 17",
    "Route 18",
    "Route 19",
    "Route 20",
    "Route 21",
    "Route 22",
    "Route 23",
    "Route 24",
    "Route 25",
}
JOHTO_TOKENS = {
    "New Bark",
    "Cherrygrove",
    "Violet",
    "Azalea",
    "Goldenrod",
    "Ecruteak",
    "Olivine",
    "Cianwood",
    "Mahogany",
    "Lake Of Rage",
    "Blackthorn",
    "Sprout Tower",
    "Ruins Of Alph",
    "Union Cave",
    "Slowpoke Well",
    "Ilex Forest",
    "National Park",
    "Burned Tower",
    "Bell Tower",
    "Whirl Islands",
    "Mt. Mortar",
    "Ice Path",
    "Dragon's Den",
    "Dark Cave",
    "Tohjo Falls",
    "Cliff",
    "Safari",
    "Route 26",
    "Route 27",
    "Route 28",
    "Route 29",
    "Route 30",
    "Route 31",
    "Route 32",
    "Route 33",
    "Route 34",
    "Route 35",
    "Route 36",
    "Route 37",
    "Route 38",
    "Route 39",
    "Route 40",
    "Route 41",
    "Route 42",
    "Route 43",
    "Route 44",
    "Route 45",
    "Route 46",
    "Route 47",
    "Route 48",
    "Mt. Silver",
}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def load_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    return json.loads(read_text(path))


def clean_text(value: Any) -> str:
    text = str(value or "")
    replacements = {
        "PokÃ©mon": "Pokemon",
        "Pokémon": "Pokemon",
        "PokÃ©": "Poke",
        "â€™": "'",
        "’": "'",
        "â€œ": '"',
        "â€": '"',
        "“": '"',
        "”": '"',
        "â€“": "-",
        "–": "-",
        "â€”": "-",
        "—": "-",
        "â™‚": "M",
        "â™€": "F",
        "\\n": " ",
        "\\r": " ",
        "\n": " ",
        "\r": " ",
        "\f": " ",
        "{PKMN}": "Pokemon",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r"\{[^}]+\}", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def labelize(identifier: str, prefix: str = "") -> str:
    value = identifier.removeprefix(prefix).lower()
    value = value.replace("_f", " F").replace("_m", " M")
    value = value.replace("_", " ").title()
    value = value.replace("Ho Oh", "Ho-Oh")
    value = value.replace("Farfetchd", "Farfetch'd")
    value = value.replace("Mr Mime", "Mr. Mime")
    value = value.replace("Mime Jr", "Mime Jr.")
    value = value.replace("Porygon Z", "Porygon-Z")
    value = value.replace("Sp Atk", "Sp. Atk").replace("Sp Def", "Sp. Def")
    value = value.replace("Hp", "HP").replace("Pp", "PP").replace("Tm", "TM").replace("Hm", "HM")
    return clean_text(value)


def slugify(value: str) -> str:
    value = clean_text(value).lower()
    value = value.replace("'", "").replace(".", "").replace("-", "_")
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_")


def parse_defines(path: Path, prefix: str) -> dict[str, int]:
    all_values: dict[str, int] = {}
    if not path.exists():
        return {}
    pattern = re.compile(r"^#define\s+([A-Z0-9_]+)\s+(.+)$", re.MULTILINE)
    for ident, expr in pattern.findall(read_text(path)):
        if "(" in ident:
            continue
        expr = expr.split("//", 1)[0].strip()
        if not expr or '"' in expr:
            continue
        value = eval_define_expr(expr, all_values)
        if value is not None:
            all_values[ident] = value
    return {
        ident: value
        for ident, value in all_values.items()
        if ident.startswith(prefix) and not ident.endswith("_COUNT") and ident != prefix + "COUNT"
    }


def eval_define_expr(expr: str, values: dict[str, int]) -> int | None:
    expr = expr.strip()
    if not expr:
        return None
    for name in sorted(values, key=len, reverse=True):
        expr = re.sub(rf"\b{re.escape(name)}\b", str(values[name]), expr)
    if re.search(r"\b[A-Z_][A-Z0-9_]*\b", expr):
        return None
    if not re.fullmatch(r"[0-9xXa-fA-F\s()+\-*/%<>&|~]+", expr):
        return None
    try:
        return int(eval(expr, {"__builtins__": {}}, {}))
    except Exception:
        return None


def read_line_table(path: Path) -> dict[int, str]:
    if not path.exists():
        return {}
    return {idx: clean_text(line) for idx, line in enumerate(read_text(path).splitlines())}


def matching_brace(text: str, start: int) -> int:
    depth = 0
    in_string = False
    escape = False
    for pos in range(start, len(text)):
        ch = text[pos]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return pos
    raise ValueError("unbalanced braces")


def designated_entries(text: str, prefix: str) -> dict[str, str]:
    entries: dict[str, str] = {}
    pattern = re.compile(rf"\[\s*({re.escape(prefix)}[A-Z0-9_]+)\s*\]\s*=\s*\{{")
    for match in pattern.finditer(text):
        start = text.find("{", match.start())
        end = matching_brace(text, start)
        entries[match.group(1)] = text[start + 1 : end]
    return entries


def field_string(body: str, field_name: str) -> str | None:
    match = re.search(rf"\.{re.escape(field_name)}\s*=\s*\"((?:\\.|[^\"])*)\"", body)
    if not match:
        return None
    return clean_text(match.group(1))


def field_int(body: str, field_name: str) -> int | None:
    match = re.search(rf"\.{re.escape(field_name)}\s*=\s*(-?[0-9]+)\b", body)
    return int(match.group(1)) if match else None


def field_ident(body: str, field_name: str) -> str | None:
    match = re.search(rf"\.{re.escape(field_name)}\s*=\s*([A-Z0-9_]+)\b", body)
    return match.group(1) if match else None


def field_list(body: str, field_name: str) -> list[str]:
    marker = f".{field_name}"
    idx = body.find(marker)
    if idx < 0:
        return []
    start = body.find("{", idx)
    if start < 0:
        return []
    end = matching_brace(body, start)
    content = body[start + 1 : end]
    return [part.strip() for part in content.split(",") if part.strip()]


def named_block(body: str, field_name: str) -> str:
    marker = f".{field_name}"
    idx = body.find(marker)
    if idx < 0:
        return ""
    start = body.find("{", idx)
    if start < 0:
        return ""
    end = matching_brace(body, start)
    return body[start + 1 : end]


def type_name(identifier: str | None) -> str:
    if not identifier:
        return "Unknown"
    return labelize(identifier, "TYPE_")


def compact_types(types: list[str]) -> list[str]:
    labels = [type_name(item) for item in types if item and item != "TYPE_MYSTERY"]
    if len(labels) == 2 and labels[0] == labels[1]:
        return [labels[0]]
    return labels or ["Unknown"]


def id_to_asset_slug(identifier: str, prefix: str) -> str:
    return identifier.removeprefix(prefix).lower()


def copy_asset(src: Path | None, rel_dest: str) -> str | None:
    if not src or not src.exists():
        return None
    dest = ASSET_DIR / rel_dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    return f"assets/{rel_dest}".replace("\\", "/")


def copy_trainer_sprite_asset(src: Path | None, rel_dest: str) -> str | None:
    if not src or not src.exists():
        return None
    dest = ASSET_DIR / rel_dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    if Image is not None:
        try:
            with Image.open(src) as image:
                rgba = image.convert("RGBA")
                width, height = rgba.size
                if src.name.endswith("_enc.png") and width > height and width % height == 0:
                    rgba = rgba.crop((0, 0, height, height))
                    width, height = rgba.size
                corners = [
                    rgba.getpixel((0, 0)),
                    rgba.getpixel((width - 1, 0)),
                    rgba.getpixel((0, height - 1)),
                    rgba.getpixel((width - 1, height - 1)),
                ]
                background = None
                for corner in corners:
                    if corner[3] and sum(1 for other in corners if other[:3] == corner[:3]) >= 3:
                        background = corner[:3]
                        break
                if background is not None:
                    pixels = rgba.load()
                    for y in range(height):
                        for x in range(width):
                            r, g, b, a = pixels[x, y]
                            if a and (r, g, b) == background:
                                pixels[x, y] = (0, 0, 0, 0)
                    bbox = rgba.getchannel("A").getbbox()
                    if bbox:
                        pad = 2
                        crop_box = (
                            max(0, bbox[0] - pad),
                            max(0, bbox[1] - pad),
                            min(width, bbox[2] + pad),
                            min(height, bbox[3] + pad),
                        )
                        rgba.crop(crop_box).save(dest)
                        return f"assets/{rel_dest}".replace("\\", "/")
                crop_box = None
                if height > width and height % width == 0:
                    crop_box = (0, 0, width, width)
                elif width > height and width % height == 0:
                    crop_box = (0, 0, height, height)
                if crop_box:
                    rgba.crop(crop_box).save(dest)
                    return f"assets/{rel_dest}".replace("\\", "/")
        except (OSError, ValueError):
            pass
    shutil.copy2(src, dest)
    return f"assets/{rel_dest}".replace("\\", "/")


def asset_candidates_for_species(engine_root: Path, species_id: str, name: str) -> list[Path]:
    sprite_root = engine_root / "data" / "graphics" / "sprites"
    candidates = []
    for slug in dict.fromkeys([id_to_asset_slug(species_id, "SPECIES_"), slugify(name)]):
        base = sprite_root / slug
        candidates.append(base)
        if slug.endswith("_f"):
            candidates.append(sprite_root / slug.removesuffix("_f") / "female")
        if slug.endswith("_m"):
            candidates.append(sprite_root / slug.removesuffix("_m") / "male")
    return candidates


def find_species_assets(engine_root: Path, species_id: str, name: str) -> dict[str, str | None]:
    icon_src: Path | None = None
    front_src: Path | None = None
    for base in asset_candidates_for_species(engine_root, species_id, name):
        if base.is_dir():
            icon = base / "icon.png"
            if icon.exists() and not icon_src:
                icon_src = icon
            for candidate in [base / "male" / "front.png", base / "female" / "front.png", base / "front.png"]:
                if candidate.exists() and not front_src:
                    front_src = candidate
        if icon_src and front_src:
            break
    slug = id_to_asset_slug(species_id, "SPECIES_")
    return {
        "icon": copy_asset(icon_src, f"pokemon/icons/{slug}.png"),
        "sprite": copy_asset(front_src, f"pokemon/front/{slug}.png"),
    }


def find_item_icon(engine_root: Path, item_id: str) -> str | None:
    slug = id_to_asset_slug(item_id, "ITEM_")
    src = engine_root / "data" / "graphics" / "item" / f"{slug}.png"
    return copy_asset(src if src.exists() else None, f"items/{slug}.png")


def find_trainer_sprite(engine_root: Path, trainer_class_id: str | None, trainer_class_ids: dict[str, int]) -> str | None:
    if not trainer_class_id:
        return None
    number = trainer_class_ids.get(trainer_class_id)
    if number is None:
        return None
    trainer_gfx_root = engine_root / "data" / "graphics" / "trainer_gfx"
    src = trainer_gfx_root / f"{number:03d}_enc.png"
    if not src.exists():
        src = trainer_gfx_root / f"{number:03d}.png"
    slug = id_to_asset_slug(trainer_class_id, "TRAINERCLASS_")
    return copy_trainer_sprite_asset(src if src.exists() else None, f"trainers/{slug}.png")


def parse_species(engine_root: Path, approved_scope: dict[str, Any]) -> list[dict[str, Any]]:
    species_ids = parse_defines(engine_root / "include" / "constants" / "species.h", "SPECIES_")
    ability_ids = parse_defines(engine_root / "include" / "constants" / "ability.h", "ABILITY_")
    ability_names_by_number = read_line_table(engine_root / "data" / "text" / "720.txt")
    ability_names = {ident: ability_names_by_number.get(num) or labelize(ident, "ABILITY_") for ident, num in ability_ids.items()}
    entries = designated_entries(read_text(engine_root / "data" / "Species.c"), "SPECIES_")
    approved_later = set(approved_scope.get("approved_later_exceptions", []))
    gen_min = approved_scope.get("gen1_4_range", {}).get("min", 1)
    gen_max = approved_scope.get("gen1_4_range", {}).get("max", 493)
    pokemon: list[dict[str, Any]] = []
    for species_id, number in sorted(species_ids.items(), key=lambda item: item[1]):
        if species_id == "SPECIES_NONE":
            continue
        body = entries.get(species_id, "")
        name = field_string(body, "name") or labelize(species_id, "SPECIES_")
        base_stats_block = named_block(body, "baseStats")
        ev_block = named_block(body, "evYields")
        held_block = named_block(body, "wildHeldItems")
        base_stats = {stat: field_int(base_stats_block, stat) or 0 for stat in STAT_FIELDS}
        ev_yield = {stat: field_int(ev_block, stat) or 0 for stat in STAT_FIELDS}
        ability_entries = []
        for index, ability_id in enumerate(field_list(body, "abilities")[:2], start=1):
            if ability_id and ability_id != "ABILITY_NONE":
                ability_entries.append(
                    {
                        "slot": str(index),
                        "id": ability_id,
                        "name": ability_names.get(ability_id, labelize(ability_id, "ABILITY_")),
                    }
                )
        if gen_min <= number <= gen_max:
            scope_status = "Gen 1-4"
        elif species_id in approved_later:
            scope_status = "Approved later family exception"
        else:
            continue
        assets = find_species_assets(engine_root, species_id, name)
        pokemon.append(
            {
                "id": species_id,
                "dexNo": number,
                "name": name,
                "slug": slugify(name),
                "generation": generation_for_dex(number),
                "scopeStatus": scope_status,
                "types": compact_types(field_list(body, "types")),
                "baseStats": base_stats,
                "bst": sum(base_stats.values()),
                "abilities": ability_entries,
                "hiddenAbility": None,
                "heldItems": {
                    "common": field_ident(held_block, "common") or "ITEM_NONE",
                    "rare": field_ident(held_block, "rare") or "ITEM_NONE",
                },
                "evYield": ev_yield,
                "eggGroups": [labelize(item, "EGG_GROUP_") for item in field_list(body, "eggGroups") if item != "EGG_GROUP_NONE"],
                "catchRate": field_int(body, "catchRate"),
                "growthRate": labelize(field_ident(body, "expRate") or "", "GROWTH_"),
                "classification": field_string(body, "classification"),
                "height": field_string(body, "height"),
                "weight": field_string(body, "weight"),
                "pokedexEntry": field_string(body, "pokedexEntry"),
                "assets": assets,
                "learnsets": {"level": [], "machine": [], "egg": [], "tutor": []},
                "evolvesTo": [],
                "evolvesFrom": [],
                "encounters": [],
                "staticsGifts": [],
                "trainerUsage": [],
                "availability": {
                    "summary": "Unknown until cross-linking runs.",
                    "earliest": None,
                    "wildCount": 0,
                    "staticGiftCount": 0,
                    "trainerCount": 0,
                    "rareNotes": [],
                },
                "validationFlags": [],
            }
        )
    return pokemon


def generation_for_dex(number: int) -> int | None:
    if number <= 0:
        return None
    if number <= 151:
        return 1
    if number <= 251:
        return 2
    if number <= 386:
        return 3
    if number <= 493:
        return 4
    if number <= 649:
        return 5
    if number <= 721:
        return 6
    if number <= 809:
        return 7
    if number <= 905:
        return 8
    return 9


def parse_moves(engine_root: Path) -> list[dict[str, Any]]:
    move_ids = parse_defines(engine_root / "include" / "constants" / "moves.h", "MOVE_")
    entries = designated_entries(read_text(engine_root / "data" / "Moves.c"), "MOVE_")
    moves: list[dict[str, Any]] = []
    for move_id, number in sorted(move_ids.items(), key=lambda item: item[1]):
        if move_id == "MOVE_NONE":
            continue
        body = entries.get(move_id, "")
        flags = [part.strip().removeprefix("FLAG_").replace("_", " ").title() for part in (field_ident_list(body, "flags") or [])]
        effect = field_ident(body, "effect") or "MOVE_EFFECT_UNKNOWN"
        moves.append(
            {
                "id": move_id,
                "number": number,
                "name": field_string(body, "name") or labelize(move_id, "MOVE_"),
                "type": type_name(field_ident(body, "type")),
                "category": labelize(field_ident(body, "split") or "", "SPLIT_"),
                "power": field_int(body, "power"),
                "accuracy": field_int(body, "accuracy"),
                "pp": field_int(body, "pp"),
                "priority": field_int(body, "priority") or 0,
                "target": labelize(field_ident(body, "target") or "", "RANGE_"),
                "flags": flags,
                "description": clean_text(field_string(body, "description") or ""),
                "effect": effect,
                "effectChance": field_int(body, "effectChance") or 0,
                "effectSummary": effect_summary(effect, field_int(body, "effectChance") or 0),
                "learners": [],
                "validationFlags": [],
            }
        )
    return moves


def field_ident_list(body: str, field_name: str) -> list[str]:
    match = re.search(rf"\.{re.escape(field_name)}\s*=\s*([^,\n]+(?:\|[^,\n]+)*)", body)
    if not match:
        return []
    return [part.strip() for part in match.group(1).split("|") if part.strip() and part.strip() != "0x00"]


def parse_stat_tokens(raw: str) -> list[str]:
    tokens: list[str] = []
    idx = 0
    parts = raw.split("_")
    while idx < len(parts):
        if idx + 1 < len(parts) and f"{parts[idx]}_{parts[idx + 1]}" in {"SP_ATK", "SP_DEF"}:
            tokens.append(f"{parts[idx].lower()}_{parts[idx + 1].lower()}")
            idx += 2
        elif parts[idx] in {"ATK", "DEF", "SPEED", "ACC", "EVA"}:
            tokens.append(parts[idx].lower())
            idx += 1
        elif parts[idx] == "ALL" and idx + 1 < len(parts) and parts[idx + 1] == "STATS":
            tokens.extend(["atk", "def", "sp_atk", "sp_def", "speed"])
            idx += 2
        else:
            idx += 1
    return tokens


def list_sentence(items: list[str]) -> str:
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return f"{', '.join(items[:-1])}, and {items[-1]}"


def stat_sentence(prefix: str, stats: list[str], stages: int, target: str = "the user's") -> str:
    labels = [STAT_LABELS.get(stat, stat) for stat in stats]
    return f"{prefix} {target} {list_sentence(labels)} by {stages} stage{'s' if stages != 1 else ''}."


def effect_summary(effect: str, chance: int) -> str | None:
    exact = {
        "MOVE_EFFECT_ATK_UP_2": stat_sentence("Raises", ["atk"], 2),
        "MOVE_EFFECT_DEF_UP_2": stat_sentence("Raises", ["def"], 2),
        "MOVE_EFFECT_SPEED_UP_2": stat_sentence("Raises", ["speed"], 2),
        "MOVE_EFFECT_SP_ATK_UP_2": stat_sentence("Raises", ["sp_atk"], 2),
        "MOVE_EFFECT_SP_DEF_UP_2": stat_sentence("Raises", ["sp_def"], 2),
        "MOVE_EFFECT_ACC_UP_2": stat_sentence("Raises", ["acc"], 2),
        "MOVE_EFFECT_EVA_UP_2": stat_sentence("Raises", ["eva"], 2),
        "MOVE_EFFECT_ATK_SPEED_UP": stat_sentence("Raises", ["atk", "speed"], 1),
        "MOVE_EFFECT_ATK_DEF_UP": stat_sentence("Raises", ["atk", "def"], 1),
        "MOVE_EFFECT_SP_ATK_SP_DEF_UP": stat_sentence("Raises", ["sp_atk", "sp_def"], 1),
        "MOVE_EFFECT_DEF_SP_DEF_UP": stat_sentence("Raises", ["def", "sp_def"], 1),
        "MOVE_EFFECT_ATK_DEF_ACC_UP": stat_sentence("Raises", ["atk", "def", "acc"], 1),
        "MOVE_EFFECT_SP_ATK_SP_DEF_SPEED_UP": stat_sentence("Raises", ["sp_atk", "sp_def", "speed"], 1),
        "MOVE_EFFECT_ATK_SP_ATK_UP": stat_sentence("Raises", ["atk", "sp_atk"], 1),
        "MOVE_EFFECT_ATK_SP_ATK_SPEED_UP_2_DEF_SP_DEF_DOWN": (
            f"{stat_sentence('Lowers', ['def', 'sp_def'], 1)} "
            f"{stat_sentence('Raises', ['atk', 'sp_atk', 'speed'], 2)}"
        ),
        "MOVE_EFFECT_ATK_SP_ATK_SPEED_UP_2": stat_sentence("Raises", ["atk", "sp_atk", "speed"], 2),
        "MOVE_EFFECT_USER_DEF_SP_DEF_DOWN_HIT": stat_sentence("Lowers", ["def", "sp_def"], 1),
        "MOVE_EFFECT_USER_ATK_DEF_DOWN_HIT": stat_sentence("Lowers", ["atk", "def"], 1),
        "MOVE_EFFECT_USER_SP_ATK_DOWN_2": stat_sentence("Lowers", ["sp_atk"], 2),
        "MOVE_EFFECT_USER_SPEED_DOWN_HIT": stat_sentence("Lowers", ["speed"], 1),
        "MOVE_EFFECT_USER_SPEED_DOWN_2_HIT": stat_sentence("Lowers", ["speed"], 2),
        "MOVE_EFFECT_RECOIL_THIRD": "The user takes recoil damage equal to one-third of the damage dealt.",
        "MOVE_EFFECT_RECOIL_HALF": "The user takes recoil damage equal to half of the damage dealt.",
        "MOVE_EFFECT_RECOIL_QUARTER": "The user takes recoil damage equal to one-quarter of the damage dealt.",
        "MOVE_EFFECT_RECOVER_HALF_DAMAGE_DEALT": "The user heals for half of the damage dealt.",
        "MOVE_EFFECT_RECOVER_FULL_DAMAGE_DEALT": "The user heals for the full damage dealt.",
        "MOVE_EFFECT_RECOVER_HALF_DAMAGE_DEALT_BURN_HIT": "The user heals for half of the damage dealt and may burn the target.",
        "MOVE_EFFECT_RECOVER_THREE_QUARTERS_DAMAGE_DEALT": "The user heals for three-quarters of the damage dealt.",
        "MOVE_EFFECT_STATUS_SLEEP": "Puts the target to sleep.",
        "MOVE_EFFECT_STATUS_POISON": "Poisons the target.",
        "MOVE_EFFECT_STATUS_BADLY_POISON": "Badly poisons the target.",
        "MOVE_EFFECT_STATUS_PARALYZE": "Paralyzes the target.",
        "MOVE_EFFECT_STATUS_BURN": "Burns the target.",
        "MOVE_EFFECT_STATUS_CONFUSE": "Confuses the target.",
        "MOVE_EFFECT_HIGH_CRITICAL": "Has a high critical-hit ratio.",
        "MOVE_EFFECT_ONE_HIT_KO": "Knocks out the target in one hit if it lands.",
        "MOVE_EFFECT_MULTI_HIT": "Hits two to five times.",
        "MOVE_EFFECT_HIT_TWICE": "Hits twice.",
    }
    if effect in exact:
        return exact[effect]
    simple = re.match(r"MOVE_EFFECT_(ATK|DEF|SPEED|SP_ATK|SP_DEF|ACC|EVA)_(UP|DOWN)(?:_([23]))?$", effect)
    if simple:
        stat, direction, stages = simple.groups()
        return stat_sentence("Raises" if direction == "UP" else "Lowers", parse_stat_tokens(stat), int(stages or "1"))
    lower_hit = re.match(r"MOVE_EFFECT_LOWER_(ATTACK|DEFENSE|SPEED|SP_ATK|SP_DEF|ACCURACY|EVASION)(?:_([23]))?_HIT$", effect)
    if lower_hit:
        stat_raw, stages = lower_hit.groups()
        stat = {
            "ATTACK": "atk",
            "DEFENSE": "def",
            "SPEED": "speed",
            "SP_ATK": "sp_atk",
            "SP_DEF": "sp_def",
            "ACCURACY": "acc",
            "EVASION": "eva",
        }[stat_raw]
        chance_text = f" Has a {chance}% chance." if chance else ""
        return stat_sentence("Lowers", [stat], int(stages or "1"), "the target's") + chance_text
    status_hit = {
        "MOVE_EFFECT_POISON_HIT": "May poison the target.",
        "MOVE_EFFECT_BURN_HIT": "May burn the target.",
        "MOVE_EFFECT_FREEZE_HIT": "May freeze the target.",
        "MOVE_EFFECT_PARALYZE_HIT": "May paralyze the target.",
        "MOVE_EFFECT_FLINCH_HIT": "May make the target flinch.",
        "MOVE_EFFECT_CONFUSE_HIT": "May confuse the target.",
    }
    return status_hit.get(effect)


def parse_abilities(engine_root: Path, pokemon: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ability_ids = parse_defines(engine_root / "include" / "constants" / "ability.h", "ABILITY_")
    names = read_line_table(engine_root / "data" / "text" / "720.txt")
    descriptions = read_line_table(engine_root / "data" / "text" / "722.txt")
    pokemon_by_ability: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for mon in pokemon:
        for ability in mon["abilities"]:
            pokemon_by_ability[ability["id"]].append(
                {
                    "id": mon["id"],
                    "name": mon["name"],
                    "types": mon["types"],
                    "slot": ability["slot"],
                    "icon": mon["assets"].get("icon"),
                }
            )
    abilities = []
    for ability_id, number in sorted(ability_ids.items(), key=lambda item: item[1]):
        if ability_id == "ABILITY_NONE":
            continue
        abilities.append(
            {
                "id": ability_id,
                "number": number,
                "name": names.get(number) or labelize(ability_id, "ABILITY_"),
                "description": descriptions.get(number) or "",
                "effectSummary": descriptions.get(number) or "",
                "pokemon": sorted(pokemon_by_ability.get(ability_id, []), key=lambda item: (item["name"], item["slot"])),
                "validationFlags": [] if descriptions.get(number) else ["Missing description"],
            }
        )
    return abilities


def parse_items(engine_root: Path, exports: dict[str, Any], evolutions: list[dict[str, Any]], pokemon: list[dict[str, Any]]) -> list[dict[str, Any]]:
    item_ids = parse_defines(engine_root / "include" / "constants" / "item.h", "ITEM_")
    names = read_line_table(engine_root / "data" / "text" / "222.txt")
    entries = designated_entries(read_text(engine_root / "data" / "itemdata" / "itemdata.c"), "ITEM_")
    mart_rows = list(exports.get("items_and_marts", {}).get("badge_mart", [])) + list(exports.get("customization_items", []))
    mart_by_item: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in mart_rows:
        if row.get("item"):
            mart_by_item[row["item"]].append(
                {
                    "location": "Badge-Gated Standard Mart",
                    "shopType": "Badge mart",
                    "price": row.get("price"),
                    "requiredBadges": row.get("required_badges"),
                }
            )
    evolution_usage: dict[str, list[dict[str, str]]] = defaultdict(list)
    for evo in evolutions:
        parameter = str(evo.get("parameter") or "")
        if parameter.startswith("ITEM_"):
            evolution_usage[parameter].append(
                {
                    "from": evo["from"],
                    "fromName": evo["fromName"],
                    "to": evo["to"],
                    "toName": evo["toName"],
                    "method": evo["methodReadable"],
                }
            )
    held_by: dict[str, list[dict[str, str]]] = defaultdict(list)
    for mon in pokemon:
        for rarity in ("common", "rare"):
            item_id = mon["heldItems"].get(rarity)
            if item_id and item_id != "ITEM_NONE":
                held_by[item_id].append({"pokemon": mon["id"], "pokemonName": mon["name"], "rarity": rarity})
    trainer_held_by: dict[str, list[dict[str, str]]] = defaultdict(list)
    for trainer in exports.get("trainer_teams", []):
        trainer_name = clean_text(trainer.get("name")) or "Trainer"
        for member in trainer.get("party", []):
            item_id = member.get("item")
            if item_id and item_id != "ITEM_NONE":
                trainer_held_by[item_id].append(
                    {
                        "trainerId": str(trainer.get("id")),
                        "trainerName": trainer_name,
                        "pokemonName": clean_text(member.get("name")) or labelize(member.get("species") or "", "SPECIES_"),
                    }
                )
    relevance_by_item: dict[str, set[str]] = defaultdict(set)
    for item_id in mart_by_item:
        relevance_by_item[item_id].add("Shop stock")
    for item_id in evolution_usage:
        relevance_by_item[item_id].add("Evolution method")
    for item_id in held_by:
        relevance_by_item[item_id].add("Wild held item")
    for item_id in trainer_held_by:
        relevance_by_item[item_id].add("Trainer held item")
    if exports.get("max_candy"):
        relevance_by_item["ITEM_MAX_CANDY"].add("Max Candy system")
    items: list[dict[str, Any]] = []
    for item_id, number in sorted(item_ids.items(), key=lambda item: item[1]):
        if item_id == "ITEM_NONE":
            continue
        body = entries.get(item_id, "")
        price_match = re.search(r"ITEM_PRICE\((\d+)\)", body)
        pocket = field_ident(body, "fieldPocket")
        party_use = {
            "levelUp": ".level_up = TRUE" in body,
            "evolve": ".evolve = TRUE" in body,
            "hpRestore": ".hp_restore = TRUE" in body,
            "ppRestore": ".pp_restore = TRUE" in body,
            "revive": ".revive = TRUE" in body,
            "statusHeal": any(flag in body for flag in [".slp_heal = TRUE", ".psn_heal = TRUE", ".brn_heal = TRUE", ".frz_heal = TRUE", ".prz_heal = TRUE"]),
            "evUp": any(flag in body for flag in [".hp_ev_up = TRUE", ".atk_ev_up = TRUE", ".def_ev_up = TRUE", ".spatk_ev_up = TRUE", ".spdef_ev_up = TRUE", ".speed_ev_up = TRUE"]),
        }
        name = names.get(number) or labelize(item_id, "ITEM_")
        if not item_is_exportable(item_id, name, relevance_by_item.get(item_id, set())):
            continue
        description = item_description(item_id, name, exports)
        asset = find_item_icon(engine_root, item_id)
        validation_flags = [] if description else ["Missing description"]
        if not asset:
            validation_flags.append("Missing item icon asset")
        items.append(
            {
                "id": item_id,
                "number": number,
                "name": name,
                "slug": slugify(name),
                "pocket": labelize(pocket or "", "POCKET_") if pocket else "Unknown",
                "price": int(price_match.group(1)) if price_match else None,
                "sellPrice": None,
                "description": clean_text(description),
                "useEffect": item_effect_summary(party_use, item_id, description),
                "technical": {
                    "fieldPocket": pocket,
                    "battlePocket": field_ident(body, "battlePocket"),
                    "holdEffect": field_ident(body, "holdEffect") or field_int(body, "holdEffect"),
                    "selectable": ".selectable = TRUE" in body,
                    "preventToss": ".prevent_toss = TRUE" in body,
                    "partyUse": party_use,
                },
                "availability": {
                    "summary": item_availability_summary(item_id, mart_by_item, evolution_usage, held_by, trainer_held_by, relevance_by_item),
                    "marts": sorted(mart_by_item.get(item_id, []), key=lambda item: (item.get("requiredBadges") or 0, item.get("price") or 0)),
                    "sources": [],
                    "wildHeldBy": sorted(held_by.get(item_id, []), key=lambda item: item["pokemonName"]),
                    "trainerHeldBy": sorted(trainer_held_by.get(item_id, []), key=lambda item: (item["trainerName"], item["pokemonName"])),
                    "relevanceSources": sorted(relevance_by_item.get(item_id, [])),
                    "status": "Referenced",
                },
                "evolutionUsage": sorted(evolution_usage.get(item_id, []), key=lambda item: item["fromName"]),
                "asset": asset,
                "validationFlags": validation_flags,
            }
        )
    return items


def item_is_exportable(item_id: str, name: str, relevance: set[str]) -> bool:
    clean_name = clean_text(name).strip()
    if not relevance:
        return False
    if not clean_name or clean_name == "???":
        return False
    if clean_name.startswith("★"):
        return False
    return True


def item_effect_summary(party_use: dict[str, bool], item_id: str, description: str) -> str:
    if description:
        return clean_text(description)
    if party_use["evolve"]:
        return "Used for Pokemon evolution."
    if party_use["levelUp"]:
        return "Raises a Pokemon's level."
    if party_use["hpRestore"] or party_use["ppRestore"] or party_use["statusHeal"] or party_use["revive"]:
        return "Medicine or battle recovery item."
    if party_use["evUp"]:
        return "Raises EVs or similar training values."
    if "MINT" in item_id:
        return "Nature customization item."
    if "CANDY" in item_id:
        return item_description(item_id, labelize(item_id, "ITEM_"), {})
    return "Effect not exported."


def item_description(item_id: str, name: str, exports: dict[str, Any]) -> str:
    if item_id == "ITEM_MAX_CANDY":
        return clean_text(exports.get("max_candy", {}).get("effect", "")) or "Sets all six IVs to 31 if at least one IV can change."
    if item_id == "ITEM_RARE_CANDY":
        return "Raises a Pokemon by one level."
    if item_id == "ITEM_RAGE_CANDY_BAR":
        return "A Johto snack item used by field scripts or recovery systems."
    if item_id == "ITEM_CANDY_JAR":
        return "Stores Pokemon candies for training and customization."
    if item_id.startswith("ITEM_EXP_CANDY_"):
        size = item_id.removeprefix("ITEM_EXP_CANDY_").replace("_", " ")
        return f"Grants experience to a Pokemon. Size {size} gives a larger experience boost."
    if item_id == "ITEM_DYNAMAX_CANDY":
        return "Raises a Pokemon's Dynamax level."

    stat_candies = {
        "HEALTH": "HP",
        "MIGHTY": "Attack",
        "TOUGH": "Defense",
        "SMART": "Sp. Atk",
        "COURAGE": "Sp. Def",
        "QUICK": "Speed",
    }
    match = re.match(r"ITEM_(HEALTH|MIGHTY|TOUGH|SMART|COURAGE|QUICK)_CANDY(?:_(L|XL))?$", item_id)
    if match:
        stat = stat_candies[match.group(1)]
        size = match.group(2)
        size_note = " Large size." if size == "L" else " Extra-large size." if size == "XL" else ""
        return f"Raises a Pokemon's {stat} IV through the IV candy system.{size_note}"

    if item_id.startswith("ITEM_") and item_id.endswith("_CANDY"):
        species = clean_text(name).removesuffix(" Candy")
        return f"Species-specific candy for the {species} evolutionary family."
    return ""


def item_availability_summary(
    item_id: str,
    mart_by_item: dict[str, list[dict[str, Any]]],
    evolution_usage: dict[str, list[dict[str, str]]],
    held_by: dict[str, list[dict[str, str]]],
    trainer_held_by: dict[str, list[dict[str, str]]],
    relevance_by_item: dict[str, set[str]],
) -> str:
    parts = []
    if item_id in mart_by_item:
        badges = sorted({row.get("requiredBadges") for row in mart_by_item[item_id] if row.get("requiredBadges") is not None})
        parts.append(f"Purchased from badge mart" + (f" after {badges[0]} badge(s)" if badges else ""))
    if item_id in held_by:
        parts.append(f"Held by {len(held_by[item_id])} Pokemon")
    if item_id in trainer_held_by:
        parts.append(f"Held by {len(trainer_held_by[item_id])} trainer Pokemon")
    if item_id in evolution_usage:
        parts.append(f"Used in {len(evolution_usage[item_id])} evolution method(s)")
    if not parts and item_id in relevance_by_item:
        parts.extend(sorted(relevance_by_item[item_id]))
    return "; ".join(parts) if parts else "Not referenced by exported game data."


def parse_evolutions(exports: dict[str, Any]) -> list[dict[str, Any]]:
    rows = exports.get("evolutions") or []
    parsed = []
    for row in rows:
        method = row.get("method") or "EVO_UNKNOWN"
        parameter = str(row.get("parameter") or "")
        parsed.append(
            {
                "from": row.get("from"),
                "fromName": clean_text(row.get("from_name")),
                "to": row.get("target"),
                "toName": clean_text(row.get("target_name")),
                "method": method,
                "parameter": parameter,
                "targetForm": row.get("target_form"),
                "methodReadable": evolution_method(method, parameter),
                "isNoTradeReplacement": method != "EVO_TRADE" and any(
                    repl.get("from") == row.get("from") and repl.get("target") == row.get("target")
                    for repl in exports.get("trade_evolution_replacements", [])
                ),
                "validationFlags": [],
            }
        )
    return parsed


def evolution_method(method: str, parameter: str) -> str:
    if method == "EVO_LEVEL":
        return f"Level {parameter}"
    if method == "EVO_STONE":
        return f"Use {labelize(parameter, 'ITEM_')}"
    if method == "EVO_TRADE":
        return "Trade evolution"
    if method == "EVO_TRADE_ITEM":
        return f"Trade while holding {labelize(parameter, 'ITEM_')}"
    if method == "EVO_MOVE":
        return f"Level up knowing {labelize(parameter, 'MOVE_')}"
    if method == "EVO_FRIENDSHIP":
        return "High friendship"
    if method == "EVO_NONE":
        return "No evolution"
    return labelize(method, "EVO_") + (f" ({labelize(parameter)})" if parameter else "")


def parse_learnsets(engine_root: Path, pokemon: list[dict[str, Any]], moves: list[dict[str, Any]]) -> None:
    data = load_json(engine_root / "data" / "learnsets" / "learnsets.json", {})
    moves_by_id = {move["id"]: move for move in moves}
    pokemon_by_id = {mon["id"]: mon for mon in pokemon}
    learners_by_move: dict[str, list[dict[str, Any]]] = defaultdict(list)
    method_map = {
        "LevelMoves": "level",
        "MachineMoves": "machine",
        "EggMoves": "egg",
        "TutorMoves": "tutor",
    }
    for species_id, learnset in data.items():
        mon = pokemon_by_id.get(species_id)
        if not mon:
            continue
        for source_key, method in method_map.items():
            values = learnset.get(source_key, [])
            for entry in values:
                if method == "level":
                    move_id = entry.get("Move")
                    item = {
                        "level": entry.get("Level"),
                        "moveId": move_id,
                        "moveName": moves_by_id.get(move_id, {}).get("name") or labelize(move_id or "", "MOVE_"),
                    }
                else:
                    move_id = entry
                    item = {"moveId": move_id, "moveName": moves_by_id.get(move_id, {}).get("name") or labelize(move_id or "", "MOVE_")}
                mon["learnsets"][method].append(item)
                if move_id:
                    learners_by_move[move_id].append(
                        {
                            "pokemonId": species_id,
                            "pokemonName": mon["name"],
                            "dexNo": mon["dexNo"],
                            "method": method,
                            "level": item.get("level"),
                            "icon": mon["assets"].get("icon"),
                        }
                    )
    for move in moves:
        move["learners"] = sorted(learners_by_move.get(move["id"], []), key=lambda item: (item["dexNo"], item["method"], item.get("level") or 999))


def area_name(area: str) -> str:
    raw = area.removeprefix("ENCDATA_")
    parts = raw.split("_")
    while parts and re.match(r"^[A-Z]\d+(?:R\d+)?$", parts[0]):
        parts.pop(0)
    name = " ".join(parts).title()
    name = name.replace("Mt Moon", "Mt. Moon").replace("Mt Mortar", "Mt. Mortar").replace("Mt Silver", "Mt. Silver")
    name = name.replace("Dragons Den", "Dragon's Den").replace("Ho Oh", "Ho-Oh")
    return clean_text(name)


def infer_region(name: str) -> str:
    for token in JOHTO_TOKENS:
        if token in name:
            return "Johto"
    for token in KANTO_TOKENS:
        if token in name:
            return "Kanto"
    return "Other"


def infer_map_type(name: str) -> str:
    lowered = name.lower()
    if "route" in lowered:
        return "route"
    if any(word in lowered for word in ["cave", "tower", "forest", "path", "falls", "den", "islands", "ruins", "well"]):
        return "dungeon"
    if "gym" in lowered:
        return "gym"
    if "city" in lowered or "town" in lowered:
        return "town"
    if "dojo" in lowered:
        return "postgame hub"
    return "area"


def parse_rare_notes(exports: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    notes: dict[str, list[dict[str, Any]]] = defaultdict(list)
    pattern = re.compile(r"(?P<method>[a-z_ ]+)\s+(?P<species>SPECIES_[A-Z0-9_]+|timed rare)\s+(?P<chance>\d+)%\s+lv(?P<levels>[0-9-]+)\s+-\s+(?P<note>.+)")
    for row in exports.get("rare_encounters", []):
        area = row.get("area")
        for raw in row.get("rare_notes", []):
            match = pattern.search(raw)
            parsed = {"raw": clean_text(raw)}
            if match:
                parsed.update(
                    {
                        "method": clean_text(match.group("method")).title(),
                        "species": match.group("species"),
                        "chance": int(match.group("chance")),
                        "levels": match.group("levels"),
                        "note": clean_text(match.group("note")),
                    }
                )
            notes[area].append(parsed)
    return notes


def flatten_encounters(exports: dict[str, Any], pokemon_by_id: dict[str, dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    rare_by_area = parse_rare_notes(exports)
    encounters: list[dict[str, Any]] = []
    locations: dict[str, dict[str, Any]] = {}
    method_map = {
        "land": "Grass/Cave",
        "surf": "Surf",
        "water": "Surf",
        "rock_smash": "Rock Smash",
        "old_rod": "Old Rod",
        "good_rod": "Good Rod",
        "super_rod": "Super Rod",
    }
    for table in exports.get("wild_encounters", []):
        area = table.get("area")
        if not area:
            continue
        loc_name = area_name(area)
        location = locations.setdefault(
            area,
            {
                "id": area,
                "name": loc_name,
                "region": infer_region(loc_name),
                "mapType": infer_map_type(loc_name),
                "tags": [],
                "encounters": [],
                "trainers": [],
                "items": [],
                "staticsGifts": [],
                "marts": [],
                "bossFights": [],
                "sourceRefs": [f"exports/perfect_johto/wild_encounters.json#{area}"],
                "validationFlags": [],
            },
        )
        for key, method in method_map.items():
            slots = table.get(key)
            if not isinstance(slots, list):
                continue
            if key == "land":
                for slot in slots:
                    for time_key, time_label in [("day", "Day"), ("night", "Night")]:
                        species_id = slot.get(time_key) or (slot.get("morning") if time_key == "day" else None)
                        if not species_id or species_id == "SPECIES_NONE":
                            continue
                        encounters.append(make_encounter(area, loc_name, location["region"], method, species_id, pokemon_by_id, slot.get("level"), slot.get("level"), slot.get("rate_percent"), slot.get("slot"), time_label, rare_by_area.get(area, [])))
                        location["encounters"].append(encounters[-1]["id"])
            else:
                for slot_index, slot in enumerate(slots):
                    species_id = slot.get("species")
                    if not species_id or species_id == "SPECIES_NONE":
                        continue
                    encounters.append(make_encounter(area, loc_name, location["region"], method, species_id, pokemon_by_id, slot.get("min_level"), slot.get("max_level"), slot.get("rate_percent"), slot_index, "Any", rare_by_area.get(area, [])))
                    location["encounters"].append(encounters[-1]["id"])
        if rare_by_area.get(area):
            location["tags"].append("Rare encounters")
    encounters = compact_encounters(encounters)
    for location in locations.values():
        location["encounters"] = [enc["id"] for enc in encounters if enc["locationId"] == location["id"]]
    return encounters, sorted(locations.values(), key=lambda item: (item["region"], item["name"]))


def compact_encounters(encounters: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[Any, ...], dict[str, Any]] = {}
    for enc in encounters:
        note_key = tuple(sorted(note.get("raw", "") for note in enc.get("rareNotes", [])))
        key = (
            enc["locationId"],
            enc["method"],
            enc.get("time") or "Any",
            enc["species"],
            enc.get("minLevel"),
            enc.get("maxLevel"),
            enc.get("rarity"),
            note_key,
        )
        if key not in grouped:
            grouped[key] = {**enc, "_slots": set(), "_tags": set(enc.get("tags", [])), "_chance": 0, "_has_chance": False}
        chance = enc.get("chance")
        if isinstance(chance, (int, float)):
            grouped[key]["_chance"] += chance
            grouped[key]["_has_chance"] = True
        grouped[key]["_slots"].add(enc.get("slot"))
        grouped[key]["_tags"].update(enc.get("tags", []))
    compacted = []
    for index, enc in enumerate(grouped.values()):
        slots = sorted(slot for slot in enc.pop("_slots") if slot is not None)
        tags = sorted(enc.pop("_tags"))
        chance = enc.pop("_chance")
        has_chance = enc.pop("_has_chance")
        time_label = enc.get("time") or "Any"
        enc["chance"] = chance if has_chance else enc.get("chance")
        enc["slot"] = ",".join(str(slot) for slot in slots) if slots else enc.get("slot")
        enc["tags"] = tags
        enc["id"] = f"{enc['locationId']}:{enc['method']}:{time_label}:{enc['species']}:{enc.get('minLevel')}-{enc.get('maxLevel')}:{enc.get('chance')}:{index}"
        compacted.append(enc)
    return compacted


def make_encounter(area: str, location_name: str, region: str, method: str, species_id: str, pokemon_by_id: dict[str, dict[str, Any]], min_level: int | None, max_level: int | None, chance: int | None, slot: int | None, time: str, rare_notes: list[dict[str, Any]]) -> dict[str, Any]:
    mon = pokemon_by_id.get(species_id, {})
    chance_num = chance if chance is not None else 0
    rarity = "Very rare" if chance_num and chance_num <= 3 else "Rare" if chance_num and chance_num < 5 else "Common"
    matching_notes = [note for note in rare_notes if note.get("species") == species_id or (note.get("raw", "").find(species_id) >= 0)]
    if matching_notes:
        rarity = "Rare"
        if any((note.get("chance") or 99) <= 3 for note in matching_notes):
            rarity = "Very rare"
    return {
        "id": f"{area}:{method}:{time}:{slot}:{species_id}:{len(matching_notes)}",
        "area": area,
        "locationId": area,
        "locationName": location_name,
        "region": region,
        "method": method,
        "time": time,
        "species": species_id,
        "pokemonName": mon.get("name") or labelize(species_id, "SPECIES_"),
        "pokemonIcon": mon.get("assets", {}).get("icon"),
        "types": mon.get("types", []),
        "minLevel": min_level,
        "maxLevel": max_level,
        "chance": chance,
        "slot": slot,
        "rarity": rarity,
        "rareNotes": matching_notes,
        "tags": encounter_tags(species_id, chance_num, region, matching_notes),
    }


def encounter_tags(species_id: str, chance: int, region: str, rare_notes: list[dict[str, Any]]) -> list[str]:
    tags = [region]
    if chance and chance < 5:
        tags.append("rare")
    if chance and chance <= 3:
        tags.append("very rare")
    if species_id in PSEUDO_BASE_SPECIES:
        tags.append("pseudo")
    if rare_notes:
        tags.append("rare finds")
    return tags


def normalize_party(raw_party: list[dict[str, Any]], pokemon_by_id: dict[str, dict[str, Any]], moves_by_id: dict[str, dict[str, Any]], items_by_id: dict[str, dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    party = []
    for member in raw_party or []:
        species_id = member.get("species")
        mon = pokemon_by_id.get(species_id, {})
        item_id = member.get("item")
        party.append(
            {
                "species": species_id,
                "pokemonName": mon.get("name") or clean_text(member.get("name")) or labelize(species_id or "", "SPECIES_"),
                "pokemonIcon": mon.get("assets", {}).get("icon"),
                "types": mon.get("types", []),
                "level": member.get("level"),
                "item": item_id,
                "itemName": (items_by_id or {}).get(item_id, {}).get("name") if item_id else labelize(item_id or "", "ITEM_") if item_id and item_id != "ITEM_NONE" else None,
                "moves": [
                    {
                        "id": move_id,
                        "name": moves_by_id.get(move_id, {}).get("name") or labelize(move_id, "MOVE_"),
                        "type": moves_by_id.get(move_id, {}).get("type"),
                    }
                    for move_id in member.get("moves", [])
                    if move_id and move_id != "MOVE_NONE"
                ],
                "ability": member.get("ability"),
                "nature": member.get("nature"),
                "evs": member.get("evs"),
                "ivs": member.get("ivs"),
            }
        )
    return party


def trainer_category(row: dict[str, Any], id_sets: dict[str, set[int]]) -> str:
    trainer_id = row.get("id")
    class_id = row.get("trainer_class", "")
    name = clean_text(row.get("name"))
    is_gym_leader = trainer_id in id_sets["gym_leaders"] or "LEADER" in class_id or name == "Blue"
    is_elite_four = trainer_id in id_sets["elite_four"] or "ELITE_FOUR" in class_id
    is_champion = "CHAMPION" in class_id or name == "Lance"
    is_red = name == "Red" or "RED" in class_id
    is_rival = "RIVAL" in class_id or name == "Silver"
    is_rocket = "ROCKET" in class_id or name in {"Archer", "Ariana", "Petrel", "Giovanni"}

    if trainer_id in id_sets["champion_circuit"]:
        return "Champion Circuit"
    if trainer_id in id_sets["rematches"]:
        if is_gym_leader:
            return "Gym Leader rematches"
        if is_elite_four or is_champion:
            return "Elite Four rematches"
        if is_red:
            return "Red rematches"
        if is_rival:
            return "Rivals"
        if is_rocket:
            return "Special battles"
        return "Postgame rematches"
    if is_gym_leader:
        return "Gym Leaders"
    if trainer_id in id_sets["elite_four"] or is_elite_four or is_champion or is_red:
        if is_red:
            return "Red"
        if is_champion:
            return "Champion"
        return "Elite Four"
    if is_rival:
        return "Rivals"
    if is_rocket or trainer_id in id_sets["bosses"]:
        return "Special battles"
    return "Route trainers"


def parse_trainers(engine_root: Path, exports: dict[str, Any], pokemon_by_id: dict[str, dict[str, Any]], moves_by_id: dict[str, dict[str, Any]], items_by_id: dict[str, dict[str, Any]] | None = None) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    trainer_class_ids = parse_defines(engine_root / "include" / "constants" / "trainerclass.h", "TRAINERCLASS_")
    id_sets = {
        "gym_leaders": {row["id"] for row in exports.get("gym_leaders", [])},
        "elite_four": {row["id"] for row in exports.get("elite_four_champions", [])},
        "rematches": {row["id"] for row in exports.get("rematches", [])},
        "champion_circuit": {row["id"] for row in exports.get("champion_circuit", {}).get("trainers", [])},
        "bosses": {row["id"] for row in exports.get("boss_battles", [])},
    }
    trainers = []
    for row in exports.get("trainer_teams", []):
        if not row.get("party") and clean_text(row.get("name")) == "-":
            continue
        category = trainer_category(row, id_sets)
        party = normalize_party(row.get("party", []), pokemon_by_id, moves_by_id, items_by_id)
        class_id = row.get("trainer_class")
        trainers.append(
            {
                "id": f"TRAINER_{row.get('id')}",
                "number": row.get("id"),
                "name": clean_text(row.get("name")) or "Unknown Trainer",
                "classId": class_id,
                "className": labelize(class_id or "", "TRAINERCLASS_"),
                "category": category,
                "location": None,
                "region": "Unknown",
                "partySize": row.get("party_size", len(party)),
                "minLevel": row.get("min_level"),
                "maxLevel": row.get("max_level"),
                "party": party,
                "rematch": "rematch" in category.lower(),
                "progression": infer_trainer_progression(category, row),
                "sprite": find_trainer_sprite(engine_root, class_id, trainer_class_ids),
                "sourceRefs": ["exports/perfect_johto/trainer_teams.json"],
                "validationFlags": [] if party else ["Missing party data"],
            }
        )
    trainer_by_num = {trainer["number"]: trainer for trainer in trainers}
    boss_ids = set().union(*id_sets.values())
    boss_fights = []
    for trainer_num in sorted(boss_ids):
        trainer = trainer_by_num.get(trainer_num)
        if not trainer:
            continue
        boss_fights.append(
            {
                "id": f"BOSS_{trainer_num}",
                "trainerId": trainer["id"],
                "number": trainer_num,
                "name": trainer["name"],
                "className": trainer["className"],
                "category": trainer["category"],
                "location": trainer["location"],
                "region": trainer["region"],
                "progression": trainer["progression"],
                "rematch": trainer["rematch"],
                "leadPokemon": trainer["party"][0] if trainer["party"] else None,
                "sprite": trainer["sprite"],
                "party": trainer["party"],
                "partySize": trainer["partySize"],
                "minLevel": trainer["minLevel"],
                "maxLevel": trainer["maxLevel"],
                "typeCoverage": type_coverage_summary(trainer["party"]),
                "weaknessSummary": "Not computed: type chart is intentionally not part of this explorer.",
                "notes": [],
                "validationFlags": trainer["validationFlags"],
            }
        )
    champion_circuit = [fight for fight in boss_fights if fight["number"] in id_sets["champion_circuit"]]
    return trainers, boss_fights, champion_circuit


def infer_trainer_progression(category: str, row: dict[str, Any]) -> str | None:
    max_level = row.get("max_level")
    if category == "Gym Leaders":
        return "Johto/Kanto Gym progression"
    if category == "Elite Four":
        return "Pokemon League"
    if category == "Champion":
        return "Champion battle"
    if category == "Red":
        return "Mt. Silver superboss"
    if "rematch" in category.lower():
        return "Postgame rematch"
    if category == "Champion Circuit":
        return "Saffron Fighting Dojo Champion Circuit"
    if max_level and max_level >= 70:
        return "Postgame"
    if max_level and max_level >= 50:
        return "Late game"
    return None


def type_coverage_summary(party: list[dict[str, Any]]) -> list[dict[str, Any]]:
    counts = Counter(type_name for member in party for type_name in member.get("types", []))
    return [{"type": item[0], "count": item[1]} for item in counts.most_common()]


def parse_statics(exports: dict[str, Any], pokemon_by_id: dict[str, dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    raw_static = exports.get("static_and_gift_pokemon", {}).get("static", [])
    pokemon_by_name = {slugify(mon["name"]): mon for mon in pokemon_by_id.values()}
    statics = []
    dossiers = []
    seen = set()
    for index, row in enumerate(raw_static):
        species_id = row.get("species")
        name = clean_text(row.get("name")) or labelize(species_id or "", "SPECIES_")
        if not species_id:
            matched = pokemon_by_name.get(slugify(name))
            species_id = matched["id"] if matched else None
        mon = pokemon_by_id.get(species_id, {})
        encounter_type = clean_text(row.get("encounter_type"))
        category = encounter_type if "dossier" in encounter_type.lower() else row.get("category") or encounter_type or "static"
        entry = {
            "id": f"STATIC_{index}_{species_id or slugify(name)}",
            "species": species_id,
            "pokemonName": mon.get("name") or name,
            "pokemonIcon": mon.get("assets", {}).get("icon"),
            "types": mon.get("types", []),
            "location": clean_text(row.get("location")),
            "region": infer_region(clean_text(row.get("location"))),
            "level": row.get("level"),
            "category": clean_text(category),
            "requirements": clean_text(row.get("prerequisites")),
            "oneTime": True if row.get("flag") else None,
            "caughtFlag": row.get("flag") or "native roamer" if row.get("encounter_type") == "roaming" else row.get("flag"),
            "retryBehavior": "Retryable if failed/fled/fainted; caught flag is set only on successful capture." if "dossier" in str(row.get("encounter_type", "")).lower() else None,
            "shinyLock": None,
            "heldItem": None,
            "specialMoves": [],
            "sourceRef": "exports/perfect_johto/static_and_gift_pokemon.json",
            "validationFlags": ["Missing shiny lock status", "Missing exact script retry flag"] if "dossier" in str(row.get("encounter_type", "")).lower() else ["Gift/static export is not exhaustive"],
        }
        key = (entry["species"], entry["location"], entry["level"], entry["category"])
        if key in seen:
            continue
        seen.add(key)
        statics.append(entry)
        if "dossier" in str(entry["category"]).lower():
            dossiers.append(entry)
    return statics, dossiers


def parse_marts(exports: dict[str, Any], items_by_id: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    rows = exports.get("items_and_marts", {}).get("badge_mart", [])
    marts = [
        {
            "id": "badge-gated-standard-mart",
            "location": "All standard Pokemon Marts",
            "region": "Johto/Kanto",
            "shopType": "Badge-gated standard mart",
            "unlockRules": "Stock expands by badge count.",
            "items": [
                {
                    "item": row.get("item"),
                    "itemName": items_by_id.get(row.get("item"), {}).get("name") or clean_text(row.get("name")),
                    "price": row.get("price"),
                    "requiredBadges": row.get("required_badges"),
                    "asset": items_by_id.get(row.get("item"), {}).get("asset"),
                }
                for row in rows
            ],
            "sourceRefs": ["exports/perfect_johto/items_and_marts.json"],
        }
    ]
    customization = exports.get("customization_items", [])
    if customization:
        marts.append(
            {
                "id": "customization-item-economy",
                "location": "Badge-gated standard mart",
                "region": "Johto/Kanto",
                "shopType": "Customization and evolution economy",
                "unlockRules": "Mints, capsules, patches, candies, Power items, and evolution items unlock through badge progression.",
                "items": [
                    {
                        "item": row.get("item"),
                        "itemName": items_by_id.get(row.get("item"), {}).get("name") or clean_text(row.get("name")),
                        "price": row.get("price"),
                        "requiredBadges": row.get("required_badges"),
                        "asset": items_by_id.get(row.get("item"), {}).get("asset"),
                    }
                    for row in customization
                ],
                "sourceRefs": ["exports/perfect_johto/customization_items.json"],
            }
        )
    return marts


def feature_cards(exports: dict[str, Any]) -> list[dict[str, str]]:
    return [
        {
            "title": "Rare wild surprises",
            "summary": "Every route and dungeon is worth exploring because many areas hide a low-chance surprise if you keep looking.",
            "body": "Johto and Kanto now have a rare encounter layer built for players who like to hunt. Many routes, caves, waters, and fishing spots include a special low-chance Pokemon that fits the area, from unusual regional forms to starters, fossils, baby Pokemon, and pseudo-legendary lines. You can play normally and occasionally get lucky, or come back later and deliberately hunt the route until its surprise appears.",
            "tag": "Encounters",
        },
        {
            "title": "More wild Pokemon variety",
            "summary": "Wild tables have been rebuilt so new team options appear throughout the journey instead of clustering late.",
            "body": "The wild encounter spread is wider across Johto and Kanto, giving you more meaningful choices while your team is still taking shape. Common encounters still keep each route recognizable, but the expanded tables add more habitats, alternate time-of-day finds, water encounters, fishing options, and late-route upgrades so building a fresh team does not depend on the same small set of early Pokemon every run.",
            "tag": "Encounters",
        },
        {
            "title": "Roaming legendary surprises",
            "summary": "Legendaries are not just sleeping in caves: if you are lucky, some can cross your path in the wild like the anime.",
            "body": "After you have enough badges, eligible wild encounters can rarely become legendary or mythical Pokemon. More Pokemon join the surprise pool as your badge count rises, their levels scale with your progress, and they generally try to flee instead of waiting politely in one cave. Bring status, trapping, Repels, and plenty of Balls when you decide to hunt them.",
            "tag": "Legendaries",
        },
        {
            "title": "Smarter trainer teams",
            "summary": "Regular trainers and bosses use more varied teams that fit who they are and where you meet them.",
            "body": "Trainer rosters have been rebuilt to feel less repetitive without making every battle a competitive puzzle. Hikers lean into rugged Pokemon, swimmers feel at home near water, Rocket teams use rougher or sneakier picks, and boss fights get fuller teams with better level progression. The goal is for battles to be more interesting while still making sense in the world.",
            "tag": "Trainers",
        },
        {
            "title": "Updated Pokemon typing",
            "summary": "Selected Pokemon receive intuitive type updates inspired by Renegade Platinum and Polished Crystal.",
            "body": "A focused set of Pokemon have type updates chosen for flavor, usefulness, and better team variety. The changes follow the spirit of projects like Renegade Platinum and Polished Crystal: make obvious theme matches feel right, give overlooked Pokemon clearer identities, and open up new counters without rewriting the whole type chart.",
            "tag": "Pokemon",
        },
        {
            "title": "Earlier team training items",
            "summary": "Mints, feathers, Ability Capsule, vitamins, candies, and evolution tools arrive earlier through badge-gated shops.",
            "body": "Team tuning is available much earlier than in vanilla. As you earn badges, shops begin offering practical training and customization items such as feathers, EV-reducing berries, mints, Ability Capsule, vitamins, stat candies, Power items, and key evolution items. You can polish favorites during the main story instead of waiting until the run is basically over.",
            "tag": "Items",
        },
        {
            "title": "No-trade evolution fixes",
            "summary": "Trade evolutions have in-game paths so a single player can complete families without another cartridge.",
            "body": "Trade-only and trade-item evolutions are moved to practical in-game methods. Some use direct evolution items, some use familiar move or condition checks, and the relevant items are worked into the badge-gated economy. The result is simple: if a Pokemon is part of the intended scope, you should be able to raise and evolve it in one save.",
            "tag": "Pokemon",
        },
        {
            "title": "One-save Gen 1-4 adventure",
            "summary": "The game is built around making Gen 1-4 Pokemon obtainable in one playthrough where possible.",
            "body": "Johto Reforged is planned around broad Gen 1-4 availability in a single save, with a small number of approved family extensions where they make sense. Wild encounters, gifts, events, evolution changes, and postgame rewards all work toward letting you build teams from across the first four generations without relying on trading or external games.",
            "tag": "Scope",
        },
        {
            "title": "Stronger bosses and rematches",
            "summary": "Gym Leaders, Elite Four, Champion-level fights, and rematches are paced for a fuller Johto-to-Kanto journey.",
            "body": "Major battles use stronger team structures and a smoother level curve so the campaign keeps asking you to adapt. Gym Leaders and higher-tier bosses have more complete rosters, important rematches are available where they belong, and the late game gives trained teams a reason to keep improving after the first credits.",
            "tag": "Trainers",
        },
        {
            "title": "Kanto postgame challenges",
            "summary": "The postgame adds Fighting Dojo rematches, Champion Circuit battles, and legendary or mythical encounters.",
            "body": "Kanto has more to do once the badge journey opens up. The Saffron Fighting Dojo becomes a postgame hub for rematches and Champion Circuit battles, including high-end fights against Lance, Blue, Red, Steven, Wallace, and Cynthia. Legendary and mythical encounters round out the hunt so postgame exploration feels like a real second act.",
            "tag": "Postgame",
        },
    ]


def version_data(romhack_root: Path, exports: dict[str, Any], validation: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    features_text = read_text(romhack_root / "FEATURES_AND_CHANGES.md") if (romhack_root / "FEATURES_AND_CHANGES.md").exists() else ""
    last_updated_match = re.search(r"Last updated:\s*([0-9-]+)", features_text)
    version = {
        "title": "Pokemon Johto Reforged",
        "versionLabel": "Phase 9 validation/export phase" if "Phase 9" in features_text else "Unknown",
        "sourceLastUpdated": last_updated_match.group(1) if last_updated_match else None,
        "exportDate": dt.datetime.now().astimezone().isoformat(timespec="seconds"),
        "sourceRepoPath": str(romhack_root),
        "explorerBuildDate": dt.datetime.now().astimezone().isoformat(timespec="seconds"),
        "latestCompletedPhase": "Phase 8 content complete; Phase 9 validation/export in progress",
        "exportStatus": "Generated from existing JSON exports, HG-Engine source tables, and project docs.",
        "completedSystems": [
            "Approved Pokemon scope and QOL foundation",
            "Pokemon modernization, no-trade evolutions, and learnset generation",
            "Badge-gated item and customization economy",
            "Wild encounter rebuild, rare layer, and random legendary overlay",
            "Trainer roster, boss team, rematch, and level curve pass",
            "Kanto postgame Dojo hub, legendary/mythical dossiers, and Champion Circuit",
        ],
        "knownIncompleteSystems": [
            "Pre-existing gift Pokemon are not exhaustively exported",
            "Trainer map locations are not fully linked in current exports",
            "Shiny lock status is not exported for dossiers/statics",
            "Hidden ability source table is not present in the active source include path",
            "Item descriptions are only populated where reliable project data exists",
        ],
        "validationStatus": validation.get("summary", {}),
    }
    log = [
        {"phase": "Phase 3 - Scope/QOL Foundation", "date": None, "highlights": ["Approved family-based scope policy", "Forbidden later battle gimmicks remain disabled", "Core HGSS-style QOL switches documented"], "links": ["FEATURES_AND_CHANGES.md#phase-3"]},
        {"phase": "Phase 4 - Pokemon Modernization", "date": None, "highlights": ["Selected type modernization", "No-trade evolution replacements", "Level-up learnset cleanup and inheritance work"], "links": ["FEATURES_AND_CHANGES.md#phase-4"]},
        {"phase": "Phase 5 - Item/TM/HM/Mart Economy", "date": None, "highlights": ["Badge-gated mart stock", "Customization item prices", "Max Candy and IV candy support"], "links": ["FEATURES_AND_CHANGES.md#phase-5"]},
        {"phase": "Phase 6 - Encounters and Obtainability", "date": None, "highlights": ["Main wild encounter overhaul", "Rare encounter layer", "Obtainability report", "Random legendary overlay"], "links": ["docs/phase6_obtainability_report.md"]},
        {"phase": "Phase 7 - Trainer Rosters", "date": None, "highlights": ["Six-Pokemon boss teams where implemented", "Gym/E4/Champion/Red level curve", "Rematch teams", "Trainer validation report"], "links": ["docs/phase7_trainer_report.md"]},
        {"phase": "Phase 8 - Kanto Postgame", "date": None, "highlights": ["Saffron Fighting Dojo hub", "Legendary/mythical dossier encounters", "Champion Circuit", "Postgame validation report"], "links": ["docs/phase8_postgame_report.md"]},
        {"phase": "Phase 9 - Explorer Export Readiness", "date": version["sourceLastUpdated"], "highlights": ["Structured exports present", "Static validation reports generated", "Explorer data pipeline consumes source exports without modifying the ROM hack"], "links": ["exports/perfect_johto", "docs/generated/validation_report.md"]},
    ]
    return version, log


class DisjointSet:
    def __init__(self, items: list[str]):
        self.parent = {item: item for item in items}

    def find(self, item: str) -> str:
        self.parent.setdefault(item, item)
        if self.parent[item] != item:
            self.parent[item] = self.find(self.parent[item])
        return self.parent[item]

    def union(self, a: str, b: str) -> None:
        self.parent[self.find(b)] = self.find(a)


def cross_link(data: dict[str, Any]) -> None:
    pokemon_by_id = {mon["id"]: mon for mon in data["pokemon"]}
    moves_by_id = {move["id"]: move for move in data["moves"]}
    items_by_id = {item["id"]: item for item in data["items"]}
    ds = DisjointSet(list(pokemon_by_id))
    for evo in data["evolutions"]:
        if evo["from"] in pokemon_by_id and evo["to"] in pokemon_by_id:
            ds.union(evo["from"], evo["to"])
            pokemon_by_id[evo["from"]]["evolvesTo"].append(evo)
            pokemon_by_id[evo["to"]]["evolvesFrom"].append(evo)
    direct_available_by_family: set[str] = set()
    for enc in data["encounters"]:
        mon = pokemon_by_id.get(enc["species"])
        if not mon:
            continue
        mon["encounters"].append(enc["id"])
        mon["availability"]["wildCount"] += 1
        if enc["rareNotes"]:
            mon["availability"]["rareNotes"].extend(note.get("raw") for note in enc["rareNotes"])
        direct_available_by_family.add(ds.find(enc["species"]))
    for entry in data["staticsGifts"]:
        mon = pokemon_by_id.get(entry.get("species"))
        if not mon:
            continue
        mon["staticsGifts"].append(entry["id"])
        mon["availability"]["staticGiftCount"] += 1
        direct_available_by_family.add(ds.find(entry["species"]))
    for trainer in data["trainers"]:
        for member in trainer["party"]:
            mon = pokemon_by_id.get(member.get("species"))
            if not mon:
                continue
            mon["trainerUsage"].append({"trainerId": trainer["id"], "trainerName": trainer["name"], "category": trainer["category"], "level": member.get("level")})
            mon["availability"]["trainerCount"] += 1
    for mon in data["pokemon"]:
        family_available = ds.find(mon["id"]) in direct_available_by_family
        if mon["availability"]["wildCount"]:
            mon["availability"]["summary"] = f"Wild in {mon['availability']['wildCount']} encounter entries."
        elif mon["availability"]["staticGiftCount"]:
            mon["availability"]["summary"] = "Static, gift, roaming, or dossier availability exported."
        elif mon["evolvesFrom"] and family_available:
            mon["availability"]["summary"] = "Evolution-only within an available family."
        elif family_available:
            mon["availability"]["summary"] = "Family has exported availability; exact path may depend on evolution data."
        elif mon["trainerUsage"]:
            mon["availability"]["summary"] = "Trainer usage exported; player availability not confirmed."
            mon["validationFlags"].append("No player availability export found")
        else:
            mon["availability"]["summary"] = "No availability found in current exports."
            mon["validationFlags"].append("No availability found")
        if mon["encounters"]:
            first = next((enc for enc in data["encounters"] if enc["id"] == mon["encounters"][0]), None)
            if first:
                mon["availability"]["earliest"] = first["locationName"]
    for item in data["items"]:
        for evo in item["evolutionUsage"]:
            evo["itemName"] = item["name"]
    for evo in data["evolutions"]:
        if evo["parameter"].startswith("ITEM_") and evo["parameter"] not in items_by_id:
            evo["validationFlags"].append("Evolution item missing from item constants")
        if evo["method"] in {"EVO_TRADE", "EVO_TRADE_ITEM"}:
            evo["validationFlags"].append("Trade evolution still present")
        if evo["method"] != "EVO_TRADE" and evo["isNoTradeReplacement"]:
            evo["validationFlags"].append("No-trade replacement")
        if evo["parameter"].startswith("MOVE_") and evo["parameter"] not in moves_by_id:
            evo["validationFlags"].append("Evolution move missing from move constants")


def validate(data: dict[str, Any], exports: dict[str, Any]) -> dict[str, Any]:
    pokemon_by_id = {mon["id"]: mon for mon in data["pokemon"]}
    moves_by_id = {move["id"]: move for move in data["moves"]}
    items_by_id = {item["id"]: item for item in data["items"]}
    abilities_by_id = {ability["id"]: ability for ability in data["abilities"]}
    issues: dict[str, list[Any]] = defaultdict(list)
    for mon in data["pokemon"]:
        if mon["scopeStatus"] != "Out of approved scope" and "No availability found" in mon["validationFlags"]:
            issues["pokemonWithNoAvailability"].append({"id": mon["id"], "name": mon["name"]})
        if not mon["assets"].get("icon"):
            issues["missingPokemonIcons"].append({"id": mon["id"], "name": mon["name"]})
        if not mon["assets"].get("sprite"):
            issues["missingPokemonSprites"].append({"id": mon["id"], "name": mon["name"]})
    purchased_items = {entry["item"] for mart in data["marts"] for entry in mart["items"]}
    for evo in data["evolutions"]:
        if "Trade evolution still present" in evo["validationFlags"]:
            issues["impossibleOrSuspiciousEvolutions"].append(evo)
        if evo["parameter"].startswith("ITEM_") and evo["parameter"] not in purchased_items:
            issues["evolutionItemsUnavailable"].append(evo)
    for move in data["moves"]:
        if not move["description"]:
            issues["movesWithNoDescriptions"].append({"id": move["id"], "name": move["name"]})
        if not move["effectSummary"]:
            issues["movesWithNoParsedEffects"].append({"id": move["id"], "name": move["name"], "effect": move["effect"]})
    for ability in data["abilities"]:
        if not ability["description"]:
            issues["abilitiesMissingDescriptions"].append({"id": ability["id"], "name": ability["name"]})
    for item in data["items"]:
        if not item["description"]:
            issues["itemsMissingDescriptions"].append({"id": item["id"], "name": item["name"]})
        if not item["asset"]:
            issues["missingItemIcons"].append({"id": item["id"], "name": item["name"]})
    for trainer in data["trainers"]:
        if not trainer["party"]:
            issues["trainersWithMissingPartyData"].append({"id": trainer["id"], "name": trainer["name"]})
    for location in data["locations"]:
        if not any(location[key] for key in ["encounters", "trainers", "items", "staticsGifts", "marts", "bossFights"]):
            issues["locationsWithNoLinkedContent"].append({"id": location["id"], "name": location["name"]})
    for area, method, total in encounter_totals(exports):
        if total not in {0, 100}:
            issues["encounterChanceTotals"].append({"area": area, "method": method, "total": total})
    seen_encounters = set()
    for enc in data["encounters"]:
        key = (enc["locationId"], enc["method"], enc["time"], enc["slot"], enc["species"], enc["chance"], enc["minLevel"], enc["maxLevel"])
        if key in seen_encounters:
            issues["duplicateEncounterEntries"].append(enc)
        seen_encounters.add(key)
        if enc["species"] not in pokemon_by_id:
            issues["brokenLinks"].append({"kind": "encounterSpecies", "id": enc["species"]})
    for trainer in data["trainers"]:
        for member in trainer["party"]:
            if member["species"] not in pokemon_by_id:
                issues["brokenLinks"].append({"kind": "trainerSpecies", "id": member["species"], "trainer": trainer["id"]})
            for move in member["moves"]:
                if move["id"] not in moves_by_id:
                    issues["brokenLinks"].append({"kind": "trainerMove", "id": move["id"], "trainer": trainer["id"]})
            if member["item"] and member["item"] != "ITEM_NONE" and member["item"] not in items_by_id:
                issues["brokenLinks"].append({"kind": "trainerItem", "id": member["item"], "trainer": trainer["id"]})
    approved_later = set(exports.get("approved_scope", {}).get("approved_later_exceptions", []))
    for section in ["encounters", "staticsGifts"]:
        for row in data[section]:
            species = row.get("species")
            mon = pokemon_by_id.get(species)
            if mon and mon["dexNo"] > 493 and species not in approved_later:
                issues["pokemonOutsideApprovedScope"].append({"section": section, "species": species, "name": mon["name"]})
    for trainer in data["trainers"]:
        for member in trainer["party"]:
            mon = pokemon_by_id.get(member["species"])
            if mon and mon["dexNo"] > 493 and member["species"] not in approved_later:
                issues["pokemonOutsideApprovedScope"].append({"section": "trainers", "species": member["species"], "name": mon["name"], "trainer": trainer["id"]})
    for dossier in data["legendaryDossiers"]:
        if not dossier.get("caughtFlag"):
            issues["legendaryDossiersMissingFlags"].append(dossier)
        if not dossier.get("requirements"):
            issues["legendaryDossiersMissingRequirements"].append(dossier)
    missing_boss_details = []
    for boss in data["bossFights"]:
        for member in boss["party"]:
            if not member["moves"]:
                missing_boss_details.append({"boss": boss["name"], "pokemon": member["pokemonName"], "field": "moves"})
            if member["item"] in {None, "ITEM_NONE"}:
                continue
            if member["item"] not in items_by_id:
                missing_boss_details.append({"boss": boss["name"], "pokemon": member["pokemonName"], "field": "item link"})
    issues["bossTeamsWithMissingMovesItemsAbilities"] = missing_boss_details
    counts = {
        "pokemon": len(data["pokemon"]),
        "moves": len(data["moves"]),
        "abilities": len(data["abilities"]),
        "items": len(data["items"]),
        "trainers": len(data["trainers"]),
        "locations": len(data["locations"]),
        "wildEncounterEntries": len(data["encounters"]),
        "staticGiftEntries": len(data["staticsGifts"]),
        "martShopCount": len(data["marts"]),
        "bossFights": len(data["bossFights"]),
        "legendaryDossiers": len(data["legendaryDossiers"]),
    }
    asset_coverage = {
        "pokemonWithIcons": counts_with(data["pokemon"], lambda item: item["assets"].get("icon")),
        "pokemonWithSprites": counts_with(data["pokemon"], lambda item: item["assets"].get("sprite")),
        "trainersWithSprites": counts_with(data["trainers"], lambda item: item.get("sprite")),
        "itemsWithIcons": counts_with(data["items"], lambda item: item.get("asset")),
        "missingPokemonAssets": len(issues["missingPokemonIcons"]),
        "missingTrainerAssets": len(data["trainers"]),
        "missingItemAssets": len(issues["missingItemIcons"]),
    }
    severity_counts = {
        "critical": len(issues["brokenLinks"]) + len(issues["pokemonOutsideApprovedScope"]),
        "warnings": sum(len(v) for k, v in issues.items() if k not in {"brokenLinks", "pokemonOutsideApprovedScope"}),
    }
    return {
        "generatedAt": dt.datetime.now().astimezone().isoformat(timespec="seconds"),
        "summary": {
            "counts": counts,
            "assetCoverage": asset_coverage,
            "issueCounts": {key: len(value) for key, value in sorted(issues.items())},
            "severityCounts": severity_counts,
            "status": "PASS" if severity_counts["critical"] == 0 else "REVIEW",
        },
        "issues": issues,
    }


def encounter_totals(exports: dict[str, Any]) -> list[tuple[str, str, int]]:
    totals: list[tuple[str, str, int]] = []
    method_keys = ["land", "surf", "water", "rock_smash", "old_rod", "good_rod", "super_rod"]
    for table in exports.get("wild_encounters", []):
        area = table.get("area", "UNKNOWN")
        for key in method_keys:
            slots = table.get(key)
            if isinstance(slots, list) and slots:
                totals.append((area, key, sum(int(slot.get("rate_percent") or 0) for slot in slots)))
    return totals


def counts_with(items: list[dict[str, Any]], predicate: Any) -> int:
    return sum(1 for item in items if predicate(item))


def write_json(name: str, data: Any) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / name).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown_report(report: dict[str, Any]) -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Pokemon Johto Reforged Explorer Validation Report",
        "",
        f"Generated: {report['generatedAt']}",
        f"Status: {report['summary']['status']}",
        "",
        "## Counts",
        "",
    ]
    for key, value in report["summary"]["counts"].items():
        lines.append(f"- {key}: {value}")
    lines.extend(["", "## Asset Coverage", ""])
    for key, value in report["summary"]["assetCoverage"].items():
        lines.append(f"- {key}: {value}")
    lines.extend(["", "## Issue Counts", ""])
    for key, value in report["summary"]["issueCounts"].items():
        lines.append(f"- {key}: {value}")
    lines.extend(["", "## Sample Issues", ""])
    for key, values in report["issues"].items():
        if not values:
            continue
        lines.append(f"### {key}")
        for item in values[:25]:
            lines.append(f"- `{json.dumps(item, ensure_ascii=False)[:500]}`")
        if len(values) > 25:
            lines.append(f"- ... {len(values) - 25} more")
        lines.append("")
    (DOCS_DIR / "validation_report.md").write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def write_schema_docs() -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    content = """# Data Schema

Generated JSON lives in `public/data/`. Source records are copied from the Pokemon Johto Reforged repo and normalized for static browsing.

- `pokemon.json`: species profile records with stats, typing, abilities, learnsets, evolutions, availability links, and asset references.
- `moves.json`: move records with type/category/power/accuracy/PP/flags/descriptions/effect summaries and linked learners.
- `abilities.json`: ability names/descriptions and linked Pokemon slots.
- `items.json`: item constants, names, prices, pockets, mart availability, held/evolution usage, technical fields, and icons when available.
- `locations.json`: inferred location records linked to encounters and future location-scoped exports.
- `encounters.json`: flattened wild encounter slots with method, time, level range, chance, rarity, Pokemon, and location links.
- `trainers.json`: trainer parties from exported trainer data.
- `boss_fights.json`: boss-oriented subset linked back to trainer records.
- `statics_gifts.json`: static, roaming, gift, and dossier-style exported encounters.
- `legendary_dossiers.json`: Phase 8 dossier subset with flags/requirements where exported.
- `marts.json`: badge-gated shop exports.
- `evolutions.json`: normalized evolution rows and validation flags.
- `features.json`, `version.json`, `version_log.json`: docs-derived overview and release state.
- `assets_manifest.json`: copied asset coverage summary.
- `validation_report.json`: machine-readable validation output.

Unknown fields are intentionally represented as `null`, empty arrays, or validation flags instead of guessed values.
"""
    (DOCS_DIR / "data_schema.md").write_text(content, encoding="utf-8")


def load_exports(romhack_root: Path) -> dict[str, Any]:
    export_root = romhack_root / "exports" / "perfect_johto"
    names = [
        "approved_scope",
        "approved_later_exceptions",
        "boss_battles",
        "champion_circuit",
        "customization_items",
        "elite_four_champions",
        "evolutions",
        "gym_leaders",
        "items_and_marts",
        "kanto_postgame",
        "known_risks",
        "level_curve",
        "max_candy",
        "pokemon_availability",
        "proper_legendary_events",
        "random_legendary_surprise",
        "rare_encounters",
        "rematches",
        "static_and_gift_pokemon",
        "trade_evolution_replacements",
        "trainer_teams",
        "wild_encounters",
    ]
    return {name: load_json(export_root / f"{name}.json", [] if name.endswith("s") else {}) for name in names}


def build(romhack_root: Path, validate_only: bool = False) -> dict[str, Any]:
    if not romhack_root.exists():
        raise SystemExit(f"Romhack root not found: {romhack_root}")
    if ASSET_DIR.exists() and not validate_only:
        shutil.rmtree(ASSET_DIR)
    exports = load_exports(romhack_root)
    engine_root = romhack_root / "hg-engine-main" / "hg-engine-main"
    evolutions = parse_evolutions(exports)
    pokemon = parse_species(engine_root, exports.get("approved_scope", {}))
    moves = parse_moves(engine_root)
    parse_learnsets(engine_root, pokemon, moves)
    pokemon_by_id = {mon["id"]: mon for mon in pokemon}
    moves_by_id = {move["id"]: move for move in moves}
    abilities = parse_abilities(engine_root, pokemon)
    items = parse_items(engine_root, exports, evolutions, pokemon)
    items_by_id = {item["id"]: item for item in items}
    encounters, locations = flatten_encounters(exports, pokemon_by_id)
    trainers, boss_fights, champion_circuit = parse_trainers(engine_root, exports, pokemon_by_id, moves_by_id, items_by_id)
    statics_gifts, legendary_dossiers = parse_statics(exports, pokemon_by_id)
    marts = parse_marts(exports, items_by_id)
    data = {
        "pokemon": pokemon,
        "moves": moves,
        "abilities": abilities,
        "items": items,
        "locations": locations,
        "encounters": encounters,
        "trainers": trainers,
        "bossFights": boss_fights,
        "championCircuit": champion_circuit,
        "staticsGifts": statics_gifts,
        "legendaryDossiers": legendary_dossiers,
        "marts": marts,
        "evolutions": evolutions,
        "randomLegendary": exports.get("random_legendary_surprise", {}),
        "knownRisks": exports.get("known_risks", {}),
    }
    cross_link(data)
    validation = validate(data, exports)
    features = feature_cards(exports)
    version, version_log = version_data(romhack_root, exports, validation)
    data.update({"features": features, "version": version, "versionLog": version_log, "validationReport": validation})
    data["assetsManifest"] = validation["summary"]["assetCoverage"]
    if not validate_only:
        for filename, key in [
            ("pokemon.json", "pokemon"),
            ("moves.json", "moves"),
            ("abilities.json", "abilities"),
            ("items.json", "items"),
            ("locations.json", "locations"),
            ("encounters.json", "encounters"),
            ("trainers.json", "trainers"),
            ("boss_fights.json", "bossFights"),
            ("champion_circuit.json", "championCircuit"),
            ("statics_gifts.json", "staticsGifts"),
            ("legendary_dossiers.json", "legendaryDossiers"),
            ("marts.json", "marts"),
            ("evolutions.json", "evolutions"),
            ("features.json", "features"),
            ("version.json", "version"),
            ("version_log.json", "versionLog"),
            ("random_legendary.json", "randomLegendary"),
            ("known_risks.json", "knownRisks"),
            ("assets_manifest.json", "assetsManifest"),
            ("validation_report.json", "validationReport"),
        ]:
            write_json(filename, data[key])
        index = {
            "title": "Pokemon Johto Reforged Explorer",
            "generatedAt": validation["generatedAt"],
            "sourceRepoPath": str(romhack_root),
            "files": {
                "pokemon": "pokemon.json",
                "moves": "moves.json",
                "abilities": "abilities.json",
                "items": "items.json",
                "locations": "locations.json",
                "encounters": "encounters.json",
                "trainers": "trainers.json",
                "bossFights": "boss_fights.json",
                "championCircuit": "champion_circuit.json",
                "staticsGifts": "statics_gifts.json",
                "legendaryDossiers": "legendary_dossiers.json",
                "marts": "marts.json",
                "evolutions": "evolutions.json",
                "features": "features.json",
                "version": "version.json",
                "versionLog": "version_log.json",
                "randomLegendary": "random_legendary.json",
                "knownRisks": "known_risks.json",
                "assetsManifest": "assets_manifest.json",
                "validationReport": "validation_report.json",
            },
            "counts": validation["summary"]["counts"],
        }
        write_json("index.json", index)
        write_markdown_report(validation)
        write_schema_docs()
    else:
        write_markdown_report(validation)
        write_json("validation_report.json", validation)
    print_console_report(validation)
    return data


def print_console_report(report: dict[str, Any]) -> None:
    print("Pokemon Johto Reforged Explorer validation")
    print(f"Status: {report['summary']['status']}")
    print("Counts:")
    for key, value in report["summary"]["counts"].items():
        print(f"  {key}: {value}")
    print("Issue counts:")
    for key, value in report["summary"]["issueCounts"].items():
        print(f"  {key}: {value}")
    print(f"Markdown report: {DOCS_DIR / 'validation_report.md'}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build static Pokemon Johto Reforged explorer data.")
    parser.add_argument("--romhack-root", type=Path, default=DEFAULT_ROMHACK_ROOT)
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    build(args.romhack_root, args.validate_only)


if __name__ == "__main__":
    main()
