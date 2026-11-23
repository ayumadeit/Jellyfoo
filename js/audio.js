/**
 * jellyfoo — Web Audio API Chirp / Squish Synthesizer
 */
(function () {
  let soundOn = false;
  let audioCtx = null;
  let lastSoundTime = 0;

  const soundBtn = document.getElementById('snd');

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSquishChirp() {
    if (!soundOn || !audioCtx) return;
    const now = audioCtx.currentTime;
    if (now - lastSoundTime < 0.08) return; // Prevent acoustic clutter
    lastSoundTime = now;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.value = 900;

    // Pleasant randomized springy pitch sweep
    const baseFreq = 220 + Math.random() * 120;
    osc.frequency.setValueAtTime(baseFreq * 1.6, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.22);

    // Dynamic gain envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  function toggleSound() {
    soundOn = !soundOn;
    if (soundBtn) {
      soundBtn.setAttribute('aria-pressed', soundOn.toString());
      soundBtn.innerHTML = soundOn ? '🔊 <span>sound on</span>' : '🔇 <span>sound off</span>';
    }
    if (soundOn) {
      initAudioContext();
      playSquishChirp();
    }
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', toggleSound);
  }

  window.JellyAudio = {
    toggle: toggleSound,
    chirp: playSquishChirp,
    isEnabled: () => soundOn
  };
})();
