// Standard installable PWA: served as static files over HTTPS; no app server required.
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
let installPrompt=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});
addEventListener('appinstalled',()=>{installPrompt=null;const result=document.getElementById('install-status');if(result)result.textContent='Paste Inn is installed.'});
const installButton=document.getElementById('install-app');
if(installButton){
  const guide=document.createElement('section');guide.id='install-guide';guide.hidden=true;
  guide.innerHTML=`<label>Your device<select id="install-device" data-ui><option value="ios">iPhone / iPad · Safari</option><option value="android">Android · Chrome</option><option value="desktop">Computer · Chrome</option><option value="mac">Mac · Safari</option></select></label><div id="install-illustration"></div><ol id="install-steps"></ol><p id="install-help" class="small-note"></p><button type="button" id="install-now" hidden>Install now</button><button type="button" id="close-install-guide">Close guide</button>`;
  installButton.after(guide);installButton.setAttribute('aria-expanded','false');installButton.setAttribute('aria-controls','install-guide');
  const device=guide.querySelector('#install-device'),result=document.getElementById('install-status');
  const instructions={
    ios:['Open Paste Inn in Safari.','Tap the Share icon (square with an upward arrow). It may be inside the ••• menu.','Choose Add to Home Screen. Scroll down if needed.','Keep Open as Web App enabled, if shown, then tap Add.'],
    android:['Open Paste Inn in Chrome.','Tap the ⋮ menu at the top right.','Choose Add to home screen → Install (or Install app).','Confirm Install, then open Paste Inn from your home screen.'],
    desktop:['Open Paste Inn in Chrome.','Click ⋮ at the top right.','Choose Cast, save and share → Install page as app. You may also see an install icon in the address bar.','Confirm Install. Open Paste Inn from your apps or desktop.'],
    mac:['Open Paste Inn in Safari.','Open File in the menu bar at the top of your screen.','Choose Add to Dock.','Confirm Add, then open Paste Inn from the Dock.']};
  const draw=()=>{const mobile=['ios','android'].includes(device.value),share=device.value==='ios',mac=device.value==='mac';
    guide.querySelector('#install-steps').innerHTML=instructions[device.value].map(text=>`<li>${text}</li>`).join('');
    guide.querySelector('#install-illustration').innerHTML=`<svg viewBox="0 0 320 150" role="img" aria-label="${share?'Safari Share button: a square with an upward arrow':mac?'Safari File menu at the top left':'Chrome three-dot menu at the top right'}"><rect x="12" y="12" width="296" height="126" rx="10" fill="#142019" stroke="#86917b"/><path d="M12 42h296" stroke="#86917b"/><text x="27" y="33" fill="#eeeed8" font-size="15">${mac?'Safari   File': 'pasteinn.com'}</text><text x="48" y="86" fill="#eeeed8" font-size="23">paste inn</text>${share?'<rect x="256" y="95" width="23" height="23" rx="3" fill="none" stroke="#eba46e" stroke-width="3"/><path d="M268 109V84m-7 7 7-7 7 7" fill="none" stroke="#eba46e" stroke-width="3"/><circle cx="268" cy="102" r="28" fill="none" stroke="#eba46e" stroke-dasharray="4 4"/>':mac?'<rect x="78" y="17" width="39" height="22" fill="none" stroke="#eba46e" stroke-width="2"/>':'<text x="280" y="34" fill="#eba46e" font-size="23">⋮</text><circle cx="287" cy="27" r="18" fill="none" stroke="#eba46e" stroke-dasharray="4 4"/>'}</svg><span class="small-note">Button guide · placement may vary.</span>`;
    guide.querySelector('#install-help').textContent=share?'Missing Add to Home Screen? Scroll to Edit Actions and add it.':mac?'Requires a Safari version with Add to Dock.':'If Install is missing, open the secure site in a normal browser tab and try again.';
    guide.querySelector('#install-now').hidden=!installPrompt||matchMedia('(display-mode: standalone)').matches;
  };
  device.value=/iPhone|iPad/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1?'ios':/Android/.test(navigator.userAgent)?'android':'desktop';device.onchange=draw;
  const toggle=()=>{guide.hidden=!guide.hidden;installButton.setAttribute('aria-expanded',String(!guide.hidden));if(!guide.hidden){draw();result.textContent=matchMedia('(display-mode: standalone)').matches?'You’re already in the app.':''}};
  installButton.onclick=toggle;guide.querySelector('#close-install-guide').onclick=toggle;
  guide.querySelector('#install-now').onclick=async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;await prompt.prompt();const choice=await prompt.userChoice;result.textContent=choice.outcome==='accepted'?'Installing…':'You can install whenever you like.';draw()};
}
const shared=new URLSearchParams(location.search);if(shared.has('share')){const capture=document.getElementById('capture');const text=[shared.get('title'),shared.get('text'),shared.get('url')].filter(Boolean).join('\n');if(text&&capture){capture.value=text;schedulePreview();capture.focus()}history.replaceState(null,'',location.pathname+location.hash)}
