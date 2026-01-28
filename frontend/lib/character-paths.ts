/**
 * public/default_characters/ = (1) 없는 정적 GLB
 * public/animated_characters/ = (1) 있는 애니메이션 GLB
 * 저장/API에서는 기존 경로(/character1.glb, /cute+girl.glb 등) 유지하고,
 * 실제 로드 시 toDefaultCharacterPath / toAnimatedCharacterPath 사용.
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

/** 애니메이션 GLB 로드 시 사용할 경로. princess는 (1) 없음 → default 사용 */
export function toAnimatedCharacterPath(displayUrl: string): string {
  if (!displayUrl?.trim()) return '/default_characters/character1.glb';
  const base = displayUrl.replace(/\s*\(1\)\s*\.glb$/i, '.glb').trim();
  const name = base.replace(/^\/+/, '').split('/').pop()?.replace(/\.glb$/i, '') || 'character1';
  if (name.includes('princess')) return '/default_characters/princess.glb';
  return `/animated_characters/${name} (1).glb`;
}
