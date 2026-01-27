// components/ModelViewer.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import { useEffect, useState, useRef, useMemo } from "react";
import * as THREE from 'three';

function Model({ url, scaleMultiplier = 1 }: { url: string; scaleMultiplier?: number }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  useEffect(() => {
    Object.values(actions).forEach(action => action?.stop());
  }, [actions]);
  
  const isCharacter1 = url.includes('character1');
  const positionY = isCharacter1 ? -1.0 : -0.3;
  const baseScale = isCharacter1 ? 1.8 : 2.8;
  const scale = baseScale * scaleMultiplier;
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={clonedScene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

interface ModelViewerProps {
  modelUrl?: string;
  /** 로비 등에서 캐릭터를 약간 크게 보이게 할 때 1.0보다 크게 (예: 1.15) */
  scaleMultiplier?: number;
}

export default function ModelViewer({ modelUrl, scaleMultiplier = 1 }: ModelViewerProps) {
  const [equippedCharacter, setEquippedCharacter] = useState<string>('/character1.glb');

  useEffect(() => {
    // 전달받은 modelUrl이 있으면 그것을 사용
    if (modelUrl) {
      setEquippedCharacter(modelUrl);
      return;
    }
    
    // 없으면 localStorage에서 장착된 캐릭터 불러오기
    const userId = localStorage.getItem('userId');
    if (userId) {
      const equipped = localStorage.getItem(`equipped-character-${userId}`);
      if (equipped) {
        setEquippedCharacter(equipped);
      }
    }
  }, [modelUrl]);

  return (
    // Canvas: 3D가 그려지는 영역
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0.5, 5], fov: 45 }}>
        {/* 조명 설정 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* 환경광 (주변 반사광) - city, sunset, dawn 등 프리셋 사용 가능 */}
        <Environment preset="city" />

        {/* 모델 렌더링 */}
        <Model url={equippedCharacter} scaleMultiplier={scaleMultiplier} />

        {/* 마우스로 돌려보기 */}
        <OrbitControls 
          autoRotate={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}
