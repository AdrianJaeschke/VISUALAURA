# Case media

Aktuell ist noch kein externes CMS/Backend verbunden. Case-Medien liegen deshalb direkt im Repository.

Empfohlene Struktur:

```
media/
  signal-garden/
    hero.mp4
    01.jpg
    02.jpg
    03.jpg
  afterimage/
    hero.mp4
    01.jpg
    02.jpg
```

Die Dateien werden in `src/cases.js` über root-relative Pfade referenziert:

```js
presentation: {
  video: {
    src: "/media/signal-garden/hero.mp4"
  },
  images: [
    {
      src: "/media/signal-garden/01.jpg",
      alt: "Installation view"
    },
    {
      src: "/media/signal-garden/02.jpg",
      alt: "Detail"
    }
  ]
}
```

Ohne `presentation.video` wird kein Video-Layer gerendert. Fehlende Bilder werden derzeit durch generative Placeholder ersetzt.

Für Produktion sollten große Videos später besser über ein Medien-CDN/CMS ausgeliefert werden, statt dauerhaft im Git-Repository zu liegen.
