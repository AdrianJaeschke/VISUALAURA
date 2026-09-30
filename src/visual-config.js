export const VISUAL_PARAMS={
  generation:{
    randomizeEachLoad:true,
    seed:3417
  },

  bloom:{
    strength:.58,
    radius:.42,
    threshold:.82,
    motionBoost:.10
  },

  postfx:{
    dither:{
      strength:.13,
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
      networkOpacity:.16
    },

    typography:{
      scale:1,
      opacity:.76
    },

    cameraRail:{
      distance:2.72,
      height:.28,
      sideOffset:.35,
      lookAhead:.022,
      transitionResponse:.036,
      targetResponse:.052,
      orbitAzimuth:Math.PI,
      orbitElevation:.62,
      pointerOrbit:.92,
      motionOrbit:.12,
      minDistance:1.9,
      maxDistance:4.8
    }
  },

  reaction:{
    root:{
      pointerX:.055,
      pointerY:.042,
      cameraX:.08,
      cameraY:.065,
      velocityRoll:.16
    },

    band:{
      xPush:.12,
      yPush:.10,
      zPush:.22,
      velocityTilt:.48,
      scalePulse:.032,
      response:.022
    },

    wireAura:{
      xPush:.09,
      yPush:.075,
      zPush:.14,
      velocityTilt:.30,
      scalePulse:.018,
      response:.014
    },

    typography:{
      pointerX:.022,
      pointerY:.018,
      cameraX:.028,
      cameraY:.022,
      response:.016
    }
  },

  material:{
    band:{
      opacity:.78,
      brightness:1.12,
      edgeGlow:1.08,
      fresnelGlow:.76,
      whiteSpecular:.20,
      speed:.16
    },

    wire:{
      opacity:.50,
      glow:1.02,
      speed:.12
    },

    points:{
      opacity:.58,
      size:.034
    }
  }
};