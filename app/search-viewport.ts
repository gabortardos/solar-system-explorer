/** Visual viewport excludes the on-screen keyboard, unlike the layout viewport. */
export function searchViewportBounds(viewport: {
  width: number; height: number; offsetLeft: number; offsetTop: number;
}) {
  const margin = 10;
  return {
    left: viewport.offsetLeft + margin,
    top: viewport.offsetTop + margin,
    width: Math.max(0, viewport.width - margin * 2),
    height: Math.max(0, viewport.height - margin * 2),
  };
}
