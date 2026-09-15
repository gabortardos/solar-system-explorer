export type MotionVector = readonly [number, number, number];

export const FLIGHT_RESPONSE = {
  acceleration: 4.8,
  deceleration: 6.5,
  steering: 7.5,
  steeringRelease: 9,
  boost: 8,
  stopEpsilon: 0.0001,
} as const;

function magnitude(vector: readonly number[]) {
  return Math.hypot(vector[0], vector[1], vector[2]);
}

export function normalizedFlightAxes(
  forward: number,
  strafe: number,
  vertical: number,
): MotionVector {
  const length = Math.hypot(forward, strafe, vertical);
  if (length <= 1) return [forward, strafe, vertical];
  return [forward / length, strafe / length, vertical / length];
}

export function responseFactor(rate: number, dtSeconds: number) {
  if (rate <= 0 || dtSeconds <= 0) return 0;
  return 1 - Math.exp(-rate * dtSeconds);
}

export function stepMotionVelocity(
  current: readonly number[],
  desired: readonly number[],
  dtSeconds: number,
  acceleration = FLIGHT_RESPONSE.acceleration,
  deceleration = FLIGHT_RESPONSE.deceleration,
): MotionVector {
  const response = magnitude(desired) > FLIGHT_RESPONSE.stopEpsilon
    ? acceleration
    : deceleration;
  const blend = responseFactor(response, dtSeconds);
  return [
    current[0] + (desired[0] - current[0]) * blend,
    current[1] + (desired[1] - current[1]) * blend,
    current[2] + (desired[2] - current[2]) * blend,
  ];
}

export function motionHasStopped(vector: readonly number[]) {
  return magnitude(vector) <= FLIGHT_RESPONSE.stopEpsilon;
}
