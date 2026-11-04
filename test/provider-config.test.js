import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('uses the current Freesound API v2 search endpoint',()=>{
 const server=fs.readFileSync(new URL('../server.js',import.meta.url),'utf8');
 assert.match(server,/https:\/\/freesound\.org\/apiv2\/search\/\?query=/);
 assert.doesNotMatch(server,/freesound\.org\/apiv2\/search\/text\//);
});
