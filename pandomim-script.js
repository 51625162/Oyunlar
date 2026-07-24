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
function playCorrectSound(){ [659.25,880,1046.5].forEach((f,i)=>beep(f,0.14,'sine',i*0.07,0.2)); }
function playWrongSound(){ [220,180].forEach((f,i)=>beep(f,0.22,'sawtooth',i*0.14,0.22)); }
function playGiveUpSound(){ [300,240].forEach((f,i)=>beep(f,0.18,'square',i*0.12,0.16)); }
function playPassSound(){ [392,330].forEach((f,i)=>beep(f,0.14,'triangle',i*0.09,0.16)); }
function playTimeUpSound(){
  // Belirgin, uzun "süre bitti" uyarı sesi (siren benzeri iniş-çıkış)
  [880,660,880,660,440,330].forEach((f,i)=>beep(f,0.28,'sawtooth',i*0.2,0.26));
}
function playTurnStartSound(){ [523.25,659.25,783.99].forEach((f,i)=>beep(f,0.14,'sine',i*0.08,0.2)); }
function playCountdownBeep(){ beep(880,0.16,'square',0,0.28); }
function playGongSound(){
  // Derin, uzun yankılanan gong sesi (birkaç frekansın üst üste binmesiyle)
  beep(98, 2.4, 'sine', 0, 0.32);
  beep(146.83, 2.1, 'triangle', 0.02, 0.18);
  beep(196, 1.9, 'sine', 0.03, 0.14);
  beep(73.42, 2.6, 'sawtooth', 0, 0.1);
}
function playWinSound(){ [523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>beep(f,0.22,'sine',i*0.1,0.22)); }
function playLoseSound(){ [293.66,261.63,220,196,146.83].forEach((f,i)=>beep(f,0.35,'square',i*0.22,0.2)); }
function playPauseSound(){ [392,349.23,311.13,261.63].forEach((f,i)=>beep(f,0.22,'sawtooth',i*0.16,0.18)); }
function playResumeSound(){ [523.25,659.25,880,1046.5].forEach((f,i)=>beep(f,0.16,'sine',i*0.08,0.2)); }

/* ============================ YARDIMCI ============================ */

const SAVE_KEY = 'pandomim_save_v1';
let G = null;

function log(msg){
  const el = document.getElementById('log');
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

/* ============================ KURULUM ============================ */

let setupParticipants = [];

function participantDefaultName(i){
  return (currentGameStyle()==='team' ? 'Takım ' : 'Oyuncu ') + (i+1);
}
function currentGameStyle(){
  const el = document.querySelector('input[name="gameStyle"]:checked');
  return el ? el.value : 'individual';
}

function renderParticipants(){
  document.getElementById('participantsLabel').textContent = currentGameStyle()==='team' ? 'Takımlar' : 'Oyuncular';
  const list = document.getElementById('participantsList');
  list.innerHTML = '';
  setupParticipants.forEach((p, idx)=>{
    const row = document.createElement('div');
    row.className = 'participantRow';
    row.innerHTML = `
      <input type="text" value="${p.name}" data-idx="${idx}" class="nameInput" placeholder="İsim">
      ${setupParticipants.length>2 ? `<button class="remove" data-idx="${idx}">Sil</button>` : ''}
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('.nameInput').forEach(inp=>{
    inp.addEventListener('input', e=>{ setupParticipants[+e.target.dataset.idx].name = e.target.value; });
  });
  list.querySelectorAll('button.remove').forEach(btn=>{
    btn.addEventListener('click', e=>{ setupParticipants.splice(+e.target.dataset.idx,1); renderParticipants(); });
  });
}
function initSetupParticipants(){
  setupParticipants = [
    {name: currentGameStyle()==='team' ? 'Takım 1' : 'Oyuncu 1'},
    {name: currentGameStyle()==='team' ? 'Takım 2' : 'Oyuncu 2'}
  ];
  renderParticipants();
}
initSetupParticipants();

document.querySelectorAll('input[name="gameStyle"]').forEach(r=>{
  r.addEventListener('change', ()=>{ initSetupParticipants(); });
});

document.getElementById('addParticipantBtn').addEventListener('click', ()=>{
  if(setupParticipants.length>=8){ alert('En fazla 8 katılımcı eklenebilir.'); return; }
  setupParticipants.push({name: participantDefaultName(setupParticipants.length)});
  renderParticipants();
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
  CATEGORY_ORDER.forEach(key=>{
    const cat = CATEGORIES[key];
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${key}" checked> ${cat.label} (${cat.items.length})`;
    box.appendChild(label);
  });
}
renderCategoryBox();

document.getElementById('startGameBtn').addEventListener('click', ()=>{
  if(setupParticipants.length<2){ alert('En az 2 katılımcı gerekli.'); return; }
  for(const p of setupParticipants){ if(!p.name.trim()){ alert('Tüm katılımcıların bir adı olmalı.'); return; } }
  const modeInput = document.querySelector('input[name="userMode"]:checked');
  const mode = modeInput ? modeInput.value : 'child';
  if(mode==='parent'){
    const pass = document.getElementById('parentPass').value;
    if(pass !== '1247'){ alert('Ebeveyn şifresi yanlış!'); return; }
  }
  const selectedCats = Array.from(document.querySelectorAll('#categoryBox input:checked')).map(el=>el.value);
  if(selectedCats.length===0){ alert('En az bir kategori seçmelisiniz.'); return; }
  const style = currentGameStyle();
  const roundsTotal = parseInt(document.getElementById('roundCount').value,10) || 3;
  clearState();
  startMatch(mode, style, selectedCats, roundsTotal);
});

document.getElementById('resumeBtn').addEventListener('click', ()=>{
  const saved = loadState();
  if(!saved){ alert('Kayıtlı Pandomim oyunu bulunamadı.'); checkResume(); return; }
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

/* ============================ MAÇ BAŞLATMA ============================ */

function buildPool(selectedCats){
  let pool = [];
  selectedCats.forEach(key=>{
    CATEGORIES[key].items.forEach(item=>{
      pool.push({name:item.name, emoji:item.emoji, taboo:item.taboo, category:key});
    });
  });
  return pool;
}

function startMatch(mode, style, selectedCats, roundsTotal){
  const pool = buildPool(selectedCats);
  G = {
    mode: mode || 'child',
    gameStyle: style,
    participants: setupParticipants.map((p,i)=>({id:i, name:p.name, score:0})),
    roundsTotal,
    turnGlobalIndex: 0,
    pool,
    deck: shuffle(pool),
    deckPos: 0,
    turnTimeLeft: 60,
    passesLeft: 3,
    turnActive: false,
    currentCard: null,
    turnStats: {correct:0, wrong:0, giveup:0, pass:0},
    gameOver: false,
    timeLeft: (mode==='parent') ? DAILY_LIMIT_SECONDS : getSharedRemainingSeconds(),
    timerHandle: null
  };
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  log(`🎭 Pandomim başladı! <b>${style==='team'?'Takım':'Bireysel'} modu</b> — ${G.participants.map(p=>p.name).join(', ')} — ${roundsTotal} tur.`);
  if(G.mode==='child' && G.timeLeft<=0){
    pauseGame('⏰ Bugünkü 30 dakikalık toplam oyun süreniz doldu! (Tüm oyunlar dahil)', true);
    return;
  }
  beginTurn();
}

/* ============================ TUR AKIŞI ============================ */

function totalTurns(){ return G.roundsTotal * G.participants.length; }
function currentParticipantIdx(){ return G.turnGlobalIndex % G.participants.length; }
function currentRoundNumber(){ return Math.floor(G.turnGlobalIndex / G.participants.length) + 1; }

function beginTurn(){
  if(G.gameOver) return;
  G.turnActive = false;
  const p = G.participants[currentParticipantIdx()];
  document.getElementById('roundInfo').textContent = `Tur ${currentRoundNumber()}/${G.roundsTotal}`;
  document.getElementById('turnBanner').textContent = `Sıra: ${p.name} — Hazır olduğunda başlat!`;
  document.getElementById('startTurnWrap').style.display = 'block';
  document.getElementById('actionButtons').style.display = 'none';
  document.getElementById('bigEmoji').textContent = '🎭';
  document.getElementById('cardName').textContent = 'Hazır mısın?';
  document.getElementById('tabooWords').innerHTML = '';
  document.getElementById('timerDisplay').textContent = '60';
  document.getElementById('timerDisplay').classList.remove('urgent');
  document.getElementById('passInfo').textContent = `🚫 Pas: 3/3`;
  renderScoreboard();
  saveState();
}

document.getElementById('startTurnBtn').addEventListener('click', ()=>{
  document.getElementById('startTurnWrap').style.display = 'none';
  runCountdown(()=>{
    document.getElementById('actionButtons').style.display = 'grid';
    G.turnActive = true;
    G.turnTimeLeft = 60;
    G.passesLeft = 3;
    G.turnStats = {correct:0, wrong:0, giveup:0, pass:0};
    drawNextCard();
    startTurnTimer();
  });
});

function runCountdown(onDone){
  const emojiEl = document.getElementById('bigEmoji');
  const nameEl = document.getElementById('cardName');
  document.getElementById('tabooWords').innerHTML = '';
  nameEl.textContent = 'Hazırlan!';
  const seq = [3,2,1];
  let i = 0;
  function step(){
    if(i < seq.length){
      emojiEl.textContent = String(seq[i]);
      playCountdownBeep();
      i++;
      setTimeout(step, 1000);
    } else {
      emojiEl.textContent = '🔔';
      nameEl.textContent = 'Başla!';
      playGongSound();
      setTimeout(onDone, 500);
    }
  }
  step();
}

function drawNextCard(){
  if(G.deckPos >= G.deck.length){
    G.deck = shuffle(G.pool);
    G.deckPos = 0;
  }
  G.currentCard = G.deck[G.deckPos];
  G.deckPos++;
  renderCard();
}

function renderCard(){
  const c = G.currentCard;
  document.getElementById('bigEmoji').textContent = c.emoji;
  document.getElementById('cardName').textContent = c.name;
  document.getElementById('tabooWords').innerHTML = c.taboo.map(t=>`<span>${t}</span>`).join('');
}

function startTurnTimer(){
  G.timerHandle = setInterval(()=>{
    if(!G.turnActive || G.gameOver) return;
    G.turnTimeLeft--;
    if(G.mode==='child'){
      G.timeLeft--;
      addSharedUsedSeconds(1);
      if(G.timeLeft<=0){
        clearInterval(G.timerHandle);
        G.timerHandle = null;
        pauseGame('⏰ Bugünkü 30 dakikalık toplam oyun süreniz doldu! (Tüm oyunlar dahil)', true);
        return;
      }
    }
    updateTurnTimerDisplay();
    if(G.turnTimeLeft<=0){
      endTurnTimeUp();
    }
  },1000);
}
function updateTurnTimerDisplay(){
  const el = document.getElementById('timerDisplay');
  el.textContent = G.turnTimeLeft;
  if(G.turnTimeLeft<=10) el.classList.add('urgent'); else el.classList.remove('urgent');
}

function endTurnTimeUp(){
  clearInterval(G.timerHandle);
  G.timerHandle = null;
  G.turnActive = false;
  playTimeUpSound();
  document.getElementById('actionButtons').style.display = 'none';
  const p = G.participants[currentParticipantIdx()];
  p.score += G.turnStats.correct;
  log(`⏰ <b>${p.name}</b> turu bitti! ✅ ${G.turnStats.correct} doğru, ❌ ${G.turnStats.wrong} hatalı, 🤷 ${G.turnStats.giveup} bilinemedi, 🚫 ${G.turnStats.pass} pas. Toplam puan: ${p.score}`);
  renderScoreboard();
  saveState();
  showTurnSummaryModal(p);
}

function showTurnSummaryModal(p){
  let html = `<h3>⏰ Süre Bitti!</h3><p><b>${p.name}</b> bu turda <b>${G.turnStats.correct}</b> puan kazandı.</p>
    <div class="statLine"><span>✅ Bildi</span><b>${G.turnStats.correct}</b></div>
    <div class="statLine"><span>❌ Hatalı</span><b>${G.turnStats.wrong}</b></div>
    <div class="statLine"><span>🤷 Bilemedi</span><b>${G.turnStats.giveup}</b></div>
    <div class="statLine"><span>🚫 Pas</span><b>${G.turnStats.pass}</b></div>
    <div class="btnrow"><button class="primaryBtn" id="nextTurnBtn">▶️ Devam Et</button></div>`;
  showModal(html);
  document.getElementById('nextTurnBtn').onclick = ()=>{
    closeModal();
    G.turnGlobalIndex++;
    if(G.turnGlobalIndex >= totalTurns()){
      matchEnd();
    } else {
      beginTurn();
    }
  };
}

/* ============================ AKSİYON DÜĞMELERİ ============================ */

function afterAction(){
  renderScoreboard();
  saveState();
  drawNextCard();
}

document.getElementById('btnCorrect').addEventListener('click', ()=>{
  if(!G || !G.turnActive) return;
  G.turnStats.correct++;
  playCorrectSound();
  afterAction();
});
document.getElementById('btnWrong').addEventListener('click', ()=>{
  if(!G || !G.turnActive) return;
  G.turnStats.wrong++;
  playWrongSound();
  afterAction();
});
document.getElementById('btnGiveUp').addEventListener('click', ()=>{
  if(!G || !G.turnActive) return;
  G.turnStats.giveup++;
  playGiveUpSound();
  afterAction();
});
document.getElementById('btnPass').addEventListener('click', ()=>{
  if(!G || !G.turnActive) return;
  if(G.passesLeft<=0) return;
  G.passesLeft--;
  G.turnStats.pass++;
  playPassSound();
  document.getElementById('passInfo').textContent = `🚫 Pas: ${G.passesLeft}/3`;
  document.getElementById('btnPass').disabled = (G.passesLeft<=0);
  afterAction();
});

/* ============================ SEKME YÖNETİMİ ============================ */

function switchTab(name){
  ['playTab','helpTab'].forEach(id=>document.getElementById(id).classList.remove('show'));
  ['tabPlayBtn','tabHelpBtn'].forEach(id=>document.getElementById(id).classList.remove('active'));
  document.getElementById(name+'Tab').classList.add('show');
  document.getElementById('tab'+name.charAt(0).toUpperCase()+name.slice(1)+'Btn').classList.add('active');
}
document.getElementById('tabPlayBtn').addEventListener('click', ()=>switchTab('play'));
document.getElementById('tabHelpBtn').addEventListener('click', ()=>switchTab('help'));

document.getElementById('endGameBtn').addEventListener('click', ()=>{
  if(confirm('Pandomim oyununu duraklatmak istediğine emin misin? Bu turun puanı kaydedilmeyecek, daha sonra kaldığın turdan devam edebilirsin.')){
    pauseGame('Oyun kullanıcı tarafından duraklatıldı.', false);
  }
});

/* ============================ SKOR TABLOSU ============================ */

function renderScoreboard(){
  const sb = document.getElementById('scoreboard');
  sb.innerHTML = '';
  const curIdx = currentParticipantIdx();
  G.participants.forEach((p,i)=>{
    const pill = document.createElement('div');
    pill.className = 'scorePill' + (i===curIdx && !G.gameOver ? ' turn' : '');
    pill.textContent = `${p.name}: ${p.score}`;
    sb.appendChild(pill);
  });
}

/* ============================ MAÇ SONU ============================ */

function matchEnd(){
  G.gameOver = true;
  clearInterval(G.timerHandle);
  G.timerHandle = null;
  const ranking = G.participants.slice().sort((a,b)=>b.score-a.score);
  playWinSound();
  setTimeout(playLoseSound, 500);
  let html = `<h3>🏁 Oyun Bitti!</h3><ol style="text-align:left;">`;
  ranking.forEach((p,i)=>{
    html += `<li><b>${p.name}</b> — ${p.score} puan ${i===0?'👑 Kazandı!':''}</li>`;
  });
  html += `</ol><div class="btnrow"><button class="primaryBtn" id="newMatchBtn">🆕 Yeni Oyun</button></div>`;
  showModal(html);
  document.getElementById('newMatchBtn').onclick = ()=>{ clearState(); location.reload(); };
  log(`🏁 OYUN SONA ERDİ! Kazanan: <b>${ranking[0].name}</b> (${ranking[0].score} puan)`);
  saveState();
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
  G.turnActive = false;
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
  renderScoreboard();
  saveState();
  beginTurn();
}

function showPauseModal(reason, requirePassword){
  const ranking = G.participants.slice().sort((a,b)=>b.score-a.score);
  let html = `<h3>⏸️ Pandomim Duraklatıldı</h3><p>${reason}</p><div>`;
  ranking.forEach((p,i)=>{
    html += `<div class="scoreRow"><span>${i===0?'👑 ':''}${p.name}</span><b>${p.score}</b></div>`;
  });
  html += `</div><p style="font-size:12.5px;color:#666;">Tur ${currentRoundNumber()}/${G.roundsTotal}</p>`;

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
        <button class="close" id="newGameBtn">🆕 Yeni Oyun</button>
      </div>`;
    showModal(html);
    document.getElementById('continueBtn').onclick = ()=>{ closeModal(); resumeGame(); };
    document.getElementById('newGameBtn').onclick = ()=>{ clearState(); location.reload(); };
  }
  log(`⏸️ Pandomim duraklatıldı: ${reason}`);
}
