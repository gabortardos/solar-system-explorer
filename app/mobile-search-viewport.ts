/** Vertical VisualViewport geometry keeps the fixed sheet above the iOS keyboard.
 * Horizontal placement deliberately stays edge-to-edge in CSS.
 */
export function mobileSearchViewportStyle(viewport: {
  height: number;
  offsetTop: number;
}) {
  const top = Math.max(0, Math.round(viewport.offsetTop));
  const height = Math.max(1, Math.round(viewport.height));
  return {
    "--mobile-search-top": `${top}px`,
    "--mobile-search-height": `${height}px`,
  };
}
