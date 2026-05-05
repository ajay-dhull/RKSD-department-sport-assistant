import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";
import useWebRTCAudioSession from "@/hooks/use-webrtc";

interface ThreeDOrbProps {
  intensity?: number;
  isListening?: boolean;
  isSpeaking?: boolean;
}

const ThreeDOrb: React.FC<ThreeDOrbProps> = ({ 
  intensity = 3, 
  isListening = false,
  isSpeaking = false 
}) => {
  const { currentVolume, isSessionActive, handleStartStopClick } = useWebRTCAudioSession('alloy');
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const ballRef = useRef<THREE.Mesh | null>(null);
  const originalPositionsRef = useRef<any | null>(null);
  const noise = createNoise3D();

  useEffect(() => {
    initViz();
    window.addEventListener("resize", onWindowResize);
    return () => {
      window.removeEventListener("resize", onWindowResize);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if ((isListening || isSpeaking || isSessionActive) && ballRef.current) {
      const audioVolume = isListening || isSpeaking ? 0.8 : currentVolume;
      updateBallMorph(ballRef.current, audioVolume);
    } else if (ballRef.current && originalPositionsRef.current) {
      resetBallMorph(ballRef.current, originalPositionsRef.current);
    }
  }, [currentVolume, isSessionActive, isListening, isSpeaking]);

  const cleanup = () => {
    if (rendererRef.current) {
      const outElement = document.getElementById("rksd-orb");
      if (outElement && rendererRef.current.domElement) {
        outElement.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    }
  };

  const initViz = () => {
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    const camera = new THREE.PerspectiveCamera(20, 1, 1, 100);
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);

    scene.add(camera);
    sceneRef.current = scene;
    groupRef.current = group;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const outElement = document.getElementById("rksd-orb");
    if (outElement) {
      outElement.innerHTML = "";
      outElement.appendChild(renderer.domElement);
      
      const width = outElement.clientWidth;
      renderer.setSize(width, width);
      
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.objectFit = 'contain';
    }

    rendererRef.current = renderer;

    const icosahedronGeometry = new THREE.IcosahedronGeometry(10, 8);
    
    // RKSD Colors - Pink to Purple gradient material
    const lambertMaterial = new THREE.MeshLambertMaterial({
      color: 0xff69b4, // Hot pink
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });

    const ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);
    ballRef.current = ball;

    // Store the original positions of the vertices
    originalPositionsRef.current = ball.geometry.attributes.position.array.slice();

    group.add(ball);

    // RKSD theme lighting
    const ambientLight = new THREE.AmbientLight(0xff69b4, 0.3); // Pink ambient
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0x9f7aea); // Purple spotlight
    spotLight.intensity = 1.2;
    spotLight.position.set(-10, 40, 20);
    spotLight.lookAt(ball.position);
    spotLight.castShadow = true;
    scene.add(spotLight);

    // Additional purple light for gradient effect
    const purpleLight = new THREE.PointLight(0x8b5cf6, 0.6);
    purpleLight.position.set(10, -20, 30);
    scene.add(purpleLight);

    scene.add(group);
    render();
  };

  const render = () => {
    if (
      !groupRef.current ||
      !ballRef.current ||
      !cameraRef.current ||
      !rendererRef.current ||
      !sceneRef.current
    ) {
      return;
    }

    // Slower rotation for more elegant look
    groupRef.current.rotation.y += 0.003;
    groupRef.current.rotation.x += 0.001;
    
    // Color animation based on state
    const material = ballRef.current.material as THREE.MeshLambertMaterial;
    const time = Date.now() * 0.001;
    
    if (isListening) {
      // Pulsing pink when listening
      const pulse = Math.sin(time * 4) * 0.3 + 0.7;
      material.color.setHex(0xff1493 * pulse + 0xff69b4 * (1 - pulse));
    } else if (isSpeaking) {
      // Purple when speaking
      material.color.setHex(0x9f7aea);
    } else {
      // Gradient animation between pink and purple
      const colorShift = Math.sin(time * 0.8) * 0.5 + 0.5;
      material.color.lerpColors(
        new THREE.Color(0xff69b4), // Pink
        new THREE.Color(0x9f7aea),  // Purple
        colorShift
      );
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    requestAnimationFrame(render);
  };

  const onWindowResize = () => {
    if (!cameraRef.current || !rendererRef.current) return;

    const outElement = document.getElementById("rksd-orb");
    if (outElement) {
      const width = outElement.clientWidth;
      rendererRef.current.setSize(width, width);
      
      cameraRef.current.aspect = 1;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const updateBallMorph = (mesh: THREE.Mesh, volume: number) => {
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute("position");

    for (let i = 0; i < positionAttribute.count; i++) {
      const vertex = new THREE.Vector3(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i),
      );

      const offset = 10;
      const amp = 2.5;
      const time = window.performance.now();
      vertex.normalize();
      const rf = 0.00001;
      const distance =
        offset +
        volume * 4 * intensity +
        noise(
          vertex.x + time * rf * 7,
          vertex.y + time * rf * 8,
          vertex.z + time * rf * 9,
        ) *
          amp *
          volume * intensity;
      vertex.multiplyScalar(distance);

      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  const resetBallMorph = (
    mesh: THREE.Mesh,
    originalPositions: Float32Array,
  ) => {
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute("position");

    for (let i = 0; i < positionAttribute.count; i++) {
      positionAttribute.setXYZ(
        i,
        originalPositions[i * 3],
        originalPositions[i * 3 + 1],
        originalPositions[i * 3 + 2],
      );
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  return (
    <div className="w-48 h-48 relative">
      <div
        id="rksd-orb"
        className="w-full h-full aspect-square"
        style={{ cursor: 'pointer' }}
        onClick={handleStartStopClick}
      />
      {/* Glow effect overlay */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 animate-pulse pointer-events-none" />
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-600/10 animate-ping pointer-events-none" />
    </div>
  );
};

export default ThreeDOrb;