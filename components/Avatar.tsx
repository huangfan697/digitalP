import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AudioManager } from '../services/audioManager';

interface AvatarProps {
  audioManager: AudioManager;
  isTalking: boolean;
  avatarUrl: string;
}

// Using a standard Ready Player Me avatar. 
// These GLBs usually come with 'viseme_XX' or 'mouthOpen' morph targets.
const DEFAULT_MODEL_URL = "https://models.readyplayer.me/64e3055495439dfcf3f0b665.glb";

export const Avatar: React.FC<AvatarProps> = ({ audioManager, isTalking, avatarUrl }) => {
  const { scene } = useGLTF(avatarUrl || DEFAULT_MODEL_URL);
  const { nodes } = useGraph(scene);
  const headMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const bodyMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  
  // Ref to store original rotations for idle animation
  const neckBoneRef = useRef<THREE.Bone | null>(null);
  const spineBoneRef = useRef<THREE.Bone | null>(null);
  const jawBoneRef = useRef<THREE.Bone | null>(null);
  const initialNeckRot = useRef<THREE.Euler | null>(null);
  const initialSpineRot = useRef<THREE.Euler | null>(null);
  const initialJawRot = useRef<THREE.Euler | null>(null);
  const initialBodyPos = useRef<THREE.Vector3 | null>(null);

  // Parse the model to find the head mesh with morph targets
  useEffect(() => {
    scene.traverse((child) => {
      // ReadyPlayerMe usually names the mesh with blendshapes "Wolf3D_Head" or "Wolf3D_Avatar"
      if ((child as THREE.SkinnedMesh).isMesh && (child as THREE.SkinnedMesh).morphTargetDictionary) {
        // We prefer the head mesh
        if (child.name.includes('Head') || child.name.includes('Avatar')) {
          headMeshRef.current = child as THREE.SkinnedMesh;
        }
        if (child.name.toLowerCase().includes('body') || child.name.toLowerCase().includes('torso')) {
          bodyMeshRef.current = child as THREE.SkinnedMesh;
        }
      }
      if ((child as THREE.Bone).isBone && child.name.includes('Neck')) {
        neckBoneRef.current = child as THREE.Bone;
        initialNeckRot.current = child.rotation.clone();
      }
      if ((child as THREE.Bone).isBone && child.name.toLowerCase().includes('spine')) {
        spineBoneRef.current = child as THREE.Bone;
        initialSpineRot.current = child.rotation.clone();
      }
      if ((child as THREE.Bone).isBone && child.name.toLowerCase().includes('jaw')) {
        jawBoneRef.current = child as THREE.Bone;
        initialJawRot.current = child.rotation.clone();
      }
      if ((child as THREE.Object3D).isObject3D && child.name.toLowerCase().includes('hips')) {
        initialBodyPos.current = child.position.clone();
      }
    });
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // --- 1. Idle Animation (Breathing & Subtle Head Sway) ---
    if (neckBoneRef.current && initialNeckRot.current) {
        const swayX = Math.sin(t * 1) * 0.05 + Math.sin(t * 3.5) * 0.01;
        const swayY = Math.cos(t * 0.8) * 0.05 + Math.sin(t * 2.1) * 0.01;
        neckBoneRef.current.rotation.x = initialNeckRot.current.x + swayX;
        neckBoneRef.current.rotation.y = initialNeckRot.current.y + swayY;
    }
    if (spineBoneRef.current && initialSpineRot.current) {
        const lean = Math.sin(t * 0.6) * 0.03;
        spineBoneRef.current.rotation.y = initialSpineRot.current.y + lean;
    }
    if (jawBoneRef.current && initialJawRot.current) {
        const volume = audioManager.getVolume();
        // small jaw pitch to reduce static teeth exposure
        const jawOpen = Math.min(0.25, volume * 0.25);
        jawBoneRef.current.rotation.x = THREE.MathUtils.lerp(
          jawBoneRef.current.rotation.x,
          initialJawRot.current.x + jawOpen,
          0.3
        );
    }
    // Subtle body bob
    if (bodyMeshRef.current && initialBodyPos.current) {
        const bob = Math.sin(t * 1.2) * 0.01;
        bodyMeshRef.current.position.y = initialBodyPos.current.y + bob;
    }

    // --- 2. Lip Sync Logic ---
    if (headMeshRef.current && headMeshRef.current.morphTargetDictionary && headMeshRef.current.morphTargetInfluences) {
        const dict = headMeshRef.current.morphTargetDictionary;
        const influences = headMeshRef.current.morphTargetInfluences;

        // Get Audio Volume (Energy)
        const volume = audioManager.getVolume();
        
        // We smooth the value slightly to avoid jitter
        // Mouth opening target (clamped) — tweak multiplier for expressiveness
        const targetOpen = Math.min(1, volume * 2.0);

        // Key Morph Targets for RPM avatars
        const mouthOpenIdx = dict['mouthOpen'] ?? dict['jawOpen'];
        const visemeAA = dict['viseme_aa'];

        // Reset all visemes to 0 first (optional, but cleaner)
        // For performance, we just manipulate the main ones.
        
        const lerpFactor = 0.1; // lower = smoother
        if (mouthOpenIdx !== undefined) {
           influences[mouthOpenIdx] = THREE.MathUtils.lerp(influences[mouthOpenIdx], targetOpen, lerpFactor);
        } else if (visemeAA !== undefined) {
           influences[visemeAA] = THREE.MathUtils.lerp(influences[visemeAA], targetOpen, lerpFactor);
        }
    }
  });

  return (
    <primitive 
      object={scene} 
      position={[0, -3.4, 0]} // Lowered Y to keep head centered with larger scale
      scale={2.3} // Increased scale from 1.1 to 2.3 for a "Medium Close Up" shot
      rotation={[0, 0, 0]} 
    />
  );
};

useGLTF.preload(DEFAULT_MODEL_URL);
useGLTF.preload(DEFAULT_MODEL_URL);
