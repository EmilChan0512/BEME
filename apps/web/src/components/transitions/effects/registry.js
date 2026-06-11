import { VeilTransition } from './VeilTransition';
export const routeTransitionEffectRegistry = [
    {
        name: 'veil',
        label: 'Veil',
        description: '柔和的品牌幕布先覆盖页面，再平滑揭示下一页，稳定且克制。',
        Component: VeilTransition,
    },
];
const routeTransitionEffectMap = new Map(routeTransitionEffectRegistry.map((effect) => [effect.name, effect]));
export function getRouteTransitionEffectDefinition(name) {
    const definition = routeTransitionEffectMap.get(name);
    if (!definition) {
        throw new Error(`Unknown route transition effect: ${name}`);
    }
    return definition;
}
