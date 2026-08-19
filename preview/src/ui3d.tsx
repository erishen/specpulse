import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { ReactNode } from 'react';

type UIProps = Record<string, unknown> & { children?: ReactNode };

function pick(props: UIProps, key: string, fallback = ''): string {
  const value = props[key];
  return typeof value === 'string' ? value : fallback;
}

function parseVector(raw: string, fallback: [number, number, number]): [number, number, number] {
  const parts = raw.split(',').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return fallback;
  return [parts[0], parts[1], parts[2]];
}

function parseColor(props: UIProps, key: string, fallback: string): string {
  const value = pick(props, key, fallback);
  return /^#[0-9a-fA-F]{3,8}$/.test(value) || /^[a-z]+$/i.test(value) ? value : fallback;
}

export function Scene3D(props: UIProps) {
  const { children } = props;
  const background = parseColor(props, 'background', '#0f172a');
  const height = pick(props, 'height', '420px');
  const camera = { position: parseVector(pick(props, 'camera', '6,5,6'), [6, 5, 6]), fov: 50 };

  return (
    <div style={{ height, width: '100%' }}>
      <Canvas camera={camera} onCreated={({ gl }) => gl.setClearColor(background)}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <pointLight position={[-5, -2, -5]} intensity={0.4} color="#60a5fa" />
        {children}
        <OrbitControls enableDamping makeDefault />
      </Canvas>
    </div>
  );
}

export function Box3D(props: UIProps) {
  const position = parseVector(pick(props, 'position', '0,0,0'), [0, 0, 0]);
  const rotation = parseVector(pick(props, 'rotation', '0,0,0'), [0, 0, 0]);
  const size = parseVector(pick(props, 'size', '1,1,1'), [1, 1, 1]);
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={parseColor(props, 'color', '#3b82f6')} />
    </mesh>
  );
}

export function Sphere3D(props: UIProps) {
  const position = parseVector(pick(props, 'position', '0,0,0'), [0, 0, 0]);
  const radius = Math.max(Number(pick(props, 'radius', '1')) || 1, 0.01);
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color={parseColor(props, 'color', '#22d3ee')} />
    </mesh>
  );
}

export function Torus3D(props: UIProps) {
  const position = parseVector(pick(props, 'position', '0,0,0'), [0, 0, 0]);
  const rotation = parseVector(pick(props, 'rotation', '1.2,0,0'), [1.2, 0, 0]);
  const radius = Math.max(Number(pick(props, 'radius', '1')) || 1, 0.01);
  const tube = Math.max(Number(pick(props, 'tube', '0.4')) || 0.4, 0.01);
  return (
    <mesh position={position} rotation={rotation}>
      <torusGeometry args={[radius, tube, 16, 64]} />
      <meshStandardMaterial color={parseColor(props, 'color', '#f59e0b')} />
    </mesh>
  );
}

export function Plane3D(props: UIProps) {
  const position = parseVector(pick(props, 'position', '0,-0.5,0'), [0, -0.5, 0]);
  const size = parseVector(pick(props, 'size', '20,20,1'), [20, 20, 1]);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size[0], size[1]]} />
      <meshStandardMaterial color={parseColor(props, 'color', '#334155')} />
    </mesh>
  );
}

export function Cylinder3D(props: UIProps) {
  const position = parseVector(pick(props, 'position', '0,0,0'), [0, 0, 0]);
  const radius = Math.max(Number(pick(props, 'radius', '1')) || 1, 0.01);
  const height = Math.max(Number(pick(props, 'height', '2')) || 2, 0.01);
  return (
    <mesh position={position}>
      <cylinderGeometry args={[radius, radius, height, 32]} />
      <meshStandardMaterial color={parseColor(props, 'color', '#f472b6')} />
    </mesh>
  );
}

export function Cone3D(props: UIProps) {
  const position = parseVector(pick(props, 'position', '0,0,0'), [0, 0, 0]);
  const radius = Math.max(Number(pick(props, 'radius', '1')) || 1, 0.01);
  const height = Math.max(Number(pick(props, 'height', '2')) || 2, 0.01);
  return (
    <mesh position={position}>
      <coneGeometry args={[radius, height, 32]} />
      <meshStandardMaterial color={parseColor(props, 'color', '#34d399')} />
    </mesh>
  );
}

export function Icosahedron3D(props: UIProps) {
  const position = parseVector(pick(props, 'position', '0,0,0'), [0, 0, 0]);
  const radius = Math.max(Number(pick(props, 'radius', '1')) || 1, 0.01);
  return (
    <mesh position={position}>
      <icosahedronGeometry args={[radius, 0]} />
      <meshStandardMaterial color={parseColor(props, 'color', '#a78bfa')} flatShading />
    </mesh>
  );
}

export function TorusKnot3D(props: UIProps) {
  const position = parseVector(pick(props, 'position', '0,0,0'), [0, 0, 0]);
  const radius = Math.max(Number(pick(props, 'radius', '1')) || 1, 0.01);
  const tube = Math.max(Number(pick(props, 'tube', '0.3')) || 0.3, 0.01);
  return (
    <mesh position={position}>
      <torusKnotGeometry args={[radius, tube, 128, 16]} />
      <meshStandardMaterial color={parseColor(props, 'color', '#fb7185')} />
    </mesh>
  );
}