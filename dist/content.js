// Search actual saved content, independently of card display preferences.
(function(root){
 const normalized=x=>String(x||'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/\s+/g,' ').trim();
 function matches(r,q){const text=normalized([r.title,r.body,r.url,r.transcript,r.ocrText,...(r.tags||[]),r.metadata?.title,r.metadata?.description,...[...(r.images||[]),...(r.media||[])].flatMap(f=>[f.name,f.transcript])].join(' '));return normalized(q).split(' ').every(word=>text.includes(word))}
 function generatedTitle(r){return ['audio','video','image'].includes(r.type)&&((r.media||[]).some(f=>f.name===r.title)||(r.images||[]).some(f=>f.name===r.title)||/^Voice note \d{4}-/.test(r.title))}
 function note(r,settings){let body=r.url?r.body.replace(/https?:\/\/[^\s<>]+/,'').trim():r.body;if(generatedTitle(r)&&body.startsWith(r.title+'\n'))body=body.slice(r.title.length).trim();if(normalized(body)===normalized(r.transcript)||generatedTitle(r)&&body===r.title||body===r.title&&settings.title)return '';return body}
 const api={normalized,matches,generatedTitle,note};if(typeof module!=='undefined')module.exports=api;else root.InnContent=api;
})(typeof window!=='undefined'?window:globalThis);
