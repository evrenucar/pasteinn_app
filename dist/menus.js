// Native dialogs keep keyboard focus; backdrop and Escape share the same draft guard.
(() => {
  const states=new WeakMap();let pending=null;
  const guard=document.createElement('dialog');guard.id='unsaved-dialog';guard.innerHTML='<button type="button" class="dialog-close" aria-label="Keep editing">×</button><h2>A little unfinished.</h2><p>Keep your changes?</p><div class="unsaved-actions"><button type="button" id="keep-editing">Keep editing</button><button type="button" id="discard-edit">Discard</button><button type="button" id="save-edit" class="save-button">Save</button></div>';document.body.append(guard);
  const values=d=>JSON.stringify([...d.querySelectorAll('input,textarea,select')].filter(x=>!x.matches('[type=search],[data-ui]')).map(x=>[x.id,x.type==='checkbox'?x.checked:x.value]));
  function state(d){if(!states.has(d))watch(d,()=>values(d));return states.get(d)}
  function watch(d,read,save,discard){states.set(d,{read,save,discard,base:read()})}
  function baseline(d){const s=states.get(d);if(s)s.base=s.read()}
  function dirty(d){const s=state(d);return s.read()!==s.base}
  function ask(d,action){const s=state(d);if(!dirty(d)){action();return}pending={d,action,s};document.getElementById('save-edit').hidden=!s.save;guard.showModal()}
  function dismiss(d){ask(d,()=>{state(d).discard?.();d.close()})}
  document.getElementById('keep-editing').onclick=()=>{guard.close();pending=null};
  document.getElementById('discard-edit').onclick=()=>{const p=pending;guard.close();pending=null;p.s.discard?.();p.action()};
  document.getElementById('save-edit').onclick=()=>{const p=pending;guard.close();pending=null;p.s.save?.()};
  const closeGlyph='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  guard.querySelector('.dialog-close').innerHTML=closeGlyph;guard.querySelector('.dialog-close').onclick=()=>document.getElementById('keep-editing').click();
  function wire(d){if(d===guard||d.dataset.dismissWired)return;if(!d.querySelector('.dialog-close')){const b=document.createElement('button');b.type='button';b.className='dialog-close';b.setAttribute('aria-label','Close window');b.dataset.dismiss='';d.prepend(b)}d.querySelectorAll('.dialog-close').forEach(b=>{b.innerHTML=closeGlyph;b.title=b.getAttribute('aria-label')||'Close';if(!b.closest('form[method="dialog"]'))b.dataset.dismiss=''});d.dataset.dismissWired='true';let outside=false;const out=e=>{const r=d.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom};d.addEventListener('pointerdown',e=>outside=e.target===d&&out(e));d.addEventListener('click',e=>{if(outside&&e.target===d&&out(e))dismiss(d);outside=false});d.addEventListener('cancel',e=>{e.preventDefault();dismiss(d)});d.addEventListener('submit',e=>{if(e.target.getAttribute('method')==='dialog'){e.preventDefault();dismiss(d)}});d.querySelectorAll('[data-dismiss]').forEach(b=>b.onclick=()=>dismiss(d));d.addEventListener('close',()=>states.delete(d));}
  document.querySelectorAll('dialog').forEach(wire);new MutationObserver(entries=>{for(const entry of entries){if(entry.type==='attributes'&&entry.target.tagName==='DIALOG'&&entry.target.open){wire(entry.target);if(!states.has(entry.target))watch(entry.target,()=>values(entry.target))}for(const node of entry.addedNodes||[])if(node.nodeType===1){if(node.tagName==='DIALOG')wire(node);node.querySelectorAll('dialog').forEach(wire)}}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
  window.InnMenus={watch,baseline,dismiss,change(d,action){ask(d,action);return true}};
})();
