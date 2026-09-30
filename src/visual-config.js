export const VISUAL_PARAMS={
  generation:{
    randomizeEachLoad:true,
    seed:3417
  },

  bloom:{
    strength:1.08,
    radius:.68,
    threshold:.60,
    motionBoost:.24
  },

  composition:{
    hero:{
      size:2.85,
      z:.30,
      tiltX:-.04,
      tiltY:.08
    },

    moire:{
      count:3,
      radius:2.05,
      sizeMin:1.16,
      sizeMax:1.66,
      zStart:-.10,
      zStep:-.16,
      yRatio:.76,
      rotationJitter:.22
    },

    aura:{
      count:112,
      radiusMin:2.55,
      radiusMax:5.15,
      ellipsoid:[1.0,.80,.88],
      sizeMin:.075,
      sizeMax:.38,
      depthSpread:2.6,
      radialPower:.82
    },

    outerWire:{
      size:8.15,
      z:-.62,
      tubeRadius:.020,
      tiltX:.02,
      tiltY:-.06,
      tiltZ:.08,
      darkColor:"#0b0c10",
      emissiveColor:"#020305",
      emissiveIntensity:.018,
      metalness:.90,
      roughness:.26,
      clearcoat:.84,
      clearcoatRoughness:.18
    }
  },

  dither:{
    hero:{
      strength:.09,
      scale:2.0
    },
    moire:{
      strength:.34,
      scale:1.55
    },
    aura:{
      strength:.20,
      scale:2.4
    }
  },

  reaction:{
    root:{
      pointerX:.10,
      pointerY:.08,
      cameraX:.12,
      cameraY:.10,
      velocityRoll:.28
    },

    hero:{
      xPush:.34,
      yPush:.26,
      zPush:.42,
      velocityTilt:1.35,
      scalePulse:.045
    },

    moire:{
      xPush:.20,
      yPush:.16,
      zPush:.24,
      velocityTilt:.72,
      scalePulse:.025,
      lag:.018
    },

    aura:{
      xPush:.13,
      yPush:.10,
      zPush:.17,
      velocityTilt:.36,
      scalePulse:.018,
      lag:.012
    },

    outerWire:{
      xPush:.055,
      yPush:.04,
      velocityTilt:.12,
      scalePulse:.008,
      lag:.008
    }
  },

  material:{
    reflection:{
      pixelGrid:[72,48],
      saturation:.76,
      brightness:1.34,
      baseLift:.095,
      edgeGlow:2.15,
      fresnelGlow:.52,
      opacity:.98
    },

    moire:{
      black:.008,
      white:.98,
      opacity:.94,
      frequencyA:46,
      frequencyB:53,
      radialFrequency:72,
      zebraMix:.42,
      edgeGlow:.72
    },

    iridescent:{
      opacity:.92,
      brightness:1.18,
      edgeGlow:1.42,
      fresnelGlow:.62,
      speed:.18
    }
  }
};