const {test}=require('node:test');const assert=require('node:assert/strict');
const P=require((process.env.PASTEINN_ROOT||require('node:path').join(__dirname,'..'))+'/dist/sync-protocol.js');
test('encryption round trip, random IVs, wrong key and tampering',async()=>{
  const key=await P.importKey(P.generateKey()),data={title:'private words',image:'secret image'};
  const a=await P.encrypt(data,key),b=await P.encrypt(data,key);
  assert.notEqual(a.iv,b.iv);assert.ok(!JSON.stringify(a).includes('private words'));assert.deepEqual(await P.decrypt(a,key),data);
  await assert.rejects(P.decrypt(a,await P.importKey(P.generateKey())));
  const bytes=P.fromBase64(a.ciphertext);bytes[0]^=1;await assert.rejects(P.decrypt({...a,ciphertext:P.toBase64(bytes)},key));
});
test('merge recognizes descendants without trusting timestamps',()=>{
  const base={id:'note-1',revision:'base',ancestors:[],body:'old'},next={...base,revision:'next',ancestors:['base'],body:'new',updatedAt:1};
  assert.deepEqual(P.mergeRecords([base],[next]),[next]);assert.deepEqual(P.mergeRecords([next],[base]),[next]);
});
test('concurrent edits retain both and repeated merges do not multiply copies',()=>{
  const a={id:'note-1',revision:'a',ancestors:['base'],body:'A'},b={...a,revision:'b',body:'B'};
  const once=P.mergeRecords([a],[b]);assert.equal(once.length,2);assert.deepEqual(new Set(once.map(x=>x.body)),new Set(['A','B']));
  assert.equal(P.mergeRecords(once,[b]).length,2);assert.deepEqual(P.mergeRecords([b],[a]),once);
});
test('concurrent deletion preserves an edited copy; later intentional deletion wins',()=>{
  const deleted={id:'note-1',revision:'delete',ancestors:['base'],deleted:true},edited={id:'note-1',revision:'edit',ancestors:['base'],body:'keep me'};
  const merged=P.mergeRecords([deleted],[edited]);assert.equal(merged.length,2);assert.ok(merged.some(x=>x.body==='keep me'&&!x.deleted));
  assert.equal(P.mergeRecords([edited],[{...deleted,ancestors:['base','edit']}]).length,1);
});
test('repository and record validation rejects unsafe destinations and IDs',()=>{
  assert.equal(P.parseRepo('https://github.com/test/my-inn.git'),'test/my-inn');
  for(const value of ['https://evil.test/a/b','https://github.com/a/b/../../x','evrenucar/pasteinn_app','a/..'])assert.throws(()=>P.parseRepo(value));
  assert.throws(()=>P.validateRecords([{id:'<img>'}]));assert.throws(()=>P.validateRecords([{id:'a'},{id:'a'}]));
});
