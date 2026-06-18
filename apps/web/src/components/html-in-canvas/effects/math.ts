// 一个轻量的伪随机函数。
// 输入相同数值时输出恒定，适合做“可重复”的粒子分布与动画扰动。
export function hash(value: number) {
  const s = Math.sin(value * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

// 平滑版 step，用来让数值过渡更柔和，避免突兀跳变。
export function softstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
