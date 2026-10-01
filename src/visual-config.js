export const VISUAL_PARAMS={
  generation:{
    randomizeEachLoad:true,
    seed:3417
  },

  bloom:{
    strength:.46,
    radius:.32,
    threshold:.92,
    motionBoost:.06
  },

  postfx:{
    dither:{
      strength:.52,
      scale:8,
      levels:15
    }
  },

  composition:{
    band:{
      segments:32,
      radius:4.43,
      radiusNoise:1.02,
      width:.93,
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
      orbitAzimuth:Math.PI/4,
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
      opacity:.34,
      brightness:3,
      edgeGlow:4,
      fresnelGlow:1.25,
      whiteSpecular:1.5,
      speed:1,
      pearlStrength:1.5,
      filmThickness:3,
      whiteness:1,
      spectralSaturation:1.5,
      focusWidth:.16,
      focusColorBoost:.62,
      focusReflection:.72,
      imageBaseOpacity:.52,
      imageTiltOpacity:.18,
      imageActiveBoost:.14,
      imageShimmer:.24
    },

    wire:{
      opacity:.48,
      glow:.78,
      speed:.10
    },

    points:{
      opacity:.58,
      size:.034
    }
  }
};