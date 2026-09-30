export const VISUAL_PARAMS={
  generation:{
    randomizeEachLoad:true,
    seed:3417
  },

  bloom:{
    strength:1.12,
    radius:.72,
    threshold:.64,
    motionBoost:.24
  },

  postfx:{
    dither:{
      strength:.15,
      scale:1.7,
      levels:7
    }
  },

  composition:{
    band:{
      segments:56,
      radius:2.62,
      radiusNoise:.52,
      width:1.22,
      widthNoise:.58,
      yScale:.72,
      depth:.92,
      fold:.42,
      twist:.78,
      rotationX:-.10,
      rotationY:.08,
      rotationZ:-.16
    },

    wireAura:{
      count:38,
      radiusMin:3.15,
      radiusMax:6.05,
      yScale:.74,
      zSpread:3.4,
      sizeMin:.34,
      sizeMax:1.22,
      networkStride:5,
      networkOpacity:.20
    },

    typography:{
      scale:1,
      opacity:.82
    }
  },

  reaction:{
    root:{
      pointerX:.10,
      pointerY:.075,
      cameraX:.13,
      cameraY:.10,
      velocityRoll:.24
    },

    band:{
      xPush:.18,
      yPush:.15,
      zPush:.30,
      velocityTilt:.66,
      scalePulse:.045,
      response:.024
    },

    wireAura:{
      xPush:.12,
      yPush:.10,
      zPush:.18,
      velocityTilt:.38,
      scalePulse:.025,
      response:.015
    },

    typography:{
      pointerX:.035,
      pointerY:.025,
      cameraX:.045,
      cameraY:.035,
      response:.018
    }
  },

  material:{
    band:{
      opacity:.78,
      brightness:1.20,
      edgeGlow:1.55,
      fresnelGlow:1.05,
      whiteSpecular:.28,
      speed:.16
    },

    wire:{
      opacity:.58,
      glow:1.55,
      speed:.12
    },

    points:{
      opacity:.72,
      size:.038
    }
  }
};