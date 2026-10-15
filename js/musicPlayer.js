/**
 * =========================================================================
 * MULTI-TRACK AUDIO ENGINE, WEBAUDIO ANALYSER & SYNCED LYRICS
 * =========================================================================
 * - Supports multiple songs (Cinderella, Flawless, etc.) with animated floating popover
 * - Real-time Web Audio API AnalyserNode providing real-time audio reactivity (bass, treble)
 *   to drive the 3D Aurora Borealis ribbon and tumbling gemstones
 * - Millisecond-synchronized lyrics ticker
 */

import { PLAYLIST } from './lyricsData.js?v=330';

let instance = null;

class MusicPlayer {
  constructor() {
    if (instance) {
      instance.playlist = PLAYLIST;
      instance.renderPlaylistMenu();
      return instance;
    }
    instance = this;
    window.musicPlayer = this;

    this.playlist = PLAYLIST;
    this.currentTrackIndex = 0;

    // HTML5 Audio Element
    this.audio = new Audio(this.playlist[0].audioSrc);
    this.audio.loop = false; // Auto-advances to next track in playlist when song ends
    this.audio.volume = 0.25;
    this.audio.crossOrigin = "anonymous";

    this.isPlaying = false;
    this.isMuted = false;
    this.activeLineIndex = -1;

    // Web Audio API Reactivity Nodes
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.freqData = null;
    this.isAudioCtxReady = false;

    // DOM Elements
    this.playBtn = document.getElementById('music-play-btn');
    this.muteBtn = document.getElementById('music-mute-btn');
    this.trackTrigger = document.getElementById('music-track-trigger');
    this.trackTitleEl = document.getElementById('current-track-title');
    this.popoverEl = document.getElementById('playlist-popover');
    this.playlistListEl = document.getElementById('playlist-items-list');
    this.lyricsContainer = document.getElementById('lyrics-ticker-container');
    this.lyricsText = document.getElementById('lyrics-text');
    this.visualizerBars = document.querySelectorAll('.music-wave-bar');

    // Floating Volume Slider Dropdown DOM Elements
    this.volumeSliderPopover = document.getElementById('volume-slider-popover');
    this.volumeSliderInput = document.getElementById('volume-slider-input');
    this.volumeSliderPercent = document.getElementById('volume-slider-percent');
    this.volumeMiniMuteBtn = document.getElementById('volume-slider-mute-toggle');
    this.lastNonZeroVolume = 0.25;

    // Songs always start at 25% volume per user instruction
    this.setVolume(0.25, false);

    this.renderPlaylistMenu();
    this.bindEvents();
    this.initAutoplay();
  }

  /* -------------------------------------------------------------------------
   * WEB AUDIO API: FREQUENCY & BEAT ANALYSIS
   * ------------------------------------------------------------------------- */
  initAudioContext() {
    if (this.isAudioCtxReady) {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioContext = new AudioCtxClass();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      // Connect HTML5 audio -> Analyser -> Speakers
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.isAudioCtxReady = true;

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
    } catch (e) {
      console.warn("Web Audio API initialization notice:", e);
    }
  }

  // Real-time audio metrics for the 3D Aurora Borealis Ribbon and Gemstones
  getAudioData() {
    if (!this.analyser || !this.isPlaying || this.isMuted) {
      return { bass: 0, mid: 0, treble: 0, overall: 0 };
    }

    this.analyser.getByteFrequencyData(this.freqData);

    // 1. Bass (low frequencies ~30Hz - 250Hz, bins 1 to 10)
    let bassSum = 0;
    const bassBins = Math.min(10, this.freqData.length);
    for (let i = 1; i <= bassBins; i++) {
      bassSum += this.freqData[i];
    }
    const bass = bassSum / (bassBins * 255);

    // 2. Mid (bins 11 to 40)
    let midSum = 0;
    const midBins = Math.min(40, this.freqData.length);
    for (let i = 11; i <= midBins; i++) {
      midSum += this.freqData[i];
    }
    const mid = midSum / ((midBins - 11 + 1) * 255);

    // 3. Treble / Highs (bins 41 to 100)
    let trebleSum = 0;
    const trebleBins = Math.min(100, this.freqData.length);
    for (let i = 41; i <= trebleBins; i++) {
      trebleSum += this.freqData[i];
    }
    const treble = trebleSum / ((trebleBins - 41 + 1) * 255);

    const overall = bass * 0.55 + mid * 0.30 + treble * 0.15;

    return { bass, mid, treble, overall };
  }

  /* -------------------------------------------------------------------------
   * PLAYLIST & TRACK SWITCHING
   * ------------------------------------------------------------------------- */
  renderPlaylistMenu() {
    if (!this.playlistListEl) return;
    this.playlistListEl.innerHTML = '';

    this.playlist.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = `playlist-item ${index === this.currentTrackIndex ? 'active' : ''}`;
      item.dataset.index = index;

      item.innerHTML = `
        <div class="playlist-item-left">
          <span class="playlist-item-number">${index + 1}</span>
          <div class="playlist-item-meta">
            <span class="playlist-item-title">${track.title}</span>
            <span class="playlist-item-artist">${track.artist}</span>
          </div>
        </div>
        <div class="playlist-item-status">
          <span class="playlist-item-badge">${index === this.currentTrackIndex ? '✦ Active' : ''}</span>
        </div>
      `;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadTrack(index, true);
        this.closePopover();
      });

      this.playlistListEl.appendChild(item);
    });
  }

  loadTrack(index, autoPlay = true) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrackIndex = index;
    const track = this.playlist[index];

    // Stop current track and reset
    this.audio.pause();
    this.audio.src = track.audioSrc;
    this.audio.currentTime = 0;
    this.audio.load();
    this.activeLineIndex = -1;

    // Update Header Pill Title
    if (this.trackTitleEl) {
      this.trackTitleEl.textContent = track.title.split('(')[0].trim();
    }

    // Reset Lyrics Display
    if (this.lyricsText) {
      this.lyricsText.textContent = `${track.title} • ${track.artist}`;
    }

    // Re-render playlist items to update active indicator
    this.renderPlaylistMenu();

    if (autoPlay) {
      this.initAudioContext();
      this.audio.muted = false;
      this.isMuted = false;
      this.setVolume(this.lastNonZeroVolume || 0.25, false);
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.updateUIState();
      }).catch(e => console.warn("Track play rejected:", e));
    }
  }

  togglePopover() {
    if (!this.popoverEl) return;
    const isHidden = this.popoverEl.classList.contains('hidden');
    if (isHidden) {
      this.popoverEl.classList.remove('hidden');
      if (this.trackTrigger) this.trackTrigger.classList.add('popover-open');
    } else {
      this.closePopover();
    }
  }

  closePopover() {
    if (!this.popoverEl) return;
    this.popoverEl.classList.add('hidden');
    if (this.trackTrigger) this.trackTrigger.classList.remove('popover-open');
  }

  toggleVolumePopover() {
    if (!this.volumeSliderPopover) return;
    this.volumeSliderPopover.classList.toggle('visible');
  }

  closeVolumePopover() {
    if (!this.volumeSliderPopover) return;
    this.volumeSliderPopover.classList.remove('visible');
  }

  /* -------------------------------------------------------------------------
   * EVENT BINDINGS & CONTROLS
   * ------------------------------------------------------------------------- */
  bindEvents() {
    // Play / Pause toggle
    if (this.playBtn) {
      this.playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.initAudioContext();
        this.togglePlay();
      });
    }

    // Speaker Button: Click toggles mute directly per user request!
    if (this.muteBtn) {
      this.muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMute();
      });

      // Mouse wheel over speaker button also adjusts volume directly
      this.muteBtn.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        this.setVolume(this.audio.volume + delta, true);
      }, { passive: false });
    }

    // Volume Range Slider Input
    if (this.volumeSliderInput) {
      this.volumeSliderInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.setVolume(val, true);
      });
    }

    // Prevent clicks/scrolls inside volume popover from closing it
    if (this.volumeSliderPopover) {
      this.volumeSliderPopover.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      this.volumeSliderPopover.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        this.setVolume(this.audio.volume + delta, true);
      }, { passive: false });
    }

    // Mini Mute Toggle inside the dropdown card
    if (this.volumeMiniMuteBtn) {
      this.volumeMiniMuteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMute();
      });
    }

    // Track Selector Popover Trigger (Song Name Click)
    if (this.trackTrigger) {
      this.trackTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeVolumePopover();
        this.togglePopover();
      });
    }

    // Close popovers when clicking outside
    window.addEventListener('click', (e) => {
      if (this.popoverEl && !this.popoverEl.classList.contains('hidden')) {
        if (!e.target.closest('#playlist-popover') && !e.target.closest('#music-track-trigger')) {
          this.closePopover();
        }
      }
      if (this.volumeSliderPopover && this.volumeSliderPopover.classList.contains('visible')) {
        if (!e.target.closest('.volume-speaker-wrapper')) {
          this.closeVolumePopover();
        }
      }
    });

    // Audio status events
    this.audio.addEventListener('play', () => {
      this.initAudioContext();
      this.isPlaying = true;
      this.updateUIState();
      this.startLyricsLoop();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateUIState();
      this.stopLyricsLoop();
    });

    this.audio.addEventListener('ended', () => {
      // Advance to next song in playlist
      const nextIdx = (this.currentTrackIndex + 1) % this.playlist.length;
      this.loadTrack(nextIdx, true);
    });

    // Real-time Synced Lyrics synchronization
    this.audio.addEventListener('timeupdate', () => this.syncLyrics());
  }

  startLyricsLoop() {
    this.isLoopRunning = true;
    const loop = () => {
      if (!this.isLoopRunning) return;
      this.syncLyrics();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stopLyricsLoop() {
    this.isLoopRunning = false;
  }

  initAutoplay() {
    this.audio.volume = 0.25;

    // 1. Attempt unmuted playback directly
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.initAudioContext();
        this.isPlaying = true;
        this.updateUIState();
      }).catch(() => {
        console.log("Unmuted autoplay restricted by browser; starting muted autoplay so lyrics & track stream seamlessly.");
        // 2. Fallback: modern browsers allow muted autoplay without restriction.
        this.audio.muted = true;
        this.isMuted = true;
        this.audio.play().then(() => {
          this.isPlaying = true;
          this.updateUIState();
        }).catch(err => console.warn("Muted autoplay notice:", err));

        // 3. On the very first user interaction anywhere, unmute and restore 25% volume smoothly without restarting!
        const unlockSound = () => {
          this.initAudioContext();
          this.audio.muted = false;
          this.isMuted = false;
          this.setVolume(this.lastNonZeroVolume || 0.25, false);

          if (this.audio.paused) {
            this.audio.play().then(() => {
              this.isPlaying = true;
              this.updateUIState();
            }).catch(e => console.warn("User gesture play failed:", e));
          } else {
            this.isPlaying = true;
            this.updateUIState();
          }

          ['pointerdown', 'mousedown', 'keydown', 'touchstart'].forEach(evt => {
            window.removeEventListener(evt, unlockSound, true);
          });
        };

        ['pointerdown', 'mousedown', 'keydown', 'touchstart'].forEach(evt => {
          window.addEventListener(evt, unlockSound, { capture: true, once: true });
        });
      });
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.initAudioContext();
      this.audio.play().catch(e => console.warn(e));
    }
  }

  setVolume(vol, isUserAction = true) {
    const clamped = Math.max(0.0, Math.min(1.0, vol));
    this.audio.volume = clamped;

    if (clamped > 0) {
      this.lastNonZeroVolume = clamped;
      this.isMuted = false;
      this.audio.muted = false;
    } else {
      this.isMuted = true;
      this.audio.muted = true;
    }

    const pct = Math.round(clamped * 100);

    // Update Range Slider value & fill progress
    if (this.volumeSliderInput) {
      this.volumeSliderInput.value = pct;
      this.volumeSliderInput.style.setProperty('--vol-fill-pct', `${pct}%`);
    }

    // Update Percentage readout
    if (this.volumeSliderPercent) {
      this.volumeSliderPercent.textContent = `${pct}%`;
    }

    if (isUserAction) {
      try {
        localStorage.setItem('mary_sanctuary_volume', clamped.toFixed(2));
      } catch (e) {}
    }

    this.updateUIState();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;
    if (!this.isMuted) {
      // Unmuting: restore previous volume or 25%
      const targetVol = this.lastNonZeroVolume || 0.25;
      this.setVolume(targetVol, true);
    } else {
      // Muting: visually reflect 0% on slider while remembering lastNonZeroVolume
      if (this.volumeSliderInput) {
        this.volumeSliderInput.value = 0;
        this.volumeSliderInput.style.setProperty('--vol-fill-pct', '0%');
      }
      if (this.volumeSliderPercent) {
        this.volumeSliderPercent.textContent = '0%';
      }
    }
    this.updateUIState();
  }

  updateUIState() {
    const track = this.playlist[this.currentTrackIndex];

    if (this.playBtn) {
      this.playBtn.classList.toggle('playing', this.isPlaying);
      this.playBtn.title = this.isPlaying ? `Pause ${track.title}` : `Play ${track.title}`;
    }

    if (this.muteBtn) {
      this.muteBtn.classList.toggle('muted', this.isMuted);
      this.muteBtn.title = this.isMuted ? "Click to Unmute" : "Click to Mute";
    }

    if (this.volumeMiniMuteBtn) {
      this.volumeMiniMuteBtn.classList.toggle('muted', this.isMuted);
      this.volumeMiniMuteBtn.title = this.isMuted ? "Unmute" : "Mute";
    }

    this.visualizerBars.forEach(bar => {
      bar.classList.toggle('active', this.isPlaying && !this.isMuted);
    });
  }

  // Real-time Lyrics Synchronization at the Millisecond Level for Current Track
  syncLyrics() {
    const currentMs = Math.round(this.audio.currentTime * 1000);
    const lyrics = this.playlist[this.currentTrackIndex]?.lyrics || [];

    let foundIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentMs >= lyrics[i].start_ms && currentMs <= lyrics[i].end_ms) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1 && foundIndex !== this.activeLineIndex) {
      this.activeLineIndex = foundIndex;
      const line = lyrics[foundIndex];
      this.renderLyricLine(line.text);
    } else if (foundIndex === -1 && this.activeLineIndex !== -1) {
      this.activeLineIndex = -1;
      this.renderLyricLine("♪ ♪ ♪");
    }
  }

  renderLyricLine(text) {
    if (!this.lyricsText) return;

    if (window.gsap) {
      window.gsap.to(this.lyricsText, {
        opacity: 0,
        y: -4,
        duration: 0.15,
        onComplete: () => {
          this.lyricsText.textContent = text;
          window.gsap.fromTo(this.lyricsText,
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
          );
        }
      });
    } else {
      this.lyricsText.textContent = text;
    }
  }
}

export const musicPlayer = new MusicPlayer();
