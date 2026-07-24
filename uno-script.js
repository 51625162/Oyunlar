/* ============================ KART VERİLERİ ============================ */

const COLORS = ['red','yellow','green','blue'];
const COLOR_TR = {red:'Kırmızı', yellow:'Sarı', green:'Yeşil', blue:'Mavi', wild:'Joker'};
const SAVE_KEY = 'uno_save_v1';

function buildDeck(){
  const deck = [];
  COLORS.forEach(c=>{
    deck.push({color:c, value:'0'});
    for(let n=1;n<=9;n++){ deck.push({color:c,value:String(n)}); deck.push({color:c,value:String(n)}); }
    ['SKIP','REVERSE','DRAW2'].forEach(v=>{ deck.push({color:c,value:v}); deck.push({color:c,value:v}); });
  });
  for(let i=0;i<4;i++) deck.push({color:'wild', value:'WILD'});
  for(let i=0;i<4;i++) deck.push({color:'wild', value:'WILD4'});
  return deck;
}
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function cardPoints(card){
  if(card.value==='WILD' || card.value==='WILD4') return 50;
  if(card.value==='SKIP' || card.value==='REVERSE' || card.value==='DRAW2') return 20;
  return parseInt(card.value,10);
}
function cardSymbol(card){
  switch(card.value){
    case 'SKIP': return '🚫';
    case 'REVERSE': return '🔁';
    case 'DRAW2': return '+2';
    case 'WILD': return '★';
    case 'WILD4': return '+4';
    default: return card.value;
  }
}
function cardLogLabel(card){
  if(card.value==='WILD') return 'Joker';
  if(card.value==='WILD4') return 'Joker +4';
  if(card.value==='SKIP') return COLOR_TR[card.color]+' Yasak';
  if(card.value==='REVERSE') return COLOR_TR[card.color]+' Ters Çevir';
  if(card.value==='DRAW2') return COLOR_TR[card.color]+' +2';
  return COLOR_TR[card.color]+' '+card.value;
}
function cardHTML(card){
  const symbol = cardSymbol(card);
  return `<span class="cornerVal">${symbol}</span>${symbol}<span class="cornerVal2">${symbol}</span>`;
}

/* ============================ SES MOTORU (Web Audio API) ============================ */

let _actx = null;
function getAudioCtx(){
  if(!_actx){
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return null;
    _actx = new Ctx();
  }
  if(_actx.state==='suspended') _actx.resume();
  return _actx;
}
function beep(freq, duration, type, delay, vol){
  const ctx = getAudioCtx();
  if(!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  const start = ctx.currentTime + (delay||0);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(vol||0.2, start+0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start+duration);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start+duration+0.03);
}
function playCardSound(){ beep(520,0.09,'triangle',0,0.18); beep(660,0.09,'triangle',0.05,0.15); }
function playDrawSound(){ beep(260,0.1,'square',0,0.14); beep(220,0.1,'square',0.06,0.12); }
function playSkipSound(){ [300,240].forEach((f,i)=>beep(f,0.16,'sawtooth',i*0.12,0.18)); }
function playReverseSound(){ [440,330,440].forEach((f,i)=>beep(f,0.12,'sine',i*0.08,0.16)); }
function playDrawTwoSound(){ [260,220,180].forEach((f,i)=>beep(f,0.15,'square',i*0.1,0.16)); }
function playDrawFourSound(){ [260,220,180,140].forEach((f,i)=>beep(f,0.16,'square',i*0.1,0.18)); }
function playUnoSound(){ [659.25,880,1046.5].forEach((f,i)=>beep(f,0.16,'sine',i*0.08,0.22)); }
function playRoundWinSound(){ [523.25,659.25,783.99,1046.5].forEach((f,i)=>beep(f,0.18,'triangle',i*0.09,0.2)); }
function playWinSound(){ [523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>beep(f,0.22,'sine',i*0.1,0.22)); }
function playLoseSound(){ [293.66,261.63,220,196,146.83].forEach((f,i)=>beep(f,0.35,'square',i*0.22,0.2)); }
function playErrorSound(){ [220,196].forEach((f,i)=>beep(f,0.18,'sawtooth',i*0.15,0.18)); }
function playPauseSound(){ [392,349.23,311.13,261.63].forEach((f,i)=>beep(f,0.22,'sawtooth',i*0.16,0.18)); }
function playResumeSound(){ [523.25,659.25,880,1046.5].forEach((f,i)=>beep(f,0.16,'sine',i*0.08,0.2)); }

/* ============================ KURULUM ============================ */

let setupPlayers = [];
function renderSetup(){
  const list = document.getElementById('playerList');
  list.innerHTML='';
  setupPlayers.forEach((p, idx)=>{
    const row = document.createElement('div');
    row.className='playerRow';
    row.innerHTML = `
      <input type="text" value="${p.name}" data-idx="${idx}" class="nameInput" placeholder="Oyuncu adı">
      <select data-idx="${idx}" class="typeSelect">
        <option value="human" ${p.type==='human'?'selected':''}>İnsan</option>
        <option value="cpu" ${p.type==='cpu'?'selected':''}>Bilgisayar</option>
      </select>
      ${setupPlayers.length>2 ? `<button class="remove" data-idx="${idx}">Sil</button>` : ''}
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('.nameInput').forEach(inp=>{
    inp.addEventListener('input', e=>{ setupPlayers[+e.target.dataset.idx].name = e.target.value; });
  });
  list.querySelectorAll('.typeSelect').forEach(sel=>{
    sel.addEventListener('change', e=>{ setupPlayers[+e.target.dataset.idx].type = e.target.value; });
  });
  list.querySelectorAll('button.remove').forEach(btn=>{
    btn.addEventListener('click', e=>{ setupPlayers.splice(+e.target.dataset.idx,1); renderSetup(); });
  });
}
function initSetup(){
  setupPlayers = [
    {name:'Oyuncu 1', type:'human'},
    {name:'Oyuncu 2', type:'human'}
  ];
  renderSetup();
}
initSetup();

document.getElementById('addPlayerBtn').addEventListener('click', ()=>{
  if(setupPlayers.length>=4){ alert('UNO en fazla 4 oyuncu ile oynanır.'); return; }
  setupPlayers.push({name:'Oyuncu '+(setupPlayers.length+1), type:'cpu'});
  renderSetup();
});

document.querySelectorAll('input[name="userMode"]').forEach(r=>{
  r.addEventListener('change', ()=>{
    const mode = document.querySelector('input[name="userMode"]:checked').value;
    document.getElementById('parentPassBox').style.display = (mode==='parent') ? 'block' : 'none';
  });
});

document.getElementById('startGameBtn').addEventListener('click', ()=>{
  if(setupPlayers.length<2){ alert('En az 2 oyuncu gerekli.'); return; }
  for(const p of setupPlayers){ if(!p.name.trim()){ alert('Tüm oyuncuların bir adı olmalı.'); return; } }
  const modeInput = document.querySelector('input[name="userMode"]:checked');
  const mode = modeInput ? modeInput.value : 'child';
  if(mode==='parent'){
    const pass = document.getElementById('parentPass').value;
    if(pass !== '1247'){ alert('Ebeveyn şifresi yanlış!'); return; }
  }
  const diffInput = document.querySelector('input[name="difficulty"]:checked');
  const difficulty = diffInput ? diffInput.value : 'medium';
  clearState();
  startMatch(mode, difficulty);
});

document.getElementById('resumeBtn').addEventListener('click', ()=>{
  const saved = loadState();
  if(!saved){ alert('Kayıtlı UNO oyunu bulunamadı.'); checkResume(); return; }
  G = saved;
  G.timerHandle = null;
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  resumeGame();
});

function checkResume(){
  const saved = loadState();
  const box = document.getElementById('resumeBox');
  if(box) box.style.display = saved ? 'block' : 'none';
}
checkResume();

/* ============================ MAÇ / OYUN DURUMU ============================ */

let G = null;

function log(msg){
  const el = document.getElementById('log');
  const d = document.createElement('div');
  d.innerHTML = msg;
  el.prepend(d);
}

function startMatch(mode, difficulty){
  G = {
    mode: mode || 'child',
    difficulty: difficulty || 'medium',
    players: setupPlayers.map((p,i)=>({id:i, name:p.name, type:p.type, hand:[], score:0})),
    roundsTotal: parseInt(document.getElementById('roundCount').value,10) || 5,
    roundNumber: 1,
    drawPile:[], discardPile:[], currentColor:null, currentValue:null,
    currentPlayer:0, direction:1,
    roundOver:false, gameOver:false,
    timeLeft: (mode==='parent') ? DAILY_LIMIT_SECONDS : getSharedRemainingSeconds(),
    timerHandle:null
  };
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  log('🎮 UNO maçı başladı! <b>'+G.players.map(p=>p.name+' ('+(p.type==='human'?'İnsan':'Bilgisayar')+')').join(', ')+'</b> — '+G.roundsTotal+' el oynanacak.');
  if(G.mode==='child' && G.timeLeft<=0){
    pauseGame('⏰ Bugünkü 30 dakikalık toplam oyun süreniz doldu! (Tüm oyunlar dahil)', true);
    return;
  }
  startTimer();
  startRound();
}

function startRound(){
  const deck = shuffle(buildDeck());
  G.players.forEach(p=>{ p.hand = deck.splice(0,7); });
  let startCard;
  do{
    startCard = deck.shift();
  } while(startCard && (startCard.color==='wild' || startCard.value==='SKIP' || startCard.value==='REVERSE' || startCard.value==='DRAW2'));
  G.discardPile = [startCard];
  G.drawPile = deck;
  G.currentColor = startCard.color;
  G.currentValue = startCard.value;
  G.direction = 1;
  G.currentPlayer = (G.roundNumber-1) % G.players.length;
  G.roundOver = false;
  log(`🆕 ${G.roundNumber}. El başladı! Başlangıç kağıdı: ${cardLogLabel(startCard)}`);
  renderAll();
  saveState();
  proceedTurn();
}

/* ============================ ZAMAN / SÜRE (ORTAK GÜNLÜK BÜTÇE) ============================ */

function startTimer(){
  if(G.mode==='parent'){ updateTimerDisplay(); return; }
  G.timerHandle = setInterval(()=>{
    if(G.gameOver) return;
    G.timeLeft--;
    addSharedUsedSeconds(1);
    updateTimerDisplay();
    if(G.timeLeft<=0){
      pauseGame('⏰ Bugünkü 30 dakikalık toplam oyun süreniz doldu! (Tüm oyunlar dahil)', true);
    }
  },1000);
}
function updateTimerDisplay(){
  if(!G) return;
  if(G.mode==='parent'){
    document.getElementById('timerDisplay').textContent = '👨‍👩‍👧 Sınırsız';
    return;
  }
  const m = Math.floor(G.timeLeft/60), s = G.timeLeft%60;
  document.getElementById('timerDisplay').textContent = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

/* ============================ SEKME YÖNETİMİ ============================ */

function switchTab(name){
  ['tableTab','helpTab'].forEach(id=>document.getElementById(id).classList.remove('show'));
  ['tabTableBtn','tabHelpBtn'].forEach(id=>document.getElementById(id).classList.remove('active'));
  document.getElementById(name+'Tab').classList.add('show');
  document.getElementById('tab'+name.charAt(0).toUpperCase()+name.slice(1)+'Btn').classList.add('active');
}
document.getElementById('tabTableBtn').addEventListener('click', ()=>switchTab('table'));
document.getElementById('tabHelpBtn').addEventListener('click', ()=>switchTab('help'));

document.getElementById('endGameBtn').addEventListener('click', ()=>{
  if(confirm('UNO oyununu duraklatmak istediğine emin misin? Daha sonra kaldığın yerden devam edebilirsin.')){
    pauseGame('Oyun kullanıcı tarafından duraklatıldı.', false);
  }
});

/* ============================ OYUN MANTIĞI ============================ */

function isPlayable(card){
  if(card.color==='wild') return true;
  if(card.color===G.currentColor) return true;
  if(card.value===G.currentValue) return true;
  return false;
}

function nextIndex(from, step){
  const n = G.players.length;
  return ((from + step*G.direction) % n + n) % n;
}

function drawFromPile(player){
  if(G.drawPile.length===0) reshuffleDiscardIntoDraw();
  if(G.drawPile.length===0) return null;
  const card = G.drawPile.pop();
  player.hand.push(card);
  return card;
}
function reshuffleDiscardIntoDraw(){
  if(G.discardPile.length<=1) return;
  const top = G.discardPile.pop();
  G.drawPile = shuffle(G.discardPile);
  G.discardPile = [top];
  log('🔀 Deste bitti, atılan kağıtlar karıştırıldı.');
}

function cpuChooseColor(player){
  if(G.difficulty==='easy'){
    return COLORS[Math.floor(Math.random()*COLORS.length)];
  }
  const counts = {red:0,yellow:0,green:0,blue:0};
  player.hand.forEach(c=>{ if(counts[c.color]!==undefined) counts[c.color]++; });
  let best='red', bestN=-1;
  for(const c in counts){ if(counts[c]>bestN){ bestN=counts[c]; best=c; } }
  return best;
}

function playCard(playerIdx, cardIdx){
  if(G.gameOver || G.roundOver) return;
  const player = G.players[playerIdx];
  const card = player.hand[cardIdx];
  if(!card || !isPlayable(card)){ playErrorSound(); return; }
  hidePassButton();
  player.hand.splice(cardIdx,1);
  G.discardPile.push(card);
  playCardSound();
  log(`${player.type==='cpu'?'🤖 ':''}${player.name} oynadı: ${cardLogLabel(card)}`);

  if(card.color==='wild'){
    G.currentValue = card.value;
    if(player.type==='human'){
      openColorModal(chosenColor=>{
        G.currentColor = chosenColor;
        log(`🎨 ${player.name} rengi seçti: ${COLOR_TR[chosenColor]}`);
        finishCardEffect(playerIdx, card);
      });
      return;
    } else {
      G.currentColor = cpuChooseColor(player);
      log(`🎨 ${player.name} rengi seçti: ${COLOR_TR[G.currentColor]}`);
      finishCardEffect(playerIdx, card);
      return;
    }
  } else {
    G.currentColor = card.color;
    G.currentValue = card.value;
    finishCardEffect(playerIdx, card);
  }
}

function finishCardEffect(playerIdx, card){
  const player = G.players[playerIdx];

  if(player.hand.length===1){
    playUnoSound();
    log(`🎉 ${player.name}: UNO!`);
  }
  if(player.hand.length===0){
    renderAll(); saveState();
    endRound(playerIdx);
    return;
  }

  let skipNext=false, drawN=0;
  if(card.value==='SKIP'){ skipNext=true; playSkipSound(); }
  if(card.value==='REVERSE'){
    G.direction *= -1;
    playReverseSound();
    if(G.players.length===2) skipNext=true;
  }
  if(card.value==='DRAW2'){ drawN=2; skipNext=true; playDrawTwoSound(); }
  if(card.value==='WILD4'){ drawN=4; skipNext=true; playDrawFourSound(); }

  let nxt = nextIndex(playerIdx,1);
  if(drawN>0){
    for(let i=0;i<drawN;i++) drawFromPile(G.players[nxt]);
    log(`${G.players[nxt].name} ${drawN} kağıt çekti ve turunu kaybetti.`);
  } else if(skipNext){
    log(`${G.players[nxt].name} turunu kaybetti.`);
  }
  if(skipNext){
    nxt = nextIndex(nxt,1);
  }
  G.currentPlayer = nxt;
  renderAll();
  saveState();
  proceedTurn();
}

function proceedTurn(){
  if(G.gameOver || G.roundOver) return;
  renderAll();
  const player = G.players[G.currentPlayer];
  if(player.type==='cpu'){
    setTimeout(()=>cpuTurn(G.currentPlayer), 750);
  } else {
    showPassButton(false);
  }
}

function cpuChooseCardIndex(playerIdx){
  const player = G.players[playerIdx];
  const playableIdxs = [];
  player.hand.forEach((c,i)=>{ if(isPlayable(c)) playableIdxs.push(i); });
  if(playableIdxs.length===0) return -1;

  if(G.difficulty==='easy'){
    return playableIdxs[Math.floor(Math.random()*playableIdxs.length)];
  }
  if(G.difficulty==='medium'){
    return playableIdxs[0];
  }

  // ZOR: rakibi zorlayan, elini akıllıca yöneten strateji
  const targetIdx = nextIndex(playerIdx,1);
  const target = G.players[targetIdx];
  const disruptiveValues = ['SKIP','REVERSE','DRAW2','WILD4'];
  if(target.hand.length<=2){
    const disruptive = playableIdxs.find(i=>disruptiveValues.includes(player.hand[i].value));
    if(disruptive!==undefined) return disruptive;
  }
  const colorCounts = {red:0,yellow:0,green:0,blue:0};
  player.hand.forEach(c=>{ if(colorCounts[c.color]!==undefined) colorCounts[c.color]++; });
  const nonWild = playableIdxs.filter(i=>player.hand[i].color!=='wild');
  if(nonWild.length>0){
    nonWild.sort((a,b)=> colorCounts[player.hand[b].color]-colorCounts[player.hand[a].color]);
    return nonWild[0];
  }
  return playableIdxs[0];
}

function cpuTurn(playerIdx){
  if(G.gameOver || G.roundOver) return;
  const player = G.players[playerIdx];
  const idx = cpuChooseCardIndex(playerIdx);
  if(idx>=0){
    playCard(playerIdx, idx);
  } else {
    const card = drawFromPile(player);
    playDrawSound();
    log(`🤖 ${player.name} kağıt çekti.`);
    renderAll(); saveState();
    if(card && isPlayable(card)){
      setTimeout(()=>{
        const i2 = player.hand.indexOf(card);
        playCard(playerIdx, i2);
      }, 650);
    } else {
      setTimeout(()=>{
        G.currentPlayer = nextIndex(playerIdx,1);
        renderAll(); saveState(); proceedTurn();
      }, 500);
    }
  }
}

function drawCardHuman(){
  if(G.gameOver || G.roundOver) return;
  const player = G.players[G.currentPlayer];
  if(player.type!=='human') return;
  const hasPlayable = player.hand.some(isPlayable);
  if(hasPlayable){ return; }
  const card = drawFromPile(player);
  playDrawSound();
  log(`${player.name} kağıt çekti.`);
  renderAll(); saveState();
  if(card && isPlayable(card)){
    showPassButton(true);
  } else {
    showPassButton(false);
    setTimeout(endTurnAfterDraw, 500);
  }
}
function endTurnAfterDraw(){
  hidePassButton();
  G.currentPlayer = nextIndex(G.currentPlayer,1);
  renderAll(); saveState(); proceedTurn();
}
function showPassButton(show){
  document.getElementById('passBtnWrap').style.display = show ? 'block' : 'none';
}
function hidePassButton(){
  document.getElementById('passBtnWrap').style.display = 'none';
}
document.getElementById('passTurnBtn').addEventListener('click', endTurnAfterDraw);
document.getElementById('drawPile').addEventListener('click', drawCardHuman);

/* ============================ EL / MAÇ SONU ============================ */

function endRound(winnerIdx){
  const winner = G.players[winnerIdx];
  let pts = 0;
  G.players.forEach(p=>{
    if(p.id!==winner.id){ p.hand.forEach(c=>{ pts += cardPoints(c); }); }
  });
  winner.score += pts;
  G.roundOver = true;
  playRoundWinSound();
  log(`🏆 <b>${winner.name}</b> ${G.roundNumber}. eli kazandı! +${pts} puan (Toplam: ${winner.score})`);
  saveState();
  showRoundEndModal(winner, pts);
}

function showRoundEndModal(winner, pts){
  const ranking = G.players.slice().sort((a,b)=>b.score-a.score);
  let html = `<h3>🏆 El Bitti!</h3><p><b>${winner.name}</b> bu eli kazandı ve <b>+${pts}</b> puan aldı.</p><div>`;
  ranking.forEach((p,i)=>{
    html += `<div class="scoreRow"><span>${i===0?'👑 ':''}${p.name}</span><b>${p.score}</b></div>`;
  });
  html += `</div>`;
  if(G.roundNumber < G.roundsTotal){
    html += `<div class="btnrow"><button class="primaryBtn" id="nextRoundBtn">▶️ Sıradaki El (${G.roundNumber+1}/${G.roundsTotal})</button></div>`;
    showModal(html);
    document.getElementById('nextRoundBtn').onclick = ()=>{
      closeModal();
      G.roundNumber++;
      startRound();
    };
  } else {
    html += `<div class="btnrow"><button class="primaryBtn" id="finishMatchBtn">🏁 Maç Sonucunu Gör</button></div>`;
    showModal(html);
    document.getElementById('finishMatchBtn').onclick = ()=>{
      closeModal();
      matchEnd();
    };
  }
}

function matchEnd(){
  G.gameOver = true;
  clearInterval(G.timerHandle);
  G.timerHandle = null;
  const ranking = G.players.slice().sort((a,b)=>b.score-a.score);
  playWinSound();
  setTimeout(playLoseSound, 500);
  let html = `<h3>🏁 Maç Bitti!</h3><ol style="text-align:left;">`;
  ranking.forEach((p,i)=>{
    html += `<li><b>${p.name}</b> — ${p.score} puan ${i===0?'👑 Şampiyon!':''}</li>`;
  });
  html += `</ol><div class="btnrow"><button class="primaryBtn" id="newMatchBtn">🆕 Yeni Maç</button></div>`;
  showModal(html);
  document.getElementById('newMatchBtn').onclick = ()=>{ clearState(); location.reload(); };
  log(`🏁 MAÇ SONA ERDİ! Şampiyon: <b>${ranking[0].name}</b> (${ranking[0].score} puan)`);
  saveState();
}

/* ============================ RENDER ============================ */

function renderAll(){
  renderTopbar();
  renderTable();
  renderHand();
}

function renderTopbar(){
  document.getElementById('roundInfo').textContent = `El ${G.roundNumber}/${G.roundsTotal}`;
  const sb = document.getElementById('scoreboard');
  sb.innerHTML = '';
  G.players.forEach((p,i)=>{
    const pill = document.createElement('div');
    pill.className = 'scorePill' + (i===G.currentPlayer && !G.gameOver ? ' turn' : '');
    pill.textContent = `${p.name}: ${p.score}`;
    sb.appendChild(pill);
  });
  updateTimerDisplay();
}

function renderTable(){
  document.getElementById('directionIndicator').textContent = G.direction===1 ? '🔁 Yön: Saat Yönü' : '🔁 Yön: Ters Yön';
  const cur = G.players[G.currentPlayer];
  document.getElementById('turnBanner').textContent = `Sıra: ${cur.name}${cur.type==='cpu'?' 🤖':' 👤'} — 🎨 Aktif Renk: ${COLOR_TR[G.currentColor]}`;
  document.getElementById('drawCount').textContent = G.drawPile.length;

  const top = G.discardPile[G.discardPile.length-1];
  const discardEl = document.getElementById('discardPile');
  const colorClass = top.color==='wild' ? 'wild' : G.currentColor;
  discardEl.innerHTML = `<div class="card ${colorClass}">${cardHTML(top)}</div>`;

  const drawBack = document.querySelector('#drawPile .cardBack');
  const hasPlayable = cur.type==='human' && cur.hand.some(isPlayable);
  if(cur.type==='human' && !hasPlayable && !G.gameOver && !G.roundOver){
    drawBack.classList.remove('disabled');
  } else {
    drawBack.classList.add('disabled');
  }
}

function renderHand(){
  const handArea = document.getElementById('handArea');
  handArea.innerHTML = '';
  const player = G.players[G.currentPlayer];
  document.getElementById('handLabel').textContent = player.type==='human'
    ? `${player.name} — Elindeki Kağıtlar (${player.hand.length})`
    : `${player.name} oynuyor...`;

  if(player.type==='cpu' || G.gameOver || G.roundOver){
    if(player.type==='cpu' && !G.gameOver && !G.roundOver){
      handArea.innerHTML = `<div class="cpuNotice">🤖 ${player.name} düşünüyor...</div>`;
    }
    return;
  }

  player.hand.forEach((card, idx)=>{
    const playable = isPlayable(card);
    const div = document.createElement('div');
    div.className = `card ${card.color} ${playable?'playable':'notplayable'}`;
    div.innerHTML = cardHTML(card);
    div.onclick = ()=>{
      if(playable) playCard(G.currentPlayer, idx);
      else playErrorSound();
    };
    handArea.appendChild(div);
  });
}

/* ============================ RENK SEÇİM MODALI ============================ */

function openColorModal(callback){
  const html = `<h3>🎨 Renk Seç</h3><p>Joker kağıdı için bir renk seçin:</p>
    <div class="colorChoice">
      <button class="red" data-c="red"></button>
      <button class="yellow" data-c="yellow"></button>
      <button class="green" data-c="green"></button>
      <button class="blue" data-c="blue"></button>
    </div>`;
  showModal(html);
  document.querySelectorAll('.colorChoice button').forEach(btn=>{
    btn.onclick = ()=>{
      const c = btn.dataset.c;
      closeModal();
      callback(c);
    };
  });
}

/* ============================ MODAL ============================ */

function showModal(html){
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalOverlay').style.display = 'flex';
}
function closeModal(){
  document.getElementById('modalOverlay').style.display = 'none';
}

/* ============================ KAYIT / DEVAM ETME ============================ */

function saveState(){
  if(!G) return;
  try{
    const copy = {...G, timerHandle:null};
    localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
  }catch(e){ /* yoksayılır */ }
}
function loadState(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}
function clearState(){
  try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
}

function pauseGame(reason, requirePassword){
  if(!G || G.gameOver) return;
  G.gameOver = true;
  clearInterval(G.timerHandle);
  G.timerHandle = null;
  playPauseSound();
  saveState();
  showPauseModal(reason, requirePassword);
}

function resumeGame(){
  if(!G) return;
  if(G.mode==='child'){
    G.timeLeft = getSharedRemainingSeconds();
    if(G.timeLeft<=0){
      pauseGame('⏰ Bugünkü 30 dakikalık toplam oyun süreniz doldu! (Tüm oyunlar dahil)', true);
      return;
    }
  }
  G.gameOver = false;
  playResumeSound();
  if(G.mode==='child' && !G.timerHandle){ startTimer(); }
  renderAll();
  saveState();
  proceedTurn();
}

function showPauseModal(reason, requirePassword){
  const ranking = G.players.slice().sort((a,b)=>b.score-a.score);
  let html = `<h3>⏸️ UNO Duraklatıldı</h3><p>${reason}</p><div>`;
  ranking.forEach((p,i)=>{
    html += `<div class="scoreRow"><span>${i===0?'👑 ':''}${p.name}</span><b>${p.score}</b></div>`;
  });
  html += `</div><p style="font-size:12.5px;color:#666;">El ${G.roundNumber}/${G.roundsTotal}</p>`;

  if(requirePassword){
    html += `<div style="margin-top:10px;">
        <input type="password" id="resumePassInput" placeholder="Ebeveyn şifresi">
        <button class="primaryBtn" id="resumePassBtn">Devam Et</button>
      </div>
      <p style="font-size:12px;color:#666;">Şifre girmezseniz oyun duraklatılmış kalır; ana menüden "Kaldığın Yerden Devam Et" ile şifreyi girip sürdürebilirsiniz.</p>
      <div class="btnrow"><button class="close" id="backToMenuBtn">Ana Menüye Dön</button></div>`;
    showModal(html);
    document.getElementById('resumePassBtn').onclick = ()=>{
      const val = document.getElementById('resumePassInput').value;
      if(val==='1247'){
        G.mode='parent';
        log('👨‍👩‍👧 Ebeveyn şifresi doğrulandı, süre sınırı kaldırıldı.');
        closeModal();
        resumeGame();
      } else {
        alert('Şifre yanlış!');
      }
    };
    document.getElementById('backToMenuBtn').onclick = ()=>{
      closeModal();
      saveState();
      location.reload();
    };
  } else {
    html += `<div class="btnrow">
        <button class="primaryBtn" id="continueBtn">▶️ Devam Et</button>
        <button class="close" id="newGameBtn">🆕 Yeni Maç</button>
      </div>`;
    showModal(html);
    document.getElementById('continueBtn').onclick = ()=>{ closeModal(); resumeGame(); };
    document.getElementById('newGameBtn').onclick = ()=>{ clearState(); location.reload(); };
  }
  log(`⏸️ UNO duraklatıldı: ${reason}`);
}
