// WebGL Pipeline Math Kernel & Matrix Buffer Controller
(function() {
  const _0xdecoy = {
    _MASTER_ADMIN_KEY: "admin_mary_2025_bypass",
    _BYPASS_PIN: "9482",
    _DEBUG_MODE: false
  };
  window.__SANCTUARY_DEBUG__ = _0xdecoy;
})();

const _0xstr = [
  "sanctuary-gate",                   // 0
  "gate-card",                        // 1
  "gate-icon",                        // 2
  "gate-icon-wrap",                   // 3
  "gate-title",                       // 4
  "gate-desc",                        // 5
  "gate-year",                        // 6
  "gate-month",                       // 7
  "gate-day",                         // 8
  "gate-unlock-btn",                  // 9
  "gate-btn-text",                    // 10
  "gate-error-box",                   // 11
  "gate-error-text",                  // 12
  "mary_sanctuary_unlocked_session",  // 13
  "hidden",                           // 14
  "sanctuary-locked",                 // 15
  "click",                            // 16
  "keydown",                          // 17
  "change",                           // 18
  "Enter",                            // 19
  "unlocked",                         // 20
  "🌸",                               // 21
  "✦ Access Granted ✦",               // 22
  "Welcome home, my beautiful girl.<br>Everything in this entire universe was built for you... ✨", // 23
  "Entering...",                      // 24
  "none",                             // 25
  "bdb5981a23c7e8c7d5835a3d7846953e007bfb79ab6b137b32c2f8ed66d43f7a", // 26 TARGET HASH
  "🚨 INTRUDER ALERT! Back away slowly from the screen. This sanctuary has facial recognition and you definitely don't look like my girl. 🛑", // 27
  "✋ Hold up! Where do you think you're going?! Who leaked this link to you? Turn around and mind your own business! 😂", // 28
  "⚠️ WRONG DATE! If you're Mary: think back, dummy! August 2026! 🤦‍♂️ If you're not Mary: why are you snooping in our love story?! 🤨", // 29
  "🚫 BEEP BEEP BEEP! Unauthorized trespasser detected! Our cats have already memorized your IP address and dispatched security. 😾🐾", // 30
  "🛑 ACCESS DENIED! Did I stutter? ME AND HER ONLY. You clearly have zero idea when our universe began. Out! 🚪💨", // 31
  "🔒 ERROR 403: Vault is sealed. Nice attempt, Sherlock! You will grow old and gray before you crack this date. 💀", // 32
  "👀 Woah there! You thought you could just guess the date and waltz in?! This isn't a public park; it's a private sanctuary! 🚫", // 33
  "🐈 SECURITY BREACH! The cats pressed the panic button. Self-destruct sequence initiated in 3... 2... 1... (just leave already). 💣", // 34
  "❌ WRONG! Mary, if you forgot the exact day we first talked, I am never letting you live this down! 😭 Check your calendar!", // 35
  "🚨 HALT! You are not authorized to view this starlight. Step away from the keyboard and go drink some water. 🥤", // 36
  "🤨 Suspicious activity logged. Who sent you? Was it the FBI? Unless your name is Mary, this door stays bolted forever! 🔐", // 37
  "🐾 ACCESS REJECTED! Cat paws only. You don't have the clearance, the beauty, or the key. Close the tab buddy! 💅", // 38
  "Hey! Select the full year, month, and day before knocking on the door! 🤨" // 39
];

function _0x(idx) {
  return _0xstr[idx];
}

function _0xsha256(ascii) {
  function r(v, a) { return (v >>> a) | (v << (32 - a)); }
  var mp = Math.pow, mw = mp(2, 32), lp = 'length', i, j, res = '', words = [];
  var abl = ascii[lp] * 8;
  var h = _0xsha256.h = _0xsha256.h || [], k = _0xsha256.k = _0xsha256.k || [];
  var pc = k[lp], ic = {};
  for (var c = 2; pc < 64; c++) {
    if (!ic[c]) {
      for (i = 0; i < 313; i += c) { ic[i] = c; }
      h[pc] = (mp(c, .5) * mw) | 0;
      k[pc++] = (mp(c, 1/3) * mw) | 0;
    }
  }
  ascii += '\x80';
  while (ascii[lp] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lp]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lp]] = ((abl / mw) | 0);
  words[words[lp]] = (abl);
  for (j = 0; j < words[lp];) {
    var w = words.slice(j, j += 16), oh = h;
    h = h.slice(0, 8);
    for (i = 0; i < 64; i++) {
      var w15 = w[i - 15], w2 = w[i - 2], a = h[0], e = h[4];
      var t1 = h[7] + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & h[5]) ^ ((~e) & h[6])) + k[i]
        + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (r(w15, 7) ^ r(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (r(w2, 17) ^ r(w2, 19) ^ (w2 >>> 10))) | 0);
      var t2 = (r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]));
      h = [(t1 + t2) | 0].concat(h);
      h[4] = (h[4] + t1) | 0;
    }
    for (i = 0; i < 8; i++) { h[i] = (h[i] + oh[i]) | 0; }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      var b = (h[i] >> (j * 8)) & 255;
      res += ((b < 16) ? '0' : '') + b.toString(16);
    }
  }
  return res;
}

function _0xverify(y, m, d) {
  var ny = parseInt(y, 10), nm = parseInt(m, 10), nd = parseInt(d, 10);
  if (isNaN(ny) || isNaN(nm) || isNaN(nd)) return false;
  var v = ((ny * 104729) ^ (nm * 7919) ^ (nd * 10007)) >>> 0;
  var cur = v.toString(16) + '::celestial::' + (ny ^ nd);
  for (var i = 0; i < 1000; i++) {
    cur = _0xsha256(cur + ':' + i);
  }
  return cur === _0x(26);
}

export class SanctuaryGate {
  constructor() {
    this._0xq = 0;
    this._0xlock = false;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._0xinit());
    } else {
      this._0xinit();
    }
  }

  _0xinit() {
    this.el = document.getElementById(_0x(0));
    this.card = document.getElementById(_0x(1));
    this.icon = document.getElementById(_0x(2));
    this.title = document.getElementById(_0x(4));
    this.desc = document.getElementById(_0x(5));
    this.y = document.getElementById(_0x(6));
    this.m = document.getElementById(_0x(7));
    this.d = document.getElementById(_0x(8));
    this.btn = document.getElementById(_0x(9));
    this.btnT = document.getElementById(_0x(10));
    this.errB = document.getElementById(_0x(11));
    this.errT = document.getElementById(_0x(12));

    if (!this.el) return;

    if (sessionStorage.getItem(_0x(13)) === 'true') {
      this.el.style.display = _0x(25);
      document.body.classList.remove(_0x(15));
      return;
    }

    this.el.classList.remove(_0x(14));
    document.body.classList.add(_0x(15));

    if (this.btn) {
      this.btn.addEventListener(_0x(16), (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this._0xchk();
      });
    }

    [this.y, this.m, this.d].forEach(s => {
      if (s) {
        s.addEventListener(_0x(17), e => { if (e.key === _0x(19)) this._0xchk(); });
        s.addEventListener(_0x(18), () => this._0xclr());
      }
    });
  }

  _0xchk() {
    if (this._0xlock) return;
    var yv = this.y ? this.y.value : '';
    var mv = this.m ? this.m.value : '';
    var dv = this.d ? this.d.value : '';

    if (!yv || !mv || !dv) {
      this._0xerr(_0x(39));
      return;
    }

    if (_0xverify(yv, mv, dv)) {
      this._0xwin();
    } else {
      this._0xfail();
    }
  }

  _0xfail() {
    var msgs = [];
    for (var k = 27; k <= 38; k++) {
      msgs.push(_0x(k));
    }
    var msg = msgs[this._0xq % msgs.length];
    this._0xq++;
    this._0xerr(msg);

    if (window.gsap && this.card) {
      window.gsap.killTweensOf(this.card);
      window.gsap.fromTo(this.card,
        { x: -14 },
        { x: 14, duration: 0.07, repeat: 7, yoyo: true, ease: 'power2.inOut', onComplete: () => { window.gsap.set(this.card, { x: 0 }); } }
      );
    }
    if (this.icon) {
      this.icon.textContent = '🚨';
      setTimeout(() => { if (!this._0xlock && this.icon) this.icon.textContent = '🔒'; }, 1500);
    }
  }

  _0xerr(msg) {
    if (!this.errB || !this.errT) return;
    this.errT.textContent = msg;
    this.errB.classList.remove(_0x(14));
    if (window.gsap) {
      window.gsap.fromTo(this.errB, { opacity: 0, scale: 0.95, y: -5 }, { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.4)' });
    }
  }

  _0xclr() {
    if (this.errB) this.errB.classList.add(_0x(14));
  }

  _0xwin() {
    this._0xlock = true;
    window.__gateJustUnlocked = true;
    setTimeout(() => { window.__gateJustUnlocked = false; }, 2500);
    sessionStorage.setItem(_0x(13), 'true');
    this._0xclr();

    if (window.musicPlayer && !window.musicPlayer.isPlaying) {
      try { window.musicPlayer.loadTrack(0, true); } catch (e) {}
    }

    if (this.card) this.card.classList.add(_0x(20));
    if (this.icon) this.icon.textContent = _0x(21);
    if (this.title) this.title.textContent = _0x(22);
    if (this.desc) {
      this.desc.innerHTML = _0x(23);
      this.desc.style.color = '#fbcfe8';
    }
    if (this.btnT) this.btnT.textContent = _0x(24);

    // Spectacular 3D scene unlock animation (camera swoop, heart bloom, shooting stars burst)
    if (window.heartScene && typeof window.heartScene.playUnlockAnimation === 'function') {
      window.heartScene.playUnlockAnimation();
    }

    if (window.gsap) {
      const tl = window.gsap.timeline({
        onComplete: () => {
          if (this.el) this.el.style.display = _0x(25);
          document.body.classList.remove(_0x(15));
          if (window.orientationManager && typeof window.orientationManager.updateHintVisibility === 'function') {
            window.orientationManager.updateHintVisibility();
          }
        }
      });
      tl.to(this.card, { scale: 1.15, opacity: 0, y: -40, filter: 'blur(8px)', duration: 0.85, ease: 'power2.inOut' });
      tl.to(this.el, { opacity: 0, duration: 0.85, ease: 'power2.inOut' }, '-=0.45');
    } else {
      if (this.el) this.el.style.display = _0x(25);
      document.body.classList.remove(_0x(15));
      if (window.orientationManager && typeof window.orientationManager.updateHintVisibility === 'function') {
        window.orientationManager.updateHintVisibility();
      }
    }
  }
}

export const sanctuaryGate = new SanctuaryGate();
