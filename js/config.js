/**
 * =========================================================================
 * MARY'S SANCTUARY: Global Application Configuration
 * =========================================================================
 */

export const CONFIG = {
  // --- Personalization ---
  recipientName: "Mary",
  siteTitle: "for mary.",
  siteSubtitle: "for the softest soul, and the strongest heart I have ever known.",
  
  // --- Telemetry & Silent Gmail Alerts ---
  telemetry: {
    enabled: true,
    webhookUrl: "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL_HERE",
    notifyOnVisit: true,
    notifyOnInteractions: true,
    interactionMilestones: [1, 5, 15, 25, 40, 75, 100]
  },

  // --- Visuals & 3D Parameters ---
  visuals: {
    particleCount: 4200,
    corePulseSpeed: 1.15,
    pulseAmplitude: 1.08,
    
    // Camera Limits (Permits flying right inside the 3D heart)
    camera: {
      minDistance: 1.2,
      maxDistance: 85.0,
      initialPosition: { x: 0, y: 3, z: 62 },
      panEnabled: true
    },

    // Background Multilingual Light Whispers
    whispers: {
      activeSimultaneous: 1,     // Exactly ONE word active at a time
      holdDurationSec: 4.5,
      fadeDurationSec: 2.2
    },

    // 3D Rose-Ruby Aurora Borealis Ribbon (Centered Deep-Ocean Wave Undulation)
    aurora: {
      radiusX: 34.0,
      radiusZ: 34.0,
      ribbonWidth: 5.2,
      tiltDeg: 0, // Zero static inclination: centered horizontally around Mary's heart
      waveSpeed: 0.65,
      undulationAmplitude: 2.4
    },

    // Cosmic Gemstones (Diamonds & Rubies)
    gemstones: {
      count: 32,                 // 16 Blood Rubies + 16 Brilliant Diamonds
      rubyColor: 0xe11d48,
      diamondColor: 0xffffff,
      starlightGlint: 0xfef08a,
      size: 0.75
    },

    // UnrealBloomPass: Calibrated for razor-sharp starlight particles & elegant starlight halo
    bloomStrength: 0.52,
    bloomRadius: 0.28,
    bloomThreshold: 0.52,
    
    // Aesthetic Color Palette (Harmonized Crimson-Ruby & Starlight Gold)
    colors: {
      background: 0x07070a,
      deepRuby: 0x9f1239,
      brightCrimson: 0xf43f5e,
      royalRuby: 0xe11d48,
      warmCoral: 0xfb7185,
      roseGold: 0xfda4af,
      starlightGold: 0xfef08a,
      electricDiamond: 0x38bdf8, // High-contrast hover pop color (Ice Diamond)
      diamondBeacon: 0xffffff,
      ambientDust: 0xf43f5e
    }
  },

  // --- Music (Cinderella) ---
  music: {
    audioSrc: "assets/audio/cinderella.mp3",
    defaultVolume: 0.25
  }
};

