import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function MedicalCross() {
  const group = useRef();
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.16;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * .4) * .08;
    }
  });
  return <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.45}>
    <group ref={group} rotation={[.2, -.4, 0]}>
      <mesh castShadow><boxGeometry args={[1.25, .38, .34]} /><meshStandardMaterial color="#FCD116" roughness={.25} metalness={.12} /></mesh>
      <mesh castShadow><boxGeometry args={[.38, 1.25, .34]} /><meshStandardMaterial color="#FCD116" roughness={.25} metalness={.12} /></mesh>
      <mesh position={[0,0,-.28]}><torusGeometry args={[.9,.025,16,100]} /><meshStandardMaterial color="#7ccaa5" emissive="#0A5C36" emissiveIntensity={.5} /></mesh>
    </group>
  </Float>;
}

function Particles() {
  const points = useRef();
  const positions = new Float32Array(90);
  for (let i=0;i<positions.length;i++) positions[i] = (Math.random()-.5)*6;
  useFrame((_,delta)=>{ if(points.current) points.current.rotation.y += delta*.03; });
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" count={positions.length/3} array={positions} itemSize={3} /></bufferGeometry><pointsMaterial color="#afe0c5" size={.035} transparent opacity={.7} /></points>;
}

export default function MedicalScene() {
  return <div className="absolute inset-0" aria-hidden="true">
    <Canvas camera={{ position: [0,0,3.6], fov: 45 }} dpr={[1,1.5]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.6} /><directionalLight position={[3,4,3]} intensity={2.5} color={new THREE.Color('#fff4ba')} />
      <MedicalCross /><Particles /><Environment preset="city" />
    </Canvas>
  </div>;
}
