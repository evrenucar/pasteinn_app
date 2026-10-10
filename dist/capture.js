// Local capture: images stay in this browser, and only link URLs reach the preview helper.
const objectURLs=new Map();
let pendingImages=[], pendingLink=null, previewController=null, previewTimer, captureBusy=false;
const ACCEPTED_IMAGES=new Set(['image/png','image/jpeg','image/webp','image/gif','image/avif','image/bmp']);
const dbReady=new Promise((resolve,reject)=>{
  const request=indexedDB.open('pasteinn-saves',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('saves',{keyPath:'id'});
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
  request.onblocked=()=>reject(Error('Close other Paste Inn tabs and reload.'));
});
// Attach a handler immediately, including in browsers where storage is disabled.
dbReady.catch(()=>{});
async function storeSave(record){
  const db=await dbReady;Object.assign(record,PasteInnProtocol.revised(record));
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('saves','readwrite');
    tx.objectStore('saves').put(record);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}
function imageURL(image){
  if(!objectURLs.has(image.id))objectURLs.set(image.id,URL.createObjectURL(image.blob));
  return objectURLs.get(image.id);
}
function safeURL(text){try{const u=new URL(text);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u:null}catch{return null}}
function captureLink(text){
  const matches=text.match(/https?:\/\/[^\s<>]+/g)||[];
  return matches.length===1?safeURL(matches[0]):null;
}
function imageMarkup(image,cls='saved-image'){
  if(!image.blob)return '';return `<img class="${cls}" src="${imageURL(image)}" alt="${esc(image.name)}" loading="lazy">`;
}
function previewMarkup(link,cls='link-preview'){
  const u=safeURL(link.url);if(!u)return '';
  const image=safeURL(link.metadata?.image);
  return `<div class="${cls}">${image?`<img class="link-thumbnail" src="${esc(image.href)}" referrerpolicy="no-referrer" alt="" loading="lazy">`:`<span class="link-symbol" aria-hidden="true">${iconHTML('Link',null,21)}</span>`}<div><span class="link-domain">${esc(u.hostname.replace(/^www\./,''))}</span><strong>${esc(link.metadata?.title||u.hostname.replace(/^www\./,''))}</strong>${link.state==='loading'?'<span class="preview-state">Getting a preview…</span>':link.metadata?.description?`<span class="link-description">${esc(link.metadata.description)}</span>`:''}</div></div>`;
}
function renderAttachments(){
  $('pending-images').hidden=!pendingImages.length;
  $('pending-images').innerHTML=pendingImages.map(x=>`<div class="pending-image">${ACCEPTED_IMAGES.has(x.blob.type)?imageMarkup(x):`<span class="pending-media">${iconHTML(x.blob.type.startsWith('audio/')?'Music':'Film',null,30)}</span>`}<button type="button" data-remove-image="${x.id}" aria-label="Remove ${esc(x.name)}">×</button><span>${esc(x.name)}</span></div>`).join('');
  $('attachment-status').textContent=pendingImages.length?`${pendingImages.length} file${pendingImages.length===1?'':'s'} attached`:'';
}
async function addImages(files){
  if(captureBusy)return;
  for(const file of files){
    if(!ACCEPTED_IMAGES.has(file.type)&&!/^audio\/|^video\//.test(file.type)){toast('Attach an image, audio, or video file.');continue}
    if(file.size>(ACCEPTED_IMAGES.has(file.type)?20:50)*1024*1024){toast('Use an image under 20 MB or audio/video under 50 MB.');continue}
    if(pendingImages.length>=8){toast('Up to 8 attachments per save.');break}
    pendingImages.push({id:crypto.randomUUID(),name:file.name||'Pasted image.png',blob:file});
  }
  renderAttachments();$('capture').focus();
}
$('add-image').onclick=()=>$('image-input').click();
$('image-input').onchange=e=>{addImages([...e.target.files]);e.target.value=''};
$('pending-images').onclick=e=>{
  const b=e.target.closest('[data-remove-image]');if(!b||captureBusy)return;
  const id=b.dataset.removeImage;URL.revokeObjectURL(objectURLs.get(id));objectURLs.delete(id);
  pendingImages=pendingImages.filter(x=>x.id!==id);renderAttachments();if(typeof renderPendingTranscript==='function')renderPendingTranscript();
};
document.addEventListener('paste',e=>{
  if(document.querySelector('dialog[open]'))return;
  const target=e.target;
  if(target.matches?.('input,textarea,[contenteditable=true]')&&target.id!=='capture')return;
  const files=[...(e.clipboardData?.items||[])].filter(x=>x.kind==='file').map(x=>x.getAsFile()).filter(Boolean);
  if(files.length){e.preventDefault();addImages(files)}
});
const composer=$('capture-form');let dragDepth=0;
composer.addEventListener('dragenter',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();dragDepth++;composer.classList.add('drop-active')}});
composer.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy'}});
composer.addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;composer.classList.remove('drop-active')}});
composer.addEventListener('drop',e=>{e.preventDefault();dragDepth=0;composer.classList.remove('drop-active');addImages([...e.dataTransfer.files])});
// Prevent an image dropped outside the composer from navigating away and losing a draft.
window.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files'))e.preventDefault()});
window.addEventListener('drop',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();if(!composer.contains(e.target))addImages([...e.dataTransfer.files])}});
function renderPendingLink(){
  $('pending-link').hidden=!pendingLink;
  $('pending-link').innerHTML=pendingLink?previewMarkup(pendingLink):'';
}
async function fetchMetadata(url,signal){
  const response=await fetch('/api/preview?url='+encodeURIComponent(url),{headers:{'X-Paste-Inn':'preview'},signal});
  if(!response.ok)throw Error('No preview');
  return response.json();
}
function schedulePreview(){
  clearTimeout(previewTimer);previewController?.abort();
  const url=captureLink($('capture').value)?.href;
  if(!url){pendingLink=null;renderPendingLink();return}
  if(pendingLink?.url===url&&pendingLink.state==='ready')return;
  const current=pendingLink={url,state:'loading',metadata:null};renderPendingLink();
  previewTimer=setTimeout(async()=>{
    const controller=previewController=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),16000);
    try{current.metadata=await fetchMetadata(url,controller.signal);current.state='ready'}
    catch{current.state='unavailable'}finally{clearTimeout(timeout);if(pendingLink===current)renderPendingLink()}
  },400);
}
$('capture').addEventListener('input',schedulePreview);
document.addEventListener('error',e=>{if(e.target.matches?.('.link-thumbnail'))e.target.hidden=true},true);
async function enrichSave(record){
  if(!record.url||record.metadata)return;
  try{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),16000);let metadata;
    try{metadata=await fetchMetadata(record.url,controller.signal)}finally{clearTimeout(timeout)}
    const latest=notes.find(x=>x.id===record.id);if(!latest||latest.deleted||latest.url!==record.url)return;
    const next={...latest,metadata};await storeSave(next);notes=notes.map(x=>x.id===next.id?next:x);render();notifyLocalChange();
  }catch{/* The original link is already safely saved; metadata is optional. */}
}
composer.onsubmit=async e=>{
  e.preventDefault();if(captureBusy)return;
  const text=$('capture').value.trim();if(!text&&!pendingImages.length){await $('auto-paste').onclick();return}
  captureBusy=true;const saveButton=composer.querySelector('[type=submit]');saveButton.disabled=true;$('capture').readOnly=true;
  const url=captureLink(text);const duplicate=url&&!pendingImages.length?notes.find(n=>!n.deleted&&n.url===url.href&&(!!safeURL(text)||n.body===text)):null;if(duplicate){captureBusy=false;saveButton.disabled=false;$('capture').readOnly=false;detail(duplicate.title,duplicate.body,(categories.find(c=>c.id===duplicate.category)||categories[0]).name,duplicate.url,duplicate);toast('Already here. Opened your existing save.');return}const destination={...categories[selected]};
  const record={id:'n'+crypto.randomUUID(),category:destination.id,type:pendingImages.length?(ACCEPTED_IMAGES.has(pendingImages[0].blob.type)?'image':pendingImages[0].blob.type.startsWith('audio/')?'audio':'video'):url?'link':'note',title:pendingImages.length?(text.split('\n')[0]||pendingImages[0].name):url?url.hostname:text.split('\n')[0].slice(0,85),body:text,url:url?.href,images:pendingImages.filter(x=>ACCEPTED_IMAGES.has(x.blob.type)),media:pendingImages.filter(x=>!ACCEPTED_IMAGES.has(x.blob.type)),transcript:pendingImages.map(x=>x.transcript||'').filter(Boolean).join('\n\n'),tags:[],localOnly:false,metadata:pendingLink?.url===url?.href?pendingLink?.metadata:null,createdAt:Date.now(),time:'On this device'};
  try{
    await storeSave(record);notes.unshift(record);if(typeof trackPendingTranscripts==='function')trackPendingTranscripts(record);pendingImages=[];renderAttachments();if(typeof renderPendingTranscript==='function')renderPendingTranscript();
    $('capture').value='';$('search').value='';pendingLink=null;previewController?.abort();clearTimeout(previewTimer);renderPendingLink();render();
    toast('In '+destination.name+' · saved on this device');notifyLocalChange();enrichSave(record);enqueueOCR(record);
  }catch{toast('Couldn’t save to this browser. Your draft is still here; free some space and try again.')}
  finally{captureBusy=false;saveButton.disabled=false;$('capture').readOnly=false;window.updateCaptureAction?.()}
};
async function loadSaves(){
  try{
    const db=await dbReady;
    const saved=await new Promise((resolve,reject)=>{const r=db.transaction('saves').objectStore('saves').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
    const merged=new Map([...saved,...notes].map(x=>[x.id,x]));notes=[...merged.values()].sort((a,b)=>b.createdAt-a.createdAt);render();refreshStorageStatus();for(const record of notes)if(record.images?.length&&record.ocrStatus!=='done'&&record.ocrStatus!=='failed')enqueueOCR(record);
  }catch{toast('Browser storage is unavailable. Your drafts will stay here until saving is available.')}
}
loadSaves();
window.addEventListener('beforeunload',e=>{if(pendingImages.length||$('capture').value.trim()||captureBusy){e.preventDefault();e.returnValue=''}});
