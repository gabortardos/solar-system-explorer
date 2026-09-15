import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  server: { middlewareMode: true, hmr: false },
});

test.after(async () => vite.close());

const motion = await vite.ssrLoadModule("/app/navigation-motion.ts");

test("normalizes combined flight input so diagonals do not move faster", () => {
  const axes = motion.normalizedFlightAxes(1, 1, 1);
  assert.ok(Math.abs(Math.hypot(...axes) - 1) < 1e-12);
  assert.deepEqual(motion.normalizedFlightAxes(1, 0, 0), [1, 0, 0]);
});

test("manual velocity accelerates smoothly instead of jumping to full speed", () => {
  const first = motion.stepMotionVelocity([0, 0, 0], [10, 0, 0], 1 / 60);
  assert.ok(first[0] > 0);
  assert.ok(first[0] < 10);
  assert.equal(first[1], 0);
  assert.equal(first[2], 0);
});

test("released controls decelerate smoothly and settle at rest", () => {
  let velocity = [10, -4, 2];
  const first = motion.stepMotionVelocity(velocity, [0, 0, 0], 1 / 60);
  assert.ok(Math.hypot(...first) < Math.hypot(...velocity));
  assert.ok(Math.hypot(...first) > 0);
  velocity = first;
  for (let i = 0; i < 240; i += 1)
    velocity = motion.stepMotionVelocity(velocity, [0, 0, 0], 1 / 60);
  assert.equal(motion.motionHasStopped(velocity), true);
});

test("exponential response is stable across common frame rates", () => {
  let at60 = [0, 0, 0];
  let at30 = [0, 0, 0];
  for (let i = 0; i < 60; i += 1)
    at60 = motion.stepMotionVelocity(at60, [12, 0, 0], 1 / 60);
  for (let i = 0; i < 30; i += 1)
    at30 = motion.stepMotionVelocity(at30, [12, 0, 0], 1 / 30);
  assert.ok(Math.abs(at60[0] - at30[0]) < 1e-10);
});

test("the established boost multiplier remains unchanged", () => {
  assert.equal(motion.FLIGHT_RESPONSE.boost, 8);
});

test("scene navigation preserves focus, overview, cancellation, brake and reduced-motion contracts", async () => {
  const scene = await readFile(new URL("../app/scene.ts", import.meta.url), "utf8");

  assert.match(scene, /if \(instant \|\| options\.reduced\) \{[\s\S]*?flight = null;[\s\S]*?follow = true;[\s\S]*?onStatus\("Target locked"\)/);
  assert.match(scene, /const stop = \(preserveManualMotion = false\)[\s\S]*?flight = null;[\s\S]*?viewTransition = null;[\s\S]*?clearRoute\(\);[\s\S]*?follow = false/);
  assert.match(scene, /overview\(\) \{[\s\S]*?stop\(\);[\s\S]*?if \(options\.reduced\) \{[\s\S]*?camera\.position\.copy\(to\)/);
  assert.match(scene, /brake\(\) \{[\s\S]*?keys\.clear\(\);[\s\S]*?stopManualMotion\(\);[\s\S]*?flight = null;[\s\S]*?viewTransition = null;[\s\S]*?clearRoute\(\)/);
  assert.match(scene, /setMovement\(code: string, active: boolean\)[\s\S]*?keys\.add\(code\);[\s\S]*?stop\(true\)/);
});
