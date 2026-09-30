# Case media

Cases werden ordnerbasiert automatisch erkannt. Für neue Projekte musst du keinen JavaScript-Code mehr anfassen.

## Ordnerstruktur

Pro Projekt ein Ordner unter `media/`:

```
media/
  case1/
    case1.txt
    01.jpg
    02.jpg
    hero.mp4

  case2/
    project.txt
    01.jpg
    02.webp
```

Die Dateinamen der TXT-Datei sind egal. Wenn mehrere `.txt` Dateien vorhanden sind, wird zuerst eine Datei bevorzugt, deren Name dem Ordnernamen entspricht, ansonsten die alphabetisch erste.

## TXT-Format

Die erste nichtleere Zeile ist immer der **Projektname**.

Alle weiteren nichtleeren Zeilen bilden den **Beschreibungstext**.

Beispiel:

```txt
PORSCHE PIONEERS CIRCLE
First immersive NFT Experience Campaign
```

Daraus wird automatisch:

```json
{
  "title": "PORSCHE PIONEERS CIRCLE",
  "description": "First immersive NFT Experience Campaign"
}
```

Der Titel erscheint in der Case-Navigation und in der räumlichen Case-Headline. Die Beschreibung wird direkt darunter dargestellt.

## Automatischer Scan

Nach einem Upload unter `media/**` startet die GitHub Action **Rebuild case manifest**.

Sie führt `tools/build-cases.py` aus und erzeugt automatisch:

```
media/cases.json
```

Das Frontend lädt dieses Manifest als primäre Case-Datenquelle.

## Erkannte Medien

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

## Aura pro Case

Jeder Case bekommt automatisch eine eigene stabile visuelle Signatur:

- Palette
- Intensität
- Komplexität
- Hero-Triangle Scale
- Moiré Scale
- Iridescent-Aura Scale
- Outer-Wire Scale
- Bloom Bias
- Orbit
- Iridescence
- Moiré Bias

Optional kann weiterhin eine `case.json` im Ordner liegen. Werte aus `case.json` überschreiben die automatisch gelesenen bzw. generierten Werte.

Für große Produktionsvideos ist später ein Media-CDN sinnvoller. Git als Videospeicher funktioniert, bis Git irgendwann sehr deutlich mitteilt, dass Menschen wieder einmal Dateisysteme mit Datenbanken verwechselt haben.
