# html-in-canvas 功能索引

这份文档用于快速回答两个问题：

1. 什么功能放在哪个文件里。
2. 哪些文件是基础设施，哪些文件是可复用特效，哪些文件是具体页面 preset。

所有路径都以下面这个目录为基准：

`apps/web/src/components/html-in-canvas/`

## 功能 -> 相对路径

| 功能 | 相对路径 |
| --- | --- |
| 通用舞台组件：负责 `source DOM`、`staging canvas`、`preview canvas` 三层结构，以及 `html-in-canvas` 能力检测、重绘和 fallback | `HtmlInCanvasStage.tsx` |
| 通用舞台样式：控制全屏布局、preview 不拦截交互、sourceRoot 可滚动 | `HtmlInCanvasStage.css` |
| 水墨风格 preset：`20260616` 页面主组件，基于通用舞台做深色水墨后处理 | `FullscreenInkCanvasStage.tsx` |
| 水墨风格 preset 样式 | `FullscreenInkCanvasStage.css` |
| 极光裂隙 preset：`20260618` 页面主组件，组合白底、拖影、极光、粒子、色散、扫描线、暗角 | `presets/AuroraRiftStage.tsx` |
| 极光裂隙 preset 样式：白底、隐藏原生光标、DOM 内容排版 | `presets/AuroraRiftStage.css` |
| effect 入参类型定义：统一约束每个特效模块能拿到哪些上下文 | `effects/types.ts` |
| effect 组合器：把多个独立特效串成一条渲染流水线 | `effects/composeEffects.ts` |
| 白底特效：每帧先清空并铺白色背景 | `effects/createWhiteBackgroundEffect.ts` |
| DOM 内容层特效：把 staging canvas 中的真实 DOM 画面绘制到预览层 | `effects/createDomLayerEffect.ts` |
| 滚动拖影特效：只在滚动时回写上一帧，形成反馈流体感 | `effects/createScrollFeedbackEffect.ts` |
| 指针极光特效：根据鼠标/手指位置和速度生成径向彩色光圈 | `effects/createPointerAuroraEffect.ts` |
| 粒子场特效：围绕指针生成可重复伪随机粒子 | `effects/createParticleFieldEffect.ts` |
| 滚动色散特效：只在滚动时叠加彩边，避免鼠标移动造成正文残影 | `effects/createScrollChromaticEffect.ts` |
| 扫描线特效：叠加轻微显示器纹理 | `effects/createScanlineEffect.ts` |
| 暗角特效：压暗边缘，增强聚焦感 | `effects/createVignetteEffect.ts` |
| 数学工具：伪随机 `hash` 和平滑插值 `softstep` | `effects/math.ts` |
| 指针跟踪 hook：统一维护归一化位置、速度和按下状态 | `hooks/usePointerTracker.ts` |

## 使用关系

| 场景 | 主要入口 | 依赖 |
| --- | --- | --- |
| 通用 html-in-canvas 舞台能力 | `HtmlInCanvasStage.tsx` | `HtmlInCanvasStage.css` |
| `20260616` 水墨页面 | `FullscreenInkCanvasStage.tsx` | `HtmlInCanvasStage.tsx`、`FullscreenInkCanvasStage.css` |
| `20260618` 极光页面 | `presets/AuroraRiftStage.tsx` | `HtmlInCanvasStage.tsx`、`hooks/usePointerTracker.ts`、`effects/*`、`presets/AuroraRiftStage.css` |

## 复用建议

| 需求 | 推荐文件 |
| --- | --- |
| 新做一个页面级 canvas preset | 从 `HtmlInCanvasStage.tsx` 开始，新增一个类似 `presets/AuroraRiftStage.tsx` 的组件 |
| 新增可复用视觉效果 | 放到 `effects/` 目录，并保持签名兼容 `CanvasEffect` |
| 新增依赖指针的交互效果 | 复用 `hooks/usePointerTracker.ts` |
| 调整 Aurora 页面观感 | 优先改 `presets/AuroraRiftStage.tsx` 顶部常量区 |
| 调整水墨页面观感 | 优先改 `FullscreenInkCanvasStage.tsx` 中的 `previewRenderer` |
