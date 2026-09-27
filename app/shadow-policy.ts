export type ShadowParticipation = {
  cast: boolean;
  receive: boolean;
};

/**
 * The exploration renderer deliberately enlarges bodies and compresses moon
 * systems. Those presentation meshes are not eclipse-grade geometry: allowing
 * an enlarged moon or the single alpha ring sheet to shadow a planet produces
 * physically misleading, coarse mobile shadow-map artifacts.
 *
 * Direct PointLight/PBR lighting still supplies the terminator and night side.
 * Major planets cast only onto explicitly opted-in receivers (currently
 * Saturn's rings), so Saturn can still shade its rings without accepting the
 * ring/moon/self-shadow artifacts on its globe.
 */
export function surfaceShadowParticipation(
  id: string,
  category: string,
): ShadowParticipation {
  if (id === "sun" || category === "moon") return { cast: false, receive: false };
  return { cast: true, receive: false };
}

export const SATURN_RING_SHADOWS: ShadowParticipation = {
  cast: false,
  receive: true,
};
