import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { PCComponent, ComponentState } from '../types';

interface PCPartProps {
  component: PCComponent;
  state: ComponentState;
  onInstallComplete: (id: string) => void;
}

const PCPart: React.FC<PCPartProps> = ({ component, state, onInstallComplete }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene: originalScene } = useGLTF(component.file);
  const animProgress = useRef(0);
  const isAnimatingRef = useRef(false);
  const hasInitialized = useRef(false);
  const startOffset = useRef(new THREE.Vector3(...component.startOffset));

  
  const clonedScene = useMemo(() => {
    const clone = originalScene.clone(true);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material = (child.material as THREE.Material).clone();
      }
    });
    return clone;
  }, [originalScene]);

  useEffect(() => {
    if (!groupRef.current || hasInitialized.current) return;
    hasInitialized.current = true;
    if (component.installOrder === 0) {
      const isInstalledOrInstalling = state === 'installed' || state === 'installing';
      groupRef.current.visible = isInstalledOrInstalling;
      groupRef.current.position.set(0, 0, 0);
      return;
    }
    if (component.interaction === 'fade-in') {
      groupRef.current.visible = false;
      groupRef.current.position.set(0, 0, 0);
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = 0;
        }
      });
    } else {
      groupRef.current.visible = false;
      groupRef.current.position.copy(startOffset.current);
    }
  }, [clonedScene, component, state]);

 
  useEffect(() => {
    if (!groupRef.current) return;
    
    if (state === 'installing') {
      groupRef.current.visible = true;
      animProgress.current = 0;
      isAnimatingRef.current = true;
      if (component.interaction === 'fade-in') {
        groupRef.current.position.set(0, 0, 0);
      } else {
        groupRef.current.position.copy(startOffset.current);
      }
    } else if (state === 'installed') {
      groupRef.current.visible = true;
      isAnimatingRef.current = false;
      groupRef.current.position.set(0, 0, 0);
      if (component.interaction === 'fade-in') {
        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.opacity = 1;
          }
        });
      }
    } else {
      
      groupRef.current.visible = false;
      isAnimatingRef.current = false;
      animProgress.current = 0;
      
      if (component.interaction === 'fade-in') {
        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.opacity = 0;
          }
        });
      } else {
        groupRef.current.position.copy(startOffset.current);
      }
    }
  }, [state, clonedScene, component]);

  useFrame((_, delta) => {
    if (!isAnimatingRef.current || !groupRef.current) return;
    const duration = 1.4;
    animProgress.current += delta / duration;
    if (animProgress.current >= 1) {
      animProgress.current = 1;
      isAnimatingRef.current = false;
      if (component.interaction === 'fade-in') {
        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.opacity = 1;
          }
        });
      } else {
        groupRef.current.position.set(0, 0, 0);
      }
      onInstallComplete(component.id);
      return;
    }
    const t = animProgress.current;
    const eased = 1 - Math.pow(1 - t, 3);
    if (component.interaction === 'fade-in') {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.opacity = eased;
        }
      });
    } else {
      groupRef.current.position.lerpVectors(startOffset.current, new THREE.Vector3(0, 0, 0), eased);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
};

export default React.memo(PCPart);