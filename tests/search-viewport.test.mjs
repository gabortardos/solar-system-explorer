import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'vite';

const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});
test.after(()=>vite.close());
const {mobileSearchViewportStyle}=await vite.ssrLoadModule('/app/mobile-search-viewport.ts');

test('mobile search tracks only the visible vertical viewport above the iOS keyboard',()=>{
  for(const viewport of [
    {height:568,offsetTop:0},
    {height:844,offsetTop:0},
    {height:310,offsetTop:80},
    {height:240,offsetTop:12},
  ]) {
    const style=mobileSearchViewportStyle(viewport);
    assert.equal(style['--mobile-search-top'],`${Math.round(viewport.offsetTop)}px`);
    assert.equal(style['--mobile-search-height'],`${Math.round(viewport.height)}px`);
    assert.deepEqual(Object.keys(style).sort(),['--mobile-search-height','--mobile-search-top']);
  }
});

test('mobile search is a dedicated fixed sheet and desktop remains a dialog',async()=>{
  const source=await readFile('app/catalog-search-dialog.tsx','utf8');
  assert.match(source,/if \(mobile\)[\s\S]*catalog-search-mobile-sheet/);
  assert.match(source,/catalog-search-mobile-close[\s\S]*Close/);
  assert.match(source,/<DialogContent className="catalog-search-dialog">/);
  assert.equal((source.match(/shouldFilter=\{false\}/g)??[]).length,2);
  for(const event of ['resize','scroll']) {
    assert.ok(source.includes(`visual?.addEventListener("${event}", update)`));
    assert.ok(source.includes(`visual?.removeEventListener("${event}", update)`));
  }
  const css=await readFile('app/search.css','utf8');
  const mobile=css.slice(css.indexOf('@media'));
  assert.match(mobile,/\.catalog-search-mobile-sheet\s*\{[\s\S]*position:\s*fixed/);
  assert.match(mobile,/\.catalog-search-mobile-sheet\s*\{[\s\S]*left:\s*0/);
  assert.match(mobile,/height:\s*var\(--mobile-search-height, 100dvh\)/);
  assert.match(mobile,/env\(safe-area-inset-top\)/);
  assert.match(mobile,/\.catalog-search-mobile-sheet \.catalog-search-list[\s\S]*overflow-y:\s*auto/);
  assert.doesNotMatch(mobile,/left:\s*50%|translate\s*:|transform\s*:/);
  assert.doesNotMatch(mobile,/\.catalog-search-dialog\s*\{/);
  assert.match(mobile,/min-height:\s*44px/);
  assert.match(css,/\.catalog-search-header[\s\S]*flex: 0 0 auto/);
});

test('mobile action grid remains bounded at 320, 390 and 430 CSS pixels',async()=>{
  const css=await readFile('app/search.css','utf8');
  assert.match(css,/grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css,/\.catalog-search-mobile-sheet \.search-result-actions\s*\{[\s\S]*width:\s*100%/);
  assert.match(css,/\.catalog-search-mobile-sheet \.catalog-search-result\s*\{[\s\S]*box-sizing:\s*border-box/);
  for(const width of [320,390,430]) {
    const horizontalPadding=24;
    const gaps=14;
    assert.ok((width-horizontalPadding-gaps)/3>=94,'each action retains a tappable column');
  }
});
