
import React, { useEffect, useRef } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AudioManager } from '../services/audioManager';
import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      primitive: any;
    }
  }
}

interface AvatarProps {
  audioManager: AudioManager;
  isTalking: boolean;
  url: string;
  orbitControlsRef: React.MutableRefObject<any>;
}

// Hook to track keyboard keys
function usePlayerControls() {
  const keys = useRef<{ [key: string]: boolean }>({});
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if typing in an input
        const tag = document.activeElement?.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        keys.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  return keys;
}

export const Avatar: React.FC<AvatarProps> = ({ audioManager, isTalking, url, orbitControlsRef }) => {
  const { scene } = useGLTF(url);
  const { nodes } = useGraph(scene);
  const groupRef = useRef<THREE.Group>(null);
  const keys = usePlayerControls();
  
  // Track previous position to calculate delta for camera follow
  const prevPos = useRef(new THREE.Vector3(0, -2, 0));

  // Bone Refs for procedural animation
  const headMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const neckBoneRef = useRef<THREE.Bone | null>(null);
  const spineRef = useRef<THREE.Bone | null>(null);

  // Legs
  const leftUpLegRef = useRef<THREE.Bone | null>(null); // Thigh
  const leftLegRef = useRef<THREE.Bone | null>(null);   // Calf/Knee
  const rightUpLegRef = useRef<THREE.Bone | null>(null);
  const rightLegRef = useRef<THREE.Bone | null>(null);

  // Arms
  const leftArmRef = useRef<THREE.Bone | null>(null);       // Shoulder/Upper Arm
  const leftForeArmRef = useRef<THREE.Bone | null>(null);   // Elbow
  const rightArmRef = useRef<THREE.Bone | null>(null);
  const rightForeArmRef = useRef<THREE.Bone | null>(null);

  // Store initial rotations to apply transforms relative to rest pose
  const initialRotations = useRef<{ [key: string]: THREE.Euler }>({});

  // Parse model to find specific bones
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isMesh && (child as THREE.SkinnedMesh).morphTargetDictionary) {
        if (child.name.includes('Head') || child.name.includes('Avatar')) {
          headMeshRef.current = child as THREE.SkinnedMesh;
        }
      }
      if ((child as THREE.Bone).isBone) {
          // Identify bones using standard naming conventions (Mixamo/RPM)
          const name = child.name;
          
          if (name.includes('Neck')) neckBoneRef.current = child as THREE.Bone;
          if (name.includes('Spine')) spineRef.current = child as THREE.Bone;

          if (name.includes('LeftUpLeg')) leftUpLegRef.current = child as THREE.Bone;
          else if (name.includes('LeftLeg')) leftLegRef.current = child as THREE.Bone;
          
          if (name.includes('RightUpLeg')) rightUpLegRef.current = child as THREE.Bone;
          else if (name.includes('RightLeg')) rightLegRef.current = child as THREE.Bone;

          if (name.includes('LeftArm')) leftArmRef.current = child as THREE.Bone;
          else if (name.includes('LeftForeArm')) leftForeArmRef.current = child as THREE.Bone;

          if (name.includes('RightArm')) rightArmRef.current = child as THREE.Bone;
          else if (name.includes('RightForeArm')) rightForeArmRef.current = child as THREE.Bone;
          
          if (!initialRotations.current[name]) {
              initialRotations.current[name] = child.rotation.clone();
          }
      }
    });
  }, [scene, url]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const group = groupRef.current;
    if (!group) return;

    // --- 1. Movement Physics ---
    const speed = 0.08; // Adjusted speed
    const frontVector = new THREE.Vector3(0, 0, 0);
    const sideVector = new THREE.Vector3(0, 0, 0);
    const direction = new THREE.Vector3();
    
    // Check Keys
    const k = keys.current;
    if (k['w'] || k['arrowup']) frontVector.z -= 1;
    if (k['s'] || k['arrowdown']) frontVector.z += 1;
    if (k['a'] || k['arrowleft']) sideVector.x -= 1;
    if (k['d'] || k['arrowright']) sideVector.x += 1;

    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(speed);

    // Apply movement
    const isMoving = direction.length() > 0;
    if (isMoving) {
        group.position.x += direction.x;
        group.position.z += direction.z;

        // Smooth rotation to face direction
        const targetRotation = Math.atan2(direction.x, direction.z);
        let rotDiff = targetRotation - group.rotation.y;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        group.rotation.y += rotDiff * 0.15;
    }

    // --- 2. Camera Follow ---
    if (orbitControlsRef.current) {
        const controls = orbitControlsRef.current;
        const camera = state.camera;
        const delta = new THREE.Vector3().subVectors(group.position, prevPos.current);
        camera.position.add(delta);
        
        const targetOffset = new THREE.Vector3(0, 1.2, 0); // Focus on chest
        const newTarget = group.position.clone().add(targetOffset);
        
        controls.target.copy(newTarget);
        controls.update();
        
        prevPos.current.copy(group.position);
    }

    // --- 3. Procedural Animation (Full Body) ---
    const applyRot = (bone: THREE.Bone, axis: 'x'|'y'|'z', val: number) => {
        const base = initialRotations.current[bone.name];
        if (base) bone.rotation[axis] = base[axis] + val;
    };

    // Helper for smooth damping return to idle
    const dampRot = (bone: THREE.Bone, axis: 'x'|'y'|'z', targetOffset: number, delta: number = 0.1) => {
         const base = initialRotations.current[bone.name];
         if (!base) return;
         bone.rotation[axis] = THREE.MathUtils.lerp(bone.rotation[axis], base[axis] + targetOffset, delta);
    };

    if (isMoving) {
        const walkSpeed = 12;
        const legAmp = 0.6;   // How far thighs swing
        const kneeAmp = 1.0;  // How much knees bend
        const armAmp = 0.3;   // How far arms swing

        // -- LEGS --
        // Left Leg
        if (leftUpLegRef.current) applyRot(leftUpLegRef.current, 'x', Math.sin(t * walkSpeed) * legAmp);
        // Knee bends when leg swings forward/up (Phase shifted)
        if (leftLegRef.current) applyRot(leftLegRef.current, 'x', Math.max(0, Math.sin(t * walkSpeed + 1)) * kneeAmp);

        // Right Leg (Phase offset PI)
        if (rightUpLegRef.current) applyRot(rightUpLegRef.current, 'x', Math.sin(t * walkSpeed + Math.PI) * legAmp);
        if (rightLegRef.current) applyRot(rightLegRef.current, 'x', Math.max(0, Math.sin(t * walkSpeed + Math.PI + 1)) * kneeAmp);

        // -- ARMS --
        // Put arms DOWN (rotate Z) and swing X
        const armDownRot = 1.35; // ~77 degrees down
        
        if (leftArmRef.current) {
             applyRot(leftArmRef.current, 'z', armDownRot); 
             // Arms swing opposite to legs (Left Arm swings with Right Leg)
             applyRot(leftArmRef.current, 'x', Math.sin(t * walkSpeed + Math.PI) * armAmp);
        }
        if (leftForeArmRef.current) applyRot(leftForeArmRef.current, 'x', 0.4); // Natural elbow bend

        if (rightArmRef.current) {
             applyRot(rightArmRef.current, 'z', -armDownRot);
             applyRot(rightArmRef.current, 'x', Math.sin(t * walkSpeed) * armAmp);
        }
        if (rightForeArmRef.current) applyRot(rightForeArmRef.current, 'x', 0.4);

        // -- SPINE --
        // Bobbing up and down
        group.position.y = -2 + Math.abs(Math.sin(t * walkSpeed)) * 0.05;
        // Subtle spine twist
        if (spineRef.current) applyRot(spineRef.current, 'y', Math.sin(t * walkSpeed) * 0.1);

    } else {
        // -- IDLE --
        group.position.y = THREE.MathUtils.lerp(group.position.y, -2, 0.1);

        // Breathe
        if (spineRef.current) {
             applyRot(spineRef.current, 'x', Math.sin(t * 1.5) * 0.03);
             applyRot(spineRef.current, 'y', 0);
        }

        // Return Legs to stand
        if (leftUpLegRef.current) dampRot(leftUpLegRef.current, 'x', 0);
        if (leftLegRef.current) dampRot(leftLegRef.current, 'x', 0);
        if (rightUpLegRef.current) dampRot(rightUpLegRef.current, 'x', 0);
        if (rightLegRef.current) dampRot(rightLegRef.current, 'x', 0);

        // Arms relax at sides
        const relaxArmZ = 1.2;
        if (leftArmRef.current) {
             dampRot(leftArmRef.current, 'z', relaxArmZ);
             dampRot(leftArmRef.current, 'x', 0);
        }
        if (leftForeArmRef.current) dampRot(leftForeArmRef.current, 'x', 0.1);

        if (rightArmRef.current) {
             dampRot(rightArmRef.current, 'z', -relaxArmZ);
             dampRot(rightArmRef.current, 'x', 0);
        }
        if (rightForeArmRef.current) dampRot(rightForeArmRef.current, 'x', 0.1);
    }

    // --- 4. Lip Sync Logic ---
    if (headMeshRef.current && headMeshRef.current.morphTargetDictionary && headMeshRef.current.morphTargetInfluences) {
        const dict = headMeshRef.current.morphTargetDictionary;
        const influences = headMeshRef.current.morphTargetInfluences;
        const volume = audioManager.getVolume();
        const targetOpen = volume * 2.5;
        const mouthOpenIdx = dict['mouthOpen'] ?? dict['jawOpen'];
        const visemeAA = dict['viseme_aa'];
        if (mouthOpenIdx !== undefined) influences[mouthOpenIdx] = THREE.MathUtils.lerp(influences[mouthOpenIdx], targetOpen, 0.4);
        else if (visemeAA !== undefined) influences[visemeAA] = THREE.MathUtils.lerp(influences[visemeAA], targetOpen, 0.4);
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
        <primitive 
        object={scene} 
        position={[0, 0, 0]} 
        scale={1.6} 
        />
    </group>
  );
};
