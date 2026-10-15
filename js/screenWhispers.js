/**
 * =========================================================================
 * SCREEN-SPACE BACKGROUND LIGHT WHISPERS ENGINE
 * =========================================================================
 * Replaces clustered 3D meshes with an ethereal screen-space background layer.
 * Exactly ONE phrase appears at a time with a soft aura of light, floats,
 * slowly dims and disappears, followed by another phrase in a different corner.
 * Completely immune to camera rotations, always in the background of her view.
 */

export const SCREEN_WHISPERS = [
  { text: "I love you", lang: "English" },
  { text: "Je t'aime", lang: "French" },
  { text: "Te amo", lang: "Spanish" },
  { text: "Ti amo", lang: "Italian" },
  { text: "Ich liebe dich", lang: "German" },
  { text: "愛してる", lang: "Japanese" },
  { text: "사랑해", lang: "Korean" },
  { text: "Eu te amo", lang: "Portuguese" },
  { text: "Я тебя люблю", lang: "Russian" },
  { text: "Σ' αγαπώ", lang: "Greek" },
  { text: "Seni seviyorum", lang: "Turkish" },
  { text: "Ik hou van jou", lang: "Dutch" },
  { text: "Jag älskar dig", lang: "Swedish" },
  { text: "Kocham cię", lang: "Polish" },
  { text: "Anh yêu em", lang: "Vietnamese" },
  { text: "Aku cinta kamu", lang: "Indonesian" },
  { text: "Я тебе кохаю", lang: "Ukrainian" },
  { text: "मैं तुमसे प्यार करता हूँ", lang: "Hindi" },
  { text: "Jeg elsker dig", lang: "Danish" },
  { text: "Miluji tě", lang: "Czech" },
  { text: "Te iubesc", lang: "Romanian" },
  { text: "Taim i ngra leat", lang: "Irish" },
  { text: "Te amo in aeternum", lang: "Latin" }
];

export class ScreenWhispersEngine {
  constructor() {
    this.container = document.getElementById('screen-whisper-container');
    this.textEl = document.getElementById('whisper-text');
    this.langEl = document.getElementById('whisper-lang');
    this.auraEl = document.getElementById('whisper-aura');

    this.currentIndex = 0;
    this.isRunning = false;

    // 5 Distinct Aesthetic Background Positions across the viewport
    this.positions = [
      { top: "18%", left: "14%", right: "auto", bottom: "auto", align: "left" },
      { top: "auto", left: "auto", right: "14%", bottom: "20%", align: "right" },
      { top: "22%", left: "auto", right: "15%", bottom: "auto", align: "right" },
      { top: "auto", left: "15%", right: "auto", bottom: "24%", align: "left" },
      { top: "12%", left: "50%", right: "auto", bottom: "auto", align: "center", transform: "translateX(-50%)" }
    ];
    this.currentPosIndex = 0;

    if (this.container && this.textEl) {
      this.startCycle();
    }
  }

  startCycle() {
    this.isRunning = true;
    this.showNext();
  }

  showNext() {
    if (!this.isRunning) return;

    const phrase = SCREEN_WHISPERS[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % SCREEN_WHISPERS.length;

    // Pick next position (cycles through corners and center)
    const pos = this.positions[this.currentPosIndex];
    this.currentPosIndex = (this.currentPosIndex + 1) % this.positions.length;

    // Apply positioning
    this.container.style.top = pos.top;
    this.container.style.left = pos.left;
    this.container.style.right = pos.right;
    this.container.style.bottom = pos.bottom;
    this.container.style.textAlign = pos.align;
    this.container.style.transform = pos.transform || "none";

    // Update Text
    this.textEl.textContent = phrase.text;
    if (this.langEl) this.langEl.textContent = `✦ ${phrase.lang}`;

    // GSAP Cinematic Single-Word Light Cycle
    if (window.gsap) {
      const tl = window.gsap.timeline({
        onComplete: () => {
          // Pause in darkness for 1.2s before next word appears
          setTimeout(() => this.showNext(), 1200);
        }
      });

      // 1. Light gently blooms and word appears (2.5s ease in)
      tl.fromTo(this.container, 
        { opacity: 0, scale: 0.92, filter: "blur(14px)" },
        { opacity: 0.72, scale: 1.0, filter: "blur(0px)", duration: 2.5, ease: "power2.out" }
      );

      // 2. Gentle holding float (3.5s slow breathing)
      tl.to(this.container, {
        y: -10,
        opacity: 0.82,
        duration: 3.5,
        ease: "sine.inOut"
      });

      // 3. Light slowly dims and word disappears into darkness (2.5s ease out)
      tl.to(this.container, {
        opacity: 0,
        scale: 1.05,
        filter: "blur(12px)",
        duration: 2.5,
        ease: "power2.in"
      });

    } else {
      // Fallback if GSAP not loaded
      this.container.style.opacity = "0.7";
      setTimeout(() => {
        this.container.style.opacity = "0";
        setTimeout(() => this.showNext(), 2000);
      }, 5000);
    }
  }
}
