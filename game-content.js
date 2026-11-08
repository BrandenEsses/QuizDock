const STOP_WORDS=new Set(['a','an','and','are','as','at','be','by','for','from','how','in','is','it','of','on','or','that','the','this','to','was','what','when','where','which','who','with']);

export function normalizedText(value){
 return String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}

function tokens(value){return new Set(normalizedText(value).split(/\s+/).filter(x=>x.length>2&&!STOP_WORDS.has(x)))}
function jaccard(a,b){const aa=tokens(a),bb=tokens(b);if(!aa.size||!bb.size)return 0;let overlap=0;for(const x of aa)if(bb.has(x))overlap++;return overlap/(aa.size+bb.size-overlap)}
function similar(a,b,threshold=.68){const x=normalizedText(a),y=normalizedText(b);if(!x||!y)return false;if(x===y||x.includes(y)&&y.length>12||y.includes(x)&&x.length>12)return true;return jaccard(x,y)>=threshold}
function leaksAnswer(clue,answer){const clueWords=normalizedText(clue).split(/\s+/),cleanAnswer=normalizedText(answer).replace(/^(a|an|the)\s+/,'');if(cleanAnswer.length<3)return false;const answerWords=cleanAnswer.split(/\s+/);return answerWords.length===1?clueWords.includes(cleanAnswer):` ${clueWords.join(' ')} `.includes(` ${cleanAnswer} `)}
function validateMedia(value,label){if(value==null)return null;if(!value||typeof value!=='object'||!['image','audio','video'].includes(value.type))throw Error(`${label}: media type must be image, audio, or video`);const url=String(value.url||'').trim();if(!/^https:\/\//i.test(url)&&!/^\/(downloads|media)\/[A-Za-z0-9._/-]+$/.test(url))throw Error(`${label}: media URL must use HTTPS, /downloads/, or packaged /media/`);const source=String(value.source||'').trim();if(source&&!/^https:\/\//i.test(source))throw Error(`${label}: media attribution source must use HTTPS`);return {type:value.type,url:url.slice(0,2000),alt:String(value.alt||'').trim().slice(0,240),...(value.credit?{credit:String(value.credit).trim().slice(0,240)}:{}),...(value.license?{license:String(value.license).trim().slice(0,120)}:{}),...(value.provider?{provider:String(value.provider).trim().slice(0,60)}:{}),...(source?{source:source.slice(0,2000)}:{})}}

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
 const finalCategory=String(value.final?.category||'Final Jeopardy').trim().slice(0,100)||'Final Jeopardy',finalClue=String(value.final?.clue||'').trim(),finalAnswer=String(value.final?.answer||'').trim(),finalMedia=validateMedia(value.final?.media,'Final Jeopardy');
 if(!finalClue||!finalAnswer)throw Error('Final Jeopardy needs a clue and answer');
 if(seen.some(x=>similar(finalAnswer,x.answer,.72)||similar(finalClue,x.clue,.62)))throw Error('Final Jeopardy repeats an earlier clue or answer');
 return {title:single.title,jeopardy:single,doubleJeopardy:{...double,title:single.title},final:{category:finalCategory,clue:finalClue.slice(0,1000),answer:finalAnswer.slice(0,1000),...(finalMedia?{media:finalMedia}:{})}};
}

export function legacyPackage(board){const clean=validateBoard(board);return {title:clean.title,jeopardy:clean,doubleJeopardy:clean,final:{clue:'Final Jeopardy: This optical technique uses a sharp tip to detect evanescent fields at subwavelength scales.',answer:'s-SNOM'}}}

function validationIssue(code,path,message,suggestion){return {code,path,message,suggestion}}

export function diagnoseGamePackage(value){
 const issues=[];
 const add=(code,path,message,suggestion)=>{if(issues.length<100)issues.push(validationIssue(code,path,message,suggestion))};
 if(!value||typeof value!=='object'||Array.isArray(value)){
  add('game.invalid_type','$','The request body must be a QuizDock game object.','Send the game JSON object itself, not a JSON string or array.');
  return issues;
 }
 const entries=[];
 const categoryNames={jeopardy:[],doubleJeopardy:[]};
 for(const roundName of ['jeopardy','doubleJeopardy']){
  const label=roundName==='jeopardy'?'Jeopardy':'Double Jeopardy',round=value[roundName],roundPath=`$.${roundName}`;
  if(!round||typeof round!=='object'){
   add('round.missing',roundPath,`${label} is missing.`,`Add a ${roundName} object containing a categories array.`);
   continue;
  }
  if(!Array.isArray(round.categories)){
   add('categories.invalid_type',`${roundPath}.categories`,`${label} categories must be an array.`,'Provide between 1 and 8 category objects.');
   continue;
  }
  if(round.categories.length<1||round.categories.length>8)
   add('categories.invalid_count',`${roundPath}.categories`,`${label} has ${round.categories.length} categories; QuizDock supports 1 through 8.`,'Add or remove categories so the round contains 1-8.');
  for(const [categoryIndex,category] of round.categories.slice(0,9).entries()){
   const categoryPath=`${roundPath}.categories[${categoryIndex}]`;
   if(!category||typeof category!=='object'){
    add('category.invalid_type',categoryPath,'This category must be an object with name and clues fields.','Replace it with {"name":"...","clues":[["clue","answer"]]}.');
    continue;
   }
   const name=typeof category.name==='string'?category.name.trim():'';
   if(!name)add('category.name_required',`${categoryPath}.name`,'The category name is empty or missing.','Give this category a distinct, non-empty name.');
   else{
    const comparableName=name.slice(0,60);
    for(const previous of categoryNames[roundName])if(similar(comparableName,previous.name,.72))
     add('category.duplicate',`${categoryPath}.name`,`“${comparableName}” is too similar to “${previous.name}” in the same round.`,'Rename one category so its subject is clearly distinct.');
    categoryNames[roundName].push({name:comparableName,path:`${categoryPath}.name`});
   }
   if(!Array.isArray(category.clues)){
    add('clues.invalid_type',`${categoryPath}.clues`,'Category clues must be an array.','Provide 1-8 [clue, answer] pairs.');
    continue;
   }
   if(category.clues.length<1||category.clues.length>8)
    add('clues.invalid_count',`${categoryPath}.clues`,`This category has ${category.clues.length} clues; QuizDock supports 1 through 8.`,'Add or remove clues so the category contains 1-8.');
   for(const [clueIndex,pair] of category.clues.slice(0,9).entries()){
    const cluePath=`${categoryPath}.clues[${clueIndex}]`;
    if(!Array.isArray(pair)||(pair.length!==2&&pair.length!==3)){
     add('clue.invalid_format',cluePath,'A clue must be [clue, answer] with optional media as the third item.','Use ["clue text", "canonical answer"] or add a media object as item 3.');
     continue;
    }
    const clue=typeof pair[0]==='string'?pair[0].trim():'',answer=typeof pair[1]==='string'?pair[1].trim():'';
    if(!clue)add('clue.text_required',`${cluePath}[0]`,'The clue text is empty or is not a string.','Write a non-empty clue of at most 1,000 characters.');
    else if(pair[0].length>1000)add('clue.text_too_long',`${cluePath}[0]`,'The clue exceeds 1,000 characters.','Shorten the clue to 1,000 characters or fewer.');
    if(!answer)add('clue.answer_required',`${cluePath}[1]`,'The canonical answer is empty or is not a string.','Provide the expected answer as a non-empty string.');
    else if(pair[1].length>1000)add('clue.answer_too_long',`${cluePath}[1]`,'The answer exceeds 1,000 characters.','Shorten the answer to 1,000 characters or fewer.');
    if(pair.length===3)try{validateMedia(pair[2],label)}catch(error){add('media.invalid',`${cluePath}[2]`,error.message,'Use type image, audio, or video and an HTTPS, /downloads/, or /media/ URL.');}
    if(clue&&answer&&pair[0].length<=1000&&pair[1].length<=1000){
     if(leaksAnswer(clue,answer))add('clue.leaks_answer',`${cluePath}[0]`,`The clue contains its own answer: “${answer}”.`,'Rewrite the clue so it does not name the canonical answer.');
     entries.push({clue,answer,path:cluePath,round:label});
    }
   }
  }
 }
 for(const first of categoryNames.jeopardy)for(const second of categoryNames.doubleJeopardy)if(similar(first.name,second.name,.45))
  add('category.cross_round_similarity',second.path,`Double Jeopardy category “${second.name}” is too similar to Jeopardy category “${first.name}”.`,'Use substantially different category subjects across the two rounds.');
 for(let index=0;index<entries.length;index++)for(let earlier=0;earlier<index;earlier++){
  const current=entries[index],previous=entries[earlier];
  if(similar(current.answer,previous.answer,.72))add('answer.duplicate',`${current.path}[1]`,`Answer “${current.answer}” is too similar to earlier answer “${previous.answer}” at ${previous.path}[1].`,'Replace one answer and its clue with distinct content.');
  if(similar(current.clue,previous.clue,.62))add('clue.duplicate',`${current.path}[0]`,`This clue is too similar to an earlier clue at ${previous.path}[0].`,'Rewrite or replace one of the clues.');
 }
 const final=value.final;
 if(!final||typeof final!=='object')add('final.missing','$.final','Final Jeopardy is missing.','Add final with category, clue, and answer strings.');
 else{
  const finalClue=typeof final.clue==='string'?final.clue.trim():'',finalAnswer=typeof final.answer==='string'?final.answer.trim():'';
  if(!finalClue)add('final.clue_required','$.final.clue','Final Jeopardy needs non-empty clue text.','Write the Final Jeopardy clue.');
  else if(final.clue.length>1000)add('final.clue_too_long','$.final.clue','The Final Jeopardy clue exceeds 1,000 characters.','Shorten it to 1,000 characters or fewer.');
  if(!finalAnswer)add('final.answer_required','$.final.answer','Final Jeopardy needs a non-empty canonical answer.','Provide the expected Final Jeopardy answer.');
  else if(final.answer.length>1000)add('final.answer_too_long','$.final.answer','The Final Jeopardy answer exceeds 1,000 characters.','Shorten it to 1,000 characters or fewer.');
  if(final.media!==undefined)try{validateMedia(final.media,'Final Jeopardy')}catch(error){add('final.media_invalid','$.final.media',error.message,'Use type image, audio, or video and an HTTPS, /downloads/, or /media/ URL.');}
  if(finalClue&&finalAnswer&&final.clue.length<=1000&&final.answer.length<=1000){
   if(leaksAnswer(finalClue,finalAnswer))add('final.leaks_answer','$.final.clue',`The Final Jeopardy clue contains its answer: “${finalAnswer}”.`,'Rewrite the clue so it does not name the answer.');
   const repeated=entries.find(entry=>similar(finalAnswer,entry.answer,.72)||similar(finalClue,entry.clue,.62));
   if(repeated)add('final.duplicate','$.final','Final Jeopardy repeats or closely paraphrases an earlier clue or answer.',`Replace it with content distinct from ${repeated.path}.`);
  }
 }
 if(!issues.length)try{validateGamePackage(value)}catch(error){add('game.invalid','$',error.message,'Revise the game to satisfy this validation rule and submit it again.');}
 return issues;
}
