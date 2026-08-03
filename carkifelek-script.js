/* ============================================================
   ÇARK DİLİMLERİ
   ============================================================ */
const WHEEL_SEGMENTS = [
  {type:'points', value:100},
  {type:'points', value:200},
  {type:'pas'},
  {type:'points', value:300},
  {type:'points', value:500},
  {type:'iflas'},
  {type:'points', value:400},
  {type:'points', value:800},
  {type:'ekstra'},
  {type:'points', value:600},
  {type:'points', value:1000},
  {type:'points', value:300}
];
const WHEEL_COLORS = ['#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#00897b','#f4511e','#3949ab','#00acc1','#c0ca33','#6d4c41','#d81b60'];
const COMMON_LETTERS = ['A','E','İ','N','R','L','K','D','M','U','T','S','Y','O','B','Z','G','Ç','H','P','Ö','V','C','Ş','F','J','Ğ','I','Ü'];

const SAVE_KEY = 'carkifelek_save_v1';
let G = null;

/* ============================================================
   SES MOTORU
   ============================================================ */
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
function playSpinSound(){ [300,340,300,340,300].forEach((f,i)=>beep(f,0.08,'square',i*0.1,0.1)); }
function playStopSound(){ beep(150,0.2,'sawtooth',0,0.22); }
function playLetterHitSound(){ [659.25,880].forEach((f,i)=>beep(f,0.14,'sine',i*0.08,0.2)); }
function playLetterMissSound(){ [220,180].forEach((f,i)=>beep(f,0.18,'sawtooth',i*0.12,0.18)); }
function playPasSound(){ [392,330].forEach((f,i)=>beep(f,0.14,'triangle',i*0.09,0.16)); }
function playIflasSound(){ [300,250,200,150].forEach((f,i)=>beep(f,0.2,'sawtooth',i*0.13,0.2)); }
function playEkstraSound(){ [523.25,659.25,783.99].forEach((f,i)=>beep(f,0.12,'sine',i*0.07,0.18)); }
function playSolveSound(){ [523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>beep(f,0.2,'sine',i*0.1,0.22)); }
function playWrongGuessSound(){ [220,196].forEach((f,i)=>beep(f,0.18,'sawtooth',i*0.15,0.18)); }
function playWinSound(){ [523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>beep(f,0.22,'sine',i*0.1,0.22)); }
function playLoseSound(){ [293.66,261.63,220,196,146.83].forEach((f,i)=>beep(f,0.35,'square',i*0.22,0.2)); }
function playPauseSound(){ [392,349.23,311.13,261.63].forEach((f,i)=>beep(f,0.22,'sawtooth',i*0.16,0.18)); }
function playResumeSound(){ [523.25,659.25,880,1046.5].forEach((f,i)=>beep(f,0.16,'sine',i*0.08,0.2)); }

function log(msg){
  const el = document.getElementById('log');
  if(!el) return;
  const d = document.createElement('div');
  d.innerHTML = msg;
  el.prepend(d);
}
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function trUpper(s){ return s.toLocaleUpperCase('tr-TR'); }

/* ============================================================
   KURULUM
   ============================================================ */
let setupPlayers = [];
function renderSetup(){
  const list = document.getElementById('playerList');
  list.innerHTML = '';
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
  setupPlayers = [{name:'Oyuncu 1', type:'human'}, {name:'Oyuncu 2', type:'human'}];
  renderSetup();
}
initSetup();

document.getElementById('addPlayerBtn').addEventListener('click', ()=>{
  if(setupPlayers.length>=4){ alert('En fazla 4 oyuncu ile oynanır.'); return; }
  setupPlayers.push({name:'Oyuncu '+(setupPlayers.length+1), type:'cpu'});
  renderSetup();
});

document.querySelectorAll('input[name="userMode"]').forEach(r=>{
  r.addEventListener('change', ()=>{
    const mode = document.querySelector('input[name="userMode"]:checked').value;
    document.getElementById('parentPassBox').style.display = (mode==='parent') ? 'block' : 'none';
  });
});

function renderCategoryBox(){
  const box = document.getElementById('categoryBox');
  box.innerHTML = '';
  PHRASE_CATEGORY_ORDER.forEach(key=>{
    const cat = PHRASE_CATEGORIES[key];
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${key}" checked> ${cat.label} (${cat.items.length})`;
    box.appendChild(label);
  });
}
renderCategoryBox();

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
  const selectedCats = Array.from(document.querySelectorAll('#categoryBox input:checked')).map(el=>el.value);
  if(selectedCats.length===0){ alert('En az bir kategori seçmelisiniz.'); return; }
  const roundsTotal = parseInt(document.getElementById('roundCount').value,10) || 3;
  clearState();
  startMatch(mode, difficulty, selectedCats, roundsTotal);
});

document.getElementById('resumeBtn').addEventListener('click', ()=>{
  const saved = loadState();
  if(!saved){ alert('Kayıtlı oyun bulunamadı.'); checkResume(); return; }
  G = saved;
  G.timerHandle = null;
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  buildWheel();
  resumeGame();
});
function checkResume(){
  const saved = loadState();
  const box = document.getElementById('resumeBox');
  if(box) box.style.display = saved ? 'block' : 'none';
}
checkResume();

document.getElementById('homeBtn').addEventListener('click', ()=>{
  if(G) saveState();
  location.href = 'index.html';
});

/* ============================================================
   MAÇ / TUR BAŞLATMA
   ============================================================ */
function buildPool(selectedCats){
  let pool = [];
  selectedCats.forEach(key=>{
    PHRASE_CATEGORIES[key].items.forEach(text=>{
      pool.push({text, category: PHRASE_CATEGORIES[key].label});
    });
  });
  return pool;
}

function startMatch(mode, difficulty, selectedCats, roundsTotal){
  const pool = buildPool(selectedCats);
  G = {
    mode: mode || 'child',
    difficulty: difficulty || 'medium',
    players: setupPlayers.map((p,i)=>({id:i, name:p.name, type:p.type, score:0, roundBank:0})),
    roundsTotal,
    roundNumber: 1,
    pool,
    deck: shuffle(pool),
    deckPos: 0,
    currentPlayer: 0,
    guessedLetters: {},
    awaitingLetterPick: false,
    turnLocked: false,
    gameOver: false,
    timeLeft: (mode==='parent') ? DAILY_LIMIT_SECONDS : getSharedRemainingSeconds(),
    timerHandle: null,
    wheelRotation: 0
  };
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  buildWheel();
  log(`🎡 Çarkıfelek başladı! <b>${G.players.map(p=>p.name+(p.type==='cpu'?' 🤖':'')).join(', ')}</b> — ${roundsTotal} tur.`);
  if(G.mode==='child' && G.timeLeft<=0){
    pauseGame('⏰ Bugünkü 30 dakikalık toplam oyun süreniz doldu! (Tüm oyunlar dahil)', true);
    return;
  }
  startTimer();
  startRound();
}

function drawPhrase(){
  if(G.deckPos >= G.deck.length){
    G.deck = shuffle(G.pool);
    G.deckPos = 0;
  }
  const item = G.deck[G.deckPos];
  G.deckPos++;
  return item;
}

function startRound(){
  const item = drawPhrase();
  G.currentPhrase = {category:item.category, text:item.text, upper:trUpper(item.text)};
  G.guessedLetters = {};
  G.players.forEach(p=>p.roundBank=0);
  G.currentPlayer = (G.roundNumber-1) % G.players.length;
  G.awaitingLetterPick = false;
  G.turnLocked = false;
  log(`🆕 ${G.roundNumber}. tur başladı! Kategori: ${item.category}`);
  renderAll();
  saveState();
  proceedTurn();
}

/* ============================================================
   ZAMAN
   ============================================================ */
function startTimer(){
  if(G.mode==='parent'){ document.getElementById('timerDisplay').textContent='👨‍👩‍👧 Sınırsız'; return; }
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
  if(G.mode==='parent'){ document.getElementById('timerDisplay').textContent='👨‍👩‍👧 Sınırsız'; return; }
  const m=Math.floor(G.timeLeft/60), s=G.timeLeft%60;
  document.getElementById('timerDisplay').textContent = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

/* ============================================================
   SEKME
   ============================================================ */
function switchTab(name){
  ['playTab','helpTab'].forEach(id=>document.getElementById(id).classList.remove('show'));
  ['tabPlayBtn','tabHelpBtn'].forEach(id=>document.getElementById(id).classList.remove('active'));
  document.getElementById(name+'Tab').classList.add('show');
  document.getElementById('tab'+name.charAt(0).toUpperCase()+name.slice(1)+'Btn').classList.add('active');
}
document.getElementById('tabPlayBtn').addEventListener('click', ()=>switchTab('play'));
document.getElementById('tabHelpBtn').addEventListener('click', ()=>switchTab('help'));
document.getElementById('endGameBtn').addEventListener('click', ()=>{
  if(confirm('Oyunu duraklatmak istediğine emin misin? Daha sonra kaldığın yerden devam edebilirsin.')){
    pauseGame('Oyun kullanıcı tarafından duraklatıldı.', false);
  }
});

/* ============================================================
   ÇARK
   ============================================================ */
function buildWheel(){
  const wheelEl = document.getElementById('wheel');
  wheelEl.innerHTML = '';
  const n = WHEEL_SEGMENTS.length;
  const anglePer = 360/n;
  const parts = WHEEL_SEGMENTS.map((seg,i)=> WHEEL_COLORS[i%WHEEL_COLORS.length]+' '+(i*anglePer)+'deg '+((i+1)*anglePer)+'deg');
  wheelEl.style.background = 'conic-gradient('+parts.join(',')+')';
  WHEEL_SEGMENTS.forEach((seg,i)=>{
    const mid = i*anglePer + anglePer/2;
    const rotator = document.createElement('div');
    rotator.style.position='absolute'; rotator.style.inset='0';
    rotator.style.transform = 'rotate('+mid+'deg)';
    const txt = document.createElement('div');
    txt.style.position='absolute'; txt.style.top='14px'; txt.style.left='50%';
    txt.style.transform='translateX(-50%)';
    txt.style.color='#fff'; txt.style.fontWeight='bold'; txt.style.textShadow='0 1px 2px rgba(0,0,0,.6)';
    txt.style.fontSize = seg.type==='points' ? '14px' : '10px';
    txt.textContent = seg.type==='points' ? seg.value : (seg.type==='pas'?'PAS':(seg.type==='iflas'?'İFLAS':'EKSTRA'));
    rotator.appendChild(txt);
    wheelEl.appendChild(rotator);
  });
  if(G && G.wheelRotation){ wheelEl.style.transition='none'; wheelEl.style.transform='rotate('+G.wheelRotation+'deg)'; requestAnimationFrame(()=>{ wheelEl.style.transition=''; }); }
}

function spinWheel(onResult){
  const wheelEl = document.getElementById('wheel');
  const n = WHEEL_SEGMENTS.length;
  const anglePer = 360/n;
  const idx = Math.floor(Math.random()*n);
  const mid = idx*anglePer + anglePer/2;
  const current = ((G.wheelRotation % 360) + 360) % 360;
  const desired = (360 - mid) % 360;
  const delta = ((desired - current) % 360 + 360) % 360;
  G.wheelRotation += delta + 5*360;
  wheelEl.style.transform = 'rotate('+G.wheelRotation+'deg)';
  playSpinSound();
  setTimeout(()=>{
    playStopSound();
    onResult(WHEEL_SEGMENTS[idx]);
  }, 3050);
}

document.getElementById('spinBtn').addEventListener('click', ()=>{
  if(!G || G.gameOver || G.turnLocked || G.awaitingLetterPick) return;
  const player = G.players[G.currentPlayer];
  if(player.type!=='human') return;
  doSpin();
});

function doSpin(){
  G.turnLocked = true;
  document.getElementById('spinBtn').disabled = true;
  document.getElementById('guessPhraseBtn').disabled = true;
  document.getElementById('wheelResult').textContent = 'Çark dönüyor...';
  spinWheel(seg=>{
    handleSpinResult(seg);
  });
}

function handleSpinResult(seg){
  const player = G.players[G.currentPlayer];
  if(seg.type==='points'){
    document.getElementById('wheelResult').textContent = '🎯 '+seg.value+' puan! Bir harf seç.';
    G.awaitingLetterPick = true;
    G.pendingValue = seg.value;
    G.turnLocked = false;
    renderLetterBoard();
    saveState();
    if(player.type==='cpu'){ setTimeout(cpuPickLetter, 700); }
  } else if(seg.type==='pas'){
    playPasSound();
    document.getElementById('wheelResult').textContent = '🚫 PAS! Sıra geçiyor.';
    log(`${player.name} PAS geldi.`);
    setTimeout(()=>{ advanceTurn(); }, 900);
  } else if(seg.type==='iflas'){
    playIflasSound();
    player.roundBank = 0;
    document.getElementById('wheelResult').textContent = '💥 İFLAS! Bu turdaki puanın silindi.';
    log(`${player.name} İFLAS'a geldi, tur puanı sıfırlandı.`);
    renderScoreboard();
    setTimeout(()=>{ advanceTurn(); }, 900);
  } else if(seg.type==='ekstra'){
    playEkstraSound();
    document.getElementById('wheelResult').textContent = '🔄 EKSTRA ÇEVİR! Tekrar çevir.';
    log(`${player.name} ekstra çevirme hakkı kazandı.`);
    G.turnLocked = false;
    document.getElementById('spinBtn').disabled = false;
    saveState();
    if(player.type==='cpu'){ setTimeout(doSpin, 800); }
  }
}

/* ============================================================
   HARF TAHTASI
   ============================================================ */
function renderLetterBoard(){
  const board = document.getElementById('letterBoard');
  board.innerHTML = '';
  TR_ALPHABET.forEach(letter=>{
    const btn = document.createElement('button');
    const state = G.guessedLetters[letter];
    btn.className = 'letterBtn' + (state==='hit'?' hit':(state==='miss'?' miss':''));
    btn.textContent = letter;
    btn.disabled = !!state || !G.awaitingLetterPick || G.players[G.currentPlayer].type!=='human';
    btn.onclick = ()=>pickLetter(letter);
    board.appendChild(btn);
  });
}

function pickLetter(letter){
  if(!G.awaitingLetterPick || G.guessedLetters[letter]) return;
  const player = G.players[G.currentPlayer];
  const count = G.currentPhrase.upper.split('').filter(ch=>ch===letter).length;
  G.awaitingLetterPick = false;
  if(count>0){
    G.guessedLetters[letter] = 'hit';
    const gained = count * G.pendingValue;
    player.roundBank += gained;
    playLetterHitSound();
    log(`${player.name}: "${letter}" harfi ${count} kez geçiyor! +${gained} puan.`);
    renderAll();
    saveState();
    if(isFullyRevealed()){
      solveRound(player);
      return;
    }
    document.getElementById('wheelResult').textContent = '✅ Doğru! Tekrar çevirebilir ya da tahmin edebilirsin.';
    document.getElementById('spinBtn').disabled = false;
    document.getElementById('guessPhraseBtn').disabled = false;
    if(player.type==='cpu'){ setTimeout(()=>cpuTurn(), 800); }
  } else {
    G.guessedLetters[letter] = 'miss';
    playLetterMissSound();
    log(`${player.name}: "${letter}" harfi yok.`);
    renderAll();
    saveState();
    document.getElementById('wheelResult').textContent = '❌ "'+letter+'" yok. Sıra geçiyor.';
    setTimeout(()=>{ advanceTurn(); }, 900);
  }
}

function isFullyRevealed(){
  const letters = new Set(G.currentPhrase.upper.split('').filter(ch=>TR_ALPHABET.includes(ch)));
  for(const l of letters){ if(G.guessedLetters[l]!=='hit') return false; }
  return true;
}

/* ============================================================
   KELİMEYİ TAHMİN ET
   ============================================================ */
document.getElementById('guessPhraseBtn').addEventListener('click', ()=>{
  if(!G || G.gameOver || G.turnLocked) return;
  const player = G.players[G.currentPlayer];
  if(player.type!=='human') return;
  openGuessModal();
});

function openGuessModal(){
  showModal(`<h3>💬 Kelimeyi Tahmin Et</h3>
    <p>Kategori: ${G.currentPhrase.category}</p>
    <input type="text" id="guessInput" placeholder="Tahminini yaz...">
    <div class="btnrow">
      <button class="primaryBtn" id="submitGuessBtn">Tahmin Et</button>
      <button class="close" id="cancelGuessBtn">Vazgeç</button>
    </div>`);
  document.getElementById('submitGuessBtn').onclick = ()=>{
    const val = document.getElementById('guessInput').value;
    closeModal();
    checkPhraseGuess(val, G.players[G.currentPlayer]);
  };
  document.getElementById('cancelGuessBtn').onclick = closeModal;
}

function checkPhraseGuess(text, player){
  const guess = trUpper((text||'').trim());
  if(guess.length>0 && guess === G.currentPhrase.upper){
    log(`🎉 ${player.name}: "${text}" — DOĞRU!`);
    solveRound(player);
  } else {
    playWrongGuessSound();
    log(`${player.name}: "${text}" — yanlış tahmin.`);
    setTimeout(()=>{ advanceTurn(); }, 700);
  }
}

/* ============================================================
   TUR / MAÇ SONU
   ============================================================ */
function solveRound(player){
  playSolveSound();
  Object.keys(G.currentPhrase.upper.split('').reduce((a,ch)=>{ if(TR_ALPHABET.includes(ch)) a[ch]=1; return a; },{})).forEach(l=>{ G.guessedLetters[l]='hit'; });
  player.score += player.roundBank;
  const bonus = player.roundBank;
  log(`🏆 ${player.name} turu kazandı! "${G.currentPhrase.text}" — +${bonus} puan (Toplam: ${player.score})`);
  G.gameOver = true;
  renderAll();
  saveState();
  showRoundEndModal(player, bonus);
}

function showRoundEndModal(winner, bonus){
  const ranking = G.players.slice().sort((a,b)=>b.score-a.score);
  let html = `<h3>🏆 Tur Bitti!</h3><p><b>${winner.name}</b> kazandı: "${G.currentPhrase.text}" (+${bonus} puan)</p><div>`;
  ranking.forEach((p,i)=>{
    html += `<div class="scoreRow"><span>${i===0?'👑 ':''}${p.name}</span><b>${p.score}</b></div>`;
  });
  html += `</div>`;
  if(G.roundNumber < G.roundsTotal){
    html += `<div class="btnrow"><button class="primaryBtn" id="nextRoundBtn">▶️ Sıradaki Tur (${G.roundNumber+1}/${G.roundsTotal})</button></div>`;
    showModal(html);
    document.getElementById('nextRoundBtn').onclick = ()=>{
      closeModal();
      G.gameOver = false;
      G.roundNumber++;
      startRound();
    };
  } else {
    html += `<div class="btnrow"><button class="primaryBtn" id="finishMatchBtn">🏁 Maç Sonucunu Gör</button></div>`;
    showModal(html);
    document.getElementById('finishMatchBtn').onclick = ()=>{ closeModal(); matchEnd(); };
  }
}

function matchEnd(){
  G.gameOver = true;
  clearInterval(G.timerHandle); G.timerHandle=null;
  const ranking = G.players.slice().sort((a,b)=>b.score-a.score);
  playWinSound(); setTimeout(playLoseSound, 500);
  let html = `<h3>🏁 Maç Bitti!</h3><ol style="text-align:left;">`;
  ranking.forEach((p,i)=>{ html += `<li><b>${p.name}</b> — ${p.score} puan ${i===0?'👑 Şampiyon!':''}</li>`; });
  html += `</ol><div class="btnrow"><button class="primaryBtn" id="newMatchBtn">🆕 Yeni Maç</button></div>`;
  showModal(html);
  document.getElementById('newMatchBtn').onclick = ()=>{ clearState(); location.reload(); };
  log(`🏁 MAÇ SONA ERDİ! Şampiyon: <b>${ranking[0].name}</b> (${ranking[0].score} puan)`);
  saveState();
}

/* ============================================================
   TUR YÖNETİMİ
   ============================================================ */
function advanceTurn(){
  if(G.gameOver) return;
  G.currentPlayer = (G.currentPlayer+1) % G.players.length;
  G.awaitingLetterPick = false;
  G.turnLocked = false;
  renderAll();
  saveState();
  proceedTurn();
}

function proceedTurn(){
  if(G.gameOver) return;
  renderAll();
  const player = G.players[G.currentPlayer];
  document.getElementById('wheelResult').textContent='';
  if(player.type==='cpu'){
    setTimeout(()=>cpuTurn(), 800);
  }
}

/* ============================================================
   CPU MANTIĞI
   ============================================================ */
function revealedFraction(){
  const letters = Array.from(new Set(G.currentPhrase.upper.split('').filter(ch=>TR_ALPHABET.includes(ch))));
  if(letters.length===0) return 0;
  const hit = letters.filter(l=>G.guessedLetters[l]==='hit').length;
  return hit/letters.length;
}

function cpuTurn(){
  if(G.gameOver) return;
  const player = G.players[G.currentPlayer];
  const frac = revealedFraction();
  const guessProb = frac * (G.difficulty==='hard'?1.25:(G.difficulty==='easy'?0.55:0.9));
  if(frac>0.3 && Math.random()<guessProb){
    const success = Math.random() < (frac*0.85 + (G.difficulty==='hard'?0.15:0.02));
    if(success){
      log(`🤖 ${player.name} kelimeyi tahmin ediyor...`);
      solveRound(player);
    } else {
      log(`🤖 ${player.name} yanlış tahmin etti.`);
      playWrongGuessSound();
      setTimeout(()=>{ advanceTurn(); }, 700);
    }
    return;
  }
  doSpin();
}

function cpuPickLetter(){
  if(!G.awaitingLetterPick) return;
  const player = G.players[G.currentPlayer];
  if(player.type!=='cpu') return;
  let pool = COMMON_LETTERS.filter(l=>!G.guessedLetters[l]);
  if(pool.length===0) pool = TR_ALPHABET.filter(l=>!G.guessedLetters[l]);
  let letter;
  if(G.difficulty==='easy'){
    letter = pool[Math.floor(Math.random()*pool.length)];
  } else if(G.difficulty==='hard'){
    letter = pool[0];
  } else {
    const topN = pool.slice(0, Math.max(3,Math.floor(pool.length/2)));
    letter = topN[Math.floor(Math.random()*topN.length)];
  }
  pickLetter(letter);
}

/* ============================================================
   RENDER
   ============================================================ */
function renderAll(){
  renderTopbar();
  renderPhrase();
  renderScoreboard();
  renderLetterBoard();
  document.getElementById('roundScoreInfo').textContent = 'Bu turdaki puanın: ' + (G.players[G.currentPlayer] ? G.players[G.currentPlayer].roundBank : 0);
  document.getElementById('spinBtn').disabled = G.gameOver || G.turnLocked || G.awaitingLetterPick || G.players[G.currentPlayer].type!=='human';
  document.getElementById('guessPhraseBtn').disabled = G.gameOver || G.turnLocked || G.players[G.currentPlayer].type!=='human';
}

function renderTopbar(){
  document.getElementById('roundInfo').textContent = `Tur ${G.roundNumber}/${G.roundsTotal}`;
  updateTimerDisplay();
  const cur = G.players[G.currentPlayer];
  document.getElementById('turnBanner').textContent = `Sıra: ${cur.name}${cur.type==='cpu'?' 🤖':' 👤'}`;
  document.getElementById('categoryLabel').textContent = 'Kategori: ' + G.currentPhrase.category;
}

function renderPhrase(){
  const wrap = document.getElementById('phraseDisplay');
  wrap.innerHTML = '';
  G.currentPhrase.upper.split('').forEach(ch=>{
    if(ch===' '){
      const sp = document.createElement('div');
      sp.className='phraseSpace';
      wrap.appendChild(sp);
      return;
    }
    const box = document.createElement('div');
    box.className='phraseLetter';
    if(TR_ALPHABET.includes(ch)){
      box.textContent = G.guessedLetters[ch]==='hit' ? ch : '';
    } else {
      box.textContent = ch;
    }
    wrap.appendChild(box);
  });
}

function renderScoreboard(){
  const sb = document.getElementById('scoreboard');
  sb.innerHTML = '';
  G.players.forEach((p,i)=>{
    const pill = document.createElement('div');
    pill.className = 'scorePill' + (i===G.currentPlayer && !G.gameOver ? ' turn' : '');
    pill.innerHTML = `<span class="pName">${p.name}${p.type==='cpu'?' 🤖':''}</span>
      <span class="pScore">${p.score}</span>
      ${p.roundBank>0 ? '<span class="pBank">Bu tur: +'+p.roundBank+'</span>' : ''}`;
    sb.appendChild(pill);
  });
}

/* ============================================================
   MODAL
   ============================================================ */
function showModal(html){
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalOverlay').style.display = 'flex';
}
function closeModal(){
  document.getElementById('modalOverlay').style.display = 'none';
}

/* ============================================================
   KAYIT / DURAKLAT / DEVAM
   ============================================================ */
function saveState(){
  if(!G) return;
  try{
    const copy = {...G, timerHandle:null};
    localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
  }catch(e){}
}
function loadState(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function clearState(){
  try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
}

function pauseGame(reason, requirePassword){
  if(!G || G.gameOver) return;
  G.gameOver = true;
  clearInterval(G.timerHandle); G.timerHandle=null;
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
  G.turnLocked = false;
  playResumeSound();
  if(G.mode==='child' && !G.timerHandle){ startTimer(); }
  renderAll();
  saveState();
  proceedTurn();
}

function showPauseModal(reason, requirePassword){
  const ranking = G.players.slice().sort((a,b)=>b.score-a.score);
  let html = `<h3>⏸️ Çarkıfelek Duraklatıldı</h3><p>${reason}</p><div>`;
  ranking.forEach((p,i)=>{ html += `<div class="scoreRow"><span>${i===0?'👑 ':''}${p.name}</span><b>${p.score}</b></div>`; });
  html += `</div><p style="font-size:12.5px;color:#666;">Tur ${G.roundNumber}/${G.roundsTotal}</p>`;

  if(requirePassword){
    html += `<div style="margin-top:10px;">
        <input type="password" id="resumePassInput" placeholder="Ebeveyn şifresi">
        <button class="primaryBtn" id="resumePassBtn">Devam Et</button>
      </div>
      <p style="font-size:12px;color:#666;">Şifre girmezseniz oyun duraklatılmış kalır.</p>
      <div class="btnrow"><button class="close" id="backToMenuBtn">Ana Menüye Dön</button></div>`;
    showModal(html);
    document.getElementById('resumePassBtn').onclick = ()=>{
      const val = document.getElementById('resumePassInput').value;
      if(val==='1247'){
        G.mode='parent';
        log('👨‍👩‍👧 Ebeveyn şifresi doğrulandı, süre sınırı kaldırıldı.');
        closeModal();
        resumeGame();
      } else { alert('Şifre yanlış!'); }
    };
    document.getElementById('backToMenuBtn').onclick = ()=>{ closeModal(); saveState(); location.reload(); };
  } else {
    html += `<div class="btnrow">
        <button class="primaryBtn" id="continueBtn">▶️ Devam Et</button>
        <button class="close" id="newGameBtn">🆕 Yeni Maç</button>
      </div>`;
    showModal(html);
    document.getElementById('continueBtn').onclick = ()=>{ closeModal(); resumeGame(); };
    document.getElementById('newGameBtn').onclick = ()=>{ clearState(); location.reload(); };
  }
  log(`⏸️ Çarkıfelek duraklatıldı: ${reason}`);
}
