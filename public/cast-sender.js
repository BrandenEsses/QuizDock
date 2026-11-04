// Native Google Cast requires a registered Custom Web Receiver application ID.
// Without it, the TV-only tab works with Chrome's Cast tab feature.
let castAppId='',castContext=null;
const castNamespace='urn:x-cast:dev.ble.quizdock';
function castStatus(message){const el=document.getElementById('castStatus');if(el)el.textContent=message;}
async function sendCastRoom(){
 if(!castContext||!state?.code||mode!=='host')return;
 const session=castContext.getCurrentSession();if(!session)return;
 try{await session.sendMessage(castNamespace,{type:'room',code:state.code});}catch(e){castStatus('Unable to send room: '+e.message);}
}
async function setupCast(){
 if(tvCode)return;
 const button=document.getElementById('castButton');
 document.getElementById('tvTab').onclick=()=>{
   if(!state?.code)return castStatus('Create a room first.');
   window.open('/display/'+encodeURIComponent(state.code),'_blank','noopener');
 };
 try{
   const res=await fetch('/api/cast-config');const config=await res.json();castAppId=config.appId;
   if(!castAppId){castStatus('Native Cast needs a registered Google Cast application ID. Use Open TV-only tab meanwhile.');return;}
   if(!window.cast?.framework){castStatus('Google Cast SDK not ready or unsupported. Use desktop Chrome or cast the TV-only tab.');return;}
   castContext=cast.framework.CastContext.getInstance();
   castContext.setOptions({receiverApplicationId:castAppId,autoJoinPolicy:chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED});
   button.disabled=false;castStatus('Cast SDK ready. Click Cast; if the device list is empty, check desktop Chrome, local network access, and Chromecast discovery.');
   button.onclick=async()=>{if(!state?.code)return castStatus('Create a room first.');try{await castContext.requestSession();await sendCastRoom();castStatus('TV connected to room '+state.code);}catch(e){castStatus('Cast cancelled or failed: '+(e.message||e));}};
   castContext.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED,()=>sendCastRoom());
 }catch(e){castStatus('Cast setup failed: '+e.message);}
}
window.__onGCastApiAvailable=function(available){if(available)setupCast();else castStatus('Google Cast SDK is unavailable in this browser. Try desktop Chrome.');};
document.addEventListener('DOMContentLoaded',()=>{if(!tvCode)setTimeout(()=>{if(!castContext)setupCast();},1500);});
