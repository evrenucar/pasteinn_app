const Protocol=window.PasteInnProtocol;
let activeSaveId=null,ocrWorkerPromise=null,ocrQueue=Promise.resolve(),recording=null,recordingStream=null;
function downloadFile(name,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}
function allLocalRecords(){return dbReady.then(db=>new Promise((resolve,reject)=>{const r=db.transaction('saves').objectStore('saves').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}))}
async function persistRecords(records){const db=await dbReady;await new Promise((resolve,reject)=>{const tx=db.transaction('saves','readwrite');for(const record of records)tx.objectStore('saves').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});notes=records.sort((a,b)=>b.createdAt-a.createdAt);render()}
function mediaMarkup(file){
  if(!file.blob)return `<p class="media-unavailable">${esc(file.name)} · original on capture device</p>`;
  const kind=file.blob.type.startsWith('video/')?'video':'audio';
  return `<div class="media-file"><${kind} controls preload="metadata" src="${imageURL(file)}"></${kind}><a href="${imageURL(file)}" download="${esc(file.name)}">${esc(file.name)}</a></div>`;
}
function refreshDetail(record){
  activeSaveId=record?.id||null;
  $('edit-save').hidden=!record?.createdAt||!!record.deleted;$('pin-save').hidden=!record?.createdAt||!!record.deleted;
  $('pin-save').textContent=record?.pinned?'Unpin':'Pin';$('delete-save').textContent=record?.deleted?'Restore save':'Move to trash';
  $('detail-ocr').hidden=!(record?.images?.length);
  $('ocr-status').textContent=record?.ocrText|| (record?.ocrStatus==='working'?'Reading text on this device…':record?.ocrStatus==='failed'?'Text recognition failed. You can retry.':record?.ocrStatus==='done'?'No text found.':'');
  $('retry-ocr').hidden=!record?.images?.length||record?.ocrStatus==='working';
  $('detail-media').querySelectorAll('.media-file,.media-unavailable').forEach(e=>e.remove());if(record?.media?.length)$('detail-media').insertAdjacentHTML('beforeend',record.media.map(mediaMarkup).join(''));
  $('local-only-row').hidden=!record?.createdAt||!!record.deleted;
  $('local-only').checked=!!record?.localOnly;
}
$('view-filter').onchange=render;$('date-filter').onchange=render;
$('filter-options').onclick=()=>{$('filters').hidden=!$('filters').hidden;$('filter-options').setAttribute('aria-expanded',String(!$('filters').hidden))};
$('pin-save').onclick=async()=>{const r=notes.find(x=>x.id===activeSaveId);if(!r)return;try{const next={...r,pinned:!r.pinned};await storeSave(next);notes=notes.map(x=>x.id===r.id?next:x);render();refreshDetail(next);notifyLocalChange()}catch{toast('Couldn’t update that save.')}};
$('local-only').onchange=async e=>{const r=notes.find(x=>x.id===activeSaveId);if(!r)return;try{const next={...r,localOnly:e.target.checked};await storeSave(next);notes=notes.map(x=>x.id===r.id?next:x);notifyLocalChange();toast(next.localOnly?'Kept on this device. Earlier repository history is unchanged.':'Included in the next sync.')}catch{e.target.checked=!!r.localOnly;toast('Couldn’t change sync preference.')}};
$('delete-save').onclick=async()=>{
  const r=notes.find(x=>x.id===activeSaveId);if(!r)return;
  try{const next={...r,deleted:!r.deleted};await storeSave(next);notes=notes.map(x=>x.id===r.id?next:x);$('detail').close();render();notifyLocalChange();toast(next.deleted?'Moved to trash. Restore it from Filters → Trash.':'Save restored')}
  catch{toast('Couldn’t update that save. Please try again.')}
};
$('edit-save').onclick=()=>{
  const record=notes.find(x=>x.id===activeSaveId);if(!record)return;
  $('edit-title').value=record.title;$('edit-body').value=window.InnContent?.generatedTitle(record)&&record.body===record.title?'':record.body;$('edit-tags').value=(record.tags||[]).join(', ');
  $('edit-category').innerHTML=categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');$('edit-category').value=record.category;
  $('edit-record').showModal();
};
$('edit-record-form').onsubmit=async e=>{
  e.preventDefault();const old=notes.find(x=>x.id===activeSaveId);if(!old)return;
  const body=$('edit-body').value.trim(),url=captureLink(body)?.href||old.url;
  const next={...old,title:$('edit-title').value.trim().slice(0,200)||old.title,body,category:$('edit-category').value,tags:[...new Set($('edit-tags').value.split(',').map(t=>t.trim()).filter(Boolean))].slice(0,30),url,metadata:url===old.url?old.metadata:null};
  try{await storeSave(next);notes=notes.map(x=>x.id===old.id?next:x);$('edit-record').close();$('detail').close();render();notifyLocalChange();enrichSave(next);toast('Changes saved')}
  catch{toast('Couldn’t save changes. Your edit is still here.')}
};
const localUpdates=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('pasteinn-local-updates'):null;
if(localUpdates)localUpdates.onmessage=async()=>{try{notes=(await allLocalRecords()).sort((a,b)=>b.createdAt-a.createdAt);render();refreshStorageStatus()}catch{}};
function broadcastLocalUpdate(){localUpdates?.postMessage('changed')}
function notifyLocalChange(){broadcastLocalUpdate();if(typeof scheduleSync==='function')scheduleSync();refreshStorageStatus()}
async function refreshStorageStatus(){
  const count=notes.filter(n=>!n.deleted).length;$('storage-summary').textContent=`${count} save${count===1?'':'s'} on this device`;
  try{const estimate=await navigator.storage?.estimate();if(estimate?.usage)$('storage-summary').textContent+=` · ${(estimate.usage/1048576).toFixed(1)} MB`;}catch{}
}
$('storage-settings').onclick=()=>{refreshStorageStatus();$('storage-dialog').showModal()};
$('protect-storage').onclick=async()=>{try{const granted=await navigator.storage.persist();$('storage-result').textContent=granted?'Persistent browser storage enabled. Keep backups too.':'This browser did not grant persistent storage. Export a backup regularly.'}catch{$('storage-result').textContent='This browser does not support persistent storage.'}};
function archiveName(name){return String(name||'attachment').replace(/[\\/\x00-\x1f:*?"<>|]/g,'_').slice(0,120)||'attachment'}
async function buildBackup(){
  const records=await allLocalRecords(),files={},items=[];
  for(const record of records){
    const item={...record,images:[],media:[]};
    for(const field of ['images','media'])for(const file of record[field]||[]){
      const descriptor={id:file.id,name:file.name,type:file.blob?.type||file.type,originalName:file.originalName,compressed:!!file.compressed,transcript:file.transcript,speechState:file.speechState};
      if(file.blob){descriptor.path=`attachments/${record.id}/${file.id}-${archiveName(file.name)}`;files[descriptor.path]=new Uint8Array(await file.blob.arrayBuffer())}
      item[field].push(descriptor);
    }
    items.push(item);
    const links=[...item.images,...item.media].filter(x=>x.path).map(x=>`[${x.name.replace(/[\[\]]/g,'')}](${('../'+x.path).split('/').map(encodeURIComponent).join('/')})`).join('\n');
    files[`notes/${record.id}.md`]=fflate.strToU8(`# ${record.title}\n\n${record.body||''}\n\n${links}\n\n${record.ocrText?'Image text:\n'+record.ocrText:''}\n\n${record.transcript?'Transcript:\n'+record.transcript:''}\n`);
  }
  files['pasteinn.json']=fflate.strToU8(JSON.stringify({format:'pasteinn-backup-v1',exportedAt:new Date().toISOString(),categories:allCrates(),preferences:window.InnSurface?.export(),records:items},null,2));
  const archiveBytes=Object.values(files).reduce((sum,bytes)=>sum+bytes.length,0);if(archiveBytes>190*1024*1024)throw Error('This early build supports backup archives up to 190 MB. Download large original attachments from their save before exporting a smaller library.');
  files['README.txt']=fflate.strToU8('Paste Inn backup v1\nUnencrypted: store this archive somewhere safe.\npasteinn.json contains categories, records, revision history and attachment paths.\nnotes/ contains readable Markdown. attachments/ contains original local files (or compressed files received through sync).\nNo GitHub tokens or recovery keys are included. Import through Paste Inn → Storage → Restore backup.\n');
  return new Promise((resolve,reject)=>fflate.zip(files,{level:0},(error,bytes)=>error?reject(error):resolve(bytes)));
}
$('export-backup').onclick=async()=>{
  const button=$('export-backup');button.disabled=true;$('storage-result').textContent='Preparing your archive…';
  try{const bytes=await buildBackup();downloadFile(`pasteinn-${new Date().toISOString().slice(0,10)}.zip`,new Blob([bytes],{type:'application/zip'}));$('storage-result').textContent='Backup downloaded. It contains readable, unencrypted files.'}
  catch(error){$('storage-result').textContent=error.message||'Backup failed. Your saves are unchanged.'}finally{button.disabled=false}
};
function validatePayload(payload){
  if(!payload||!['pasteinn-backup-v1','pasteinn-sync-v1'].includes(payload.format))throw Error('Not a supported Paste Inn archive.');
  Protocol.validateRecords(payload.records);Protocol.validateRecords(payload.categories);
  if(payload.categories.length>200)throw Error('Too many categories');
  for(const c of payload.categories)if(typeof c.name!=='string'||!c.name.trim()||c.name.length>28||!validColor(c.color)||!(validIcon(c.icon)||c.icon==='HandDrawn'&&validDrawing(c.drawing)))throw Error('Invalid category');
  for(const r of payload.records){
    if(!r.redacted&&!['note','link','image','audio','video'].includes(r.type))throw Error('Invalid save type');
    if(typeof r.title!=='string'||r.title.length>1000||typeof r.body!=='string'||r.body.length>1000000||typeof r.category!=='string'||!Number.isFinite(r.createdAt))throw Error('Invalid saved content');
    if(r.url&&!safeURL(r.url))throw Error('Invalid link');
    if(r.metadata&&(typeof r.metadata!=='object'||typeof r.metadata.title!=='string'||(r.metadata.image&&!safeURL(r.metadata.image))))throw Error('Invalid preview');
    if(r.transcript!==undefined&&(typeof r.transcript!=='string'||r.transcript.length>1000000))throw Error('Invalid transcript');
    if(r.ocrText!==undefined&&typeof r.ocrText!=='string')throw Error('Invalid image text');
    if(r.tags&&(!Array.isArray(r.tags)||r.tags.length>30||r.tags.some(t=>typeof t!=='string'||t.length>100)))throw Error('Invalid tags');
    for(const field of ['images','media']){if(r[field]!==undefined&&(!Array.isArray(r[field])||r[field].length>8))throw Error('Invalid attachments');for(const f of r[field]||[])if(typeof f.id!=='string'||!/^[a-z0-9-]{1,200}$/i.test(f.id)||typeof f.name!=='string'||f.name.length>500||typeof f.type!=='string'||(field==='images'?!ACCEPTED_IMAGES.has(f.type):!/^audio\/|^video\//.test(f.type)))throw Error('Invalid attachment');}
  }
  return payload;
}
function mergeCategories(incoming){const wasFiltered=onlyCategory,selectedId=categories[selected]?.id;const merged=Protocol.mergeRecords(allCrates(),incoming).map(c=>c.conflict&&!c.name.endsWith(' (copy)')?{...c,name:c.name.slice(0,21)+' (copy)'}:c);categories=merged.filter(c=>!c.deleted);archivedCategories=merged.filter(c=>c.deleted);if(!categories.some(c=>c.id==='inbox'))categories.unshift({...defaultCategories[0]});persistCrates();renderWheel();selectCategory(Math.max(0,categories.findIndex(c=>c.id===selectedId)),false);onlyCategory=wasFiltered;window.InnSurface?.select(wasFiltered?categories[selected]:null);render();paintWheel();window.InnUI?.refreshCrates()}
$('import-backup').onclick=()=>$('backup-input').click();
$('backup-input').onchange=async e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;$('storage-result').textContent='Checking backup…';
  try{
    if(file.size>200*1024*1024)throw Error('This preview supports backups up to 200 MB.');
    let expanded=0,oversized=false;
    const bytes=new Uint8Array(await file.arrayBuffer());
    const files=await new Promise((resolve,reject)=>fflate.unzip(bytes,{filter(entry){expanded+=entry.originalSize;if(expanded>200*1024*1024||entry.originalSize>60*1024*1024){oversized=true;return false}return true}},(error,result)=>error?reject(Error('Couldn’t read that ZIP archive.')):resolve(result)));
    if(oversized)throw Error('Backup expands beyond the 200 MB safety limit.');
    if(!files['pasteinn.json']||files['pasteinn.json'].length>20*1024*1024)throw Error('Missing or oversized Paste Inn manifest.');
    const payload=validatePayload(JSON.parse(fflate.strFromU8(files['pasteinn.json'])));
    const incoming=payload.records.map(record=>{
      const value={...record};
      for(const field of ['images','media'])value[field]=(record[field]||[]).map(f=>{
        if(f.path&&(!f.path.startsWith('attachments/')||f.path.includes('..')||!files[f.path]))throw Error('An attachment is missing from this backup.');
        return {...f,blob:f.path?new Blob([files[f.path]],{type:f.type}):null};
      });return value;
    });
    const combined=Protocol.mergeRecords(await allLocalRecords(),incoming);await persistRecords(combined);mergeCategories(payload.categories);if(payload.preferences)window.InnSurface?.restore(payload.preferences);notifyLocalChange();
    $('storage-result').textContent='Backup restored. Conflicting versions are kept as separate copies.';
  }catch(error){$('storage-result').textContent=error.message}
};
// Sequential OCR keeps mobile memory bounded. Recognition never uploads images.
function enqueueOCR(record){
  if(!record.images?.length||record.ocrStatus==='done'||record.deleted)return;
  ocrQueue=ocrQueue.then(async()=>{
    if(!notes.some(x=>x.id===record.id&&!x.deleted))return;
    const current=notes.find(x=>x.id===record.id);current.ocrStatus='working';if(activeSaveId===current.id)refreshDetail(current);
    try{
      ocrWorkerPromise ||= Tesseract.createWorker('eng',1,{workerPath:'vendor/ocr/worker.min.js',corePath:'vendor/ocr',langPath:'vendor/ocr',workerBlobURL:false});
      const worker=await ocrWorkerPromise,texts=[];
      for(const image of current.images){if(!image.blob)continue;const result=await worker.recognize(image.blob);texts.push(result.data.text.trim())}
      const latest=notes.find(x=>x.id===record.id);if(!latest||latest.deleted)return;
      const next={...latest,ocrText:texts.filter(Boolean).join('\n\n'),ocrStatus:'done'};await storeSave(next);notes=notes.map(x=>x.id===next.id?next:x);render();notifyLocalChange();if(activeSaveId===next.id)refreshDetail(next);
    }catch{ocrWorkerPromise=null;const latest=notes.find(x=>x.id===record.id);if(latest){latest.ocrStatus='failed';if(activeSaveId===latest.id)refreshDetail(latest)}}
  }).catch(()=>{});
}
$('retry-ocr').onclick=()=>{const r=notes.find(x=>x.id===activeSaveId);if(r){r.ocrStatus='pending';enqueueOCR(r)}};
$('take-photo').onclick=()=>$('camera-input').click();$('camera-input').onchange=e=>{addImages([...e.target.files]);e.target.value=''};
