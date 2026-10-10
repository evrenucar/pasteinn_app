const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ROOT=process.env.PASTEINN_ROOT||require('node:path').join(__dirname,'..'),P=require(ROOT+'/dist/sync-protocol.js');
const category={id:'inbox',name:'Inbox',icon:'Inbox',color:'#b9c990'};
const note=(id,body)=>({id,revision:id+'-rev',ancestors:[],title:body,body,type:'note',category:'inbox',createdAt:1,images:[],media:[]});
async function harness({remoteRecords=[],local=[],wrongKey=false,conflict=false,privateRepo=true,failWrite=false,editDuringUpload=false,crates=[category]}={}){
  const keyText=P.generateKey(),key=await P.importKey(keyText),nodes=new Map(),storage=new Map(),calls=[];
  let records=structuredClone(local),remote=remoteRecords.length?await P.encrypt({format:'pasteinn-sync-v1',records:remoteRecords,categories:[category]},key):null,sha=remote?'sha-1':null,conflicted=false;
  const $=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',checked:true,disabled:false,hidden:false});return nodes.get(id)};
  const context=vm.createContext({console,Protocol:P,crypto,TextEncoder,TextDecoder,Uint8Array,Blob,AbortController,Response,URL,Date,JSON,Map,Set,Promise,structuredClone,
    $,categories:crates,allCrates:()=>crates,notes:records,document:{addEventListener(){}},window:{addEventListener(){}},navigator:{onLine:true},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    setTimeout:(fn,ms)=>{const timer=setTimeout(fn,ms);timer.unref();return timer},clearTimeout,
    allLocalRecords:async()=>structuredClone(records),persistRecords:async r=>{records=r},mergeCategories:()=>{},
    validatePayload:value=>{P.validateRecords(value.records);return value},downloadFile:()=>{},
    fetch:async(url,options)=>{
      assert.ok(url.startsWith('https://api.github.com/repos/test/my-inn'));calls.push({url,method:options.method,body:options.body});
      if(url.endsWith('/test/my-inn'))return new Response(JSON.stringify({private:privateRepo,permissions:{push:true},default_branch:'main'}));
      if(options.method==='GET')return remote?new Response(JSON.stringify({type:'file',sha,size:100,content:P.toBase64(new TextEncoder().encode(JSON.stringify(remote)))})):new Response('{}',{status:404});
      const body=JSON.parse(options.body);
      if(failWrite)return new Response('{}',{status:500});
      if(conflict&&!conflicted){conflicted=true;remote=await P.encrypt({format:'pasteinn-sync-v1',records:[...remoteRecords,note('concurrent','other device')],categories:[category]},key);sha='sha-2';return new Response('{}',{status:409})}
      assert.equal(body.sha||null,sha);remote=JSON.parse(new TextDecoder().decode(P.fromBase64(body.content)));sha='sha-'+(calls.length+1);
      if(editDuringUpload){records[0]=P.revised({...records[0],body:'edited while uploading'});context.syncAPI.scheduleSync();}
      return new Response(JSON.stringify({content:{sha}}),{status:200});
    }
  });
  vm.runInContext(fs.readFileSync(ROOT+'/dist/sync.js','utf8')+'\nglobalThis.syncAPI={runSync,serializeSync,mergeLocalAndRemote,scheduleSync};',context);
  $('sync-repo').value='test/my-inn';$('sync-token').value='test-token-not-real';$('sync-key').value=wrongKey?P.generateKey():keyText;
  return {$,context,calls,storage,key,connect:()=>$('sync-form').onsubmit({preventDefault(){}}),records:()=>records,remote:()=>P.decrypt(remote,key)};
}
test('new vault encrypts content, clears input secrets, and does not persist credentials',async()=>{
  const h=await harness({local:[note('local','private content')]});await h.connect();
  assert.equal((await h.remote()).records[0].body,'private content');assert.ok(h.$('sync-status').textContent.startsWith('Synced'));
  assert.equal(h.$('sync-token').value,'');assert.equal(h.$('sync-key').value,'');
  assert.ok(!JSON.stringify([...h.storage]).includes('test-token'));assert.ok(!h.calls.find(c=>c.method==='PUT').body.includes('private content'));
});
test('wrong key and public repo cannot trigger writes',async()=>{
  for(const options of [{remoteRecords:[note('remote','secret')],wrongKey:true},{privateRepo:false}]){const h=await harness(options);await h.connect();assert.equal(h.calls.filter(c=>c.method==='PUT').length,0);assert.ok(h.$('sync-result').textContent.length>0)}
});
test('CAS conflict retries from fresh remote state and keeps both devices saves',async()=>{
  const h=await harness({local:[note('local','local')],remoteRecords:[note('remote','remote')],conflict:true});await h.connect();
  assert.equal(h.calls.filter(c=>c.method==='PUT').length,2);assert.equal((await h.remote()).records.length,3);assert.equal(h.records().length,3);
});
test('excluded saves upload only redaction records and media bytes remain local',async()=>{
  const r={...note('secret','sensitive words'),localOnly:true};const audio={...note('audio','voice'),media:[{id:'file-1',name:'voice.webm',blob:new Blob(['original audio'],{type:'audio/webm'})}]};
  const h=await harness({local:[r,audio]});await h.connect();const payload=await h.remote();
  assert.equal(payload.records.find(x=>x.id==='secret').body,'');assert.ok(payload.records.find(x=>x.id==='secret').redacted);
  assert.ok(!JSON.stringify(payload).includes('sensitive words'));assert.ok(!JSON.stringify(payload).includes('original audio'));
  assert.equal(await h.records().find(x=>x.id==='audio').media[0].blob.text(),'original audio');assert.equal(h.records().find(x=>x.id==='secret').body,'sensitive words');
});
test('offline sync does not send a request or claim success',async()=>{
  const h=await harness({local:[note('local','local')]});await h.connect();const count=h.calls.length;h.context.navigator.onLine=false;await h.context.syncAPI.runSync();assert.equal(h.calls.length,count);assert.equal(h.$('sync-status').textContent,'Offline · saved here');
});
test('unchanged revisions do not create another commit',async()=>{
  const h=await harness({local:[note('local','local')]});await h.connect();const writes=h.calls.filter(c=>c.method==='PUT').length;await h.context.syncAPI.runSync();assert.equal(h.calls.filter(c=>c.method==='PUT').length,writes);
});
test('failed upload leaves local data and does not report a successful sync',async()=>{
  const h=await harness({local:[note('local','only here')],failWrite:true});await h.connect();assert.equal(h.records()[0].body,'only here');assert.equal(h.$('sync-status').textContent,'Saved here · sync needs attention');assert.ok(!JSON.parse(h.storage.get('pasteinn-sync-config')).lastSync);
});
test('a local edit during upload remains queued and is not overwritten',async()=>{
  const h=await harness({local:[note('local','before')],editDuringUpload:true});await h.connect();assert.equal(h.records()[0].body,'edited while uploading');assert.equal((await h.remote()).records[0].body,'before');assert.equal(h.$('sync-status').textContent,'Saved here · sync queued');
});

test('crate settings, retired crates and transcripts survive encrypted sync',async()=>{
  const retired=P.revised({...category,id:'retired',deleted:true});
  const drawn={id:'drawn',name:'Drawn crate',icon:'HandDrawn',color:'#e7a170',drawing:'1'+'0'.repeat(1023),appearance:{cards:{layout:'compact',title:false},background:{base:'#15201b',seed:8}}};
  const r={...note('voice',''),transcript:'A small thought.'};
  const h=await harness({local:[r],crates:[category,retired,drawn]});await h.connect();const payload=await h.remote();
  assert.equal(payload.records[0].transcript,'A small thought.');assert.equal(payload.categories.find(c=>c.id==='retired').deleted,true);assert.equal(payload.categories.find(c=>c.id==='drawn').drawing.length,1024);assert.equal(payload.categories.find(c=>c.id==='drawn').appearance.cards.title,false);
});
