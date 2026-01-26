// components/ModelViewer.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import { useEffect, useState, useRef } from "react";
import * as THREE from 'three';

function Model({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);
  
  // 모든 애니메이션 정지
  useEffect(() => {
    Object.values(actions).forEach(action => action?.stop());
  }, [actions]);
  
  // character1은 축이 달라서 다른 position 적용
  const isCharacter1 = url.includes('character1');
  const positionY = isCharacter1 ? -1.5 : -0.3;
  const scale = isCharacter1 ? 2.8 : 2.8;
  
  return <primitive ref={group} object={scene} scale={scale} position={[0, positionY, 0]} rotation={[0, -Math.PI * 0.55, 0]} />;
}

interface ModelViewerProps {
  modelUrl?: string;
}

export default function ModelViewer({ modelUrl }: ModelViewerProps) {
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
        <Model url={equippedCharacter} />

        {/* 마우스로 돌려보기 */}
        <OrbitControls 
          autoRotate={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}
