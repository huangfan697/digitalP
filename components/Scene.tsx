import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sparkles, Grid, ContactShadows, Instances, Instance, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Avatar } from './Avatar';
import { AudioManager } from '../services/audioManager';
import { EnvironmentConfig, LocationType, WeatherType } from '../types';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      [elemName: string]: any;
    }
  }
}

interface SceneProps {
  audioManager: AudioManager;
  isTalking: boolean;
  avatarUrl: string;
  config: EnvironmentConfig;
}

// --- Weather Components ---

const WeatherSystem = ({ type }: { type: WeatherType }) => {
  if (type === 'clear') return null;

  return (
    <group>
      {type === 'rain' && (
        <Sparkles 
          count={500} 
          scale={[10, 10, 10]} 
          size={4} 
          speed={3} 
          opacity={0.4} 
          color="#a5b4fc"
          noise={0.2}
        />
      )}
      {type === 'snow' && (
        <Sparkles 
          count={500} 
          scale={[10, 8, 10]} 
          size={6} 
          speed={0.4} 
          opacity={0.6} 
          color="#ffffff"
          noise={1}
        />
      )}
    </group>
  );
};

// --- Sub-Environment Assets ---

const FloatingRocks = () => {
  const rockRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (rockRef.current) {
        rockRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={rockRef}>
       {Array.from({ length: 8 }).map((_, i) => (
          <mesh 
            key={i} 
            position={[
                (Math.random() - 0.5) * 10, 
                (Math.random() - 0.5) * 6, 
                (Math.random() - 0.5) * 5 - 3
            ]} 
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
          >
             <dodecahedronGeometry args={[Math.random() * 0.3 + 0.1, 0]} />
             <meshStandardMaterial color="#444" roughness={0.8} />
          </mesh>
       ))}
    </group>
  );
};

const Nebula = () => (
    <group position={[0, -1, -8]}>
        <Sparkles count={300} scale={[15, 6, 6]} size={15} speed={0.2} opacity={0.3} color="#4c1d95" noise={2} />
        <Sparkles count={200} scale={[12, 5, 5]} size={12} speed={0.3} opacity={0.2} color="#1d4ed8" noise={1} />
    </group>
);

// --- Base Location Renderers ---

const SpaceBase = () => (
    <>
      <color attach="background" args={['#020205']} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
         <FloatingRocks />
      </Float>
    </>
);

const CyberBase = () => (
    <>
      <color attach="background" args={['#050510']} />
      <fog attach="fog" args={['#050510', 5, 20]} />
      <Grid 
        position={[0, -2, 0]} 
        args={[20, 20]} 
        cellSize={0.5} 
        cellThickness={1}
        cellColor="#06b6d4" 
        sectionSize={2}
        sectionThickness={1.5}
        sectionColor="#d946ef"
        fadeDistance={15}
        infiniteGrid
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#050510" roughness={0.1} metalness={0.8} />
      </mesh>
    </>
);

const NatureBase = ({ isDay }: { isDay: boolean }) => (
    <>
      <color attach="background" args={isDay ? ['#7dd3fc'] : ['#0f172a']} />
      <fog attach="fog" args={[isDay ? '#7dd3fc' : '#0f172a', 5, 25]} />
      
      {/* Grass Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
         <planeGeometry args={[50, 50]} />
         <meshStandardMaterial color={isDay ? "#4ade80" : "#14532d"} roughness={1} />
      </mesh>
      
      {/* Trees */}
      <Instances range={20}>
         <coneGeometry args={[0.8, 3, 8]} />
         <meshStandardMaterial color={isDay ? "#166534" : "#052e16"} />
         {Array.from({ length: 20 }).map((_, i) => (
             <Instance 
                key={i}
                position={[(Math.random() - 0.5) * 15, -0.5, (Math.random() - 0.5) * 10 - 4]}
                scale={0.8 + Math.random() * 0.5}
             />
         ))}
      </Instances>
    </>
);

const StudioBase = ({ isDay }: { isDay: boolean }) => (
    <>
      <color attach="background" args={[isDay ? '#f3f4f6' : '#1f2937']} />
      <ContactShadows resolution={1024} scale={10} blur={1} opacity={0.5} far={10} color="#000000" />
    </>
);

const BeachBase = ({ isDay }: { isDay: boolean }) => (
    <>
      <color attach="background" args={isDay ? ['#bae6fd'] : ['#0c4a6e']} />
      <fog attach="fog" args={[isDay ? '#bae6fd' : '#0c4a6e', 5, 40]} />
      
      {/* Sand */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 2]} receiveShadow>
         <planeGeometry args={[50, 20]} />
         <meshStandardMaterial color={isDay ? "#fde047" : "#713f12"} roughness={0.9} />
      </mesh>

      {/* Water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, -10]} receiveShadow>
         <planeGeometry args={[50, 30]} />
         <meshStandardMaterial color={isDay ? "#0ea5e9" : "#082f49"} roughness={0.2} metalness={0.5} />
      </mesh>

      {/* Sun/Moon Glow Visuals */}
      {isDay && <Sky sunPosition={[10, 10, 10]} turbidity={0.5} rayleigh={0.5} />}
    </>
);

const DailyBase = ({ isDay }: { isDay: boolean }) => {
    // Street Lights positions
    const lampPositions = useMemo(() => [[-3, 0, -3], [3, 0, -3], [-2, 0, 3]], []);

    return (
    <>
      <color attach="background" args={isDay ? ['#dbeafe'] : ['#1e1b4b']} />
      <fog attach="fog" args={[isDay ? '#dbeafe' : '#1e1b4b', 5, 30]} />
      
      {/* Pavement/Street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
         <planeGeometry args={[50, 50]} />
         <meshStandardMaterial color={isDay ? "#9ca3af" : "#374151"} roughness={0.8} />
      </mesh>

      {/* Street Lamps (Cylinders) */}
      {lampPositions.map((pos, i) => (
          <group key={i} position={[pos[0], -2, pos[2]]}>
              <mesh position={[0, 2, 0]}>
                  <cylinderGeometry args={[0.05, 0.1, 4]} />
                  <meshStandardMaterial color="#333" />
              </mesh>
              {/* Lamp Head */}
              <mesh position={[0, 4, 0]}>
                  <sphereGeometry args={[0.3]} />
                  <meshStandardMaterial color="#fff" emissive={!isDay ? "#fbbf24" : "#000"} emissiveIntensity={!isDay ? 2 : 0} />
              </mesh>
              {/* Light Source at night */}
              {!isDay && <pointLight position={[0, 3.5, 0]} distance={8} intensity={2} color="#fbbf24" />}
          </group>
      ))}

      {/* Simple Buildings Background */}
      <Instances range={10}>
         <boxGeometry args={[3, 8, 3]} />
         <meshStandardMaterial color={isDay ? "#e5e5e5" : "#1f2937"} />
         {Array.from({ length: 10 }).map((_, i) => (
             <Instance 
                key={i}
                position={[(Math.random() - 0.5) * 30, 2, -8 - Math.random() * 10]}
             />
         ))}
      </Instances>
    </>
    );
};

// --- Dynamic Lighting ---

const GlobalLighting = ({ config }: { config: EnvironmentConfig }) => {
    const isDay = config.time === 'day';
    
    // Space has its own unique dramatic lighting
    if (config.location === 'space') {
        return (
            <>
                <ambientLight intensity={0.4} color="#6366f1" />
                <directionalLight position={[0, 2, 5]} intensity={2.5} color="#e0e7ff" castShadow />
                <spotLight position={[-5, 2, 0]} intensity={5} color="#a855f7" angle={0.5} penumbra={1} />
                <spotLight position={[5, 2, -2]} intensity={5} color="#3b82f6" angle={0.5} penumbra={1} />
            </>
        );
    }
    
    // Cyber has neon lighting
    if (config.location === 'cyber') {
        return (
            <>
                <ambientLight intensity={0.2} />
                <pointLight position={[2, 3, 2]} intensity={2} color="#d946ef" />
                <pointLight position={[-2, 1, 2]} intensity={2} color="#06b6d4" />
                <spotLight position={[0, 5, 5]} intensity={3} color="white" angle={0.5} penumbra={0.5} />
            </>
        );
    }

    // Dynamic Natural Lighting for Nature, Beach, Daily
    return (
        <>
            <ambientLight intensity={isDay ? 0.5 : 0.1} color={isDay ? "#ffffff" : "#1e1b4b"} />
            
            {/* Sun / Moon */}
            <directionalLight 
                position={isDay ? [10, 10, 5] : [-5, 8, -5]} 
                intensity={isDay ? 1.5 : 0.5} 
                color={isDay ? "#fdfbd3" : "#60a5fa"} 
                castShadow 
                shadow-bias={-0.0005}
            />

            {/* Fill Light for Night */}
            {!isDay && <pointLight position={[0, 2, 2]} intensity={0.3} color="#818cf8" />} 

            {/* Replaced Environment with HemisphereLight for stability */}
            <hemisphereLight 
                color={isDay ? "#87ceeb" : "#0f172a"} 
                groundColor={isDay ? "#353535" : "#000000"} 
                intensity={0.5} 
            />
        </>
    );
};


// --- Main Scene ---

export const Scene: React.FC<SceneProps> = ({ audioManager, isTalking, avatarUrl, config }) => {
  const isDay = config.time === 'day';
  const controlsRef = useRef<any>(null); // Use any for drei controls for simplicity

  return (
    <Canvas
      camera={{ position: [0, 1, 8], fov: 30 }} 
      shadows
      dpr={[1, 2]} 
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: isDay ? 1.0 : 0.8 }}
    >
      <GlobalLighting config={config} />
      <WeatherSystem type={config.weather} />

      {/* Global Effects */}
      {config.showStars && !isDay && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />}
      {config.showNebula && config.location === 'space' && <Nebula />}

      {/* Location Base */}
      {config.location === 'space' && <SpaceBase />}
      {config.location === 'cyber' && <CyberBase />}
      {config.location === 'nature' && <NatureBase isDay={isDay} />}
      {config.location === 'studio' && <StudioBase isDay={isDay} />}
      {config.location === 'beach' && <BeachBase isDay={isDay} />}
      {config.location === 'daily' && <DailyBase isDay={isDay} />}

      {/* --- Avatar --- */}
      <Suspense fallback={null}>
         <Avatar 
            audioManager={audioManager} 
            isTalking={isTalking} 
            url={avatarUrl}
            orbitControlsRef={controlsRef} 
         />
         <ContactShadows opacity={0.4} scale={10} blur={2} far={2} resolution={256} color="#000000" />
      </Suspense>

      <OrbitControls 
        ref={controlsRef}
        target={[0, -0.5, 0]} // Initial target, updated by Avatar
        enablePan={false}
        enableZoom={true} 
        minDistance={2}
        maxDistance={12}
        minPolarAngle={Math.PI / 2.5} 
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
};