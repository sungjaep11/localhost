// components/ModelViewer.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";

function Model({ url }: { url: string }) {
  // GLB 파일 불러오기
  const { scene } = useGLTF(url);
  
  // 모델 크기나 위치 조정 (필요하면 수정)
  return <primitive object={scene} scale={3} position={[0, -1.5, 0]} />;
}

export default function ModelViewer() {
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
        <Model url="/character1.glb" />

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