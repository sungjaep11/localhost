/**
 * public/default_characters/ = 기본 정적 GLB
 * public/animated_characters/ = 애니메이션 포함 GLB (boy_ani.glb, bunny_ani.glb 등)
 * 저장/API에서는 기존 경로(/character1.glb, /cute+girl.glb 등) 유지하고,
 * 실제 로드 시 toDefaultCharacterPath / toAnimatedCharacterPath 사용.
 *
 * 새 애니메이션 추가: public/animated_characters/ 에 {name}_ani.glb 추가 후
 * 아래 ANIMATED_CHARACTERS 에 display 경로의 base name 추가 (예: 'penguin' → penguin_ani.glb).
 */

/** (1) 붙은 경로를 논리 경로로: /cute+girl (1).glb → /cute+girl.glb (저장·비교용) */
export function toDisplayModelUrl(url: string): string {
  if (!url?.trim()) return '/character1.glb';
  return url.replace(/\s*\(1\)\s*\.glb$/i, '.glb').trim() || '/character1.glb';
}

/** 모델 로드 시 사용할 실제 경로. /character1.glb 또는 /cute+girl (1).glb → /default_characters/xxx.glb */
export function toDefaultCharacterPath(url: string): string {
  if (!url?.trim()) return '/default_characters/character1.glb';
  const base = url.replace(/\s*\(1\)\s*\.glb$/i, '.glb').trim();
  const name = base.replace(/^\/+/, '').split('/').pop()?.replace(/\.glb$/i, '') || 'character1';
  return `/default_characters/${name}.glb`;
}

/** 애니메이션 GLB 로드 시 사용할 경로. princess 등 애니가 없는 캐릭터는 default 사용 */
export function toAnimatedCharacterPath(displayUrl: string): string {
  if (!displayUrl?.trim()) return '/default_characters/character1.glb';

  // 이미 animated_characters 경로면 그대로 사용 (백워드 호환)
  if (displayUrl.startsWith('/animated_characters/')) {
    return displayUrl;
  }

  // (1) 접미사를 쓰던 예전 경로도 그대로 지원
  if (/\(1\)\.glb$/i.test(displayUrl)) {
    const baseLegacy = displayUrl.replace(/\s*\(1\)\s*\.glb$/i, ' (1).glb').trim();
    if (baseLegacy.startsWith('/animated_characters/')) return baseLegacy;
    const legacyName = baseLegacy.replace(/^\/+/, '').split('/').pop() || 'character1 (1).glb';
    return `/animated_characters/${legacyName}`;
  }

  const base = displayUrl.replace(/\s*\(1\)\s*\.glb$/i, '.glb').trim();
  const name = base.replace(/^\/+/, '').split('/').pop()?.replace(/\.glb$/i, '') || 'character1';

  /** animated_characters/ 에 있는 캐릭터. 추가 시 여기만 수정. */
  const ANIMATED_CHARACTERS = [
    'boy',
    'bunny',
    'character1',
    'cute+girl',
    'gym+rat',
    'hamster',
    'penguin',
    'stylized+girl',
    'wizard',
  ] as const;
  const animatedNameMap: Record<string, string> = Object.fromEntries(
    ANIMATED_CHARACTERS.map((n) => [n, `${n}_ani`])
  );

  if (name.includes('princess')) {
    // 공주는 별도 애니 파일이 없으므로 기본 GLB 사용
    return '/default_characters/princess.glb';
  }

  const animated = animatedNameMap[name];
  if (animated) {
    return `/animated_characters/${animated}.glb`;
  }

  // 매핑이 없으면 기본 GLB로 폴백
  return `/default_characters/${name}.glb`;
}

/** useGLTF 등에 넘길 때 공백·+ 인코딩 (cute+girl 등 파일명 404 방지) */
export function toGlbLoadUrl(path: string): string {
  return (path || '').replace(/ /g, '%20').replace(/\+/g, '%2B');
}

/** 구매한 애니메이션 키 (modelUrl:index). 로비/결과/마이페이지 등에서 사용 */
export function animationKey(modelUrl: string, index: number): string {
  return `${toDisplayModelUrl(modelUrl)}:${index}`;
}

/** 캐릭터에 animated_characters용 GLB가 있는지 (princess 등은 false) */
export function hasAnimatedVersion(displayUrl: string): boolean {
  return toAnimatedCharacterPath(displayUrl || '').includes('animated_characters');
}
