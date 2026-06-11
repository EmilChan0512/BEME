import { createContext, useContext } from 'react';
export const RouteTransitionContext = createContext(null);
export function useRouteTransition() {
    const context = useContext(RouteTransitionContext);
    if (!context) {
        throw new Error('useRouteTransition must be used within RouteTransitionProvider');
    }
    return context;
}
