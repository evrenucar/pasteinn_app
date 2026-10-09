(function(root){
  'use strict';
  const FORMAT='pasteinn-vault-v1',encoder=new TextEncoder(),decoder=new TextDecoder();
  function toBase64(bytes){let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(text)}
  function fromBase64(text){return Uint8Array.from(atob(text),c=>c.charCodeAt(0))}
  function normalize(record){return {...record,revision:record.revision||`${record.id}-initial`,ancestors:record.ancestors||[]}}
  function revised(record){const r=normalize(record);return {...r,revision:crypto.randomUUID(),ancestors:[...new Set([...r.ancestors,r.revision])].slice(-1000),updatedAt:Date.now()}}
  // An ancestry chain distinguishes a newer edit from concurrent edits; wall clocks do not.
  function mergeRecords(left,right){
    const result=new Map(left.map(r=>[r.id,normalize(r)]));
    for(const value of right){
      const b=normalize(value),a=result.get(b.id);
      if(!a){result.set(b.id,b);continue}
      if(a.revision===b.revision||a.ancestors.includes(b.revision))continue;
      if(b.ancestors.includes(a.revision)){result.set(b.id,b);continue}
      // A deletion retains its tombstone; a concurrent edit survives as an explicit copy.
      const keep=a.deleted&&!b.deleted?a:b.deleted&&!a.deleted?b:a.revision<b.revision?a:b;
      const other=keep===a?b:a;result.set(keep.id,keep);
      if(!other.deleted){const conflict={...other,id:`${other.id.slice(0,100)}-conflict-${other.revision}`,conflict:true};result.set(conflict.id,conflict)}
    }
    return [...result.values()];
  }
  function validateRecords(records){
    if(!Array.isArray(records)||records.length>10000)throw Error('Invalid save list');
    const seen=new Set();
    for(const r of records){
      if(!r||typeof r.id!=='string'||!/^[a-z0-9-]{1,200}$/i.test(r.id)||seen.has(r.id))throw Error('Invalid or duplicate save ID');seen.add(r.id);
      if(r.revision!==undefined&&(typeof r.revision!=='string'||!/^[a-z0-9-]{1,200}$/i.test(r.revision)))throw Error('Invalid revision');
      if(r.ancestors!==undefined&&(!Array.isArray(r.ancestors)||r.ancestors.length>1000||r.ancestors.some(a=>typeof a!=='string'||!/^[a-z0-9-]{1,200}$/i.test(a))))throw Error('Invalid revision history');
    }
    return records;
  }
  function generateKey(){return 'pi1_'+toBase64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  async function importKey(value){
    if(!/^pi1_[A-Za-z0-9_-]{43}$/.test(value))throw Error('Use your Paste Inn recovery key (starts with pi1_).');
    return crypto.subtle.importKey('raw',fromBase64(value.slice(4).replace(/-/g,'+').replace(/_/g,'/')+'='),'AES-GCM',false,['encrypt','decrypt']);
  }
  async function encrypt(payload,key){
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(FORMAT)},key,encoder.encode(JSON.stringify(payload)));
    return {format:FORMAT,iv:toBase64(iv),ciphertext:toBase64(new Uint8Array(ciphertext))};
  }
  async function decrypt(envelope,key){
    if(envelope?.format!==FORMAT||typeof envelope.iv!=='string'||typeof envelope.ciphertext!=='string'||envelope.ciphertext.length>30*1024*1024)throw Error('Unsupported or oversized vault');
    try{return JSON.parse(decoder.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64(envelope.iv),additionalData:encoder.encode(FORMAT)},key,fromBase64(envelope.ciphertext))))}
    catch{throw Error('Couldn’t unlock this vault. Check the recovery key; nothing was overwritten.')}
  }
  function parseRepo(value){
    const match=value.trim().match(/^(?:https:\/\/github\.com\/)?([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9_.-]{1,100})\/?$/);
    if(!match)throw Error('Use a github.com/owner/repository URL.');
    const repo=match[2].replace(/\.git$/,'');if(repo==='.'||repo==='..')throw Error('Invalid repository');
    if(`${match[1]}/${repo}`.toLowerCase()==='evrenucar/pasteinn_app')throw Error('Use a separate private content repository, not the Paste Inn source repository.');
    return `${match[1]}/${repo}`;
  }
  const api={FORMAT,toBase64,fromBase64,normalize,revised,mergeRecords,validateRecords,generateKey,importKey,encrypt,decrypt,parseRepo};
  if(typeof module!=='undefined')module.exports=api;else root.PasteInnProtocol=api;
})(typeof window!=='undefined'?window:globalThis);
