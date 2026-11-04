import assert from 'node:assert/strict';

const base=process.env.QUIZDOCK_TEST_URL||'http://127.0.0.1:3101';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

class PollingClient {
  constructor(){this.sid=null;this.ackId=0;this.acks=new Map();this.state=null}
  url(){return `${base}/socket.io/?EIO=4&transport=polling&t=${Date.now()}${this.sid?`&sid=${this.sid}`:''}`}
  async request(method='GET',body){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);try{const response=await fetch(this.url(),{method,body,headers:body===undefined?{}:{'content-type':'text/plain;charset=UTF-8'},signal:controller.signal});assert.equal(response.status,200);return await response.text()}finally{clearTimeout(timer)}}
  async post(packet){await this.request('POST',packet)}
  async packets(payload){for(const packet of payload.split('\x1e')){if(packet==='2'){await this.post('3');continue}if(packet.startsWith('42')){const message=JSON.parse(packet.slice(2));if(message[0]==='state')this.state=message[1];continue}if(packet.startsWith('43')){const match=packet.match(/^43(\d+)(.*)$/);if(match)this.acks.set(Number(match[1]),JSON.parse(match[2]));}}}
  async poll(){try{await this.packets(await this.request())}catch(error){if(error.name!=='AbortError')throw error}}
  async connect(){const handshake=JSON.parse((await this.request()).slice(1));this.sid=handshake.sid;await this.post('40');await this.poll()}
  async emit(event,data={}){const id=++this.ackId;await this.post(`42${id}${JSON.stringify([event,data])}`);const end=Date.now()+10000;while(Date.now()<end){if(this.acks.has(id)){const value=this.acks.get(id);this.acks.delete(id);return value[0]}await this.poll()}throw Error(`Ack timeout for ${event}`)}
  async send(event,data={}){await this.post(`42${JSON.stringify([event,data])}`)}
  async until(predicate,label='state'){const end=Date.now()+10000;while(Date.now()<end){if(this.state&&predicate(this.state))return this.state;await this.poll()}throw Error(`Timed out waiting for ${label}`)}
}

const host=new PollingClient(),first=new PollingClient(),second=new PollingClient();
await Promise.all([host.connect(),first.connect(),second.connect()]);
const created=await host.emit('create');assert.equal(created.ok,true);
const p1=await first.emit('join',{code:created.code,name:'Ada'}),p2=await second.emit('join',{code:created.code,name:'Grace'});assert.equal(p1.ok,true);assert.equal(p2.ok,true);
assert.equal((await host.emit('autoMode',{enabled:true})).ok,true);await host.send('start');
let state=await host.until(s=>s.phase==='board'&&s.selector,'initial selector');assert.ok([p1.id,p2.id].includes(state.selector));
const chooser=state.selector===p1.id?first:second,other=state.selector===p1.id?second:first;
assert.equal((await other.emit('playerSelect',{category:0,row:0})).ok,false);
assert.equal((await chooser.emit('playerSelect',{category:0,row:0})).ok,true);
state=await host.until(s=>s.used.includes('0:0')&&s.phase!=='board','contestant clue selection');assert.equal(state.used.length,1);

const exported=await host.emit('exportGame');assert.equal(exported.ok,true);assert.equal(exported.game.format,'quizdock-game');assert.equal(exported.game.jeopardy.categories.length,6);
const imported=await host.emit('board',exported.game);assert.equal(imported.ok,true,imported.error);assert.equal((await host.emit('autoMode',{enabled:false})).ok,true);
await host.until(s=>s.phase==='board'&&s.used.length===0,'imported board');

async function scanRound(expectedDailyDoubles){let count=0,transferChecked=false;for(let category=0;category<6;category++)for(let row=0;row<5;row++){const key=`${category}:${row}`;await host.send('select',{category,row});let selected=await host.until(s=>s.used.includes(key)&&s.clue?.category===category&&s.clue?.row===row,`selected ${key}`);if(selected.phase==='dailyWager'){count++;const owner=selected.dailyDoublePlayer===p1.id?first:second,blocked=selected.dailyDoublePlayer===p1.id?second:first;assert.equal((await blocked.emit('dailyDoubleWager',{amount:5})).ok,false);assert.equal((await owner.emit('dailyDoubleWager',{amount:selected.dailyDoubleMax+1})).ok,false);assert.equal((await owner.emit('dailyDoubleWager',{amount:5})).ok,true);await host.until(s=>s.phase==='dailyReading'&&s.active===null,'Daily Double reading time');await host.until(s=>s.phase==='answer'&&s.active===selected.dailyDoublePlayer,'Daily Double answer');await host.send('reveal')}else if(!transferChecked){const responder=selected.selector===p1.id?second:first,responderId=selected.selector===p1.id?p2.id:p1.id;await host.send('openBuzz');await responder.send('buzz');await host.until(s=>s.phase==='answer'&&s.active===responderId,'buzz response');await responder.send('respond','test response');await host.until(s=>s.phase==='judge','manual judgment');await host.send('judge',{correct:true});selected=await host.until(s=>s.phase==='reveal'&&s.selector===responderId,'board control transfer');assert.equal(selected.responder,responderId);assert.equal(selected.response,'test response');transferChecked=true}else await host.send('reveal');await host.until(s=>s.phase==='reveal',`reveal ${key}`);await host.send('next');await host.until(s=>s.phase==='board'&&!s.clue,`next ${key}`)}assert.equal(count,expectedDailyDoubles);assert.equal(transferChecked,true)}

await scanRound(1);assert.equal((await host.emit('skipRound')).round,'double');await host.until(s=>s.round==='double'&&s.phase==='board','Double Jeopardy');await scanRound(2);assert.equal((await host.emit('skipRound')).round,'final');await host.until(s=>s.phase==='finalWager','Final Jeopardy wagers');await first.send('wager',{amount:0});await second.send('wager',{amount:0});await host.until(s=>s.phase==='finalAnswer','Final Jeopardy answer');assert.equal((await first.emit('finalRespond',{text:'one'})).ok,true);assert.equal((await second.emit('finalRespond',{text:'two'})).ok,true);await host.until(s=>s.phase==='finalReveal','Final Jeopardy reveal');await host.send('finalScore',{id:p1.id,correct:true});await host.send('finalScore',{id:p2.id,correct:true});state=await host.until(s=>s.result?.winners?.length,'winner result');assert.ok(state.result.winners.some(x=>[p1.id,p2.id].includes(x.id)));
console.log('Socket flow passed: TV response retention, JSON round-trip, control transfer, 1+2 Daily Doubles, and winner result.');
await delay(20);
