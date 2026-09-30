#!/usr/bin/env python3
"""Build the lightweight VISUALAURA anchor template from a Blender OBJ.

Usage:
    python3 tools/build-template.py visual_aura.obj assets/visual-aura-template.json

The runtime does not render the OBJ directly. It uses sampled face centroids,
normals and areas as a parametric scaffold for triangles, tetrahedra, line
networks and depth halos.
"""

from __future__ import annotations

import json
import math
import sys
from collections import defaultdict
from pathlib import Path


OBJECTS = {
    "core": ("Cube.001", 60),
    "shards": ("FX_shards", 80),
    "floor": ("FX_floor_facets", 48),
    "struts": ("FX_struts", 60),
}


def vec_sub(a, b):
    return [a[i] - b[i] for i in range(3)]


def cross(a, b):
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]


def length(v):
    return math.sqrt(sum(x * x for x in v))


def face_data(indices, vertices):
    points = [vertices[i] for i in indices]
    centroid = [sum(p[d] for p in points) / len(points) for d in range(3)]

    normal = [0.0, 0.0, 0.0]
    area = 0.0

    for i in range(1, len(points) - 1):
        c = cross(vec_sub(points[i], points[0]), vec_sub(points[i + 1], points[0]))
        area += length(c) * 0.5
        normal = [normal[d] + c[d] for d in range(3)]

    nlen = length(normal)
    if nlen:
        normal = [x / nlen for x in normal]

    return {
        "p": [round(x, 3) for x in centroid],
        "n": [round(x, 3) for x in normal],
        "a": round(area, 3),
    }


def parse_obj(path: Path):
    vertices = [None]
    faces = defaultdict(list)
    current = "default"

    for raw in path.read_text(encoding="utf-8").splitlines():
        if raw.startswith("o "):
            current = raw[2:].strip()
        elif raw.startswith("v "):
            _, x, y, z, *_ = raw.split()
            vertices.append([float(x), float(y), float(z)])
        elif raw.startswith("f "):
            indices = [int(token.split("/")[0]) for token in raw.split()[1:]]
            faces[current].append(indices)

    return vertices, faces


def sample_group(data, count, keep_largest=True):
    if len(data) <= count:
        return data

    if not keep_largest:
        step = max(1, len(data) // count)
        return data[::step][:count]

    largest_count = count // 2
    largest = sorted(data, key=lambda item: item["a"], reverse=True)[:largest_count]
    remaining = count - largest_count
    step = max(1, len(data) // remaining)
    distributed = data[::step][:remaining]
    return largest + distributed


def main():
    if len(sys.argv) != 3:
        raise SystemExit(
            "usage: build-template.py <visual_aura.obj> <visual-aura-template.json>"
        )

    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])

    vertices, faces = parse_obj(src)
    groups = {}

    for key, (object_name, count) in OBJECTS.items():
        if object_name not in faces:
            raise SystemExit(f"missing OBJ object: {object_name}")

        data = [face_data(face, vertices) for face in faces[object_name]]
        groups[key] = sample_group(
            data,
            count,
            keep_largest=key != "floor",
        )

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(
        json.dumps({"source": src.name, "groups": groups}, separators=(",", ":")),
        encoding="utf-8",
    )

    print(f"wrote {dst}")
    for key, values in groups.items():
        print(f"  {key}: {len(values)} anchors")


if __name__ == "__main__":
    main()
