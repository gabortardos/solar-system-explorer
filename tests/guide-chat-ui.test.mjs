import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pageUrl=new URL('../app/page.tsx',import.meta.url);
const cssUrl=new URL('../app/globals.css',import.meta.url);

test('conversation renders complete retained user and assistant turns in one scrolling log',async()=>{
 const page=await readFile(pageUrl,'utf8');
 assert.match(page,/className="guide-chat-scroll"[^>]*role="log"/);
 assert.match(page,/guideTranscript\.map\(turn/);
 assert.match(page,/guide-message-user/);
 assert.match(page,/GuideResponseMessage result=\{turn\.result\}/);
 assert.match(page,/className="guide-grounding"/);
 assert.match(page,/Sources &amp; data/);
 assert.doesNotMatch(page,/guideTranscript\.slice\(0,-1\)/);
});

test('composer clears immediately while preserving the conversation and reset clears the thread',async()=>{
 const page=await readFile(pageUrl,'utf8');
 const ask=page.slice(page.indexOf('const ask = async'),page.indexOf('const askLocalPreset'));
 assert.ok(ask.indexOf('setQuestion("")')<ask.indexOf('requestGuide(context,prompt,guideConversationToken)'));
 assert.match(ask,/setGuideTranscript\(previous=>\[\.\.\.previous,\{id:turnId,question:prompt\}\]\)/);
 const reset=page.slice(page.indexOf('const resetGuideConversation'),page.indexOf('const comparison'));
 assert.match(reset,/setGuideConversationToken\(undefined\)/);
 assert.match(reset,/setGuideTranscript\(\[\]\)/);
 assert.match(reset,/setQuestion\(""\)/);
});

test('Local starters join the visible chat without joining or spending the signed Live conversation',async()=>{
 const page=await readFile(pageUrl,'utf8');
 const local=page.slice(page.indexOf('const askLocalPreset'),page.indexOf('const touchMove'));
 assert.match(local,/answerContextGuide/);
 assert.match(local,/setGuideTranscript/);
 assert.doesNotMatch(local,/requestGuide|setGuideConversationToken|guideConversationToken|fetch\(/);
 assert.match(page,/Free Local conversation starters/);
});

test('one scene launcher and both selected-world entries open the shared Guide panel',async()=>{
 const page=await readFile(pageUrl,'utf8');
 assert.match(page,/className="scene-guide-launch"[\s\S]{0,180}setPanel\("guide"\)/);
 const target=page.slice(page.indexOf('className="target-actions"'),page.indexOf('</aside>}',page.indexOf('className="target-actions"')));
 assert.match(target,/Astronomy guide/);assert.match(target,/setPanel\("guide"\)/);
 const mobile=page.slice(page.indexOf('className="mobile-action-grid"'),page.indexOf('</div>',page.indexOf('className="mobile-action-grid"')));
 assert.match(mobile,/Astronomy guide/);assert.match(mobile,/setPanel\("guide"\)/);
 assert.equal((page.match(/panel === "guide" &&/g)??[]).length,1);
});

test('desktop and phone layouts keep only the transcript scrollable and the 16px composer visible',async()=>{
 const css=await readFile(cssUrl,'utf8');
 assert.match(css,/\.guide-sheet\{[^}]*height:100dvh!important[^}]*overflow:hidden!important/);
 assert.match(css,/\.guide-chat-scroll\{[^}]*flex:1[^}]*min-height:0[^}]*overflow-y:auto/);
 assert.match(css,/\.guide-composer\{[^}]*flex-shrink:0/);
 assert.match(css,/\.guide-composer \.ask-form input\{font-size:16px\}/);
 const mobile=css.slice(css.lastIndexOf('@media(max-width:760px){.scene-guide-launch'));
 assert.match(mobile,/\.scene-guide-launch\{[^}]*right:14px/);
 assert.match(mobile,/\.guide-sheet\{[^}]*inset:0!important[^}]*width:100vw!important/);
 assert.match(mobile,/\.guide-sheet\{[^}]*height:100dvh!important/);
 assert.match(css,/env\(safe-area-inset-top\)/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
});

test('changing the selected object updates context without deleting prior turns',async()=>{
 const page=await readFile(pageUrl,'utf8');
 const selectedEffect=page.slice(page.indexOf('setQuestion("");\n  }, [selected]')-80,page.indexOf('setQuestion("");\n  }, [selected]')+60);
 assert.match(selectedEffect,/setQuestion\(""\)/);
 assert.doesNotMatch(selectedEffect,/setGuideTranscript|resetGuideConversation/);
 assert.match(page,/guide-composer-context">Selected: \{minorView\?\.name\?\?b\.name\}/);
});
