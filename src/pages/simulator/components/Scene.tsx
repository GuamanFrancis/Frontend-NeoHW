import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import PCPart from './PCPart';
import { ASSEMBLY_SEQUENCE } from '../data/components';
import type { ComponentState, CameraAction } from '../types';

interface SceneProps {
  states: Record<string, ComponentState>;
  onInstallComplete: (id: string) => void;
  cameraAction?: CameraAction | null;
  autoRotate?: boolean;
}

const Lights: React.FC = () => (
  <>
    <hemisphereLight color="#ffffff" groundColor="#222244" intensity={2.2} />
    <directionalLight position={[5, -5, 8]} intensity={0.8} />
    <directionalLight position={[-3, 3, 4]} intensity={0.3} />
    <directionalLight position={[0, 6, -2]} intensity={0.2} />
  </>
);

const LoadingFallback: React.FC = () => (
  <mesh>
    <boxGeometry args={[0.5, 0.5, 0.5]} />
    <meshStandardMaterial color="#0d9488" wireframe />
  </mesh>
);

const CASE_CENTER = new THREE.Vector3(-2.68, -0.34, 2.05);
const INITIAL_CAM_POS = new THREE.Vector3(2, 3, 14);

const SceneContent: React.FC<SceneProps> = ({ states, onInstallComplete, cameraAction, autoRotate }) => {
  const controlsRef = useRef<any>(null);
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
        const dir2 = new THREE.Vector3().subVectors(camera.position, CASE_CENTER).normalize();
        const dist2 = camera.position.distanceTo(CASE_CENTER);
        if (dist2 < 22) {
          camera.position.addScaledVector(dir2, 1.5);
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

  const modelComponents = ASSEMBLY_SEQUENCE.filter(c => c.hasModel !== false);

  return (
    <>
      <Lights />
      <Suspense fallback={<LoadingFallback />}>
        {modelComponents.map((comp) => (
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
        position: [2, 3, 14],
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

export default React.memo(Scene);
