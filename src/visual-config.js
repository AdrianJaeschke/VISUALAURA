export const VISUAL_PARAMS={
  generation:{
    randomizeEachLoad:true,
    seed:3417
  },

  bloom:{
    strength:1.02,
    radius:.62,
    threshold:.78,
    motionBoost:.20
  },

  postfx:{
    dither:{
      strength:.22,
      scale:1.65,
      levels:6
    }
  },

  composition:{
    hero:{
      size:3.12,
      z:.18,
      tiltX:-.035,
      tiltY:.065
    },

    moire:{
      count:3,
      radius:1.16,
      sizeMin:1.34,
      sizeMax:1.86,
      zStart:.02,
      zStep:-.07,
      yRatio:.68,
      rotationJitter:.16
    },

    aura:{
      count:124,
      radiusMin:1.28,
      radiusMax:3.18,
      ellipsoid:[1.0,.77,.82],
      sizeMin:.07,
      sizeMax:.36,
      depthSpread:1.22,
      radialPower:1.18
    },

    outerWire:{
      size:6.35,
      z:-.24,
      tubeRadius:.018,
      tiltX:.015,
      tiltY:-.045,
      tiltZ:.055,
      color:"#ffffff",
      emissiveColor:"#ffffff",
      emissiveIntensity:0,
      metalness:.82,
      roughness:.23,
      clearcoat:.92,
      clearcoatRoughness:.10
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
      xPush:.30,
      yPush:.23,
      zPush:.36,
      velocityTilt:1.18,
      scalePulse:.038
    },

    moire:{
      xPush:.17,
      yPush:.14,
      zPush:.20,
      velocityTilt:.62,
      scalePulse:.020,
      lag:.018
    },

    aura:{
      xPush:.11,
      yPush:.09,
      zPush:.14,
      velocityTilt:.31,
      scalePulse:.015,
      lag:.012
    },

    outerWire:{
      xPush:.045,
      yPush:.035,
      velocityTilt:.10,
      scalePulse:.006,
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