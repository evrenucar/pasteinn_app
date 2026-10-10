// The browser talks directly to GitHub. Tokens and recovery keys are never persisted.
let syncSession=null,syncTimer,syncRunning=false,syncDirty=false,syncRetry=0;
const SYNC_FILE='pasteinn/vault.json',SYNC_LIMIT=20*1024*1024;
function syncSignature(payload){return JSON.stringify(['records','categories',...(payload.devices?['devices']:[])].map(field=>payload[field].map(r=>`${r.id}:${Protocol.normalize(r).revision}`).sort()))}
function syncStatus(message){$('sync-status').textContent=message;if(window.InnSync)window.InnSync.badge();else $('sync-badge').textContent='Sync it';$('sync-badge').title=message}
function savedSyncConfig(){try{return JSON.parse(localStorage.getItem('pasteinn-sync-config')||'null')}catch{return null}}
const savedConnection=savedSyncConfig();if(savedConnection){$('sync-repo').value=savedConnection.repo||'';syncStatus(savedConnection.lastSync?'Locked · last sync '+new Date(savedConnection.lastSync).toLocaleString():'Sync locked')}
$('open-sync').onclick=()=>{$('sync-dialog').showModal()};$('sync-badge').onclick=()=>{$('sync-dialog').showModal()};
$('generate-key').onclick=()=>{const value=Protocol.generateKey();$('sync-key').value=value;downloadFile('pasteinn-recovery-key.txt',new Blob([`Paste Inn recovery key\n\n${value}\n\nKeep this somewhere safe, separate from your GitHub token. Anyone with this key and your encrypted vault can read its content. Paste Inn cannot recover a lost key.\n`],{type:'text/plain'}));$('key-saved').checked=false;$('sync-result').textContent='Recovery key downloaded. Save it somewhere safe before connecting.'};
$('key-file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>4096){$('sync-result').textContent='Choose your small recovery-key text file.';return}const text=await file.text(),match=text.match(/pi1_[A-Za-z0-9_-]{43}/);if(match)$('sync-key').value=match[0];else $('sync-result').textContent='No Paste Inn recovery key found.'};
$('load-key').onclick=()=>$('key-file').click();
async function github(session,path,{method='GET',body,raw=false,missing=false}={}){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
  try{
    const response=await fetch(`https://api.github.com/repos/${session.repo}${path}`,{method,headers:{Accept:raw?'application/vnd.github.raw+json':'application/vnd.github+json',...(session.token?{Authorization:'Bearer '+session.token}:{}),'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal,redirect:'error',cache:'no-store'});
    if(response.status===404&&missing)return null;
    if(!response.ok){const err=Error(response.status===401?'GitHub token expired or invalid.':response.status===403?'GitHub denied access or rate-limited this request.':response.status===404?'Repository not found, or this token cannot access it.':response.status===409||response.status===422?'The repository changed during sync. Retrying safely.':'GitHub could not finish this request.');err.status=response.status;throw err}
    if(Number(response.headers.get('content-length'))>SYNC_LIMIT*2)throw Error('Remote vault exceeds this preview’s size limit.');
    const reader=response.body.getReader();let size=0;const chunks=[];
    for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>SYNC_LIMIT*2){await reader.cancel();throw Error('Remote vault too large.')}chunks.push(value)}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}const text=new TextDecoder().decode(bytes);
    return JSON.parse(text);
  }finally{clearTimeout(timeout)}
}
async function remoteVault(session){
  const file=await github(session,`/contents/${session.file||SYNC_FILE}?ref=${encodeURIComponent(session.branch)}`,{missing:true});
  if(!file)return {sha:null,payload:null};
  if(file.type!=='file'||file.size>SYNC_LIMIT||!file.sha)throw Error('Unsupported remote vault file.');
  const envelope=file.content?JSON.parse(new TextDecoder().decode(Protocol.fromBase64(file.content.replace(/\s/g,'')))):await github(session,`/contents/${session.file||SYNC_FILE}?ref=${encodeURIComponent(session.branch)}`,{raw:true});
  const payload=validatePayload(await Protocol.decrypt(envelope,session.key));if(payload.format!=='pasteinn-sync-v1')throw Error('Not a sync vault');
  if(session.crateId)InnScope.validate(payload,session.crateId);else if(payload.scope)throw Error('Choose the matching crate to open this file.');if(window.InnSync)payload.devices=InnScope.devices(payload.devices);return {sha:file.sha,payload};
}
async function compressedImage(file){
  if(!file.blob)return {...file,type:file.type||'image/webp',blob:undefined};
  let blob=file.blob,compressed=!!file.compressed,name=file.name;
  if(blob.size>512*1024){
    const image=await createImageBitmap(blob);const ratio=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();
    blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.8));if(!blob)throw Error('Couldn’t prepare an image for sync.');compressed=true;name=file.name.replace(/\.[^.]+$/,'')+'.webp';
  }
  if(blob.size>2*1024*1024)throw Error('An image is too large for sync. Keep that save on this device or use a smaller image.');
  return {id:file.id,name,originalName:file.originalName||file.name,type:blob.type,compressed,base64:Protocol.toBase64(new Uint8Array(await blob.arrayBuffer()))};
}
async function serializeSync(records){
  const exported=[];
  for(const record of records){
    const r=Protocol.normalize(record);
    // A redaction tombstone removes currently published content, while the local copy stays put.
    if(r.localOnly){exported.push({id:r.id,revision:r.revision,ancestors:r.ancestors,deleted:true,redacted:true,sharedSource:r.sharedSource,type:'note',title:'',body:'',category:'inbox',createdAt:r.createdAt,updatedAt:r.updatedAt,images:[],media:[]});continue}
    exported.push({...r,images:await Promise.all((r.images||[]).map(compressedImage)),media:(r.media||[]).map(f=>({id:f.id,name:f.name,type:f.blob?.type||f.type,transcript:f.transcript,speechState:f.speechState==='working'?'pending':f.speechState,localOnly:true})),ocrStatus:r.ocrStatus==='working'?'pending':r.ocrStatus});
  }
  return {format:'pasteinn-sync-v1',records:exported,categories:allCrates(),...(window.InnSync?{devices:window.InnSync.devicesFor(syncSession)}:{})};
}
function deserializeSync(payload){
  return payload.records.map(r=>({...r,images:(r.images||[]).map(f=>{
    if(f.base64&&f.base64.length>3*1024*1024)throw Error('Remote image exceeds the per-image limit.');
    return {...f,base64:undefined,blob:f.base64?new Blob([Protocol.fromBase64(f.base64)],{type:f.type}):null};
  }),media:(r.media||[]).map(f=>({...f,blob:null}))}));
}
function mergeLocalAndRemote(local,incoming){
  const privateSaves=local.filter(x=>x.localOnly),privateIds=new Set(privateSaves.map(x=>x.id));
  const merged=Protocol.mergeRecords(local.filter(x=>!privateIds.has(x.id)),incoming.filter(x=>!privateIds.has(x.id)));
  // Retain full originals that exist on this device, even when another device edited the note.
  const originals=new Map(local.flatMap(r=>[...(r.images||[]),...(r.media||[])].filter(f=>f.blob).map(f=>[f.id,f])));
  return [...merged.map(r=>({...r,images:(r.images||[]).map(f=>originals.has(f.id)?{...originals.get(f.id),...f,blob:originals.get(f.id).blob}:f),media:(r.media||[]).map(f=>originals.has(f.id)?{...originals.get(f.id),...f,blob:originals.get(f.id).blob}:f)})),...privateSaves];
}
async function runSync(){
  if(!syncSession)return;if(syncRunning){syncDirty=true;return}if(!navigator.onLine){syncStatus('Offline · saved here');syncDirty=true;return}
  const session=syncSession;syncRunning=true;syncDirty=false;$('sync-now').disabled=true;syncStatus('Syncing…');
  try{
    for(let attempt=0;attempt<3;attempt++){
      const remote=await remoteVault(session);if(syncSession!==session)return;
      const local=await allLocalRecords(),remoteRecords=remote.payload?deserializeSync(remote.payload):[];
      const merged=mergeLocalAndRemote(local,remoteRecords);
      if(remote.payload){mergeCategories(remote.payload.categories);window.InnSync?.mergeDevices(session,remote.payload.devices)}
      const payload=await serializeSync(merged),unchanged=remote.payload&&syncSignature(payload)===syncSignature(remote.payload),envelope=await Protocol.encrypt(payload,session.key),bytes=new TextEncoder().encode(JSON.stringify(envelope));
      if(bytes.length>SYNC_LIMIT)throw Error('This early sync vault is full (20 MB). New saves remain local. Export a backup or exclude large saves.');
      if(syncSession!==session)return;
      try{
        if(!unchanged)await github(session,`/contents/${session.file||SYNC_FILE}`,{method:'PUT',body:{message:'Sync encrypted Paste Inn vault',content:Protocol.toBase64(bytes),branch:session.branch,...(remote.sha?{sha:remote.sha}:{})}});
      }catch(error){if((error.status===409||error.status===422)&&attempt<2)continue;throw error}
      // Re-read after the network request so a simultaneous local save/edit cannot be overwritten.
      const newest=await allLocalRecords();await persistRecords(mergeLocalAndRemote(newest,merged));if(typeof broadcastLocalUpdate==='function')broadcastLocalUpdate();
      const config={repo:session.repo,lastSync:Date.now()};localStorage.setItem('pasteinn-sync-config',JSON.stringify(config));syncRetry=0;
      if(syncSession===session){syncStatus(syncDirty?'Saved here · sync queued':'Synced '+new Date(config.lastSync).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));$('sync-result').textContent='Encrypted sync complete. Audio/video originals stay on their capture device.'}
      return;
    }
  }catch(error){if(syncSession===session){syncStatus('Saved here · sync needs attention');$('sync-result').textContent=error.message||'Sync failed. Your saves remain on this device.';syncDirty=true;syncRetry++;if(syncRetry<=3)syncTimer=setTimeout(runSync,Math.min(60000,5000*2**syncRetry))}}
  finally{syncRunning=false;$('sync-now').disabled=false;if(syncDirty&&syncSession===session&&syncRetry===0)scheduleSync()}
}
function scheduleSync(){syncDirty=true;if(!syncSession)return;clearTimeout(syncTimer);syncTimer=setTimeout(runSync,1800)}
$('sync-form').onsubmit=async e=>{
  e.preventDefault();$('connect-sync').disabled=true;
  try{
    const repo=Protocol.parseRepo($('sync-repo').value),token=$('sync-token').value.trim(),key=await Protocol.importKey($('sync-key').value.trim());
    if(!token||!$('key-saved').checked)throw Error('Enter a token and confirm that your recovery key is saved safely.');
    const session={repo,token,key},info=await github(session,'');
    if(!info.private)throw Error('Personal vaults require a private repository. Public shared chests are future work.');
    if(info.permissions?.push===false)throw Error('This token needs Contents read/write permission for this repository.');
    session.branch=info.default_branch||'main';session.private=info.private;session.devices=[];
    // Verify an existing vault before enabling uploads; a wrong key must never overwrite it.
    await remoteVault(session);syncSession=session;syncRetry=0;$('sync-token').value='';$('sync-key').value='';$('sync-now').hidden=false;$('lock-sync').hidden=false;
    localStorage.setItem('pasteinn-sync-config',JSON.stringify({repo,lastSync:savedSyncConfig()?.repo===repo?savedSyncConfig()?.lastSync:null}));await runSync();
  }catch(error){$('sync-result').textContent=error.message||'Couldn’t connect. No content was uploaded.'}finally{$('connect-sync').disabled=false}
};
$('sync-now').onclick=()=>{syncRetry=0;runSync()};
$('lock-sync').onclick=()=>{syncSession=null;clearTimeout(syncTimer);$('sync-now').hidden=true;$('lock-sync').hidden=true;syncStatus('Sync locked');$('sync-result').textContent='Token and key cleared from memory. Local saves remain available.'};
window.addEventListener('online',()=>{syncRetry=0;runSync()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&syncSession)runSync()});
