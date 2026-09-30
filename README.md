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
  case-presentation.js
  params.js
```

### Dateien

- `src/main.js` — App-State, Eingabe, Case-Wechsel, Animation
- `src/cases.js` — lokale Demo-Daten
- `src/cms.js` — Adapter für ein späteres `/api/cases`
- `src/interpreter.js` — übersetzt Case-Daten in visuelle Parameter
- `src/camera-input.js` — Webcam-Stream, reduzierte Video-Textur und Motion-Analyse
- `src/scene.js` — Three.js-Szene, Shader, Triangle-Felder, Halos und Headline-Struktur
- `src/case-presentation.js` — räumliche Case-Medien, Video, zentrale Headline und reaktive Bildstaffelung
- `src/params.js` — zentrale Parameter für Geometrie, Kamera-Delay, Reaktionsstärke, Look und Case-Presentation

## Parametrischer Aufbau aus `visual_aura.obj`

Die Laufzeit rendert die OBJ-Datei nicht direkt. Stattdessen wurde aus der gelieferten `visual_aura.obj` ein leichtes Anchor-Template erzeugt: `assets/visual-aura-template.json`.

Die vier relevanten OBJ-Gruppen werden unterschiedlich interpretiert:

- `Cube.001` → zentrale kleine Triangle-Struktur
- `FX_shards` → große reflektierende Dreiecke und 3D-Fragmente
- `FX_floor_facets` → Halo-/Echo-Ebenen in der Tiefe
- `FX_struts` → feine Linienstruktur und zusätzliche räumliche Anker

Die Parameter liegen zentral in `src/params.js`. Dort lassen sich Anzahl, Größen, Tiefenstaffelung, Reaktionsstärke, Kamera-Delay und Glättung verändern, ohne die Scene-Logik umzubauen.

Das Template lässt sich aus einer neuen OBJ-Version reproduzierbar neu erzeugen:

```bash
python3 tools/build-template.py visual_aura.obj assets/visual-aura-template.json
```

## Kamera-Reaktion

Die Bewegungserkennung arbeitet jetzt mit einem verzögerten, geglätteten Signal statt mit direktem Frame-to-Frame-Jitter.

Aktuelle Default-Werte:

- ca. **260 ms Delay**
- ca. **520 ms Positions-/Motion-Glättung**
- ca. **720 ms Velocity-Glättung**
- Bewegungszentrum, Richtung und Bewegungsenergie werden getrennt verarbeitet

Dadurch folgt die Installation einer Person deutlich träger und fließender. Große Dreiecke, kleine Triangles, Tetraeder, Halo-Layer und Licht reagieren mit unterschiedlichen parametrischen Gains.

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
  },
  presentation: {
    video: {
      src: "/media/signal-garden/hero.mp4"
    },
    images: [
      { src: "/media/signal-garden/01.jpg", alt: "Installation view" },
      { src: "/media/signal-garden/02.jpg", alt: "Detail" },
      { src: "/media/signal-garden/03.jpg", alt: "Process" }
    ]
  }
}
```

Aktuell ist **noch kein echtes Backend/CMS verbunden**. `src/cms.js` versucht `/api/cases` zu laden und fällt ansonsten automatisch auf `src/cases.js` zurück. Die API-Schnittstelle ist also vorbereitet, der Server dahinter existiert noch nicht.

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

## Case-Presentation

Klick auf den aktiven Case öffnet eine räumliche Medienebene vor der Skulptur:

- Headline zentral im Vordergrund
- optionales Video direkt hinter der Headline
- Bilder radial um die Headline verteilt und in Z-Tiefe gestaffelt
- alle Medien reagieren mit verzögertem Parallax auf Webcam- und Pointer-Bewegung
- ohne echte Medien-URLs werden lokale generative Placeholder erzeugt

## Nächste Schritte

1. echtes Backend/CMS an `/api/cases` anbinden
2. echte Case-Bilder und Videos in das Media-Schema eintragen
3. räumliche, anklickbare Case-Nodes ergänzen
4. WebXR-Hit-Testing für echte AR-Platzierung ergänzen
5. Shader-Performance auf Mobile weiter optimieren


## Referenzmodell

Die aktuelle Parametrik ist aus dem bereitgestellten Blender-Export `visual_aura.obj / visual_aura.mtl` abgeleitet. Statt die OBJ-Geometrie 1:1 zu rendern, werden ihre Proportionen als Referenzprofil verwendet:

- Aura-Cluster: radial ca. 3.24 Model Units
- Shard-Feld: radial ca. 7.10 Model Units
- Strut-/Linienstruktur: radial ca. 7.90 Model Units
- Floor-Referenz: ca. 64 × 64 Model Units

Dadurch bleibt die Installation generativ und über `src/visual-config.js` steuerbar, orientiert sich aber räumlich an der gelieferten Datei.

## Kamera-Reaktion

Die Webcam-Reaktion läuft bewusst verzögert und geglättet:

- Sampling ca. alle 55 ms
- ca. 230 ms bewusster Delay
- ca. 430 ms Low-Pass-Reaktionszeit
- Bewegung wird als Energie, Zentrum und Richtung ausgewertet
- alle Reaktionsstärken sind zentral in `VISUAL_PARAMS.reaction` steuerbar

Für ein trägeres, fast flüssiges Verhalten einfach `delayMs` und `responseMs` erhöhen. Für direktere Reaktion entsprechend reduzieren.


## Bloom / Glow

Die Szene wird jetzt über Three.js Postprocessing gerendert:

- `EffectComposer`
- `RenderPass`
- `UnrealBloomPass`
- `OutputPass`

Die Default-Werte liegen in `src/visual-config.js`:

```js
bloom: {
  strength: 1.05,
  radius: 0.62,
  threshold: 0.72
}
```

Damit glühen vor allem irisierende Kanten, Wireframes, Headlines und helle Glitch-/Linienbereiche.

## Verteilung

Die OBJ-Anchor-Verteilung wurde wieder entfernt. Die Szene nutzt wieder die frühere radiale, stark zentrumsgewichtete Triangle-Verteilung: viele große Dreiecke im Zentrum, nach außen schnell weniger, dazu kleine Moiré-Triangles, Tetraeder und Halo-Layer.

Die Verteilung wird bei jedem Laden mit einem neuen Seed generiert:

```js
generation: {
  randomizeEachLoad: true,
  seed: 3417
}
```

Mit `randomizeEachLoad: false` bleibt die Komposition reproduzierbar.


## Drei visuelle Ebenen

Die Skulptur ist jetzt strikt in drei parametrische Ebenen getrennt:

1. **Irisierendes Wireframe-Gerüst**  
   Mathematisch über Fibonacci-Sphere-Punkte, nächste Nachbarn, innere/äußere Cage-Struktur und radiale Spokes aufgebaut. Dieser Layer trägt den stärksten Unreal-Bloom-Glow.

2. **Sphärische Triangle-Polygon-Shell**  
   Dreiecke werden sphärisch/ellipsoid um das Gerüst verteilt. Ein parametrisierter Anteil nutzt die Webcam als helle reflektierende Textur, alle übrigen Flächen tragen ein Schwarz-Weiß-Moiré/Zebra-Shader-Mapping mit irisierenden Kanten.

3. **Riesige dunkle Wire-Polygone**  
   Dieselbe Triangle-Sprache wird stark vergrößert außen im Raum wiederholt. Die Kanten sind echte 3D-Rods mit anthrazit-schwarzem, metallischem Physical-Material statt einfacher 1px-Linien.

Alle drei Ebenen reagieren unterschiedlich stark und verzögert auf Webcam-Bewegung. Die Szene wird bei jedem Laden mit neuem Seed generiert.

Die zentralen Werte liegen in `src/visual-config.js` unter:

```js
layers.scaffold
layers.shell
layers.giantWire
reaction
material
bloom
```


## Zero-Code Case Upload

Neue Cases benötigen keine Änderung mehr in `src/cases.js`.

Einfach einen neuen Ordner nach `media/` hochladen:

```
media/
  03-neuer-case/
    hero.mp4
    01.jpg
    02.jpg
    03.webp
```

Die GitHub Action `.github/workflows/rebuild-cases.yml` startet bei Änderungen unter `media/` automatisch und führt `tools/build-cases.py` aus. Daraus entsteht `media/cases.json`, das vom Frontend als primäre Case-Datenquelle geladen wird.

Ohne zusätzliche Metadaten werden Titel, Palette, visuelle Intensität, Komplexität und die individuelle Aura automatisch aus Ordnername und Medienbestand generiert. Optional kann jeder Case-Ordner eine `case.json` enthalten.

## Parametric Console

Die Website enthält jetzt eine eingebaute Regler-Konsole. Unten rechts öffnet **PARAMS** die Konsole; alternativ funktioniert die Backtick-Taste.

Live regelbar sind unter anderem:

- Unreal Bloom
- Scaffold Glow / Opacity / Breathing
- Webcam-Reflexion
- Moiré-Frequenzen und Kontrast
- Outer-Wire Material
- Kamera-/Pointer-Reaktion

Strukturelle Werte wie Polygon-Anzahl, Radius oder Wire-Größe sind mit **↻** markiert. Nach Änderung genügt **REGENERATE**, die Werte werden in LocalStorage gespeichert und die Skulptur mit diesen Einstellungen neu aufgebaut.

**RESET SAVED** entfernt die lokalen Overrides und lädt die Projekt-Defaults.
