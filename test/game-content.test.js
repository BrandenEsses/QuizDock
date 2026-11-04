import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGamePackage} from '../game-content.js';

const category=(name,clue,answer)=>({name,clues:[[clue,answer]]});
const valid=()=>({title:'Test',jeopardy:{categories:[category('Physics','The SI unit of force.','newton')]},doubleJeopardy:{categories:[category('Poetry','A fourteen-line verse form.','sonnet')]},final:{clue:'This city is the capital of Mongolia.','answer':'Ulaanbaatar'}});

test('accepts distinct rounds and content',()=>assert.equal(validateGamePackage(valid(),{categories:1,rows:1}).doubleJeopardy.categories[0].name,'Poetry'));

test('rejects reused category concepts across rounds',()=>{const game=valid();game.doubleJeopardy.categories[0].name='Advanced Physics';assert.throws(()=>validateGamePackage(game),/categories are too similar/i)});

test('rejects paraphrased clue duplication',()=>{const game=valid();game.doubleJeopardy.categories[0].clues=[['Name the SI force unit.','pascal']];assert.throws(()=>validateGamePackage(game),/similar clues/i)});

test('rejects semantically repeated answers',()=>{const game=valid();game.doubleJeopardy.categories[0].clues=[['The force unit named for an English scientist.','the newton']];assert.throws(()=>validateGamePackage(game),/similar answers/i)});

test('rejects a clue that contains its canonical answer',()=>{const game=valid();game.jeopardy.categories[0].clues=[['This unit is called the newton.','newton']];assert.throws(()=>validateGamePackage(game),/leaks its answer/i)});

test('does not treat a partial word as answer leakage',()=>{const game=valid();game.jeopardy.categories[0].clues=[['This discipline includes cartography.','art']];assert.doesNotThrow(()=>validateGamePackage(game))});

test('accepts safe media clues',()=>{const game=valid();game.jeopardy.categories[0].clues=[['Identify this work.','Guernica',{type:'image',url:'https://example.com/guernica.jpg',alt:'A painting'}]];assert.equal(validateGamePackage(game).jeopardy.categories[0].clues[0][2].type,'image')});

test('accepts packaged media clues',()=>{const game=valid();game.jeopardy.categories[0].clues=[['Identify this element.','gold',{type:'image',url:'/media/gold-bars.svg',alt:'Gold bars'}]];assert.equal(validateGamePackage(game).jeopardy.categories[0].clues[0][2].url,'/media/gold-bars.svg')});

test('retains safe media attribution',()=>{const game=valid();game.jeopardy.categories[0].clues=[['Identify this instrument.','theremin',{type:'audio',url:'/downloads/generated/theremin.mp3',credit:'Sound by Clara',license:'CC0',provider:'Freesound',source:'https://freesound.org/s/1/'}]];const media=validateGamePackage(game).jeopardy.categories[0].clues[0][2];assert.equal(media.credit,'Sound by Clara');assert.equal(media.source,'https://freesound.org/s/1/')});

test('rejects unsafe media URLs',()=>{const game=valid();game.jeopardy.categories[0].clues=[['Identify this work.','Guernica',{type:'image',url:'javascript:alert(1)'}]];assert.throws(()=>validateGamePackage(game),/media URL/i)});

test('rejects incomplete final',()=>{const game=valid();game.final.answer='';assert.throws(()=>validateGamePackage(game),/Final Jeopardy/i)});
