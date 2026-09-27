import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'vite';

const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});
test.after(()=>vite.close());
const {searchViewportBounds}=await vite.ssrLoadModule('/app/search-viewport.ts');

test('phone search stays inside portrait, landscape and keyboard visual viewports',()=>{
  for(const viewport of [
    {width:320,height:568,offsetLeft:0,offsetTop:0},
    {width:390,height:844,offsetLeft:0,offsetTop:0},
    {width:390,height:310,offsetLeft:0,offsetTop:80},
    {width:844,height:240,offsetLeft:24,offsetTop:12},
  ]) {
    const box=searchViewportBounds(viewport);
    assert.equal(box.left,viewport.offsetLeft+10);
    assert.equal(box.top,viewport.offsetTop+10);
    assert.equal(box.left+box.width,viewport.offsetLeft+viewport.width-10);
    assert.equal(box.top+box.height,viewport.offsetTop+viewport.height-10);
  }
});

test('search composition preserves provider results and accessible, reachable controls',async()=>{
  const source=await readFile('app/catalog-search-dialog.tsx','utf8');
  assert.match(source,/<Command shouldFilter=\{false\}>/);
  assert.match(source,/<DialogContent[\s\S]*<DialogTitle>/);
  for(const event of ['resize','scroll']) {
    assert.ok(source.includes(`visual?.addEventListener("${event}", update)`));
    assert.ok(source.includes(`visual?.removeEventListener("${event}", update)`));
  }
  const css=await readFile('app/search.css','utf8');
  const mobile=css.slice(css.indexOf('@media'));
  assert.match(mobile,/translate: none !important/);
  assert.match(mobile,/transform: none !important/);
  assert.match(mobile,/min-height: 44px/);
  assert.match(mobile,/min-height: 0/);
  assert.match(css,/\.catalog-search-header[\s\S]*flex: 0 0 auto/);
});
