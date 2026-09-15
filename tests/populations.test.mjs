import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const populations = await vite.ssrLoadModule("/app/populations.ts");
const scale = await vite.ssrLoadModule("/app/scale.ts");

function radii(sample) {
  const result = [];
  for (let i = 0; i < sample.positionsAU.length; i += 3)
    result.push(
      Math.hypot(sample.positionsAU[i], sample.positionsAU[i + 1], sample.positionsAU[i + 2]),
    );
  return result;
}

test("population samples are deterministic, finite and exactly bounded", () => {
  const first = populations.buildPopulationSamples(0.4),
    second = populations.buildPopulationSamples(0.4);
  assert.deepEqual(first, second);
  assert.equal(
    first.reduce((total, sample) => total + sample.positionsAU.length / 3, 0),
    Object.values(populations.POPULATION_COUNTS).reduce((a, b) => a + b, 0),
  );
  for (const sample of first) {
    assert.equal(
      sample.positionsAU.length / 3,
      populations.POPULATION_COUNTS[sample.id],
    );
    assert.ok([...sample.positionsAU].every(Number.isFinite));
  }
  const asteroid = first.find((p) => p.id === "asteroid-belt"),
    kuiper = first.find((p) => p.id === "kuiper-belt");
  assert.ok(radii(asteroid).every((r) => r >= 2.1 - 1e-12 && r <= 3.3 + 1e-12));
  assert.ok(radii(kuiper).every((r) => r >= 30 - 1e-12 && r <= 50 + 1e-12));
});

test("Trojan statistical clouds center near sixty degrees ahead and behind Jupiter", () => {
  const jupiter = -2.7,
    samples = populations.buildPopulationSamples(jupiter);
  for (const [id, offset] of [
    ["jupiter-trojans-leading", Math.PI / 3],
    ["jupiter-trojans-trailing", -Math.PI / 3],
  ]) {
    const sample = samples.find((p) => p.id === id);
    let x = 0, z = 0;
    for (let i = 0; i < sample.positionsAU.length; i += 3) {
      x += sample.positionsAU[i];
      z += sample.positionsAU[i + 2];
    }
    const mean = Math.atan2(z, x),
      error = Math.atan2(Math.sin(mean - jupiter - offset), Math.cos(mean - jupiter - offset));
    assert.ok(Math.abs(error) < 0.06);
    assert.ok(radii(sample).every((r) => r >= 4.7 && r <= 5.75));
  }
});

test("every population point uses the centralized scale projection", () => {
  const sample = populations.buildPopulationSamples()[0];
  for (const mode of ["exploration", "scientific"]) {
    const projected = populations.projectPopulation(sample.positionsAU, mode);
    for (let i = 0; i < projected.length; i += 3)
      assert.deepEqual(
        [...projected.slice(i, i + 3)],
        scale.projectPosition([...sample.positionsAU.slice(i, i + 3)], mode),
      );
  }
});
