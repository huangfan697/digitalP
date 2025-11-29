
import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, Float, Cloud, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { Avatar } from './Avatar';
import { AudioManager } from '../services/audioManager';

interface SceneProps {
  audioManager: AudioManager;
  isTalking: boolean;
}

// --- Space Elements ---

const FloatingRocks = () => {
  const rockRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (rockRef.current) {
        rockRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={rockRef}>
      <Instances range={15}>
         <dodecahedronGeometry args={[0.2, 0]} />
         <meshStandardMaterial color="#333" roughness={0.6} metalness={0.5} />
         
         {Array.from({ length: 15 }).map((_, i) => (
            <Instance 
                key={i} 
                position={[
                    (Math.random() - 0.5) * 10, // Spread X
                    (Math.random() - 0.5) * 6,  // Spread Y
                    (Math.random() - 0.5) * 5 - 2 // Spread Z (mostly behind avatar)
                ]} 
                scale={Math.random() * 1.5 + 0.5} 
                rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
            />
         ))}
      </Instances>
    </group>
  );
};

const Planet = () => {
  return (
    <group position={[-3, 2, -10]}>
       <mesh>
          <sphereGeometry args={[4, 64, 64]} />
          <meshStandardMaterial 
            color="#1e1b4b" 
            emissive="#000000"
            roughness={0.8} 
          />
       </mesh>
       {/* Ring */}
       <mesh rotation={[1.2, 0, 0]}>
          <torusGeometry args={[5.5, 0.4, 2, 100]} />
          <meshStandardMaterial color="#4c1d95" opacity={0.6} transparent />
       </mesh>
    </group>
  )
}

const Nebula = () => {
    return (
        <group position={[0, -2, -8]}>
             {/* Using bounds to define cloud volume */}
            <Cloud opacity={0.08} speed={0.05} bounds={[15, 4, 4]} segments={20} color="#4c1d95" />
            <Cloud opacity={0.05} speed={0.05} bounds={[10, 4, 4]} segments={20} color="#1d4ed8" position={[5, 2, 0]} />
        </group>
    )
}

// --- Main Scene ---

export const Scene: React.FC<SceneProps> = ({ audioManager, isTalking }) => {
  return (
    <Canvas
      // Adjusted Camera: Positioned to frame the upper body of the large avatar
      camera={{ position: [0, 0.5, 4.5], fov: 30 }}
      shadows
      dpr={[1, 2]} 
      gl={{ 
        antialias: true, 
        toneMapping: THREE.ACESFilmicToneMapping, 
        toneMappingExposure: 1.0
      }}
    >
      <color attach="background" args={['#020205']} />
      
      {/* --- Environment --- */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
      <Nebula />
      <Planet />
      
      {/* Floating debris (Meteors) - Darker and subtler */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
         <FloatingRocks />
      </Float>

      {/* --- Avatar --- */}
      <Suspense fallback={null}>
        {/* Avatar group is now handled cleanly in Avatar.tsx position, 
            but we wrap it here for potential future scene offsets */}
        <group> 
             <Avatar audioManager={audioManager} isTalking={isTalking} />
        </group>
        
        {/* Environment Reflections */}
        <Environment preset="city" blur={0.8} />
      </Suspense>

      {/* --- Lighting --- */}
      <ambientLight intensity={0.4} color="#6366f1" />
      
      {/* Key Light (Face) */}
      <directionalLight 
        position={[0, 2, 5]} 
        intensity={2.5} 
        color="#e0e7ff" 
        castShadow 
      />
      
      {/* Rim Light (Left - Purple) */}
      <spotLight 
        position={[-5, 2, 0]} 
        intensity={5} 
        color="#a855f7" 
        angle={0.5}
        penumbra={1} 
      />
      
      {/* Rim Light (Right - Blue) */}
      <spotLight 
        position={[5, 2, -2]} 
        intensity={5} 
        color="#3b82f6" 
        angle={0.5}
        penumbra={1} 
      />

      <OrbitControls 
        target={[0, 0.5, 0]} // Focus on Face/Upper Chest
        enablePan={false}
        enableZoom={true} 
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 2.5} 
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
};