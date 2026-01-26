// components/ModelViewer.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { useEffect, useState } from "react";

function Model({ url }: { url: string }) {
  // GLB 파일 불러오기
  const { scene } = useGLTF(url);
  
  // 모델 크기나 위치, 회전 조정
  // rotation: [x, y, z] - Y축으로 180도 회전하여 정면을 바라보게 함
  return <primitive object={scene} scale={3} position={[0, -1.5, 0]} rotation={[0, -Math.PI * 0.55, 0]} />;
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
      <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
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
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}
