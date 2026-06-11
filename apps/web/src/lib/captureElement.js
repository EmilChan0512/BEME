import html2canvas from 'html2canvas';
function waitForNextPaint() {
    return new Promise((resolve) => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
        });
    });
}
export async function captureElement(element) {
    await waitForNextPaint();
    const rect = element.getBoundingClientRect();
    // #region debug-point B:capture-start
    fetch('http://127.0.0.1:7777/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'route-transition-noop', runId: 'pre-fix', hypothesisId: 'B', location: 'captureElement.ts:20', msg: '[DEBUG] captureElement start', data: { width: Math.round(rect.width), height: Math.round(rect.height), className: element.className }, ts: Date.now() }) }).catch(() => { });
    // #endregion
    const canvas = await html2canvas(element, {
        backgroundColor: '#f9fafb',
        logging: false,
        useCORS: true,
        scale: 1,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        windowWidth: Math.round(rect.width),
        windowHeight: Math.round(rect.height),
        scrollX: 0,
        scrollY: 0,
    });
    // #region debug-point B:capture-finish
    fetch('http://127.0.0.1:7777/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'route-transition-noop', runId: 'pre-fix', hypothesisId: 'B', location: 'captureElement.ts:33', msg: '[DEBUG] captureElement finish', data: { canvasWidth: canvas.width, canvasHeight: canvas.height }, ts: Date.now() }) }).catch(() => { });
    // #endregion
    return {
        src: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
    };
}
