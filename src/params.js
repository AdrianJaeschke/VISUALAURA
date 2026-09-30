export const PARAMS = {
  template: {
    url: "../assets/visual-aura-template.json",
    coreScale: 0.88,
    shardScale: 0.72,
    strutScale: 0.78,
    floorScale: 0.115,
    verticalOffset: 0.45
  },

  camera: {
    sampleIntervalMs: 48,
    delayMs: 260,
    smoothingMs: 520,
    velocitySmoothingMs: 720,
    motionGain: 5.0,
    motionThreshold: 0.028,
    centroidDeadZone: 0.018
  },

  reaction: {
    rootTilt: 0.09,
    rootTurn: 0.14,
    largePushXY: 0.22,
    largePushZ: 0.24,
    largeRotate: 0.72,
    largeScale: 0.035,
    smallPushXY: 0.18,
    smallPushZ: 0.22,
    smallRotate: 0.95,
    tetraPushXY: 0.28,
    tetraPushZ: 0.32,
    tetraRotate: 1.25,
    haloDrift: 0.11,
    haloScale: 0.018,
    lightFollow: 1.5
  },

  triangles: {
    largeCount: 30,
    largeScaleMin: 0.9,
    largeScaleMax: 2.45,
    largeCenterBias: 1.9,
    nestedRings: 3,

    smallCount: 520,
    smallScaleMin: 0.045,
    smallScaleMax: 0.30,

    tetraCount: 88,
    tetraScaleMin: 0.07,
    tetraScaleMax: 0.40,

    haloLayers: 5,
    haloPerLayer: 56
  },

  depth: {
    largeBands: [-2.8, -1.4, -0.2, 1.15, 2.35],
    haloStart: -5.0,
    haloStep: 3.1,
    haloBaseScale: 1.18,
    haloScaleStep: 0.34
  },

  motion: {
    ambientSpeed: 0.11,
    largeDrift: 0.025,
    smallDrift: 0.055,
    tetraDrift: 0.075,
    haloSpeed: 0.00042
  },

  look: {
    reflectionBrightness: 1.16,
    reflectionSaturation: 0.72,
    wireOpacity: 0.18,
    networkOpacity: 0.075,
    backgroundCameraOpacity: 0.10
  },

  presentation: {
    sceneZ: 3.15,
    openResponseMs: 460,
    closeResponseMs: 360,

    headlineWidth: 4.6,
    headlineHeight: 1.2,

    videoWidth: 5.4,
    videoHeight: 3.05,
    videoOpacity: 0.72,

    placeholderImages: 7,
    maxImages: 10,
    imageWidthMin: 1.0,
    imageWidthMax: 1.8,
    imageOpacity: 0.92,
    imageZStart: -0.35,
    imageDepthStep: 0.48,
    radiusMin: 2.1,
    radiusMax: 4.55,
    verticalRatio: 0.63,
    stagger: 0.42,

    groupReactionX: 0.34,
    groupReactionY: 0.26,
    pointerReactionX: 0.14,
    pointerReactionY: 0.10,
    imageReactionX: 0.30,
    imageReactionY: 0.23,
    imageReactionZ: 0.32,
    imageVelocityTilt: 1.2
  }
};