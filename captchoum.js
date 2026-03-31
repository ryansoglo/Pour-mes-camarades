/**
 * CAPTCHOUM™ - La première preuve d'humanité biologique
 *
 * Utilisation basique :
 *
 * const captchoum = new Captchoum({
 *   threshold: 0.85,
 *   sustainedMs: 100,
 *   onVolumeChange: (vol) => console.log('Volume:', Math.round(vol * 100) + '%'),
 *   onSuccess: (peak) => alert('Humanité validée ! Pic: ' + peak),
 *   onError: (err) => console.error('Erreur micro:', err)
 * });
 *
 * document.querySelector('#btn').addEventListener('click', () => {
 *   captchoum.start();
 * });
 */

class Captchoum {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.85;
    this.sustainedMs = options.sustainedMs || 100;
    this.onVolumeChange = options.onVolumeChange || (() => { });
    this.onSuccess = options.onSuccess || (() => { });
    this.onError = options.onError || (() => { });

    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.animId = null;
    this.listening = false;
    this.validated = false;
    this.aboveThresholdSince = null;
    this.peakVolume = 0;
  }

  async start() {
    if (this.listening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      this.listening = true;
      this.validated = false;
      this.aboveThresholdSince = null;
      this.peakVolume = 0;

      this._tick();
    } catch (e) {
      this.onError(e);
    }
  }

  stop() {
    this.listening = false;
    this.validated = false;
    this.aboveThresholdSince = null;

    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  _tick() {
    if (!this.listening || this.validated) return;

    // Bind to this
    this.animId = requestAnimationFrame(() => this._tick());

    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);

    let sum = 0;
    for (let v of data) sum += v * v;
    const rms = Math.sqrt(sum / data.length) / 128;

    const vol = Math.min(1, rms);
    this.peakVolume = Math.max(this.peakVolume, vol);

    this.onVolumeChange(vol);

    if (vol > this.threshold) {
      if (!this.aboveThresholdSince) {
        this.aboveThresholdSince = Date.now();
      } else if (Date.now() - this.aboveThresholdSince >= this.sustainedMs) {
        this._triggerSuccess();
      }
    } else {
      this.aboveThresholdSince = null;
    }
  }

  _triggerSuccess() {
    this.validated = true;
    this.listening = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.onSuccess(this.peakVolume);
  }
}

// Expose on global window object
window.Captchoum = Captchoum;
