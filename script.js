// ======================================================
// NYXIA — CORE ENGINE
// Prototype: frontend-only. Production admin/database
// should use a real backend and authentication.
// ======================================================

const GODS = [
  ["Zeus","King of Olympus","⚡"],["Hera","Queen of Olympus","🦚"],
  ["Poseidon","God of the Sea","🔱"],["Demeter","Goddess of Harvest","🌾"],
  ["Athena","Goddess of Wisdom","🦉"],["Apollo","God of Light","☀️"],
  ["Artemis","Goddess of the Hunt","🏹"],["Ares","God of War","⚔️"],
  ["Aphrodite","Goddess of Love","🕊️"],["Hephaestus","God of Fire","🔨"],
  ["Hermes","Messenger of the Gods","🪽"],["Dionysus","God of Wine","🍇"],
  ["Hades","Lord of the Underworld","💀"],["Persephone","Queen of Spring","🌺"],
  ["Thanatos","God of Death","🖤"],["Hypnos","God of Sleep","💤"],
  ["Erebus","Primordial Darkness","🌑"],["Hemera","Primordial Day","☀️"],
  ["Gaia","Primordial Earth","🌍"],["Uranus","Primordial Sky","🌌"],
  ["Cronus","Titan King","⏳"],["Rhea","Mother of Gods","👑"],
  ["Hestia","Goddess of Hearth","🔥"],["Iris","Goddess of Rainbows","🌈"],
  ["Nemesis","Goddess of Retribution","⚖️"],["Nike","Goddess of Victory","🏆"],
  ["Selene","Goddess of the Moon","🌙"],["Eos","Goddess of Dawn","🌅"],
  ["Morpheus","God of Dreams","🪽"]
];

const FORMS = [
  ["CHIBI","Cute • playful • tiny divine form","✦"],
  ["TEEN","Young • agile • expressive","☾"],
  ["ADULT","Elegant • powerful • commanding","♛"]
];

const CARDS = [
  ["Athena","🦉","Reveal a small hint once.","WISDOM"],
  ["Ares","⚔️","+15 bonus on a correct answer.","WAR"],
  ["Hades","💀","Protects one heart once.","UNDERWORLD"],
  ["Apollo","☀️","Adds a small time bonus.","LIGHT"],
  ["Artemis","🏹","Improves one difficult trial.","HUNT"],
  ["Hermes","🪽","Reduces the pressure of time.","SPEED"],
  ["Aphrodite","🕊️","Softens one wrong-answer penalty.","GRACE"],
  ["Poseidon","🔱","Refreshes the confidence message.","SEA"],
  ["Demeter","🌾","Restores a small score bonus.","HARVEST"],
  ["Hephaestus","🔨","Forgives one failed card check.","FORGE"]
];

const state = {
  screen: "home", player: null, form: null, cards: [],
  questions: [], index: 0, correct: 0, wrong: 0, score: 0,
  hearts: 10, time: 0, timerId: null, answered: false,
  exitWarnings: Number(localStorage.getItem("nyxiaExitWarnings") || 0),
  attempt: Number(localStorage.getItem("nyxiaAttempt") || 0)
};

const $ = id => document.getElementById(id);
const screens = [...document.querySelectorAll(".screen")];

function go(id){
  screens.forEach(s => s.classList.toggle("active", s.id === id));
  state.screen = id;
  window.scrollTo(0,0);
}
document.querySelectorAll("[data-go]").forEach(btn => btn.addEventListener("click",()=>go(btn.dataset.go)));

function renderCharacters(){
  $("characterGrid").innerHTML = GODS.map((g,i)=>`
    <article class="character-card ${state.player===i?"selected":""}" data-character="${i}">
      <div class="character-art">${g[2]}</div>
      <div class="character-name">${g[0]}</div>
      <div class="character-role">${g[1]}</div>
    </article>`).join("") + `
    <article class="character-card locked" title="Admin only">
      <span class="lock-badge">🔒 ADMIN</span>
      <div class="character-art">☾</div>
      <div class="character-name">NYX</div>
      <div class="character-role">The Primordial Night</div>
    </article>`;
  document.querySelectorAll("[data-character]").forEach(card=>{
    card.onclick=()=>{
      state.player=Number(card.dataset.character);
      renderCharacters();
      $("characterCount").textContent=`1 / 29`;
      $("toForms").disabled=false;
    };
  });
}
renderCharacters();

$("toForms").onclick=()=>{
  const god=GODS[state.player];
  $("formTitle").textContent=`Choose Form — ${god[0]}`;
  $("formGrid").innerHTML=FORMS.map((f,i)=>`
    <article class="form-card ${state.form===i?"selected":""}" data-form="${i}">
      <div class="form-art">${f[2]}</div>
      <h3>${f[0]}</h3><p>${f[1]}</p>
    </article>`).join("");
  document.querySelectorAll("[data-form]").forEach(card=>card.onclick=()=>{
    state.form=Number(card.dataset.form);
    document.querySelectorAll("[data-form]").forEach(x=>x.classList.remove("selected"));
    card.classList.add("selected");
    $("toCards").disabled=false;
  });
  go("forms");
};

$("toCards").onclick=()=>{
  renderCards(); go("cards");
};

function renderCards(){
  $("cardGrid").innerHTML=CARDS.map((c,i)=>`
    <article class="game-card ${state.cards.includes(i)?"selected":""}" data-card="${i}">
      <div class="card-symbol">${c[1]}</div>
      <div class="card-name">${c[0]}</div>
      <div class="card-effect">${c[2]}</div>
      <div class="card-effect">${c[3]}</div>
    </article>`).join("");
  $("cardCount").textContent=`${state.cards.length} / 3`;
  document.querySelectorAll("[data-card]").forEach(card=>card.onclick=()=>{
    const i=Number(card.dataset.card);
    if(state.cards.includes(i)) state.cards=state.cards.filter(x=>x!==i);
    else if(state.cards.length<3) state.cards.push(i);
    renderCards();
  });
  $("beginTrial").disabled=state.cards.length!==3;
}

function shuffled(arr){
  return [...arr].sort(()=>Math.random()-0.5);
}
function buildTrial(){
  const pool=shuffled(QUESTION_BANK);
  state.questions=pool.slice(0,Math.min(10,pool.length)).map(q=>({
    ...q, answers:shuffled(q.answers.map((text,i)=>({text,correct:i===q.correct})))
  }));
  state.index=0; state.correct=0; state.wrong=0; state.score=0; state.hearts=10;
  state.time=0; state.answered=false; state.attempt++;
  localStorage.setItem("nyxiaAttempt",state.attempt);
}
function startTrial(){
  buildTrial();
  $("confidence").style.display="flex";
  $("nyxLine").textContent="“Do not fear the question. Fear the answer you believe is correct.”";
  $("nyxMood").textContent="Watching...";
  $("nyxPortrait").className="nyx-portrait";
  startTimer(); renderQuestion(); go("trial");
}
$("beginTrial").onclick=startTrial;

function startTimer(){
  clearInterval(state.timerId);
  state.timerId=setInterval(()=>{
    state.time++;
    $("timer").textContent=formatTime(state.time);
  },1000);
}
function formatTime(sec){
  return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
}
function renderHearts(){
  $("hearts").innerHTML=Array.from({length:10},(_,i)=>
    `<span class="heart ${i>=state.hearts?"lost":""}">♥</span>`).join("");
}
function renderQuestion(){
  renderHearts();
  const q=state.questions[state.index];
  $("categoryLabel").textContent=q.category;
  $("difficultyLabel").textContent=q.difficulty;
  $("questionNumber").textContent=`TRIAL ${state.index+1} / ${state.questions.length}`;
  $("questionText").textContent=q.question;
  $("progressBar").style.width=`${state.index/state.questions.length*100}%`;
  $("answers").innerHTML=q.answers.map((a,i)=>`
    <button class="answer" data-answer="${i}">${String.fromCharCode(65+i)}. ${a.text}</button>`).join("");
  document.querySelectorAll("[data-answer]").forEach(btn=>btn.onclick=()=>answer(Number(btn.dataset.answer)));
}
function setNyx(type){
  const portrait=$("nyxPortrait");
  portrait.classList.remove("correct","wrong");
  void portrait.offsetWidth;
  portrait.classList.add(type);
  if(type==="correct"){
    $("nyxMood").textContent="Amused";
    $("nyxLine").textContent="“Not bad.”";
  }else{
    $("nyxMood").textContent=state.hearts<=2?"Furious":"Disappointed";
    const lines=state.hearts<=2
      ?["“One heart remains. Do not waste it.”","“You are running out of darkness.”"]
      :["“Really?”","“You chose that?”","“How disappointing.”"];
    $("nyxLine").textContent=lines[Math.floor(Math.random()*lines.length)];
  }
}
function answer(choice){
  if(state.answered)return;
  state.answered=true;
  const q=state.questions[state.index];
  const buttons=[...document.querySelectorAll("[data-answer]")];
  buttons.forEach(b=>b.disabled=true);
  const correctIndex=q.answers.findIndex(a=>a.correct);
  buttons[correctIndex].classList.add("correct");
  if(choice===correctIndex){
    state.correct++; state.score+=100; setNyx("correct");
  }else{
    state.wrong++; state.score-=10; state.hearts=Math.max(0,state.hearts-1);
    buttons[choice].classList.add("wrong"); setNyx("wrong"); renderHearts();
  }
  setTimeout(()=>{
    state.answered=false;
    if(state.hearts<=0){finishTrial(true);return;}
    state.index++;
    if(state.index>=state.questions.length) finishTrial(false);
    else renderQuestion();
  },850);
}
function rank(){
  const accuracy=state.correct/state.questions.length;
  if(state.hearts>=9 && accuracy>=.9)return "S+";
  if(accuracy>=.9)return "S";
  if(accuracy>=.75)return "A";
  if(accuracy>=.6)return "B";
  if(accuracy>=.45)return "C";
  if(accuracy>=.25)return "D";
  return "F";
}
function finishTrial(dead){
  clearInterval(state.timerId);
  const total=state.correct+state.wrong;
  const accuracy=total?Math.round(state.correct/total*100):0;
  $("resultTitle").textContent=dead?"THE NIGHT HAS REJECTED YOU":"TRIAL COMPLETE";
  $("resultScore").textContent=Math.max(0,state.score);
  $("correctStat").textContent=state.correct;
  $("wrongStat").textContent=state.wrong;
  $("accuracyStat").textContent=`${accuracy}%`;
  $("timeStat").textContent=formatTime(state.time);
  $("heartStat").textContent=`${state.hearts} / 10`;
  $("rankStat").textContent=rank();
  $("resultMessage").textContent=dead
    ?"Your run ended. The next trial will not repeat these questions."
    :"Not bad. But the next trial will be different.";
  go("result");
}
$("retryBtn").onclick=()=>{startTrial();};

function showExitWarning(){
  state.exitWarnings++;
  localStorage.setItem("nyxiaExitWarnings",state.exitWarnings);
  const n=state.exitWarnings;
  let msg=n<=3?"The trial has not ended yet. Are you certain you want to leave?"
    :n===4?"You intend to flee again?"
    :n===5?"Enough. You have been warned."
    :"YOU HAVE BEEN WARNED. The Night is no longer patient.";
  $("exitMessage").textContent=msg;
  $("exitModal").classList.remove("hidden");
}
$("stayBtn").onclick=()=>$("exitModal").classList.add("hidden");
$("leaveBtn").onclick=()=>{ $("exitModal").classList.add("hidden"); go("home"); };

window.addEventListener("beforeunload",e=>{
  if(state.screen==="trial"){
    e.preventDefault(); e.returnValue="";
    showExitWarning();
  }
});

// Back button / browser navigation protection while trial is active.
history.replaceState({nyxia:true},"",location.href);
window.addEventListener("popstate",()=>{
  if(state.screen==="trial"){
    history.pushState({nyxia:true},"",location.href);
    showExitWarning();
  }
});

$("timer").textContent="00:00";
