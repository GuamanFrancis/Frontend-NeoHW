import React, { Suspense, useEffect, useRef, memo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import PCPart from './PCPart';
import { ASSEMBLY_SEQUENCE } from '../data/components';
import type { ComponentState, CameraAction } from '../types';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface SceneProps {
  states: Record<string, ComponentState>;
  onInstallComplete: (id: string) => void;
  cameraAction?: CameraAction | null;
  autoRotate?: boolean;
}

const CASE_CENTER = new THREE.Vector3(-3, 2, -6);
const INITIAL_CAM_POS = new THREE.Vector3(-5, 2, 10);


const MODEL_COMPONENTS = ASSEMBLY_SEQUENCE.filter(c => c.hasModel !== false);


const Lights = memo(() => (
  <>
    <hemisphereLight color="#ffffff" groundColor="#222244" intensity={2.2} />
    <directionalLight position={[5, -5, 8]} intensity={0.8} />
    <directionalLight position={[-3, 3, 4]} intensity={0.3} />
    <directionalLight position={[0, 6, -2]} intensity={0.2} />
  </>
));
Lights.displayName = 'Lights';

const LoadingFallback = memo(() => (
  <mesh>
    <boxGeometry args={[0.5, 0.5, 0.5]} />
    <meshStandardMaterial color="#0d9488" wireframe />
  </mesh>
));
LoadingFallback.displayName = 'LoadingFallback';

const SceneContent: React.FC<SceneProps> = ({ states, onInstallComplete, cameraAction, autoRotate }) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.copy(INITIAL_CAM_POS);
    camera.lookAt(CASE_CENTER);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    if (!cameraAction) return;
    const controls = controlsRef.current;

    switch (cameraAction.type) {
      case 'zoom-in': {
        const dir = new THREE.Vector3().subVectors(camera.position, CASE_CENTER).normalize();
        const dist = camera.position.distanceTo(CASE_CENTER);
        if (dist > 4) {
          camera.position.addScaledVector(dir, -1.5);
        }
        break;
      }
      case 'zoom-out': {
        const dir = new THREE.Vector3().subVectors(camera.position, CASE_CENTER).normalize();
        const dist = camera.position.distanceTo(CASE_CENTER);
        if (dist < 22) {
          camera.position.addScaledVector(dir, 1.5);
        }
        break;
      }
      case 'reset': {
        camera.position.copy(INITIAL_CAM_POS);
        camera.lookAt(CASE_CENTER);
        if (controls) {
          controls.target.copy(CASE_CENTER);
          controls.autoRotate = false;
          controls.update();
        }
        break;
      }
      case 'center': {
        if (controls) {
          controls.target.copy(CASE_CENTER);
          controls.update();
        }
        camera.lookAt(CASE_CENTER);
        break;
      }
    }
  }, [cameraAction, camera]);

  return (
    <>
      <Lights />
      <Suspense fallback={<LoadingFallback />}>
        {MODEL_COMPONENTS.map((comp) => (
          <PCPart
            key={comp.id}
            component={comp}
            state={states[comp.id]}
            onInstallComplete={onInstallComplete}
          />
        ))}
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        target={CASE_CENTER}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={22}
        enablePan={true}
        enableZoom={true}
        autoRotate={autoRotate || false}
        autoRotateSpeed={1.5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.3}
      />
    </>
  );
};

const Scene: React.FC<SceneProps> = (props) => {
  return (
    <Canvas
      camera={{
        
        position: INITIAL_CAM_POS.toArray(), 
        fov: 40,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.NoToneMapping,
      }}
    >
      <color attach="background" args={['#0a0f1a']} />
      <SceneContent {...props} />
    </Canvas>
  );
};

export default memo(Scene);