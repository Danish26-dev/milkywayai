import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const ThreeMilkCanister: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeMarker, setActiveMarker] = useState<number | null>(1);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 460;
    const height = container.clientHeight || 520;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 5.2);

    // Subtle natural lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.2);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd5e6d8, 1.4);
    rimLight.position.set(-3.5, 3, -2.5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xffffff, 0.8, 8);
    fillLight.position.set(0, -1, 3);
    scene.add(fillLight);

    // Group for bottle/canister + trace elements
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. STAINLESS STEEL INDUSTRIAL MILK CANISTER
    // Canister main body
    const bodyGeometry = new THREE.CylinderGeometry(0.88, 0.96, 2.1, 48, 1);
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xdae0dc,
      metalness: 0.88,
      roughness: 0.24,
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, metalMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.position.y = 0;
    mainGroup.add(bodyMesh);

    // Ribbed reinforcement rings on body
    const ring1Geom = new THREE.TorusGeometry(0.92, 0.025, 16, 48);
    const ring1 = new THREE.Mesh(ring1Geom, metalMaterial);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.45;
    mainGroup.add(ring1);

    const ring2 = ring1.clone();
    ring2.position.y = -0.45;
    mainGroup.add(ring2);

    // Shoulder taper
    const shoulderGeometry = new THREE.CylinderGeometry(0.58, 0.88, 0.5, 48);
    const shoulderMesh = new THREE.Mesh(shoulderGeometry, metalMaterial);
    shoulderMesh.position.y = 1.3;
    shoulderMesh.castShadow = true;
    mainGroup.add(shoulderMesh);

    // Neck
    const neckGeometry = new THREE.CylinderGeometry(0.52, 0.58, 0.45, 48);
    const neckMesh = new THREE.Mesh(neckGeometry, metalMaterial);
    neckMesh.position.y = 1.75;
    neckMesh.castShadow = true;
    mainGroup.add(neckMesh);

    // Rim
    const rimGeometry = new THREE.TorusGeometry(0.54, 0.05, 16, 48);
    const rimMesh = new THREE.Mesh(rimGeometry, metalMaterial);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 1.98;
    mainGroup.add(rimMesh);

    // Visible Fresh Milk Liquid Surface inside top opening
    const milkLiquidGeom = new THREE.CylinderGeometry(0.50, 0.50, 0.08, 48);
    const milkMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffdf7, // Milk White
      roughness: 0.15,
      metalness: 0.05,
    });
    const milkLiquid = new THREE.Mesh(milkLiquidGeom, milkMaterial);
    milkLiquid.position.y = 1.92;
    mainGroup.add(milkLiquid);

    // Canister Lid (tilted slightly back to reveal the pure white milk inside)
    const lidGeometry = new THREE.CylinderGeometry(0.55, 0.54, 0.12, 48);
    const lidMesh = new THREE.Mesh(lidGeometry, metalMaterial);
    lidMesh.position.set(0.12, 2.15, -0.15);
    lidMesh.rotation.x = -0.25;
    lidMesh.castShadow = true;
    mainGroup.add(lidMesh);

    // Lid Handle
    const handleGeometry = new THREE.TorusGeometry(0.2, 0.032, 12, 32, Math.PI);
    const handleMesh = new THREE.Mesh(handleGeometry, metalMaterial);
    handleMesh.position.set(0.12, 2.25, -0.15);
    handleMesh.rotation.x = -0.25;
    handleMesh.rotation.z = Math.PI;
    mainGroup.add(handleMesh);

    // Heavy Industrial Drop Handles (Ear handles on sides)
    const sideHandleGeom = new THREE.TorusGeometry(0.26, 0.04, 12, 24, Math.PI);
    const leftHandle = new THREE.Mesh(sideHandleGeom, metalMaterial);
    leftHandle.position.set(-0.98, 0.72, 0);
    leftHandle.rotation.y = Math.PI / 2;
    leftHandle.rotation.x = -Math.PI / 2 + 0.2;
    mainGroup.add(leftHandle);

    const rightHandle = new THREE.Mesh(sideHandleGeom, metalMaterial);
    rightHandle.position.set(0.98, 0.72, 0);
    rightHandle.rotation.y = -Math.PI / 2;
    rightHandle.rotation.x = -Math.PI / 2 + 0.2;
    mainGroup.add(rightHandle);

    // Canister inspection badge band
    const bandGeometry = new THREE.CylinderGeometry(0.90, 0.93, 0.55, 48, 1, true);
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: 0x26352d, // Charcoal Green
      roughness: 0.4,
      metalness: 0.3,
    });
    const bandMesh = new THREE.Mesh(bandGeometry, bandMaterial);
    bandMesh.position.y = 0.05;
    mainGroup.add(bandMesh);

    // 2. ORBITAL SUPPLY-CHAIN TRACE CURVE (Thin Olive & Dusty-Blue Route)
    const curvePoints: THREE.Vector3[] = [];
    const radius = 1.38;
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      const y = Math.sin(theta * 2) * 0.42 - 0.05;
      const x = Math.cos(theta) * (radius + Math.sin(theta) * 0.12);
      const z = Math.sin(theta) * (radius + Math.sin(theta) * 0.12);
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    const pathCurve = new THREE.CatmullRomCurve3(curvePoints, true);
    const tubeGeometry = new THREE.TubeGeometry(pathCurve, 80, 0.014, 8, true);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x607481, // Dusty Blue
      emissive: 0x607481,
      emissiveIntensity: 0.25,
      roughness: 0.3,
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    mainGroup.add(tubeMesh);

    // Waypoint markers along the route trail
    const markerGeometry = new THREE.SphereGeometry(0.065, 16, 16);
    
    // Farm waypoint (Field Olive #66734A)
    const farmMarkerMat = new THREE.MeshStandardMaterial({
      color: 0x66734a,
      emissive: 0x66734a,
      emissiveIntensity: 0.9,
    });
    const mFarm = new THREE.Mesh(markerGeometry, farmMarkerMat);
    mFarm.position.set(-1.28, 0.26, 0.55);
    mainGroup.add(mFarm);

    // Anomaly Checkpoint (Ochre #B78632)
    const alertMarkerMat = new THREE.MeshStandardMaterial({
      color: 0xb78632,
      emissive: 0xb78632,
      emissiveIntensity: 1.4,
    });
    const m2 = new THREE.Mesh(markerGeometry, alertMarkerMat);
    m2.position.set(0.12, -0.38, 1.42);
    mainGroup.add(m2);

    // Processing / Transport waypoint (Dusty Blue #607481)
    const processMarkerMat = new THREE.MeshStandardMaterial({
      color: 0x607481,
      emissive: 0x607481,
      emissiveIntensity: 0.9,
    });
    const mPlant = new THREE.Mesh(markerGeometry, processMarkerMat);
    mPlant.position.set(1.28, 0.12, -0.48);
    mainGroup.add(mPlant);

    // Shadow catcher / subtle circular platform
    const floorGeometry = new THREE.CircleGeometry(2.1, 48);
    const floorMaterial = new THREE.ShadowMaterial({
      opacity: 0.18,
    });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -1.15;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Subtle base ring
    const baseRingGeom = new THREE.RingGeometry(1.6, 1.62, 64);
    const baseRingMat = new THREE.MeshBasicMaterial({
      color: 0x12372a,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const baseRing = new THREE.Mesh(baseRingGeom, baseRingMat);
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.y = -1.14;
    scene.add(baseRing);

    // Mouse tilt tracking
    let targetRotationY = 0;
    let targetRotationX = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.35;
      targetRotationX = -y * 0.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous subtle slow rotation
      mainGroup.rotation.y += 0.0035;
      mainGroup.position.y = Math.sin(elapsedTime * 1.4) * 0.05;

      // Mouse easing
      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y * 0.1) * 0.02;
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.02;

      // Pulse anomaly marker
      const pulse = 1 + Math.sin(elapsedTime * 3.5) * 0.25;
      m2.scale.set(pulse, pulse, pulse);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      bodyGeometry.dispose();
      shoulderGeometry.dispose();
      neckGeometry.dispose();
      bandGeometry.dispose();
      tubeGeometry.dispose();
      metalMaterial.dispose();
      bandMaterial.dispose();
      tubeMaterial.dispose();
    };
  }, []);

  return (
    <div className="relative w-full max-w-[500px] h-[480px] sm:h-[540px] flex items-center justify-center select-none">
      {/* Container for Three.js Canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label="3D Interactive Stainless-Steel Milk Canister with supply-chain trace trajectory"
      />

      {/* Supply-chain physical checkpoint badges mapped around the canister */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
        {/* Farm Node (Origin) - Field Olive */}
        <div
          className={`pointer-events-auto transition-all duration-300 transform self-start bg-[#FFFDF7]/95 backdrop-blur-md border border-[#66734A]/30 px-4 py-2.5 rounded-2xl shadow-md ${
            activeMarker === 0 ? 'ring-2 ring-[#66734A]' : ''
          }`}
          onMouseEnter={() => setActiveMarker(0)}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-[#66734A]" />
            <span className="text-[10px] font-bold tracking-wider text-[#66734A] uppercase font-mono">
              ORIGIN • Dairy Farm 019
            </span>
          </div>
          <p className="text-[10px] text-[#202521]/70 font-mono pl-4">1,000 L Dispatched • Morning Milking</p>
        </div>

        {/* Movement Discrepancy Signal - Ochre */}
        <div
          className={`pointer-events-auto transition-all duration-300 transform self-end bg-[#FFFDF7]/95 backdrop-blur-md border border-[#B78632]/40 px-4 py-3 rounded-2xl shadow-xl max-w-[220px] ${
            activeMarker === 1 ? 'ring-2 ring-[#B78632]' : ''
          }`}
          onMouseEnter={() => setActiveMarker(1)}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 bg-[#B78632] rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-[#B78632] uppercase tracking-wider font-mono">
              Investigation Signal
            </span>
          </div>
          <div className="text-[10px] leading-tight text-[#202521]/80 font-medium">
            Unexplained discrepancy: <strong className="text-[#202521]">330 L unaccounted</strong> between Collection CC-204 and Plant.
          </div>
          <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-mono text-[#B78632] bg-[#B78632]/10 px-2 py-0.5 rounded-full font-bold">
            Prioritize Physical Inspection
          </div>
        </div>

        {/* Processing Plant & Transport Node - Dusty Blue */}
        <div
          className={`pointer-events-auto transition-all duration-300 transform self-start bg-[#26352D] text-[#FFFDF7] px-4 py-2.5 rounded-2xl shadow-xl border border-[#607481]/30 ${
            activeMarker === 2 ? 'ring-2 ring-[#607481]' : ''
          }`}
          onMouseEnter={() => setActiveMarker(2)}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-[#607481]" />
            <span className="text-[10px] font-bold tracking-wider text-[#D8D3C7] uppercase font-mono">
              MOVEMENT • Plant P-07 & Tanker V-22
            </span>
          </div>
          <p className="text-[10px] text-[#D8D3C7]/80 font-mono pl-4">650 L Intake Logged • Custody Sealed</p>
        </div>
      </div>

      {/* Subtle interaction helper tag */}
      <div className="absolute bottom-1 right-2 pointer-events-none">
        <span className="text-[9px] font-mono tracking-widest text-[#17201B]/50 uppercase">
          [ 3D Orbit: Interactive ]
        </span>
      </div>

      {!webglSupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#E9E2D0]/40 p-4 text-center">
          <p className="text-xs font-mono text-[#12372A]">
            [WebGL Canvas Unavailable: Stainless-Steel Milk Canister Trace Model]
          </p>
        </div>
      )}
    </div>
  );
};
