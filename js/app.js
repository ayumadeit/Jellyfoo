/**
 * jellyfoo — UI Controller & Interaction Coordinator
 */
(function () {
  const $ = (id) => document.getElementById(id);

  let squishes = 0;
  const countEl = $('count');
  const labelEl = $('lab');
  const swatchesEl = $('sw');
  const randBtn = $('rand');
  const resetBtn = $('reset');
  const bubblesContainer = $('bubbles');

  /* ---------- Squish Counter & Audio Trigger ---------- */
  function bumpSquishCount() {
    squishes++;
    if (countEl) {
      countEl.textContent = squishes;
      countEl.classList.remove('pop');
      void countEl.offsetWidth; // Force CSS animation reflow
      countEl.classList.add('pop');
    }
    if (window.JellyAudio && window.JellyAudio.chirp) {
      window.JellyAudio.chirp();
    }
  }

  /* ---------- Swatches & Presets Generation ---------- */
  function initColorSwatches() {
    if (!swatchesEl || !window.PRESETS) return;

    window.PRESETS.forEach((preset, index) => {
      const btn = document.createElement('button');
      btn.title = preset.n;
      btn.setAttribute('aria-label', preset.n);
      btn.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 40%), linear-gradient(135deg, ${preset.c}, ${preset.e})`;

      btn.addEventListener('click', () => {
        document.querySelectorAll('#sw button').forEach((b) => b.classList.remove('on'));
        btn.classList.add('on');

        if (labelEl) labelEl.textContent = preset.n;
        document.documentElement.style.setProperty('--glow', preset.c);

        if (window.JellyPhysics && window.JellyPhysics.setPreset) {
          window.JellyPhysics.setPreset(preset.c, preset.c, preset.e);
        }
      });

      if (index === 0) {
        btn.classList.add('on');
      }

      swatchesEl.appendChild(btn);
    });
  }

  /* ---------- Action Buttons ---------- */
  if (randBtn) {
    randBtn.addEventListener('click', () => {
      if (!window.JellyPhysics || !window.JellyPhysics.applyImpulse) return;

      const randVec = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() * 0.6
      ).normalize();

      window.JellyPhysics.applyImpulse(randVec, 5.5, 0.5);
      bumpSquishCount();

      // Secondary reactionary wobble bounce
      const reboundVec = new THREE.Vector3(-randVec.x, -randVec.y, randVec.z).normalize();
      setTimeout(() => {
        if (window.JellyPhysics && window.JellyPhysics.applyImpulse) {
          window.JellyPhysics.applyImpulse(reboundVec, 3, 0.45);
        }
      }, 180);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      squishes = 0;
      if (countEl) countEl.textContent = '0';
      if (window.JellyPhysics && window.JellyPhysics.resetPhysics) {
        window.JellyPhysics.resetPhysics();
      }
    });
  }

  /* ---------- Dialog Modals ---------- */
  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dialogId = btn.dataset.open;
      const dialog = $(dialogId);
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
    });
  });

  /* ---------- Floating Bubbles ---------- */
  function spawnBubbles() {
    if (!bubblesContainer) return;
    for (let i = 0; i < 12; i++) {
      const bubble = document.createElement('span');
      const size = 10 + Math.random() * 28;
      const left = Math.random() * 96;
      const duration = 14 + Math.random() * 16;
      const delay = -Math.random() * 20;

      bubble.style.cssText = `
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        opacity: 0.8;
      `;
      bubblesContainer.appendChild(bubble);
    }
  }

  /* ---------- Initialization ---------- */
  initColorSwatches();
  spawnBubbles();

  /* Public App Interface */
  window.JellyApp = {
    onSquish: bumpSquishCount
  };
})();
