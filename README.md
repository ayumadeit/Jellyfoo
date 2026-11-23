# 🫧 jellyfoo — squish your stress away.

> A tiny jelly. A little interaction. A whole lot of satisfaction.

**jellyfoo** is a tactile, interactive 3D digital fidget toy built with Three.js, custom spring-damper soft-body physics, and a procedural Web Audio synthesizer. Poke it, drag it, stretch it, or watch it breathe in calm pastel hues.

---

## ✨ Features

- **🌸 Soft-Body Jelly Physics**: Realistic vertex-level mesh perturbation using sub-stepped numerical spring-damper integration ($K=70, C=4.2$).
- **💥 Mexican-Hat Deformation**: Pokes produce an authentic squish effect—a localized indentation coupled with a surrounding restorative ring bulge.
- **👆 Multi-Touch & Pointer Tracking**:
  - **Hover**: Jelly gently leans and radiates interactive specular highlights toward your cursor.
  - **Tap / Click**: Immediate reactive bounce and poke impulse.
  - **Press & Drag**: Stretch the jelly along a 3D raycast plane, with an elastic snap-back upon release.
- **🔊 Generative Sound Synthesizer**: Procedural chirpy squish audio generated in real time using the Web Audio API (sine oscillator + lowpass filter + pitch/gain envelope)—no external sound files required.
- **🎨 7 Flavor Themes**:
  - 🍬 Bubblegum Pink
  - 🫐 Blueberry Dream
  - 🍇 Grape Soda
  - 🍑 Peachy Glow
  - 🍃 Minty Fresh
  - 🍓 Strawberry Milk
  - 🌌 Cosmic Jelly
- **☁️ Zero-Dependency Runtime**: Built with clean, vanilla HTML5, CSS3, and JavaScript, loading Three.js via CDN. Works out-of-the-box anywhere.

---

## 📂 Project Architecture

```
jellyfoo/
├── index.html         # Semantic HTML5 skeleton, dialogs, accessibility
├── css/
│   └── style.css      # Pastel design system, glassmorphism, keyframe animations
├── js/
│   ├── presets.js     # Color palettes and flavor definitions
│   ├── physics.js     # Three.js scene, spring-damper physics, raycaster & mesh deformation
│   ├── audio.js       # Procedural Web Audio API chirp synthesizer
│   └── app.js         # UI coordinator, counters, swatches, and modals
├── vercel.json        # One-click static deployment configuration
├── package.json       # Development scripts & metadata
└── README.md          # Project documentation
```

---

## 🔬 How the Physics Works

### 1. Spring-Damper System
Each vertex displacement $D$ and velocity $V$ is updated each sub-frame via damped harmonic oscillator equations:
$$a_i = -K \cdot D_i - C \cdot V_i$$
Where $K = 70$ is the restorative stiffness and $C = 4.2$ is the fluid damping factor.

### 2. Mexican-Hat Impulse
When poked at coordinate $p$ with sigma $\sigma$, velocities receive a dual Gaussian impulse:
$$w(d) = -\exp\left(-\frac{d^2}{\sigma^2}\right) + 0.5 \exp\left(-\frac{(d - 1.7\sigma)^2}{0.6\sigma^2}\right)$$
This produces a natural inward dimple surrounded by a displaced volume ring.

### 3. Idle Breathing
Subtle harmonic waves undulate across the surface when idle to give the jelly an alive, organic presence:
$$r(t) = \text{breathe}(t) \cdot (1 + \text{noise}(x, y, z, t))$$

---

## 🚀 Getting Started

Since **jellyfoo** is purely client-side:

### Option A: Open directly
Simply double-click `index.html` or open it in any modern web browser.

### Option B: Local development server
```bash
# Using Node / npx
npx serve .

# Or using Python
python -m http.server 8080
```
Then visit `http://localhost:8080`.

---

## 🌐 Deployment

### GitHub Pages
1. Go to repository **Settings** → **Pages**.
2. Select `main` branch as the Source.
3. Save, and your live jelly is published!

### Vercel / Netlify
Connect this repository to Vercel or Netlify. The included `vercel.json` ensures immediate zero-configuration static serving.

---

## 📄 License

MIT © [jellyfoo](https://github.com/ayumadeit)
