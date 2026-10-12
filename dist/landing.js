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
const clickGreetings=[
'easy, the sign is ticklish.','you found the secret doorbell.','the innkeeper is counting taps.','yes, we are still open.','a very enthusiastic guest.','the kettle cannot boil faster.','you rang? and rang?','one tap, two tap, tiny tap dance.','this sign has excellent patience.','no loot drops here, sorry.','achievement: persistent visitor.','the pixels would like a tea break.','you are giving this sign a workout.','a tiny round of applause for that thumb.','the doorbell has filed a complaint.','please do not poke the daydreams.','you have unlocked: more words.','the innkeeper is hiding behind the kettle.','that is one way to knock.','the sign knows you are here.','tap tap. who is there? still you.','your clicking finger deserves a room.','the inn has received your enthusiasm.','careful, you might wake the commas.','this is now a percussion instrument.','the pixels are giggling.','okay, one extra biscuit for you.','welcome to the tiny tap club.','no secret boss. just tea.','you are speedrunning the welcome mat.'
];
let tapTimes=[],reactionUntil=0,reactionTimer,lastReaction=-1,reactionChanges=0;
function randomReaction(){let n=Math.floor(Math.random()*clickGreetings.length);if(n===lastReaction)n=(n+1)%clickGreetings.length;lastReaction=n;message.textContent=clickGreetings[n]}
function finishReaction(){reactionUntil=0;reactionChanges=0;tapTimes=[];showGreeting()}
function clickGreeting(){
 const now=Date.now();
 if(now<reactionUntil){if(reactionChanges<4){randomReaction();reactionChanges++}return}
 if(reactionUntil){clearTimeout(reactionTimer);reactionUntil=0;reactionChanges=0;tapTimes=[]}
 tapTimes=tapTimes.filter(t=>now-t<4000);tapTimes.push(now);
 if(tapTimes.length>=5){randomReaction();reactionChanges=1;reactionUntil=now+30000;reactionTimer=setTimeout(finishReaction,30000)}else showGreeting();
}
message.onclick=clickGreeting;showGreeting();
setInterval(()=>{if(Date.now()>=reactionUntil&&!document.hidden)showGreeting()},12000);
document.getElementById('landing-customize').onclick=()=>InnSurface.open();
