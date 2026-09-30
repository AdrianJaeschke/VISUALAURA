# VISUALAURA

Interaktive Portfolio-Installation auf Basis von Three.js.

## Aktueller Stand

Die Installation ist jetzt modular aufgebaut und übersetzt Case-Daten in eine kantige, triangulierte visuelle Signatur.

### Visuelle Layer

- Turret Road als Display-Typografie für UI und Headlines

- kein zentraler Blob mehr: ein räumliches Feld aus großen und hunderten kleinen Dreiecken
- viele große Dreiecke clustern sich dicht im Zentrum und nehmen nach außen schnell ab
- große Dreiecke spiegeln den Webcam-Input heller und chrome-artiger
- verschachtelte Triangle-Ringe und sägezahnartige Dreiecksketten
- zusätzliche 3D-Tetraeder zwischen den 2D-Dreiecken
- Headlines hängen an großen Triangle-Ankern und laufen zusätzlich als schmale Edge-Stränge
- Triangle-Wireframe + irisierende Lichtkanten
- irisierende Highlights
- Schwarz-Weiß-Moiré und Zebra-Shader mit irisierenden Kanten
- leuchtende Datenlinien
- Case-Headlines direkt in der 3D-Struktur
- kontrollierte Pixel-Glitches und Scanline-Artefakte
- Webcam ausschließlich auf den großen reflektierenden Dreiecksflächen
- extrem unscharfe Kamerabewegung im Hintergrund
- Halo-/Echo-Ebenen duplizieren Dreiecksstrukturen in die Tiefe

### Interaktion

- Desktop: Maus + Scroll + optionale Webcam
- Mobile: Touch + Device Orientation + optionale Kamera
- Case-Wechsel verändert Form, Farbe, Moiré, Glitch, Licht und Headlines

## Struktur

```
index.html
styles.css
src/
  main.js
  cases.js
  cms.js
  interpreter.js
  camera-input.js
  scene.js
```

### Dateien

- `src/main.js` — App-State, Eingabe, Case-Wechsel, Animation
- `src/cases.js` — lokale Demo-Daten
- `src/cms.js` — Adapter für ein späteres `/api/cases`
- `src/interpreter.js` — übersetzt Case-Daten in visuelle Parameter
- `src/camera-input.js` — Webcam-Stream, reduzierte Video-Textur und Motion-Analyse
- `src/scene.js` — Three.js-Szene, Shader, Wireframe, Flow-Lines und Headline-Struktur

## CMS/API-Datenmodell

Erwartet wird pro Case ungefähr:

```js
{
  id: "signal-garden",
  slug: "signal-garden",
  title: "Signal Garden",
  year: 2026,
  location: {
    city: "Munich",
    country: "DE",
    lat: 48.137,
    lng: 11.575
  },
  disciplines: ["Spatial", "Digital"],
  tags: ["Realtime", "Data", "Light"],
  palette: ["#74f7ff", "#7b69ff", "#ff4ecf"],
  intensity: 0.84,
  complexity: 0.78,
  featured: true,
  hero: {
    image: "/media/signal-garden.jpg",
    video: "/media/signal-garden.mp4"
  }
}
```

Wenn `/api/cases` nicht erreichbar ist, fällt die App automatisch auf `src/cases.js` zurück. Menschen lieben resiliente Systeme, meist nachdem sie zuerst ein fragiles gebaut haben.

## Visual Mapping

- Jahr → Morphing / strukturelle Entwicklungsstufe
- Location → Rotation / Tilt
- Tags → Glitch-Verhalten
- Palette → Wireframe, Licht, Headlines und Flow-Lines
- Intensität → Lichtstärke / Dynamik
- Komplexität → Dichte, Moiré und Linienstruktur

## Lokal starten

Die Kamera benötigt einen sicheren Kontext. Lokal reicht `localhost`:

```bash
python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

## Nächste Schritte

1. echtes Backend/CMS an `/api/cases` anbinden
2. räumliche, anklickbare Case-Nodes ergänzen
3. WebXR-Hit-Testing für echte AR-Platzierung ergänzen
4. Shader-Performance auf Mobile weiter optimieren
5. Case-Medien als zusätzliche dynamische Texturen integrieren
