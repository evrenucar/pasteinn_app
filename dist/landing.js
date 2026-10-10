const greetings=[
'no rush, really.','your thoughts can stay.','room for one more.','a soft place to land.','leave it here a while.',
'found a little something?','the kettle is on.','settle inn.','make yourself at home.','a pocket for your day.',
'keep the good bits.','a thought worth keeping.','little finds live here.','come back whenever.','nothing to tidy yet.',
'one less tab open.','bring your loose ends.','leave a breadcrumb.','a tiny treasure chest.','hello, wandering thought.',
'put your feet up.','a quiet corner for ideas.','saved for a rainy day.','let that thought rest.','good things take space.',
'stay as long as you like.','this can wait here.','a home for almost anything.','keep it for later you.','a little less scattered.',
'empty pockets, full of finds.','something caught your eye?','there is room in here.','soft light, small thoughts.','tuck it away.',
'no filing cabinet required.','a place for the maybes.','one small thing at a time.','your next rabbit hole.','a thought checking inn.',
'you can leave the tabs here.','it might come in handy.','collected along the way.','a small stop on your way.','for when you remember.',
'welcome back, daydreamer.','keep a little wonder.','a corner of your own.','let the ideas wander.','no perfect folders here.',
'good find. keep it.','there is no hurry here.','a little room to breathe.','the inn is open.','save that spark.',
'you brought something nice.','future you says thanks.','a pause between tabs.','just a little space.','home for your loose ends.'
];
const message=document.getElementById('cozy-message'),bagKey='pasteinn-greetings-v2';let bag=[],lastGreeting=null;
try{const saved=JSON.parse(localStorage.getItem(bagKey)||'null');if(saved&&Array.isArray(saved.bag)){bag=[...new Set(saved.bag)].filter(x=>Number.isInteger(x)&&x>=0&&x<greetings.length);lastGreeting=saved.last}}catch{}
function showGreeting(){if(!bag.length){bag=greetings.map((_,i)=>i);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}if(bag.at(-1)===lastGreeting)[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]]}lastGreeting=bag.pop();message.textContent=greetings[lastGreeting];try{localStorage.setItem(bagKey,JSON.stringify({bag,last:lastGreeting}))}catch{}}
message.onclick=showGreeting;showGreeting();document.getElementById('landing-customize').onclick=()=>InnSurface.open();
