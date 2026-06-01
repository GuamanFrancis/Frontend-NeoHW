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
  const { scene: originalScene, animations } = useGLTF(component.file);
  const animProgress = useRef(0);
  const isAnimatingRef = useRef(false);
  const hasInitialized = useRef(false);

  const clonedScene = useMemo(() => {
    const clone = originalScene.clone(true);
    clone.traverse((child) => {
      const nameL = child.name.toLowerCase();
      if (
        nameL.includes('flecha') ||
        nameL.includes('guia') ||
        nameL.includes('backplate') ||
        nameL.includes('soporte_socket') ||
        nameL.includes('placa_soporte') ||
        nameL.includes('placeholder') ||
        nameL.includes('vidrio') ||
        nameL.includes('panel_vidrio')
      ) {
        child.visible = false;
      }
      if (child instanceof THREE.Mesh && child.material) {
        child.material = (child.material as THREE.Material).clone();
      }
    });
    return clone;
  }, [originalScene]);

  const mixer = useMemo(() => new THREE.AnimationMixer(clonedScene), [clonedScene]);

  const actions = useMemo(() => {
    if (!animations || animations.length === 0) return [];
    return animations.map((clip) => {
      const act = mixer.clipAction(clip);
      act.setLoop(THREE.LoopOnce, 1);
      act.clampWhenFinished = true;
      act.play();
      return act;
    });
  }, [animations, mixer]);

  const setAnimationProgress = (progress: number) => {
    actions.forEach((action) => {
      const duration = action.getClip().duration;
      action.time = progress * duration;
    });
    mixer.update(0);
  };

  useEffect(() => {
    if (!groupRef.current || hasInitialized.current) return;
    hasInitialized.current = true;
    groupRef.current.position.set(0, 0, 0);
    groupRef.current.rotation.set(0, 0, 0);
    setAnimationProgress(state === 'installed' ? 1 : 0);
  }, [clonedScene, state]);

  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.position.set(0, 0, 0);
    groupRef.current.rotation.set(0, 0, 0);

    if (state === 'installing') {
      groupRef.current.visible = true;
      animProgress.current = 0;
      isAnimatingRef.current = true;
      setAnimationProgress(0);
      if (component.interaction === 'fade-in') {
        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.transparent = true;
            mat.opacity = 0;
          }
        });
      }
    } else if (state === 'installed') {
      groupRef.current.visible = true;
      isAnimatingRef.current = false;
      setAnimationProgress(1);
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.transparent = false;
          mat.opacity = 1;
        }
      });
    } else {
      groupRef.current.visible = false;
      isAnimatingRef.current = false;
      animProgress.current = 0;
      setAnimationProgress(0);
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = 0;
        }
      });
    }
  }, [state, clonedScene, component]);

  useFrame((_, delta) => {
    if (!isAnimatingRef.current || !groupRef.current) return;
    const duration = 1.4;
    animProgress.current += delta / duration;

    if (animProgress.current >= 1) {
      animProgress.current = 1;
      isAnimatingRef.current = false;
      setAnimationProgress(1);
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.transparent = false;
          mat.opacity = 1;
        }
      });
      onInstallComplete(component.id);
      return;
    }

    const t = animProgress.current;
    const eased = 1 - Math.pow(1 - t, 3);

    if (component.interaction === 'fade-in') {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = eased;
        }
      });
    } else {
      setAnimationProgress(eased);
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = 0.2 + 0.8 * eased;
        }
      });
    }
  });

  return (
    <group ref={groupRef} visible={state === 'installed' || state === 'installing'}>
      <primitive object={clonedScene} />
    </group>
  );
};

export default React.memo(PCPart);