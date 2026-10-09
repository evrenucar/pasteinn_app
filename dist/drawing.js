// A tiny monochrome pixel canvas; drawings inherit their category's color.
const drawingCanvas=$('icon-canvas'),drawingContext=drawingCanvas.getContext('2d');
let drawingHistory=[],drawingStroke=null,drawingErase=false;
const blankDrawing=()=>'0'.repeat(256);
function renderDrawing(){
  const ctx=drawingContext,bitmap=draft?.drawing||blankDrawing();ctx.clearRect(0,0,256,256);
  ctx.fillStyle=draft?.color||'#b9c990';
  for(let i=0;i<256;i++)if(bitmap[i]==='1')ctx.fillRect((i%16)*16,Math.floor(i/16)*16,16,16);
  ctx.strokeStyle='rgba(160,170,145,.16)';ctx.lineWidth=1;ctx.beginPath();
  for(let i=0;i<=16;i++){ctx.moveTo(i*16+.5,0);ctx.lineTo(i*16+.5,256);ctx.moveTo(0,i*16+.5);ctx.lineTo(256,i*16+.5)}ctx.stroke();
  $('undo-drawing').disabled=!drawingHistory.length;
  $('draw-pen').setAttribute('aria-pressed',String(!drawingErase));$('draw-eraser').setAttribute('aria-pressed',String(drawingErase));
}
function selectIconMode(mode){
  const custom=mode==='draw';
  if(custom){if(draft.icon!=='HandDrawn')draft.libraryIcon=draft.icon;draft.icon='HandDrawn';draft.drawing ||=blankDrawing()}
  else if(draft.icon==='HandDrawn')draft.icon=draft.libraryIcon||'Folder';
  $('library-icons').hidden=custom;$('draw-panel').hidden=!custom;
  $('use-library').setAttribute('aria-pressed',String(!custom));$('draw-own').setAttribute('aria-pressed',String(custom));
  draftPreview();renderIconPicker();renderDrawing();
}
function resetDrawingEditor(){drawingHistory=[];drawingStroke=null;drawingErase=false;selectIconMode(draft.icon==='HandDrawn'?'draw':'library')}
$('use-library').onclick=()=>selectIconMode('library');$('draw-own').onclick=()=>selectIconMode('draw');
$('draw-pen').onclick=()=>{drawingErase=false;renderDrawing()};$('draw-eraser').onclick=()=>{drawingErase=true;renderDrawing()};
$('undo-drawing').onclick=()=>{if(drawingHistory.length){draft.drawing=drawingHistory.pop();draftPreview();renderDrawing()}};
$('clear-drawing').onclick=()=>{if(draft.drawing?.includes('1')){drawingHistory.push(draft.drawing);draft.drawing=blankDrawing();draftPreview();renderDrawing()}};
function canvasPoint(e){const r=drawingCanvas.getBoundingClientRect();return{x:Math.max(0,Math.min(15,Math.floor((e.clientX-r.left)/r.width*16))),y:Math.max(0,Math.min(15,Math.floor((e.clientY-r.top)/r.height*16)))}}
function paintTo(point){
  const previous=drawingStroke.last||point,steps=Math.max(Math.abs(point.x-previous.x),Math.abs(point.y-previous.y)),pixels=[...draft.drawing];
  for(let step=0;step<=steps;step++){const t=steps?step/steps:0,x=Math.round(previous.x+(point.x-previous.x)*t),y=Math.round(previous.y+(point.y-previous.y)*t);pixels[y*16+x]=drawingErase?'0':'1'}
  draft.drawing=pixels.join('');drawingStroke.last=point;draftPreview();renderDrawing();
}
drawingCanvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||drawingStroke)return;e.preventDefault();drawingCanvas.setPointerCapture(e.pointerId);
  drawingHistory.push(draft.drawing);if(drawingHistory.length>40)drawingHistory.shift();drawingStroke={id:e.pointerId,last:null};paintTo(canvasPoint(e));
});
drawingCanvas.addEventListener('pointermove',e=>{if(drawingStroke?.id===e.pointerId){e.preventDefault();paintTo(canvasPoint(e))}});
function endDrawing(e){if(drawingStroke?.id!==e.pointerId)return;drawingStroke=null;if(drawingCanvas.hasPointerCapture(e.pointerId))drawingCanvas.releasePointerCapture(e.pointerId);$('drawing-status').textContent='Drawing updated'}
drawingCanvas.addEventListener('pointerup',endDrawing);drawingCanvas.addEventListener('pointercancel',endDrawing);
// The same editor has a keyboard path: arrows move a cell; Space paints/erases it.
let drawingCursor={x:7,y:7};
drawingCanvas.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))return;e.preventDefault();
  if(e.key===' '){drawingHistory.push(draft.drawing);drawingStroke={last:null};paintTo(drawingCursor);drawingStroke=null}
  else{drawingCursor.x=Math.max(0,Math.min(15,drawingCursor.x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)));drawingCursor.y=Math.max(0,Math.min(15,drawingCursor.y+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)))}
  renderDrawing();drawingContext.strokeStyle='#ffffff';drawingContext.lineWidth=2;drawingContext.strokeRect(drawingCursor.x*16+2,drawingCursor.y*16+2,12,12);$('drawing-status').textContent=`Column ${drawingCursor.x+1}, row ${drawingCursor.y+1}`;
});
