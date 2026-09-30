#!/usr/bin/env python3
from __future__ import annotations

import colorsys
import hashlib
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "media"
OUTPUT = MEDIA / "cases.json"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
VIDEO_EXTS = {".mp4", ".webm", ".ogg"}

def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))

def stable_unit(seed: str, offset: int = 0) -> float:
    digest = hashlib.sha256(f"{seed}:{offset}".encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big") / float(2**64 - 1)

def color_from_hsv(h: float, s: float, v: float) -> str:
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, clamp(s), clamp(v))
    return "#{:02x}{:02x}{:02x}".format(round(r * 255), round(g * 255), round(b * 255))

def generated_palette(seed: str):
    base = stable_unit(seed, 1)
    return [
        color_from_hsv(base, 0.62, 1.0),
        color_from_hsv(base + 0.19 + stable_unit(seed, 2) * 0.08, 0.68, 1.0),
        color_from_hsv(base + 0.55 + stable_unit(seed, 3) * 0.08, 0.70, 1.0),
    ]

def human_title(folder_name: str) -> str:
    name = re.sub(r"^\d+[\-_ ]*", "", folder_name)
    parts = re.split(r"[-_]+", name)
    return " ".join(p[:1].upper() + p[1:] for p in parts if p) or folder_name

def read_metadata(folder: Path):
    path = folder / "case.json"
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception as exc:
        print(f"Warning: cannot parse {path}: {exc}")
        return {}

def root_path(path: Path) -> str:
    return "/" + path.relative_to(ROOT).as_posix()

def scan_case(folder: Path):
    metadata = read_metadata(folder)
    files = sorted(
        (p for p in folder.iterdir() if p.is_file() and p.name != "case.json"),
        key=lambda p: p.name.lower(),
    )

    images = [p for p in files if p.suffix.lower() in IMAGE_EXTS]
    videos = [p for p in files if p.suffix.lower() in VIDEO_EXTS]

    if not images and not videos:
        return None

    folder_slug = folder.name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", folder_slug).strip("-")
    seed = slug or folder.name
    media_count = len(images) + len(videos)

    intensity = clamp(0.48 + min(media_count, 12) * 0.035 + (0.08 if videos else 0))
    complexity = clamp(0.50 + min(len(images), 14) * 0.028 + len(videos) * 0.05)

    inferred_tags = []
    if videos:
        inferred_tags.extend(["Motion", "Film"])
    if len(images) >= 6:
        inferred_tags.append("Archive")
    if len(images) >= 10:
        inferred_tags.append("Editorial")
    if not inferred_tags:
        inferred_tags.append("Visual")

    visual = {
        "scaffoldScale": round(0.90 + stable_unit(seed, 10) * 0.24, 4),
        "shellScale": round(0.90 + stable_unit(seed, 11) * 0.22, 4),
        "giantScale": round(0.90 + stable_unit(seed, 12) * 0.28, 4),
        "bloomBias": round(-0.08 + stable_unit(seed, 13) * 0.22, 4),
        "orbitBias": round(-0.18 + stable_unit(seed, 14) * 0.36, 4),
        "moireBias": round(-0.12 + stable_unit(seed, 15) * 0.28, 4),
    }
    visual.update(metadata.get("visual", {}))

    presentation = {
        "images": [
            {
                "src": root_path(p),
                "alt": f"{metadata.get('title', human_title(folder.name))} — {p.stem}",
            }
            for p in images
        ]
    }
    if videos:
        preferred = next(
            (p for p in videos if p.stem.lower() in {"hero", "main", "cover", "intro"}),
            videos[0],
        )
        presentation["video"] = {"src": root_path(preferred)}

    case = {
        "id": metadata.get("id", slug),
        "slug": metadata.get("slug", slug),
        "folder": folder.name,
        "title": metadata.get("title", human_title(folder.name)),
        "year": metadata.get("year", datetime.now().year),
        "order": metadata.get("order", 9999),
        "location": metadata.get(
            "location",
            {"city": "", "country": "", "lat": 0, "lng": 0},
        ),
        "disciplines": metadata.get("disciplines", ["Visual"]),
        "tags": metadata.get("tags", inferred_tags),
        "palette": metadata.get("palette", generated_palette(seed)),
        "intensity": metadata.get("intensity", round(intensity, 4)),
        "complexity": metadata.get("complexity", round(complexity, 4)),
        "featured": metadata.get("featured", False),
        "visual": visual,
        "presentation": presentation,
    }

    if images:
        case["hero"] = {"image": root_path(images[0])}
        if videos:
            case["hero"]["video"] = presentation["video"]["src"]
    elif videos:
        case["hero"] = {"video": presentation["video"]["src"]}

    return case

def main():
    MEDIA.mkdir(parents=True, exist_ok=True)

    cases = []
    for folder in sorted(p for p in MEDIA.iterdir() if p.is_dir() and not p.name.startswith(".")):
        case = scan_case(folder)
        if case:
            cases.append(case)

    cases.sort(key=lambda c: (c.get("order", 9999), c.get("title", "").lower()))
    for case in cases:
        case.pop("order", None)

    payload = {
        "generated": datetime.now().isoformat(timespec="seconds"),
        "cases": cases,
    }

    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(cases)} cases")

if __name__ == "__main__":
    main()
