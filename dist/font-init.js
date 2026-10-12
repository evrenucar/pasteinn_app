// Set the saved font before the first paint, then reveal the page once it is ready.
(() => {
 const fonts={hand:"'Inn Hand', sans-serif",sans:'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',rounded:'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", system-ui, sans-serif',serif:'ui-serif, Georgia, Cambria, serif',mono:'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'};
 let choice='hand';try{const value=JSON.parse(localStorage.getItem('pasteinn-appearance-v1')||'{}').general?.font;if(Object.hasOwn(fonts,value))choice=value}catch{}
 document.documentElement.style.setProperty('--inn-font',fonts[choice]);
 if(choice!=='hand'||!document.fonts)return;
 document.documentElement.classList.add('inn-font-loading');
 document.addEventListener('DOMContentLoaded',()=>{
   document.fonts.load('22px "Inn Hand"').then(()=>document.documentElement.classList.remove('inn-font-loading'),()=>document.documentElement.classList.remove('inn-font-loading'));
 },{once:true});
})();
