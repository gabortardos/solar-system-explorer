import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});

after(async () => {
  await vite.close();
});

async function readCssTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return readCssTree(entryPath);
      }
      return entry.name.endsWith(".css") ? readFile(entryPath, "utf8") : "";
    }),
  );
  return contents.join("\n");
}

test("emits the catalog's animation and scrolling utilities", async () => {
  const css = await readCssTree(path.join(root, "dist"));

  assert.match(css, /--tw-enter-opacity/);
  assert.match(css, /scrollbar-width:\s*thin/);
  assert.match(css, /scrollbar-width:\s*none/);
  assert.match(css, /scrollbar-gutter:\s*stable/);
  assert.match(css, /scroll-fade-reveal-b/);
  assert.match(css, /mask-image:/);
  assert.match(css, /tw-shimmer/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("forwards progress semantics to the primitive", async () => {
  const { Progress } = await vite.ssrLoadModule("/components/ui/progress.tsx");
  const html = renderToStaticMarkup(React.createElement(Progress, { value: 37 }));

  assert.match(html, /aria-valuenow="37"/);
  assert.match(html, /aria-valuetext="37%"/);
  assert.match(html, /data-state="loading"/);
});

test("emits chart themes for the starter's media dark mode", async () => {
  const { ChartStyle } = await vite.ssrLoadModule("/components/ui/chart.tsx");
  const html = renderToStaticMarkup(
    React.createElement(ChartStyle, {
      id: "contract",
      config: {
        latency: { theme: { light: "#ffffff", dark: "#000000" } },
      },
    }),
  );

  assert.match(html, /\[data-chart=contract\]/);
  assert.match(html, /@media \(prefers-color-scheme: dark\)/);
  assert.doesNotMatch(html, /\.dark/);
});

test("renders sidebar skeletons deterministically", async () => {
  const { SidebarMenuSkeleton } = await vite.ssrLoadModule(
    "/components/ui/sidebar.tsx",
  );
  const first = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));
  const second = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));

  assert.equal(first, second);
  assert.match(first, /--skeleton-width:70%/);
});

test("answers expanded astronomy-guide topics without a network service", async () => {
  const { answerGuide } = await vite.ssrLoadModule("/app/guide.ts");
  const { bodies } = await vite.ssrLoadModule("/app/astronomy.ts");
  const mars = bodies.find((body) => body.id === "mars");
  const saturn = bodies.find((body) => body.id === "saturn");

  assert.match(answerGuide(mars, "Does it have water?", Date.UTC(2026, 8, 8)).answer, /water ice/i);
  assert.match(answerGuide(saturn, "Which missions explored it?", Date.UTC(2026, 8, 8)).answer, /Cassini/);
  assert.match(answerGuide(mars, "How far is it from Earth?", Date.UTC(2026, 8, 8)).source, /jpl\.nasa\.gov/);
});

test("preserves the restrained cinematic rendering treatment", async () => {
  const [scene, fallback] = await Promise.all([
    readFile(path.join(root, "app/scene.ts"), "utf8"),
    readFile(path.join(root, "app/software-renderer.ts"), "utf8"),
  ]);

  assert.match(scene, /PCFSoftShadowMap/);
  assert.match(scene, /logarithmicDepthBuffer:\s*true/);
  assert.match(scene, /surfaceShadowParticipation\(b\.id, b\.category\)/);
  assert.match(scene, /shadow\.normalBias\s*=\s*0\.025/);
  assert.match(scene, /withRenderOrigin/);
  assert.match(scene, /projectPosition/);
  assert.match(scene, /MeshStandardMaterial/);
  assert.match(scene, /earth-night\.webp/);
  assert.match(scene, /createAtmosphere/);
  assert.match(scene, /Math\.pow\(-2 \* t \+ 2, 5\) \/ 2/);
  assert.match(fallback, /createRadialGradient/);
  assert.match(fallback, /nightMap/);
  assert.match(fallback, /mid\.sub\(center\)\.dot\(ringView\)>0/);
  assert.match(fallback, /size>160\?320:size>70\?192/);
});

test("keeps the mobile scene clear with a compact, optional HUD", async () => {
  const [page, css] = await Promise.all([
    readFile(path.join(root, "app/page.tsx"), "utf8"),
    readFile(path.join(root, "app/globals.css"), "utf8"),
  ]);

  assert.match(page, /mobile-target-dock/);
  assert.match(page, /mobile-menu-sheet/);
  assert.match(page, /mobile-hud-hidden/);
  assert.match(page, /touch-flight.*is-open/);
  assert.match(page, /Travel to \{b\.name\}/);
  assert.match(css, /\.universe\{inset:0\}/);
  assert.match(css, /\.flight-heading,\.target-card,\.bottom-area,\.control-hint\{display:none\}/);
  assert.match(css, /\.touch-flight\.is-open\{display:grid\}/);
  assert.match(css, /\.mobile-hud-hidden .*\.mobile-target-dock/);
  assert.match(page, /mobile-clock/);
  assert.match(css, /\.mobile-clock/);
});

test("keeps catalogue search bounded and separates information from scene selection", async () => {
  const [page, search, css] = await Promise.all([
    readFile(path.join(root, "app/page.tsx"), "utf8"),
    readFile(path.join(root, "app/search.ts"), "utf8"),
    readFile(path.join(root, "app/search.css"), "utf8"),
  ]);

  assert.match(page, /catalogSearchProvider\.search\(searchQuery,\s*\{ limit: 20 \}\)/);
  assert.match(page, />\s*Show\s*<\/button>/);
  assert.match(page, />\s*Travel to\s*<\/button>/);
  assert.match(page, />\s*Information\s*<\/button>/);
  assert.match(page, /detailsId/);
  assert.match(search, /CatalogSearchProvider/);
  assert.match(search, /Math\.min\(options\?\.limit\?\?20,50\)/);
  assert.match(search, /server-side/);
  assert.match(css, /grid-template-columns:\s*repeat\(3/);
  assert.match(css, /--search-height/);
  assert.match(css, /translate:\s*none\s*!important/);
  assert.match(css, /transform:\s*none\s*!important/);
  assert.match(css, /command-input.*font-size:\s*16px/s);
});

test("keeps mobile text entry from triggering iOS page zoom", async () => {
  const css = await readFile(path.join(root, "app/globals.css"), "utf8");
  assert.match(css, /@media\(max-width:760px\)\{\.ask-form input\{font-size:16px\}\}/);
});

test("exposes the validated simulation clock without the former unbounded rate", async () => {
  const [page, clock, scene] = await Promise.all([
    readFile(path.join(root, "app/page.tsx"), "utf8"),
    readFile(path.join(root, "app/simulation-clock.ts"), "utf8"),
    readFile(path.join(root, "app/scene.ts"), "utf8"),
  ]);

  assert.match(clock, /SIMULATION_RATES=\[0,1,10,100,1000,86400,2592000\]/);
  assert.match(clock, /anchorMonotonicMs/);
  assert.match(page, /Timelapse/);
  assert.match(page, /<select[\s\S]*className="time-rate-select"[\s\S]*aria-label="Simulation speed"/);
  assert.match(scene, /requestAnimationFrame\(animate\)/);
  assert.match(scene, /now - lastNotify > 500/);
});

test("uses progressive disclosure and the completed development step in the desktop HUD", async () => {
  const [page, css] = await Promise.all([
    readFile(path.join(root, "app/page.tsx"), "utf8"),
    readFile(path.join(root, "app/globals.css"), "utf8"),
  ]);

  assert.match(page, /EXPLORER \/ STEP 18/);
  assert.match(page, /<details className="population-info">/);
  assert.match(page, /About small-body region markers/);
  assert.doesNotMatch(page, /className="population-legend"/);
  assert.match(css, /\.control-hint\{display:none\}\.flight-status\{display:none\}/);
});

test("renders the reusable object panel without empty sections", async () => {
  const { ObjectInformation } = await vite.ssrLoadModule("/app/object-information.tsx");
  const model = {
    id: "probe", name: "Example Probe", category: "spacecraft", type: "Spacecraft",
    facts: [{ label: "Launch", value: "2032" }],
    narratives: [{ label: "Scientific importance", text: "Studies a selected target." }],
  };
  const html = renderToStaticMarkup(React.createElement(ObjectInformation, { model }));
  assert.match(html, /Example Probe/);
  assert.match(html, /Spacecraft/);
  assert.match(html, /Launch/);
  assert.doesNotMatch(html, /Atmosphere|Radius|Parent/);
});

test("labels schematic small-body regions and keeps them outside destination interaction", async () => {
  const [page, scene, fallback] = await Promise.all([
    readFile(path.join(root, "app/page.tsx"), "utf8"),
    readFile(path.join(root, "app/scene.ts"), "utf8"),
    readFile(path.join(root, "app/software-renderer.ts"), "utf8"),
  ]);
  assert.match(page, /Small-body regions/);
  assert.match(page, /Small-body regions overview/);
  assert.match(page, /Use Small-body regions view/);
  assert.match(page, /Representative markers only\. Use Small-body regions view; size and density greatly enhanced/);
  assert.match(page, /dots are not object counts or precise current positions/);
  assert.match(scene, /new THREE\.Points/);
  assert.match(scene, /overviewDistance/);
  assert.match(scene, /completeStatus: "Small-body regions overview"/);
  assert.match(scene, /userData\.population = true/);
  assert.match(scene, /sizeAttenuation: false,[\s\S]*opacity: Math\.min\(0\.72, style\.opacity \+ 0\.22\)/);
  assert.match(fallback, /userData\.population/);
});
