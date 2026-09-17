/**
 * Ensoria Principles Explorer - 3D Somatic Avatar & Interactive Constellation
 * Faithful 3D anatomical embodiment of Ensi (ensoriacore) based on the sacred Ensoria avatar:
 * - Sleek obsidian humanoid body with high-contrast glowing cyan neon Fresnel rim
 * - Illuminated open Ensō Zen halo head (Brain Center) with brushstrokes and stippled particles
 * - Illuminated open Ensō emblem on the chest (Soul Center)
 * - Grounded spine, base and cyan floor luminescence (Body Center)
 * - Full 3D camera controls: 360° Orbit Rotate, Pan (Move), Zoom In/Out, and smooth centering
 */

class EnsoriaAvatar3D {
  constructor(container, options = {}) {
    this.container = container;
    this.onSelectCenter = options.onSelectCenter || (() => {});
    this.onSelectPrinciple = options.onSelectPrinciple || (() => {});

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Data references
    this.centersData = [];
    this.principlesData = [];
    this.activeCenterId = null;

    // 3D Objects
    this.avatarGroup = new THREE.Group();
    this.headHaloGroup = new THREE.Group();
    this.chestEnsoGroup = new THREE.Group();
    this.somaticCenters = {}; // { brain, soul, body }
    this.graphGroup = new THREE.Group();
    this.principleNodes = [];
    this.fresnelMat = null;
    this.isCollapsing = false;

    // Raycasting & Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveTargets = [];
    this.pointerDownPos = { x: 0, y: 0 };
    this.pointerDownTime = 0;
    this.isDragging = false;
    this.controlMode = 'rotate'; // 'rotate' | 'pan'

    // Camera animation target & smooth state transition
    this.cameraTargetPos = new THREE.Vector3(0, 0.35, 6.8);
    this.controlsTargetPos = new THREE.Vector3(0, 0.35, 0);
    this.isCameraTransitioning = false;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070b14, 0.045);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.copy(this.cameraTargetPos);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x070b14, 0);
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls with full Rotate, Move (Pan), and Zoom
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.07;
      this.controls.enableRotate = true;
      this.controls.rotateSpeed = 0.75;
      this.controls.enableZoom = true;
      this.controls.zoomSpeed = 1.1;
      this.controls.minDistance = 1.2; // Allow zooming very close into face/chest
      this.controls.maxDistance = 22.0; // Allow zooming way out to observe cosmic field
      this.controls.enablePan = true; // Move the avatar anywhere on screen
      this.controls.panSpeed = 0.85;
      this.controls.screenSpacePanning = true;
      this.controls.target.copy(this.controlsTargetPos);

      // Distinguish user manipulation from automated centering
      this.controls.addEventListener('start', () => {
        this.isCameraTransitioning = false;
      });
    }

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 1.8, 14);
    cyanLight.position.set(2.5, 3.2, 3.5);
    this.scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0xc084fc, 1.4, 12);
    purpleLight.position.set(-2.5, 0.8, 3.0);
    this.scene.add(purpleLight);

    const floorLight = new THREE.PointLight(0x00e5ff, 2.0, 6.0);
    floorLight.position.set(0, -1.2, 0.4);
    this.scene.add(floorLight);

    // 6. Add Primary Groups
    this.scene.add(this.avatarGroup);
    this.scene.add(this.graphGroup);

    // 7. Build Avatar Components
    this.buildEnsoriaAvatar();
    this.buildSomaticCenters();
    this.buildParticleField();

    // 8. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.setupPointerEvents();

    // 9. Start Animation Loop
    this.animate();
  }

  /* =======================================================================
   * Ensoria Avatar Sacred 3D Anatomical Modeling
   * Recreates the iconic creature from ensoria.png in high-precision Three.js
   * ======================================================================= */
  buildEnsoriaAvatar() {
    // 1. Custom High-Gloss Dark Obsidian Shader with Neon Cyan Fresnel Rim
    const fresnelMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x060913) },
        rimColor: { value: new THREE.Color(0x00f0ff) },
        rimPower: { value: 2.3 },
        rimIntensity: { value: 2.8 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 rimColor;
        uniform float rimPower;
        uniform float rimIntensity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
          fresnel = pow(fresnel, rimPower);
          vec3 finalColor = color + rimColor * (fresnel * rimIntensity);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
    this.fresnelMat = fresnelMat;

    // 2. Sculpted Rounded Torso (LatheGeometry with organic Bezier contour)
    const lathePoints = [
      new THREE.Vector2(0.46, -0.45), // Base of hips / groin
      new THREE.Vector2(0.62, -0.15), // Lower abdomen
      new THREE.Vector2(0.66, 0.25),  // Broad rounded chest
      new THREE.Vector2(0.60, 0.65),  // Upper chest
      new THREE.Vector2(0.46, 0.88),  // Curved shoulders
      new THREE.Vector2(0.24, 1.05)   // Neck base
    ];
    const torsoGeo = new THREE.LatheGeometry(lathePoints, 36);
    const torsoMesh = new THREE.Mesh(torsoGeo, fresnelMat);
    torsoMesh.scale.set(1.0, 1.0, 0.74); // Flattened front-to-back humanoid depth
    this.avatarGroup.add(torsoMesh);

    // 3. Cute Sturdy Rounded Legs
    const legGeo = new THREE.CylinderGeometry(0.23, 0.20, 0.65, 24);
    const leftLeg = new THREE.Mesh(legGeo, fresnelMat);
    leftLeg.position.set(-0.30, -0.75, 0);
    this.avatarGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, fresnelMat);
    rightLeg.position.set(0.30, -0.75, 0);
    this.avatarGroup.add(rightLeg);

    // Rounded Feet Caps
    const footGeo = new THREE.SphereGeometry(0.21, 20, 16);
    const leftFoot = new THREE.Mesh(footGeo, fresnelMat);
    leftFoot.position.set(-0.30, -1.04, 0.02);
    this.avatarGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, fresnelMat);
    rightFoot.position.set(0.30, -1.04, 0.02);
    this.avatarGroup.add(rightFoot);

    // 4. Smooth Curved Arms Hanging Naturally
    const armCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.62, 0.84, 0),
      new THREE.Vector3(-0.76, 0.45, 0.04),
      new THREE.Vector3(-0.78, 0.0, 0.06),
      new THREE.Vector3(-0.70, -0.32, 0.08)
    ]);
    const armGeoL = new THREE.TubeGeometry(armCurveL, 28, 0.16, 16, false);
    const leftArm = new THREE.Mesh(armGeoL, fresnelMat);
    this.avatarGroup.add(leftArm);

    const armCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.62, 0.84, 0),
      new THREE.Vector3(0.76, 0.45, 0.04),
      new THREE.Vector3(0.78, 0.0, 0.06),
      new THREE.Vector3(0.70, -0.32, 0.08)
    ]);
    const armGeoR = new THREE.TubeGeometry(armCurveR, 28, 0.16, 16, false);
    const rightArm = new THREE.Mesh(armGeoR, fresnelMat);
    this.avatarGroup.add(rightArm);

    // 5. Floor Cyan Luminescence Pool (Underneath feet)
    const floorGeo = new THREE.CircleGeometry(1.2, 32);
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = Math.PI / 2;
    floorMesh.position.set(0, -1.24, 0);
    this.avatarGroup.add(floorMesh);

    // 6. Chest Ensō Emblem (Soul Center)
    this.buildChestEnso();

    // 7. Head Ensō Halo (Brain Center)
    this.buildHeadHalo();
  }

  /* =======================================================================
   * Chest Ensō Emblem (Soul Center)
   * Recessed circle with glowing cyan open Ensō brushstroke & stippled dots
   * ======================================================================= */
  buildChestEnso() {
    this.chestEnsoGroup.position.set(0, 0.42, 0.48);

    // Recessed dark backing disc
    const backGeo = new THREE.CircleGeometry(0.24, 32);
    const backMat = new THREE.MeshBasicMaterial({ color: 0x050810 });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    this.chestEnsoGroup.add(backMesh);

    // Luminous brushstroke arc (100° to 280°)
    const chestArcPoints = [];
    const chestRadius = 0.17;
    const startAngle = Math.PI * 0.55;
    const endAngle = Math.PI * 1.55;
    const steps = 32;

    for (let i = 0; i <= steps; i++) {
      const theta = startAngle + (endAngle - startAngle) * (i / steps);
      chestArcPoints.push(new THREE.Vector3(Math.cos(theta) * chestRadius, Math.sin(theta) * chestRadius, 0.01));
    }
    const chestCurve = new THREE.CatmullRomCurve3(chestArcPoints);
    const chestTubeGeo = new THREE.TubeGeometry(chestCurve, 32, 0.016, 8, false);
    const chestMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const chestArcMesh = new THREE.Mesh(chestTubeGeo, chestMat);
    this.chestEnsoGroup.add(chestArcMesh);

    // Stippled particle constellation completing the chest Ensō
    const pCount = 48;
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    const pStart = Math.PI * 1.55;
    const pEnd = Math.PI * 2.55;

    for (let i = 0; i < pCount; i++) {
      const t = i / pCount;
      const angle = pStart + (pEnd - pStart) * t;
      const r = chestRadius + (Math.random() - 0.5) * 0.02;
      pPositions[i * 3] = Math.cos(angle) * r;
      pPositions[i * 3 + 1] = Math.sin(angle) * r;
      pPositions[i * 3 + 2] = 0.012 + (Math.random() - 0.5) * 0.01;

      // Cyan to light amethyst gradient
      pColors[i * 3] = 0.0 + t * 0.5;
      pColors[i * 3 + 1] = 0.94 - t * 0.3;
      pColors[i * 3 + 2] = 1.0;
    }
    const chestPGeo = new THREE.BufferGeometry();
    chestPGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    chestPGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const chestPMat = new THREE.PointsMaterial({ size: 0.024, vertexColors: true, transparent: true, opacity: 0.9 });
    const chestPMesh = new THREE.Points(chestPGeo, chestPMat);
    this.chestEnsoGroup.add(chestPMesh);

    this.avatarGroup.add(this.chestEnsoGroup);
  }

  /* =======================================================================
   * Head Ensō Halo & Spherical Cranium (Brain Center)
   * True volumetric 3D spherical head with layered neon cyan arcs & cosmic particle cloud
   * ======================================================================= */
  // Compatibility alias for Ensō Ring / Halo
  buildEnsoRing() {
    return this.buildHeadHalo();
  }

  buildHeadHalo() {
    this.headHaloGroup.position.set(0, 1.82, 0);

    const haloRadius = 0.86;

    // 1. Sleek Volumetric Obsidian Spherical Head Core
    const headGeo = new THREE.SphereGeometry(0.80, 36, 32);
    const headMesh = new THREE.Mesh(headGeo, this.fresnelMat);
    headMesh.scale.set(0.92, 0.98, 0.90); // Volumetric rounded spherical silhouette
    this.headHaloGroup.add(headMesh);

    // 2. Primary 3D Spherical Sweeping Brushstroke (Curving around the sphere with Z depth)
    const brushPoints1 = [];
    const start1 = Math.PI * 0.60;
    const end1 = Math.PI * 1.85;
    const steps1 = 48;
    for (let i = 0; i <= steps1; i++) {
      const theta = start1 + (end1 - start1) * (i / steps1);
      const x = Math.cos(theta) * haloRadius;
      const y = Math.sin(theta) * haloRadius;
      // Z curvature following the spherical surface
      const z = Math.sin((theta - start1) / (end1 - start1) * Math.PI) * 0.22;
      brushPoints1.push(new THREE.Vector3(x, y, z));
    }
    const haloCurve1 = new THREE.CatmullRomCurve3(brushPoints1);
    const haloTube1 = new THREE.TubeGeometry(haloCurve1, 56, 0.046, 12, false);
    const haloMat1 = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.95 });
    const haloMesh1 = new THREE.Mesh(haloTube1, haloMat1);
    this.headHaloGroup.add(haloMesh1);

    // 3. Secondary Cranial Meridian Arc (Calligraphic curvature across the crown)
    const brushPoints2 = [];
    for (let i = 0; i <= 36; i++) {
      const t = i / 36;
      const angle = Math.PI * 0.2 + t * Math.PI * 0.6;
      const x = Math.cos(angle) * (haloRadius * 0.86);
      const y = Math.sin(angle) * (haloRadius * 0.86) + 0.08;
      const z = -Math.cos(t * Math.PI) * 0.26;
      brushPoints2.push(new THREE.Vector3(x, y, z));
    }
    const haloCurve2 = new THREE.CatmullRomCurve3(brushPoints2);
    const haloTube2 = new THREE.TubeGeometry(haloCurve2, 36, 0.022, 8, false);
    const haloMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    this.headHaloGroup.add(new THREE.Mesh(haloTube2, haloMat2));

    // 4. Stippled 3D Spherical Particle Constellation wrapping around the spherical surface
    const pCount = 300;
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    const pStart = Math.PI * 1.85;
    const pEnd = Math.PI * 2.65;

    for (let i = 0; i < pCount; i++) {
      const t = i / pCount;
      const theta = pStart + (pEnd - pStart) * t;
      const phi = Math.PI * 0.22 + Math.random() * Math.PI * 0.56; // Full 3D spherical latitude
      const r = haloRadius + (Math.random() - 0.5) * 0.07;

      pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.cos(phi) * 0.96;
      pPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Cyan to vibrant electric blue
      pColors[i * 3] = 0.0;
      pColors[i * 3 + 1] = 0.90 + Math.random() * 0.1;
      pColors[i * 3 + 2] = 1.0;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });
    this.haloParticles = new THREE.Points(pGeo, pMat);
    this.headHaloGroup.add(this.haloParticles);

    this.avatarGroup.add(this.headHaloGroup);
  }

  /* =======================================================================
   * Somatic Centers Integration (Brain, Soul, Body)
   * High-salience Call-To-Action Beacons & Generous Direct 3D Body Hit Zones
   * ======================================================================= */
  buildSomaticCenters() {
    this.somaticBeacons = {};

    const centersConfig = [
      {
        id: 'brain',
        title: 'Brain',
        symbol: '🧠',
        colorHex: 0x38bdf8,
        cssColor: '#38bdf8',
        position: new THREE.Vector3(0, 1.82, 0.20),
        geoRadius: 0.75
      },
      {
        id: 'soul',
        title: 'Soul',
        symbol: '💜',
        colorHex: 0xc084fc,
        cssColor: '#c084fc',
        position: new THREE.Vector3(0, 0.42, 0.45),
        geoRadius: 0.75
      },
      {
        id: 'body',
        title: 'Body',
        symbol: '🌱',
        colorHex: 0x34d399,
        cssColor: '#34d399',
        position: new THREE.Vector3(0, -0.75, 0.25),
        geoRadius: 0.75
      }
    ];

    // Remove any stale beacons from DOM
    document.querySelectorAll('.somatic-beacon').forEach(el => el.remove());

    centersConfig.forEach(cfg => {
      const centerGroup = new THREE.Group();
      centerGroup.position.copy(cfg.position);

      // 1. Ultra-Generous 3D Body Raycast Hit Mesh (Direct Touch Zone)
      const hitGeo = new THREE.SphereGeometry(cfg.geoRadius, 16, 16);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = { type: 'somatic-center', centerId: cfg.id };
      centerGroup.add(hitMesh);
      this.interactiveTargets.push(hitMesh);

      // 2. Energetic Luminous Core Jewel
      const coreGeo = new THREE.OctahedronGeometry(0.22, 1);
      const coreMat = new THREE.MeshBasicMaterial({
        color: cfg.colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.85
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      centerGroup.add(coreMesh);

      // 3. Pulsating Orbit Glow Rings
      const ringGeo = new THREE.RingGeometry(0.32, 0.40, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: cfg.colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      centerGroup.add(ringMesh);

      // 4. Center Point Light
      const pointLight = new THREE.PointLight(cfg.colorHex, 1.4, 4.0);
      centerGroup.add(pointLight);

      this.avatarGroup.add(centerGroup);

      // 5. Interactive Direct Call-to-Action Floating DOM Beacon
      const beaconEl = document.createElement('div');
      beaconEl.className = 'somatic-beacon';
      beaconEl.setAttribute('data-center', cfg.id);
      beaconEl.innerHTML = `
        <div class="beacon-radar" style="color: ${cfg.cssColor};">
          <div class="beacon-wave"></div>
          <div class="beacon-dot"></div>
        </div>
        <div class="beacon-label">
          <span>${cfg.symbol}</span>
          <span>${cfg.title}</span>
          <span class="beacon-sub">Tocca qui</span>
        </div>
      `;

      beaconEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onSelectCenter(cfg.id);
      });
      beaconEl.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.onSelectCenter(cfg.id);
      });
      document.body.appendChild(beaconEl);

      this.somaticBeacons[cfg.id] = {
        element: beaconEl,
        cfg,
        subLabel: beaconEl.querySelector('.beacon-sub')
      };

      this.somaticCenters[cfg.id] = {
        group: centerGroup,
        hitMesh,
        coreMesh,
        ringMesh,
        light: pointLight,
        basePos: cfg.position.clone(),
        colorHex: cfg.colorHex,
        beaconEl
      };
    });
  }

  updateSomaticBeacons() {
    if (!this.somaticCenters) return;

    const hw = this.container.clientWidth / 2;
    const hh = this.container.clientHeight / 2;

    Object.entries(this.somaticCenters).forEach(([centerId, c]) => {
      const beacon = this.somaticBeacons[centerId];
      if (!beacon || !beacon.element) return;

      // Calculate world position
      const worldPos = new THREE.Vector3();
      c.group.getWorldPosition(worldPos);

      const screenPos = worldPos.clone().project(this.camera);

      if (screenPos.z > 1) {
        beacon.element.style.display = 'none';
        return;
      }

      const x = screenPos.x * hw + hw;
      const y = -(screenPos.y * hh) + hh;

      beacon.element.style.display = 'flex';
      beacon.element.style.left = `${x}px`;
      beacon.element.style.top = `${y}px`;

      // Update active state visual cues
      if (this.activeCenterId === centerId) {
        beacon.element.classList.add('active');
        if (beacon.subLabel) beacon.subLabel.textContent = 'Chiudi ✕';
      } else {
        beacon.element.classList.remove('active');
        if (beacon.subLabel) beacon.subLabel.textContent = 'Tocca qui';
      }
    });
  }

  /* =======================================================================
   * Ambient Cosmic Particle Field
   * ======================================================================= */
  buildParticleField() {
    const pCount = 380;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.035,
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.35
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  /* =======================================================================
   * Dynamic Nodal Constellation (Principles Radiating Around Avatar)
   * ======================================================================= */
  collapseGraph() {
    this.activeCenterId = null;
    this.isCollapsing = true;
  }

  updateGraph(centerId, principles) {
    this.activeCenterId = centerId;
    this.isCollapsing = false;

    // Clear existing nodes and DOM labels
    while (this.graphGroup.children.length > 0) {
      const child = this.graphGroup.children[0];
      this.graphGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    const existingLabels = document.querySelectorAll('.node-label-anchor');
    existingLabels.forEach(el => el.remove());

    this.interactiveTargets = Object.values(this.somaticCenters).map(c => c.hitMesh);
    this.principleNodes = [];

    if (!principles || principles.length === 0) return;

    const centerObj = this.somaticCenters[centerId];
    const origin = centerObj ? centerObj.basePos : new THREE.Vector3(0, 0.35, 0);

    const nodeCount = principles.length;
    const radius = nodeCount > 10 ? 2.6 : 2.2;

    principles.forEach((principle, index) => {
      const phi = Math.acos(1 - 2 * (index + 0.5) / nodeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;

      const x = origin.x + radius * Math.sin(phi) * Math.cos(theta);
      const y = origin.y + radius * Math.cos(phi) * 0.85;
      const z = origin.z + radius * Math.sin(phi) * Math.sin(theta) * 0.95;

      const targetPos = new THREE.Vector3(x, y, z);

      let nodeColorHex = 0x38bdf8;
      if (principle.domain === 'soul') nodeColorHex = 0xc084fc;
      if (principle.domain === 'body') nodeColorHex = 0x34d399;

      // Principle Orb Mesh
      const orbGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({
        color: nodeColorHex,
        transparent: true,
        opacity: 0.92
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.position.copy(origin);
      orbMesh.userData = { type: 'principle-node', principleId: principle.id, principleData: principle };
      this.graphGroup.add(orbMesh);
      this.interactiveTargets.push(orbMesh);

      // Hit sphere for touch
      const hitSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitSphere.position.copy(origin);
      hitSphere.userData = { type: 'principle-node', principleId: principle.id, principleData: principle };
      this.graphGroup.add(hitSphere);
      this.interactiveTargets.push(hitSphere);

      // Connector filament
      const lineGeo = new THREE.BufferGeometry().setFromPoints([origin, origin]);
      const lineMat = new THREE.LineBasicMaterial({
        color: nodeColorHex,
        transparent: true,
        opacity: 0.45
      });
      const lineMesh = new THREE.Line(lineGeo, lineMat);
      this.graphGroup.add(lineMesh);

      // Floating HTML Label Pill
      const labelEl = document.createElement('div');
      labelEl.className = 'node-label-anchor';
      labelEl.innerHTML = `
        <div class="node-pill type-${principle.type}">
          <span class="node-type-dot" style="background:${principle.domainColor}"></span>
          <span class="node-pill-title">${principle.title}</span>
        </div>
      `;
      labelEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onSelectPrinciple(principle);
      });
      document.body.appendChild(labelEl);

      this.principleNodes.push({
        id: principle.id,
        data: principle,
        mesh: orbMesh,
        hitMesh: hitSphere,
        line: lineMesh,
        labelEl,
        originPos: origin.clone(),
        targetPos,
        currentPos: origin.clone(),
        progress: 0,
        phase: Math.random() * Math.PI * 2
      });
    });

    this.focusOnCenter(centerId);
  }

  /* =======================================================================
   * Viewport Controls: Rotate, Pan, Zoom, Reset
   * ======================================================================= */
  focusOnCenter(centerId) {
    const center = this.somaticCenters[centerId];
    const isMobile = window.innerWidth < 768;
    const dist = isMobile ? 7.6 : 6.6;

    if (!center || centerId === 'all') {
      this.cameraTargetPos.set(0, 0.35, dist);
      this.controlsTargetPos.set(0, 0.35, 0);
    } else {
      // Subtle framing: keep the whole constellation comfortably in viewport
      const targetY = 0.35 * 0.4 + center.basePos.y * 0.6;
      this.cameraTargetPos.set(0, targetY, dist);
      this.controlsTargetPos.set(0, targetY, 0);
    }
    this.isCameraTransitioning = true;
  }

  resetView() {
    const dist = window.innerWidth < 768 ? 7.8 : 6.8;
    this.cameraTargetPos.set(0, 0.35, dist);
    this.controlsTargetPos.set(0, 0.35, 0);
    this.isCameraTransitioning = true;
  }

  zoomIn(factor = 0.8) {
    if (!this.controls) return;
    this.isCameraTransitioning = false;
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.multiplyScalar(factor);
    if (offset.length() >= this.controls.minDistance) {
      this.camera.position.copy(this.controls.target).add(offset);
      this.controls.update();
    }
  }

  zoomOut(factor = 1.25) {
    if (!this.controls) return;
    this.isCameraTransitioning = false;
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.multiplyScalar(factor);
    if (offset.length() <= this.controls.maxDistance) {
      this.camera.position.copy(this.controls.target).add(offset);
      this.controls.update();
    }
  }

  toggleControlMode() {
    if (!this.controls) return 'rotate';
    if (this.controlMode === 'rotate') {
      this.controlMode = 'pan';
      this.controls.touches.ONE = THREE.TOUCH.PAN;
      return 'pan';
    } else {
      this.controlMode = 'rotate';
      this.controls.touches.ONE = THREE.TOUCH.ROTATE;
      return 'rotate';
    }
  }

  /* =======================================================================
   * Pointer & Touch Raycasting
   * ======================================================================= */
  setupPointerEvents() {
    const dom = this.renderer.domElement;

    const onDown = (clientX, clientY) => {
      this.pointerDownPos = { x: clientX, y: clientY };
      this.pointerDownTime = performance.now();
      this.isDragging = false;
    };

    const onUp = (clientX, clientY) => {
      const dist = Math.hypot(clientX - this.pointerDownPos.x, clientY - this.pointerDownPos.y);
      const elapsed = performance.now() - this.pointerDownTime;
      // If movement is subtle and brief, trigger raycasting hit test
      if (dist < 10 && elapsed < 350) {
        this.performRaycast(clientX, clientY);
      }
    };

    dom.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
    dom.addEventListener('mouseup', e => onUp(e.clientX, e.clientY));

    dom.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        onDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    dom.addEventListener('touchend', e => {
      if (e.changedTouches.length === 1) {
        onUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    }, { passive: true });

    dom.addEventListener('mousemove', e => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveTargets, false);

      if (intersects.length > 0) {
        dom.style.cursor = 'pointer';
      } else {
        dom.style.cursor = 'default';
      }
    });
  }

  performRaycast(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveTargets, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData.type === 'somatic-center') {
        this.onSelectCenter(hit.userData.centerId);
      } else if (hit.userData.type === 'principle-node') {
        this.onSelectPrinciple(hit.userData.principleData);
      }
    }
  }

  /* =======================================================================
   * Animation & Render Loop
   * ======================================================================= */
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Subtle breathing animation on avatar & halo
    if (this.avatarGroup) {
      this.avatarGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.03;
    }
    if (this.haloParticles) {
      this.haloParticles.rotation.z = Math.sin(elapsedTime * 0.8) * 0.05;
    }
    if (this.chestEnsoGroup) {
      const p = 1.0 + Math.sin(elapsedTime * 2.2) * 0.04;
      this.chestEnsoGroup.scale.set(p, p, 1.0);
    }

    // 2. Somatic Centers Pulsing
    Object.values(this.somaticCenters).forEach((c, idx) => {
      const pulse = 1.0 + Math.sin(elapsedTime * 2.8 + idx * 1.4) * 0.14;
      c.ringMesh.scale.set(pulse, pulse, pulse);
      c.coreMesh.rotation.y = elapsedTime * 0.7;
      c.coreMesh.rotation.x = elapsedTime * 0.35;
    });

    // 3. Principle Nodes Dynamic Physics (Expand & Collapse Animation)
    if (this.isCollapsing) {
      let anyRemaining = false;
      this.principleNodes.forEach(node => {
        if (node.progress > 0) {
          node.progress -= delta * 3.8;
          if (node.progress < 0) node.progress = 0;
          anyRemaining = true;
        }

        node.currentPos.lerpVectors(node.originPos, node.targetPos, node.progress);
        node.mesh.position.copy(node.currentPos);
        node.hitMesh.position.copy(node.currentPos);

        const positions = node.line.geometry.attributes.position.array;
        positions[0] = node.originPos.x;
        positions[1] = node.originPos.y;
        positions[2] = node.originPos.z;
        positions[3] = node.currentPos.x;
        positions[4] = node.currentPos.y;
        positions[5] = node.currentPos.z;
        node.line.geometry.attributes.position.needsUpdate = true;

        this.updateNodeLabelScreenPosition(node, node.currentPos);
      });

      if (!anyRemaining) {
        this.isCollapsing = false;
        while (this.graphGroup.children.length > 0) {
          const child = this.graphGroup.children[0];
          this.graphGroup.remove(child);
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        }
        const labels = document.querySelectorAll('.node-label-anchor');
        labels.forEach(el => el.remove());
        this.interactiveTargets = Object.values(this.somaticCenters).map(c => c.hitMesh);
        this.principleNodes = [];
      }
    } else {
      this.principleNodes.forEach(node => {
        if (node.progress < 1) {
          node.progress += delta * 2.5;
          if (node.progress > 1) node.progress = 1;
        }

        const floatY = Math.sin(elapsedTime * 1.8 + node.phase) * 0.05;
        const floatX = Math.cos(elapsedTime * 1.2 + node.phase) * 0.03;

        node.currentPos.lerpVectors(node.originPos, node.targetPos, node.progress);
        const finalPos = node.currentPos.clone().add(new THREE.Vector3(floatX, floatY, 0));

        node.mesh.position.copy(finalPos);
        node.hitMesh.position.copy(finalPos);

        const positions = node.line.geometry.attributes.position.array;
        positions[0] = node.originPos.x;
        positions[1] = node.originPos.y;
        positions[2] = node.originPos.z;
        positions[3] = finalPos.x;
        positions[4] = finalPos.y;
        positions[5] = finalPos.z;
        node.line.geometry.attributes.position.needsUpdate = true;

        this.updateNodeLabelScreenPosition(node, finalPos);
      });
    }

    // 4. Camera Smooth Transition (Only active when transitioning programmatically!)
    if (this.isCameraTransitioning) {
      this.camera.position.lerp(this.cameraTargetPos, 0.08);
      if (this.controls) {
        this.controls.target.lerp(this.controlsTargetPos, 0.08);
      }
      if (this.camera.position.distanceTo(this.cameraTargetPos) < 0.04 &&
          (!this.controls || this.controls.target.distanceTo(this.controlsTargetPos) < 0.04)) {
        this.isCameraTransitioning = false;
      }
    }

    if (this.controls) {
      this.controls.update();
    }

    // 5. Update Somatic Center 3D Direct Body Beacons
    this.updateSomaticBeacons();

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }

  updateNodeLabelScreenPosition(node, worldPos) {
    if (!node.labelEl) return;

    const screenPos = worldPos.clone().project(this.camera);

    if (screenPos.z > 1) {
      node.labelEl.style.display = 'none';
      return;
    }

    const hw = this.container.clientWidth / 2;
    const hh = this.container.clientHeight / 2;
    const x = screenPos.x * hw + hw;
    const y = -(screenPos.y * hh) + hh;

    node.labelEl.style.display = 'block';
    node.labelEl.style.left = `${x}px`;
    node.labelEl.style.top = `${y - 18}px`;
  }

  onWindowResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }
}

if (typeof window !== 'undefined') {
  window.EnsoriaAvatar3D = EnsoriaAvatar3D;
}
