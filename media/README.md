# Case media

Cases werden jetzt **ordnerbasiert automatisch erkannt**. Du musst für neue Cases keinen JavaScript-Code mehr anfassen.

## Upload

Lege pro Case einfach einen Ordner unter `media/` an:

```
media/
  01-signal-garden/
    hero.mp4
    01.jpg
    02.jpg
    03.webp

  02-afterimage/
    01.jpg
    02.jpg
    detail.webm
```

Nach dem Upload startet automatisch die GitHub Action **Rebuild case manifest**. Sie scannt alle Case-Ordner und erzeugt `media/cases.json`.

Das Frontend lädt dieses Manifest automatisch.

## Was automatisch erkannt wird

Bilder:

- .jpg / .jpeg
- .png
- .webp
- .avif
- .gif

Videos:

- .mp4
- .webm
- .ogg

Wenn ein Video `hero`, `main`, `cover` oder `intro` heißt, wird es bevorzugt als Hauptvideo verwendet.

Aus dem Ordnernamen wird automatisch der Case-Titel erzeugt. Aus `01-signal-garden` wird beispielsweise **Signal Garden**.

## Aura automatisch pro Case

Auch ohne Metadaten bekommt jeder Ordner automatisch eine eigene visuelle Signatur:

- eigene Palette
- Intensität
- Komplexität
- Scaffold-Größe
- Polygon-Shell-Größe
- Giant-Wire-Größe
- Bloom-Bias
- Rotation / Orbit
- Moiré-Variation

Die Werte werden stabil aus dem Case-Namen und der Medienanzahl abgeleitet.

## Optional: case.json

Nur wenn du Text oder Reihenfolge genauer festlegen willst, kannst du zusätzlich eine `case.json` in den Ordner legen. Sie ist **nicht erforderlich**.

Beispiel:

```json
{
  "title": "Signal Garden",
  "year": 2026,
  "order": 1,
  "location": {
    "city": "Munich",
    "country": "DE"
  },
  "disciplines": ["Spatial", "Digital"],
  "tags": ["Realtime", "Light"],
  "palette": ["#74f7ff", "#7b69ff", "#ff4ecf"]
}
```

## Hinweis zu großen Videos

Für die aktuelle Phase können MP4/WebM-Dateien im Repository liegen. Für sehr große Produktionsvideos ist später ein Media-CDN oder CMS sinnvoller, damit Git nicht irgendwann zur digitalen Abstellkammer wird.
