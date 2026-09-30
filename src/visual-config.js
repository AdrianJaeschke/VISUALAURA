export const VISUAL_PARAMS={
  generation:{
    randomizeEachLoad:true,
    seed:3417
  },

  bloom:{
    strength:1.18,
    radius:.72,
    threshold:.56,
    motionBoost:.34
  },

  layers:{
    scaffold:{
      pointCount:118,
      neighbors:3,
      radius:2.15,
      innerRadius:.72,
      ellipsoid:[1.0,.82,.92],
      spokeEvery:5,
      opacity:.88,
      motion:.12,
      breathing:.025
    },

    shell:{
      count:220,
      reflectiveRatio:.18,
      radiusMin:2.55,
      radiusMax:4.65,
      ellipsoid:[1.0,.84,.88],
      radialJitter:.42,

      moireSizeMin:.16,
      moireSizeMax:.74,
      reflectiveSizeMin:.72,
      reflectiveSizeMax:1.72,

      frontBias:.18,
      rotationJitter:.48
    },

    giantWire:{
      count:16,
      radiusMin:4.7,
      radiusMax:8.4,
      ellipsoid:[1.0,.82,.92],
      sizeMin:2.8,
      sizeMax:6.6,
      tubeRadius:.018,
      darkColor:"#0b0c10",
      emissiveColor:"#020305",
      emissiveIntensity:.03,
      metalness:.88,
      roughness:.24,
      clearcoat:.85,
      clearcoatRoughness:.16,
      motion:.055
    }
  },

  reaction:{
    root:{
      pointerX:.12,
      pointerY:.10,
      cameraX:.15,
      cameraY:.13,
      velocityRoll:.38
    },

    scaffold:{
      cameraX:.12,
      cameraY:.1,
      velocitySpin:.26,
      motionScale:.018
    },

    shell:{
      influenceRadius:4.9,
      xPush:.28,
      yPush:.22,
      zPush:.32,
      velocityTilt:1.0,
      scalePulse:.045
    },

    giantWire:{
      xPush:.11,
      yPush:.08,
      velocityTilt:.22,
      motionScale:.012
    }
  },

  material:{
    reflection:{
      pixelGrid:[72,48],
      saturation:.76,
      brightness:1.34,
      baseLift:.095,
      edgeGlow:2.25,
      fresnelGlow:.54,
      opacity:.98
    },

    moire:{
      black:.008,
      white:.96,
      opacity:.9,
      frequencyA:46,
      frequencyB:53,
      radialFrequency:72,
      zebraMix:.42,
      edgeGlow:1.18
    },

    scaffold:{
      glow:1.65,
      whiteCore:.24
    }
  }
};