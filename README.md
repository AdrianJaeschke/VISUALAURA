# VISUALAURA

Interaktive Portfolio-Installation auf Basis von Three.js.

## Konzept

Die Website übersetzt Case-Daten wie Jahr, Location, Disziplinen, Tags, Farbwelt, Intensität und Komplexität in eine visuelle Signatur.

- **Desktop:** Maus + Scroll steuern die Installation, die Webcam speist Bewegung und Reflexionen.
- **Mobile:** Touch + Device Orientation steuern die Installation, die Kamera wird zum räumlichen Hintergrund.
- **WebXR:** Wenn `immersive-ar` unterstützt wird, kann die Installation als AR-Szene gestartet werden.
- **Cases:** Werden derzeit als Demo-Daten im Frontend interpretiert und können später direkt aus einem CMS/API kommen.

## Visual Mapping

- Jahr → Morphing
- Location → Rotation / Tilt
- Disziplinen → Metadaten
- Tags → Glitch-Verhalten
- Palette → Licht, Wireframe und Datenlinien
- Intensität → Lichtstärke / Dynamik
- Komplexität → Linien- und Partikeldichte

## Lokaler Start

Die Kamera benötigt einen sicheren Kontext. Lokal daher über einen HTTP-Server starten, z. B.:

```bash
python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

## Nächste Schritte

1. Case-Daten aus einem Headless CMS/API laden.
2. Hero-/Case-Bilder als dynamische Texturen integrieren.
3. Case-Nodes räumlich anklickbar machen.
4. AR-Hit-Testing für Platzierung im Raum ergänzen.
5. Shader für stärkere Glitch-, RGB-Split- und irisierende Effekte ausbauen.
