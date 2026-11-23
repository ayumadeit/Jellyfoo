/**
 * jellyfoo — Three.js Scene, Spring-Damper Physics & Mesh Deformation Engine
 */
(function () {
  const playContainer = document.getElementById('play');
  if (!playContainer) return;

  /* ---------- Three.js Renderer Setup ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  playContainer.appendChild(renderer.domElement);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);

  /* ---------- Lighting ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(-3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xC8B6FF, 0.8);
  rimLight.position.set(4, -1, -3);
  scene.add(rimLight);

  const hoverLight = new THREE.PointLight(0xffffff, 0, 4);
  scene.add(hoverLight);

  /* ---------- Geometry & Soft Material ---------- */
  const initialPreset = (window.PRESETS && window.PRESETS[0]) || { c: '#FF8FB8', e: '#C8B6FF' };
  const geo = new THREE.SphereGeometry(1, 96, 64);
  const mat = new THREE.MeshPhysicalMaterial({
    color: initialPreset.c,
    roughness: 0.12,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    reflectivity: 0.6,
    emissive: initialPreset.c,
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.93
  });

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  /* ---------- Physics State Arrays ---------- */
  const pos = geo.attributes.position;
  const N = pos.count;
  const base = new Float32Array(pos.array);
  const D = new Float32Array(N * 3); // Displacements
  const V = new Float32Array(N * 3); // Velocities

  /* ---------- Interaction State ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag = null;
  let hover = null;
  let lastMove = 0;

  const grabLocal = new THREE.Vector3();
  const dragVec = new THREE.Vector3();
  const tempVec = new THREE.Vector3();
  const planeNormal = new THREE.Vector3(0, 0, 1);
  const dragPlane = new THREE.Plane(planeNormal, 0);

  function getMeshIntersection() {
    return raycaster.intersectObject(mesh)[0];
  }

  function updateRayFromPointer(e) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
  }

  /**
   * Mexican-hat shaped deformation impulse:
   * Dent in the center + surrounding outward bulge ring
   */
  function applyImpulse(point, strength, sigma) {
    const sigmaSq = sigma * sigma;
    const bulgeRadius = sigma * 1.7;
    const bulgeVariance = sigmaSq * 0.6;

    for (let i = 0; i < N; i++) {
      const idx = i * 3;
      const x = base[idx], y = base[idx + 1], z = base[idx + 2];
      const dx = x - point.x, dy = y - point.y, dz = z - point.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq > 4) continue;

      const dist = Math.sqrt(distSq);
      const weight = -Math.exp(-distSq / sigmaSq) + 0.5 * Math.exp(-Math.pow(dist - bulgeRadius, 2) / bulgeVariance);
      V[idx]     += x * strength * weight;
      V[idx + 1] += y * strength * weight;
      V[idx + 2] += z * strength * weight;
    }
  }

  /* ---------- Pointer Event Listeners ---------- */
  canvas.addEventListener('pointerdown', (e) => {
    updateRayFromPointer(e);
    const hit = getMeshIntersection();
    if (!hit) return;

    canvas.setPointerCapture(e.pointerId);
    grabLocal.copy(mesh.worldToLocal(hit.point.clone())).normalize();
    drag = { id: e.pointerId, wp: hit.point.clone(), moved: 0, sx: e.clientX, sy: e.clientY };
    canvas.classList.add('drag');

    applyImpulse(grabLocal, 4.2, 0.42);
    if (window.JellyApp && window.JellyApp.onSquish) {
      window.JellyApp.onSquish();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    updateRayFromPointer(e);

    if (drag) {
      dragPlane.constant = -drag.wp.z;
      if (raycaster.ray.intersectPlane(dragPlane, tempVec)) {
        dragVec.copy(tempVec).sub(drag.wp);
        if (dragVec.length() > 1.3) dragVec.setLength(1.3);
      }
      drag.moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
      return;
    }

    const hit = getMeshIntersection();
    if (hit) {
      hover = hit;
      const now = performance.now();
      if (now - lastMove > 40) {
        lastMove = now;
        const localHit = mesh.worldToLocal(hit.point.clone()).normalize();
        for (let i = 0; i < N; i++) {
          const idx = i * 3;
          const dx = base[idx] - localHit.x;
          const dy = base[idx + 1] - localHit.y;
          const dz = base[idx + 2] - localHit.z;
          const weight = Math.exp(-(dx * dx + dy * dy + dz * dz) / 0.35) * 0.45;
          V[idx]     += base[idx] * weight;
          V[idx + 1] += base[idx + 1] * weight;
          V[idx + 2] += base[idx + 2] * weight;
        }
      }
    } else {
      hover = null;
    }
  });

  function releasePointer() {
    if (!drag) return;
    if (drag.moved > 12 && window.JellyApp && window.JellyApp.onSquish) {
      window.JellyApp.onSquish();
    }
    drag = null;
    dragVec.set(0, 0, 0);
    canvas.classList.remove('drag');
  }

  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);
  canvas.addEventListener('pointerleave', () => { hover = null; });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  /* ---------- Responsive Resize ---------- */
  function onResize() {
    const w = playContainer.clientWidth;
    const h = playContainer.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.position.set(0, 0, Math.max(5, (4.4 / Math.min(1, camera.aspect)) * 0.95));
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);
  onResize();

  /* ---------- Preset & Color Interpolation ---------- */
  const targetColor = new THREE.Color(initialPreset.c);
  const targetEmissive = new THREE.Color(initialPreset.c);
  const targetRim = new THREE.Color(initialPreset.e);

  function setPreset(colorHex, emissiveHex, rimHex) {
    targetColor.set(colorHex);
    targetEmissive.set(colorHex);
    targetRim.set(rimHex);
  }

  function resetPhysics() {
    D.fill(0);
    V.fill(0);
    drag = null;
    dragVec.set(0, 0, 0);
  }

  /* ---------- Simulation Frame Loop ---------- */
  const clock = new THREE.Clock();
  const K = 70;  // Spring constant
  const C = 4.2; // Damping coefficient
  const lerp = (a, b, t) => a + (b - a) * t;
  let isLoopActive = true;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isLoopActive = false;
    } else {
      isLoopActive = true;
      clock.getDelta(); // Clear time delta accumulator
      requestAnimationFrame(renderFrame);
    }
  });

  function renderFrame() {
    if (!isLoopActive) return;

    const dt = Math.min(clock.getDelta(), 1 / 30);
    const t = clock.elapsedTime;
    const subSteps = 2;
    const h = dt / subSteps;

    // Sub-stepped physics integration
    for (let s = 0; s < subSteps; s++) {
      for (let i = 0; i < N; i++) {
        const j = i * 3;
        let ax = -K * D[j]     - C * V[j];
        let ay = -K * D[j + 1] - C * V[j + 1];
        let az = -K * D[j + 2] - C * V[j + 2];

        if (drag) {
          const dx = base[j] - grabLocal.x;
          const dy = base[j + 1] - grabLocal.y;
          const dz = base[j + 2] - grabLocal.z;
          const w = Math.exp(-(dx * dx + dy * dy + dz * dz) / 0.55) * K * 1.25;
          ax += dragVec.x * w;
          ay += dragVec.y * w;
          az += dragVec.z * w;
        }

        V[j]     += ax * h;
        V[j + 1] += ay * h;
        V[j + 2] += az * h;

        D[j]     += V[j] * h;
        D[j + 1] += V[j + 1] * h;
        D[j + 2] += V[j + 2] * h;
      }
    }

    // Breathing harmonic modulation & mesh vertex displacement
    const breathe = 1 + Math.sin(t * 1.3) * 0.025;
    const arr = pos.array;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const x = base[j], y = base[j + 1], z = base[j + 2];
      const noise = 0.035 * Math.sin(x * 2.2 + t * 0.9) * Math.cos(y * 2.6 - t * 0.7) + 0.03 * Math.sin(z * 3 + t * 0.6 + x);
      const r = breathe * (1 + noise) * 1.15;
      arr[j]     = x * r * 1.04 + D[j];
      arr[j + 1] = y * r * 0.96 + D[j + 1];
      arr[j + 2] = z * r        + D[j + 2];
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();

    // Subtle idle float and wobble
    mesh.position.y = Math.sin(t * 0.9) * 0.09;
    mesh.rotation.y = Math.sin(t * 0.35) * 0.15;
    mesh.position.x = lerp(mesh.position.x, drag ? dragVec.x * 0.2 : 0, 0.12);

    // Smooth material color transitions
    mat.color.lerp(targetColor, 0.07);
    mat.emissive.lerp(targetEmissive, 0.07);
    rimLight.color.lerp(targetRim, 0.07);

    // Interactive pointer hover lighting
    if (hover) {
      tempVec.copy(hover.point).addScaledVector(hover.face.normal, 0.9);
      hoverLight.position.lerp(tempVec, 0.25);
      hoverLight.intensity = lerp(hoverLight.intensity, 1.4, 0.15);
    } else {
      hoverLight.intensity = lerp(hoverLight.intensity, 0, 0.1);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
  }

  requestAnimationFrame(renderFrame);

  /* Exported Physics API */
  window.JellyPhysics = {
    applyImpulse,
    resetPhysics,
    setPreset
  };
})();
