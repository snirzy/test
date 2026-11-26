
"use strict";

const $ = id => document.getElementById(id);
const save = (key,value) => {
  try { localStorage.setItem("neon_"+key,JSON.stringify(value)); }
  catch {}
};
const read = (key,fallback) => {
  try {
    const v=localStorage.getItem("neon_"+key);
    return v===null?fallback:JSON.parse(v);
  } catch { return fallback; }
};

/* CLOCK */
function clock() {
  $("clock").textContent="השעה עכשיו: "+new Date().toLocaleTimeString("he-IL");
}
clock();
setInterval(clock,1000);

let seconds=0;
setInterval(()=>{
  $("countdown").textContent=++seconds;
  $("profileTime").textContent=seconds;
},1000);

/* PROFILE */
let name=read("name","חוקר החלל");
let best=read("best",0);
$("playerName").textContent=name;
$("bestScore").textContent=best;
$("profileBest").textContent=best;

$("changeName").onclick=()=>{
  const n=prompt("הכנס שם חדש",name);
  if(n && n.trim()){
    name=n.trim().slice(0,24);
    $("playerName").textContent=name;
    save("name",name);
  }
};

/* THEMES */
const themes={
  purple:["#a855f7","#2563eb"],
  blue:["#06b6d4","#2563eb"],
  pink:["#ec4899","#9333ea"],
  green:["#10b981","#047857"]
};
function setTheme(key){
  const c=themes[key];
  if(!c)return;
  document.documentElement.style.setProperty("--a",c[0]);
  document.documentElement.style.setProperty("--b",c[1]);
  save("theme",key);
}
document.querySelectorAll("[data-theme]").forEach(b=>{
  b.onclick=()=>setTheme(b.dataset.theme);
});
setTheme(read("theme","purple"));

/* FACTS */
const facts=[
  "🐙 לתמנון יש שלושה לבבות!",
  "🪐 יום אחד בנוגה ארוך יותר משנה אחת בנוגה.",
  "🌙 הירח מתרחק מכדור הארץ בכ-3.8 סנטימטרים בשנה.",
  "🦈 כרישים קיימים עוד לפני העצים!",
  "🌞 אור השמש מגיע לכדור הארץ בכ-8 דקות ו-20 שניות.",
  "🛰️ תחנת החלל מקיפה את כדור הארץ בערך כל 90 דקות."
];
$("newFact").onclick=()=>{
  $("fact").textContent=facts[Math.floor(Math.random()*facts.length)];
};

/* TOP BUTTON */
$("top").onclick=()=>window.scrollTo({top:0,behavior:"smooth"});

/* STARS */
const starsCanvas=$("stars");
const sctx=starsCanvas.getContext("2d");
let stars=[],sw=0,sh=0;

function resizeStars(){
  const d=Math.min(devicePixelRatio||1,2);
  sw=innerWidth;sh=innerHeight;
  starsCanvas.width=sw*d;
  starsCanvas.height=sh*d;
  sctx.setTransform(d,0,0,d,0,0);
  stars=Array.from({length:90},()=>({
    x:Math.random()*sw,y:Math.random()*sh,
    r:Math.random()*1.5+.3,v:Math.random()*.3+.1
  }));
}
function animateStars(){
  sctx.clearRect(0,0,sw,sh);
  for(const s of stars){
    sctx.fillStyle="#cbbaff";
    sctx.beginPath();
    sctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    sctx.fill();
    s.y-=s.v;
    if(s.y<0){s.y=sh;s.x=Math.random()*sw;}
  }
  requestAnimationFrame(animateStars);
}
resizeStars();
addEventListener("resize",resizeStars);
animateStars();

$("cursorGlow").style.display="none";
if(matchMedia("(hover:hover) and (pointer:fine)").matches){
  const glow=$("cursorGlow");
  glow.style.display="block";
  addEventListener("pointermove",e=>{
    glow.style.left=e.clientX+"px";
    glow.style.top=e.clientY+"px";
  });
}

/* ROCKET GAME */
const gc=$("game"),g=gc.getContext("2d");
let score=0,time=30,running=false,timer=null;
let rocket={x:300,y:150};

function drawGame(){
  g.fillStyle="#090925";
  g.fillRect(0,0,600,300);
  for(let i=0;i<30;i++){
    g.fillStyle="#ffffff66";
    g.fillRect(i*83%600,i*47%300,2,2);
  }
  g.textAlign="center";
  if(running){
    g.font="48px Arial";
    g.fillText("🚀",rocket.x,rocket.y+15);
  }else{
    g.fillStyle="#d8b4fe";
    g.font="24px Arial";
    g.fillText("NEONVERSE ARCADE",300,150);
  }
}
function moveRocket(){
  rocket.x=40+Math.random()*520;
  rocket.y=45+Math.random()*210;
  drawGame();
}
function updateScore(){
  $("score").textContent=score;
  $("gameTime").textContent=time;
  $("bestScore").textContent=best;
  $("profileBest").textContent=best;
}
function endGame(){
  running=false;
  clearInterval(timer);
  $("gameMessage").textContent=score>best?"🏆 שיא חדש!":"המשחק הסתיים!";
  if(score>best){best=score;save("best",best);}
  updateScore();
  drawGame();
}
$("startGame").onclick=()=>{
  clearInterval(timer);
  score=0;time=30;running=true;
  $("gameMessage").textContent="תפוס את החללית!";
  updateScore();moveRocket();
  timer=setInterval(()=>{
    time--;updateScore();
    if(time<=0)endGame();
  },1000);
};
gc.addEventListener("pointerdown",e=>{
  if(!running)return;
  const r=gc.getBoundingClientRect();
  const x=(e.clientX-r.left)*600/r.width;
  const y=(e.clientY-r.top)*300/r.height;
  if(Math.hypot(x-rocket.x,y-rocket.y)<50){
    score++;
    if(score>best){best=score;save("best",best);}
    updateScore();moveRocket();
  }
});
drawGame();

/* BLOCK WORLD */
(()=>{
const canvas=$("blockCanvas"),ctx=canvas.getContext("2d");
const S=40,W=80,H=12;
const types={
 grass:["#55b84a","🌱"],
 dirt:["#986039","🟫"],
 stone:["#888b99","🪨"],
 wood:["#a66b36","🪵"]
};
let world=[],camera=0,selected="grass",mode="mine";
let inv={grass:15,dirt:15,stone:10,wood:10};
const player={x:100,y:100,vx:0,vy:0,w:25,h:35,ground:false};
const keys={left:false,right:false};

function inventoryUI(){
  const total=Object.values(inv).reduce((a,b)=>a+b,0);
  $("blockCount").textContent=total;
  $("selectedBlock").textContent=types[selected][1];
}
function generate(){
  world=Array.from({length:H},()=>Array(W).fill("air"));
  for(let x=0;x<W;x++){
    const ground=6+Math.floor(Math.sin(x*.35)+Math.random());
    for(let y=ground;y<H;y++){
      world[y][x]=y===ground?"grass":y<ground+3?"dirt":"stone";
    }
    if(x%10===3){
      world[ground-1][x]="wood";
      world[ground-2][x]="wood";
    }
  }
  player.x=100;player.y=100;player.vy=0;camera=0;
  inv={grass:15,dirt:15,stone:10,wood:10};
  inventoryUI();
  $("blockMessage").textContent="🌍 עולם חדש נוצר!";
}
function solid(x,y){
  if(x<0||x>=W||y>=H)return true;
  return y>=0&&world[y][x]!=="air";
}
function collision(x,y){
  const l=Math.floor(x/S),r=Math.floor((x+player.w-1)/S);
  const t=Math.floor(y/S),b=Math.floor((y+player.h-1)/S);
  for(let yy=t;yy<=b;yy++)
    for(let xx=l;xx<=r;xx++)
      if(solid(xx,yy))return true;
  return false;
}
function update(dt){
  const k=Math.min(dt/16.67,2);
  player.vx=(keys.right?3.5:0)-(keys.left?3.5:0);
  player.x+=player.vx*k;
  if(collision(player.x,player.y))player.x-=player.vx*k;
  player.vy=Math.min(player.vy+.45*k,10);
  player.y+=player.vy*k;
  player.ground=false;
  if(collision(player.x,player.y)){
    if(player.vy>0)player.ground=true;
    player.y-=player.vy*k;player.vy=0;
  }
  player.x=Math.max(0,Math.min(W*S-player.w,player.x));
  if(player.y>600){player.x=100;player.y=100;player.vy=0;}
  camera=Math.max(0,Math.min(W*S-800,player.x-400));
  $("playerPos").textContent=Math.floor(player.x/S);
}
function drawBlock(type,x,y){
  ctx.fillStyle=types[type]?.[0]||"#000";
  ctx.fillRect(x,y,S,S);
  if(type==="grass"){
    ctx.fillStyle="#7cdb55";ctx.fillRect(x,y,S,8);
  }
  ctx.strokeStyle="#0003";ctx.strokeRect(x,y,S,S);
}
function draw(){
  const sky=ctx.createLinearGradient(0,0,0,480);
  sky.addColorStop(0,"#62a9e8");
  sky.addColorStop(1,"#b8e4f5");
  ctx.fillStyle=sky;ctx.fillRect(0,0,800,480);
  ctx.fillStyle="#ffe58a";
  ctx.beginPath();ctx.arc(680,75,35,0,Math.PI*2);ctx.fill();

  const start=Math.floor(camera/S);
  for(let y=0;y<H;y++)
    for(let x=start;x<Math.min(W,start+22);x++)
      if(world[y][x]!=="air")drawBlock(world[y][x],x*S-camera,y*S);

  const x=player.x-camera,y=player.y;
  ctx.fillStyle="#edbd8a";ctx.fillRect(x+5,y,18,13);
  ctx.fillStyle="#3067c7";ctx.fillRect(x+3,y+13,22,14);
  ctx.fillStyle="#333";
  ctx.fillRect(x+4,y+27,8,9);
  ctx.fillRect(x+17,y+27,8,9);
}
function loop(now){
  const dt=Math.min(now-(loop.last||now),40);
  loop.last=now;update(dt);draw();
  requestAnimationFrame(loop);
}
function jump(){
  if(player.ground){player.vy=-10;player.ground=false;}
}
function action(e,forced){
  const r=canvas.getBoundingClientRect();
  const tx=Math.floor(((e.clientX-r.left)*800/r.width+camera)/S);
  const ty=Math.floor((e.clientY-r.top)*480/r.height/S);
  if(tx<0||tx>=W||ty<0||ty>=H)return;
  const act=forced||(e.button===2?"build":"mine");

  if(act==="mine"){
    const type=world[ty][tx];
    if(type==="air")return;
    world[ty][tx]="air";inv[type]=(inv[type]||0)+1;
    $("blockMessage").textContent="⛏️ אספת בלוק!";
  }else{
    if(world[ty][tx]!=="air"||inv[selected]<=0)return;
    const overlap=tx*S<player.x+player.w&&
      (tx+1)*S>player.x&&ty*S<player.y+player.h&&
      (ty+1)*S>player.y;
    if(overlap)return;
    world[ty][tx]=selected;inv[selected]--;
    $("blockMessage").textContent="🧱 בנית בלוק!";
  }
  inventoryUI();
}
canvas.addEventListener("pointerdown",e=>{
  e.preventDefault();
  action(e,e.pointerType==="mouse"?null:mode);
});
canvas.addEventListener("contextmenu",e=>e.preventDefault());

document.querySelectorAll(".blockChoice").forEach(b=>{
  b.onclick=()=>{
    selected=b.dataset.type;
    document.querySelectorAll(".blockChoice").forEach(x=>
      x.classList.toggle("selected",x===b));
    inventoryUI();
  };
});
$("mineMode").onclick=()=>mode="mine";
$("buildMode").onclick=()=>mode="build";
$("blockReset").onclick=generate;
$("blockJump").onclick=jump;

function hold(id,key){
  const b=$(id);
  b.addEventListener("pointerdown",e=>{e.preventDefault();keys[key]=true;});
  ["pointerup","pointerleave","pointercancel"].forEach(ev=>
    b.addEventListener(ev,()=>keys[key]=false));
}
hold("blockLeft","left");
hold("blockRight","right");

addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")keys.left=true;
  if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")keys.right=true;
  if(e.key===" "||e.key==="ArrowUp")jump();
});
addEventListener("keyup",e=>{
  if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")keys.left=false;
  if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")keys.right=false;
});
addEventListener("blur",()=>{keys.left=false;keys.right=false;});

$("saveWorld").onclick=()=>{
  save("world",world);save("inventory",inv);
  save("player",{x:player.x,y:player.y});
  $("blockMessage").textContent="💾 העולם נשמר!";
};
$("loadWorld").onclick=()=>{
  const w=read("world",null);
  if(!Array.isArray(w)||w.length!==H||
     !w.every(row=>Array.isArray(row)&&row.length===W)){
    $("blockMessage").textContent="אין עולם שמור תקין.";
    return;
  }
  world=w;inv=read("inventory",inv);
  const p=read("player",null);
  if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){
    player.x=Math.max(0,Math.min(W*S-player.w,p.x));
    player.y=Math.max(0,Math.min(H*S,p.y));
  }
  inventoryUI();
  $("blockMessage").textContent="📂 העולם נטען!";
};

generate();
requestAnimationFrame(loop);
})();

/* =================================
   NEONVERSE FACTS DATABASE
================================= */

(() => {
  const facts = [
    ["🌌","SPACE","היקום מתרחב","הגלקסיות הרחוקות מתרחקות זו מזו בגלל התפשטות היקום."],
    ["🪐","PLANETS","יום ארוך במיוחד","יום אחד על נוגה ארוך יותר משנה אחת על נוגה."],
    ["🌙","MOON","הירח מתרחק","הירח מתרחק מכדור הארץ בכ-3.8 סנטימטרים בכל שנה."],
    ["⭐","STARS","כוכבים עצומים","יש כוכבים שגדולים מהשמש שלנו פי מאות."],
    ["☀️","SUN","השמש שלנו","השמש מכילה יותר מ-99% מהמסה של מערכת השמש."],
    ["🕳️","BLACK HOLES","חורים שחורים","כוח הכבידה של חור שחור חזק כל כך שאפילו אור אינו יכול לברוח ממנו מעבר לאופק האירועים."],
    ["🌍","EARTH","כדור הארץ","כדור הארץ אינו כדור מושלם אלא מעט פחוס בקטבים."],
    ["🚀","TECHNOLOGY","מהירות האור","האור נע במהירות של כ-300 אלף קילומטרים בשנייה בריק."],
    ["🛰️","SPACE","תחנת החלל","תחנת החלל הבינלאומית מקיפה את כדור הארץ בערך כל 90 דקות."],
    ["🌊","OCEAN","עומק האוקיינוס","הנקודה העמוקה ביותר הידועה באוקיינוס נמצאת בתעלת מריאנה."],
    ["🐙","ANIMALS","שלושה לבבות","לתמנון יש שלושה לבבות ושמונה זרועות."],
    ["🦈","ANIMALS","עתיקים מהעצים","כרישים קיימים כבר מאות מיליוני שנים."],
    ["🐝","NATURE","דבורים וריקוד","דבורים משתמשות בריקוד כדי להעביר מידע על מיקום מזון."],
    ["🦒","ANIMALS","צוואר ארוך","לג'ירפה יש שבע חוליות צוואר, בדיוק כמו לבני אדם."],
    ["🦋","NATURE","פרפרים וטעם","פרפרים יכולים לחוש טעם באמצעות קולטנים בכפות הרגליים."],
    ["🐬","ANIMALS","שינה מיוחדת","דולפינים יכולים לישון כאשר חצי אחד מהמוח שלהם נשאר ער."],
    ["🧠","SCIENCE","המוח האנושי","המוח האנושי מכיל בערך 86 מיליארד תאי עצב."],
    ["⚡","SCIENCE","ברק עוצמתי","ברק יכול לחמם את האוויר סביבו לטמפרטורה גבוהה יותר מפני השטח של השמש."],
    ["💎","SCIENCE","יהלומים בחלל","מדענים חוקרים אפשרות של גשם יהלומים בתוך כוכבי לכת ענקיים כמו נפטון."],
    ["❄️","NATURE","פתיתי שלג","לפתיתי שלג יש מבנים גבישיים מגוונים, ולעיתים קרובות סימטריה משושה."],
    ["🤖","TECHNOLOGY","בינה מלאכותית","מערכות AI מסוגלות לזהות דפוסים בתמונות, טקסטים וקולות."],
    ["💻","COMPUTERS","שפת מחשבים","מחשבים מייצגים מידע דיגיטלי באמצעות ביטים שערכם 0 או 1."],
    ["🌐","INTERNET","האינטרנט","האינטרנט מחבר בין מיליארדי מכשירים ברחבי העולם."],
    ["🔭","ASTRONOMY","טלסקופ החלל","טלסקופ החלל ג'יימס וב חוקר את היקום באמצעות אור אינפרא אדום."],
    ["🪐","SATURN","שבתאי","הטבעות המפורסמות של שבתאי מורכבות בעיקר מחלקיקי קרח וסלע."],
    ["🌋","EARTH","הרי געש","יש הרי געש פעילים גם מתחת לפני הים."],
    ["🧬","BIOLOGY","DNA","ה-DNA מכיל הוראות גנטיות להתפתחות ולתפקוד של יצורים חיים."],
    ["🐢","ANIMALS","צבים עתיקים","צבים קיימים כבר יותר מ-200 מיליון שנה."],
    ["🌈","SCIENCE","קשת בענן","קשת נוצרת כאשר אור השמש נשבר, מוחזר ומתפזר בטיפות מים."],
    ["🌠","SPACE","כוכבים נופלים","מה שנראה כמו כוכב נופל הוא בדרך כלל מטאור שנכנס לאטמוספרה."]
  ];

  let current = -1;

  const icon = document.getElementById("factIcon");
  const category = document.getElementById("factCategory");
  const title = document.getElementById("factTitle");
  const text = document.getElementById("factText");
  const counter = document.getElementById("factCounter");
  const button = document.getElementById("nextFact");

  if (!button) return;

  function nextFact() {
    let next = Math.floor(Math.random() * facts.length);

    if (facts.length > 1) {
      while (next === current) {
        next = Math.floor(Math.random() * facts.length);
      }
    }

    current = next;

    const fact = facts[current];

    icon.textContent = fact[0];
    category.textContent = fact[1];
    title.textContent = fact[2];
    text.textContent = fact[3];

    counter.textContent =
      `FACT ${String(current + 1).padStart(2, "0")} / ${facts.length}`;

    button.textContent = "עובדה נוספת ✨";
  }

  button.addEventListener("click", nextFact);
  nextFact();
})();

