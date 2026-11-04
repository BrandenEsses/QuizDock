const STOP_WORDS=new Set(['a','an','and','are','as','at','be','by','for','from','how','in','is','it','of','on','or','that','the','this','to','was','what','when','where','which','who','with']);

export function normalizedText(value){
 return String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}

function tokens(value){return new Set(normalizedText(value).split(/\s+/).filter(x=>x.length>2&&!STOP_WORDS.has(x)))}
function jaccard(a,b){const aa=tokens(a),bb=tokens(b);if(!aa.size||!bb.size)return 0;let overlap=0;for(const x of aa)if(bb.has(x))overlap++;return overlap/(aa.size+bb.size-overlap)}
function similar(a,b,threshold=.68){const x=normalizedText(a),y=normalizedText(b);if(!x||!y)return false;if(x===y||x.includes(y)&&y.length>12||y.includes(x)&&x.length>12)return true;return jaccard(x,y)>=threshold}
function leaksAnswer(clue,answer){const clueWords=normalizedText(clue).split(/\s+/),cleanAnswer=normalizedText(answer).replace(/^(a|an|the)\s+/,'');if(cleanAnswer.length<3)return false;const answerWords=cleanAnswer.split(/\s+/);return answerWords.length===1?clueWords.includes(cleanAnswer):` ${clueWords.join(' ')} `.includes(` ${cleanAnswer} `)}
function validateMedia(value,label){if(value==null)return null;if(!value||typeof value!=='object'||!['image','audio','video'].includes(value.type))throw Error(`${label}: media type must be image, audio, or video`);const url=String(value.url||'').trim();if(!/^https:\/\//i.test(url)&&!/^\/downloads\/[A-Za-z0-9._/-]+$/.test(url))throw Error(`${label}: media URL must use HTTPS or /downloads/`);return {type:value.type,url:url.slice(0,2000),alt:String(value.alt||'').trim().slice(0,240)}}

export function validateBoard(board,label='Board'){
 if(!board||typeof board.title!=='string'||!Array.isArray(board.categories)||board.categories.length<1||board.categories.length>8)throw Error(`${label} requires a title and 1-8 categories`);
 const clean={title:board.title.trim().slice(0,100),categories:board.categories.map(category=>{
  if(typeof category?.name!=='string'||!category.name.trim()||!Array.isArray(category.clues)||category.clues.length<1||category.clues.length>8)throw Error(`${label}: each category needs a name and 1-8 clues`);
  return {name:category.name.trim().slice(0,60),clues:category.clues.map(pair=>{
   if(!Array.isArray(pair)||(pair.length!==2&&pair.length!==3)||pair.slice(0,2).some(x=>typeof x!=='string'||!x.trim()||x.length>1000))throw Error(`${label}: each clue must be [clue, answer] with optional media`);
   const media=validateMedia(pair[2],label);return media?[pair[0].trim(),pair[1].trim(),media]:[pair[0].trim(),pair[1].trim()];
  })};
 })};
 const names=[];for(const category of clean.categories){if(names.some(x=>similar(x,category.name,.72)))throw Error(`${label} has duplicate or overly similar categories: ${category.name}`);names.push(category.name)}
 return clean;
}

export function validateGamePackage(value,{categories,rows}={}){
 if(!value||typeof value!=='object')throw Error('AI did not return a game package');
 const single=validateBoard({title:value.title||value.jeopardy?.title||'QuizDock Game',categories:value.jeopardy?.categories},'Jeopardy');
 const double=validateBoard({title:value.title||value.doubleJeopardy?.title||'QuizDock Game',categories:value.doubleJeopardy?.categories},'Double Jeopardy');
 if(categories&&(single.categories.length!==categories||double.categories.length!==categories))throw Error(`Both rounds must contain exactly ${categories} categories`);
 if(rows&&[...single.categories,...double.categories].some(c=>c.clues.length!==rows))throw Error(`Every category must contain exactly ${rows} clues`);
 for(const first of single.categories)for(const second of double.categories)if(similar(first.name,second.name,.45))throw Error(`Round categories are too similar: ${first.name} / ${second.name}`);
 const seen=[];
 for(const [round,board] of [['Jeopardy',single],['Double Jeopardy',double]])for(const category of board.categories)for(const [clue,answer] of category.clues){
  if(leaksAnswer(clue,answer))throw Error(`${round} clue leaks its answer: ${answer}`);
  for(const old of seen){
   if(similar(answer,old.answer,.72))throw Error(`Repeated or overly similar answers: ${old.answer} / ${answer}`);
   if(similar(clue,old.clue,.62))throw Error(`Repeated or overly similar clues in ${round}: ${clue}`);
  }
  seen.push({clue,answer});
 }
 const finalClue=String(value.final?.clue||'').trim(),finalAnswer=String(value.final?.answer||'').trim(),finalMedia=validateMedia(value.final?.media,'Final Jeopardy');
 if(!finalClue||!finalAnswer)throw Error('Final Jeopardy needs a clue and answer');
 if(seen.some(x=>similar(finalAnswer,x.answer,.72)||similar(finalClue,x.clue,.62)))throw Error('Final Jeopardy repeats an earlier clue or answer');
 return {title:single.title,jeopardy:single,doubleJeopardy:{...double,title:single.title},final:{clue:finalClue.slice(0,1000),answer:finalAnswer.slice(0,1000),...(finalMedia?{media:finalMedia}:{})}};
}

export function legacyPackage(board){const clean=validateBoard(board);return {title:clean.title,jeopardy:clean,doubleJeopardy:clean,final:{clue:'Final Jeopardy: This optical technique uses a sharp tip to detect evanescent fields at subwavelength scales.',answer:'s-SNOM'}}}
