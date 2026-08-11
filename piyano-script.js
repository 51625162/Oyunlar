/* ============================================================
   NOTA VERİLERİ
   ============================================================ */
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const SOLFEGE = {C:'Do',D:'Re',E:'Mi',F:'Fa',G:'Sol',A:'La',B:'Si'};
const BLACK_AFTER = {C:0,D:1,F:3,G:4,A:5}; // beyaz tuş yerel index'inden sonra siyah tuş var

function noteFreq(name, octave){
  const idx = NOTE_NAMES.indexOf(name);
  const midi = (octave+1)*12 + idx;
  return 440 * Math.pow(2, (midi-69)/12);
}
function noteLabel(name){
  if(name.length===2){ return SOLFEGE[name[0]] + '♯'; }
  return SOLFEGE[name];
}
function noteKey(name, octave){ return name+octave; }

const KEY_MAP = {
  4: { 'C':'z','D':'x','E':'c','F':'v','G':'b','A':'n','B':'m',
       'C#':'s','D#':'d','F#':'g','G#':'h','A#':'j' },
  5: { 'C':'q','D':'w','E':'e','F':'r','G':'t','A':'y','B':'u',
       'C#':'2','D#':'3','F#':'5','G#':'6','A#':'7' }
};

const SONGS = [
  { name:'Do-Re-Mi Gam Egzersizi', notes:[
    {n:'C',o:4},{n:'D',o:4},{n:'E',o:4},{n:'F',o:4},{n:'G',o:4},{n:'A',o:4},{n:'B',o:4},{n:'C',o:5},
    {n:'C',o:5},{n:'B',o:4},{n:'A',o:4},{n:'G',o:4},{n:'F',o:4},{n:'E',o:4},{n:'D',o:4},{n:'C',o:4}
  ]},
  { name:'Twinkle Twinkle / Daha Dün Annemizin', notes:[
    {n:'C',o:4},{n:'C',o:4},{n:'G',o:4},{n:'G',o:4},{n:'A',o:4},{n:'A',o:4},{n:'G',o:4},
    {n:'F',o:4},{n:'F',o:4},{n:'E',o:4},{n:'E',o:4},{n:'D',o:4},{n:'D',o:4},{n:'C',o:4},
    {n:'G',o:4},{n:'G',o:4},{n:'F',o:4},{n:'F',o:4},{n:'E',o:4},{n:'E',o:4},{n:'D',o:4},
    {n:'G',o:4},{n:'G',o:4},{n:'F',o:4},{n:'F',o:4},{n:'E',o:4},{n:'E',o:4},{n:'D',o:4},
    {n:'C',o:4},{n:'C',o:4},{n:'G',o:4},{n:'G',o:4},{n:'A',o:4},{n:'A',o:4},{n:'G',o:4},
    {n:'F',o:4},{n:'F',o:4},{n:'E',o:4},{n:'E',o:4},{n:'D',o:4},{n:'D',o:4},{n:'C',o:4}
  ]},
  { name:'Mary Had a Little Lamb (Kuzucuğum)', notes:[
    {n:'E',o:4},{n:'D',o:4},{n:'C',o:4},{n:'D',o:4},{n:'E',o:4},{n:'E',o:4},{n:'E',o:4},
    {n:'D',o:4},{n:'D',o:4},{n:'D',o:4},{n:'E',o:4},{n:'G',o:4},{n:'G',o:4},
    {n:'E',o:4},{n:'D',o:4},{n:'C',o:4},{n:'D',o:4},{n:'E',o:4},{n:'E',o:4},{n:'E',o:4},{n:'E',o:4},
    {n:'D',o:4},{n:'D',o:4},{n:'E',o:4},{n:'D',o:4},{n:'C',o:4}
  ]}
];

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
function synthDef(waveType){
  if(waveType==='organ') return [{mult:1,type:'sine',gain:0.55},{mult:2,type:'sine',gain:0.5},{mult:3,type:'sine',gain:0.3},{mult:4,type:'sine',gain:0.2}];
  if(waveType==='synth') return [{mult:1,type:'sawtooth',gain:0.6},{mult:2,type:'square',gain:0.15}];
  return [{mult:1,type:'sine',gain:1},{mult:2,type:'sine',gain:0.28},{mult:3,type:'triangle',gain:0.12},{mult:4,type:'sine',gain:0.06}]; // piano
}
function startNote(key, freq){
  const ctx = getAudioCtx();
  if(!ctx) return;
  if(G.activeNotes[key]) stopNoteImmediate(key);
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.linearRampToValueAtTime(G.volume, ctx.currentTime+0.015);
  master.connect(ctx.destination);
  const oscs = synthDef(G.waveType).map(h=>{
    const osc = ctx.createOscillator();
    osc.type = h.type;
    osc.frequency.value = freq*h.mult;
    const g = ctx.createGain();
    g.gain.value = h.gain;
    osc.connect(g); g.connect(master);
    osc.start();
    return osc;
  });
  G.activeNotes[key] = {oscs, gain:master};
}
function stopNote(key){
  const active = G.activeNotes[key];
  if(!active) return;
  const ctx = getAudioCtx();
  const releaseTime = G.sustain ? 1.1 : 0.22;
  const now = ctx.currentTime;
  try{
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setValueAtTime(Math.max(0.0001, active.gain.gain.value), now);
    active.gain.gain.exponentialRampToValueAtTime(0.0001, now+releaseTime);
    active.oscs.forEach(o=>o.stop(now+releaseTime+0.05));
  }catch(e){}
  delete G.activeNotes[key];
}
function stopNoteImmediate(key){
  const active = G.activeNotes[key];
  if(!active) return;
  try{ active.oscs.forEach(o=>o.stop()); }catch(e){}
  delete G.activeNotes[key];
}
function playPreviewSound(){ // kısa onay sesi (kayıt vs.)
  const ctx = getAudioCtx(); if(!ctx) return;
  [523.25,659.25].forEach((f,i)=>{
    const osc=ctx.createOscillator(), g=ctx.createGain();
    osc.type='sine'; osc.frequency.value=f;
    const start=ctx.currentTime+i*0.08;
    g.gain.setValueAtTime(0.0001,start);
    g.gain.linearRampToValueAtTime(0.18,start+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,start+0.15);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(start); osc.stop(start+0.2);
  });
}
function playSuccessSound(){
  const ctx = getAudioCtx(); if(!ctx) return;
  [523.25,659.25,783.99,1046.5].forEach((f,i)=>{
    const osc=ctx.createOscillator(), g=ctx.createGain();
    osc.type='sine'; osc.frequency.value=f;
    const start=ctx.currentTime+i*0.1;
    g.gain.setValueAtTime(0.0001,start);
    g.gain.linearRampToValueAtTime(0.2,start+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,start+0.22);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(start); osc.stop(start+0.25);
  });
}
function playPauseSound(){ beepSeq([392,349.23,311.13,261.63],0.2,'sawtooth',0.16,0.18); }
function playResumeSound(){ beepSeq([523.25,659.25,880,1046.5],0.15,'sine',0.08,0.2); }
function beepSeq(freqs,dur,type,gapMs,vol){
  const ctx=getAudioCtx(); if(!ctx) return;
  freqs.forEach((f,i)=>{
    const osc=ctx.createOscillator(), g=ctx.createGain();
    osc.type=type; osc.frequency.value=f;
    const start=ctx.currentTime+i*gapMs;
    g.gain.setValueAtTime(0.0001,start);
    g.gain.linearRampToValueAtTime(vol,start+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,start+dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(start); osc.stop(start+dur+0.03);
  });
}

/* ============================================================
   DURUM
   ============================================================ */
const SAVE_KEY = 'piyano_save_v1';
let G = null;

function log(msg){
  const el = document.getElementById('log');
  if(!el) return;
  const d = document.createElement('div');
  d.innerHTML = msg;
  el.prepend(d);
}

/* ============================================================
   KURULUM
   ============================================================ */
document.querySelectorAll('input[name="userMode"]').forEach(r=>{
  r.addEventListener('change', ()=>{
    const mode = document.querySelector('input[name="userMode"]:checked').value;
    document.getElementById('parentPassBox').style.display = (mode==='parent') ? 'block' : 'none';
  });
});

document.getElementById('startGameBtn').addEventListener('click', ()=>{
  const modeInput = document.querySelector('input[name="userMode"]:checked');
  const mode = modeInput ? modeInput.value : 'child';
  if(mode==='parent'){
    const pass = document.getElementById('parentPass').value;
    if(pass !== '1247'){ alert('Ebeveyn şifresi yanlış!'); return; }
  }
  clearState();
  unlockAudio();
  startSession(mode);
});

function unlockAudio(){
  const ctx = getAudioCtx();
  if(!ctx) return;
  // Sessiz, çok kısa bir sinyal çalıp durdurarak iOS/Safari'de sesin
  // ilk kullanıcı dokunuşunda kilidinin açılmasını garantiye alır.
  try{
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    osc.connect(g); g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime+0.05);
  }catch(e){}
}

document.getElementById('resumeBtn').addEventListener('click', ()=>{
  unlockAudio();
  const saved = loadState();
  if(!saved){ alert('Kayıtlı oturum bulunamadı.'); checkResume(); return; }
  G = saved;
  G.timerHandle = null;
  G.activeNotes = {};
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  buildPiano();
  applyControlsToUI();
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
   OTURUM BAŞLATMA
   ============================================================ */
function startSession(mode){
  G = {
    mode: mode || 'child',
    volume: 0.7,
    waveType: 'piano',
    sustain: false,
    isRecording: false,
    recordedNotes: [],
    recordStartTime: null,
    activeNotes: {},
    gameOver: false,
    timeLeft: (mode==='parent') ? DAILY_LIMIT_SECONDS : getSharedRemainingSeconds(),
    timerHandle: null
  };
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  buildPiano();
  applyControlsToUI();
  log('🎹 Piyano açıldı!');
  if(G.mode==='child' && G.timeLeft<=0){
    pauseGame('⏰ Bugünkü 30 dakikalık toplam oyun süreniz doldu! (Tüm oyunlar dahil)', true);
    return;
  }
  startTimer();
}

function applyControlsToUI(){
  document.getElementById('volumeSlider').value = Math.round(G.volume*100);
  document.getElementById('waveSelect').value = G.waveType;
  const sBtn = document.getElementById('sustainBtn');
  sBtn.textContent = '🎼 Sustain: ' + (G.sustain?'Açık':'Kapalı');
  sBtn.classList.toggle('on', G.sustain);
  document.getElementById('playRecordBtn').disabled = G.recordedNotes.length===0;
  document.getElementById('clearRecordBtn').disabled = G.recordedNotes.length===0;
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
  ['play','song','help'].forEach(n=>{
    document.getElementById(n+'Tab').classList.remove('show');
    document.getElementById('tab'+n.charAt(0).toUpperCase()+n.slice(1)+'Btn').classList.remove('active');
  });
  document.getElementById(name+'Tab').classList.add('show');
  document.getElementById('tab'+name.charAt(0).toUpperCase()+name.slice(1)+'Btn').classList.add('active');
  if(name==='song') renderSongList();
}
document.getElementById('tabPlayBtn').addEventListener('click', ()=>switchTab('play'));
document.getElementById('tabSongBtn').addEventListener('click', ()=>switchTab('song'));
document.getElementById('tabHelpBtn').addEventListener('click', ()=>switchTab('help'));
document.getElementById('endGameBtn').addEventListener('click', ()=>{
  pauseGame('Oturum kullanıcı tarafından duraklatıldı.', false);
});

/* ============================================================
   PİYANO KLAVYESİ OLUŞTURMA
   ============================================================ */
const OCTAVES = [3,4,5];
const WHITE_SEQ = ['C','D','E','F','G','A','B'];
const KEY_W = 44, BLACK_W = 28;

function buildPiano(){
  const piano = document.getElementById('piano');
  piano.innerHTML = '';
  let whiteIdx = 0;
  const blackKeysToAdd = [];

  OCTAVES.forEach(oct=>{
    WHITE_SEQ.forEach(n=>{
      const key = document.createElement('div');
      key.className = 'whiteKey';
      key.dataset.note = n; key.dataset.oct = oct;
      const hint = (KEY_MAP[oct] && KEY_MAP[oct][n]) ? KEY_MAP[oct][n].toUpperCase() : '';
      key.innerHTML = `<span class="keyLabel">${noteLabel(n)}<span class="keyHint">${n}${oct}${hint?(' · '+hint):''}</span></span>`;
      attachKeyEvents(key, n, oct);
      piano.appendChild(key);
      if(BLACK_AFTER[n]!==undefined){
        blackKeysToAdd.push({globalIdx:whiteIdx, note:n+'#', oct});
      }
      whiteIdx++;
    });
  });
  // sona tamamlayıcı bir C ekle
  const lastOct = OCTAVES[OCTAVES.length-1]+1;
  const lastKey = document.createElement('div');
  lastKey.className='whiteKey'; lastKey.dataset.note='C'; lastKey.dataset.oct=lastOct;
  lastKey.innerHTML = `<span class="keyLabel">${noteLabel('C')}<span class="keyHint">C${lastOct}</span></span>`;
  attachKeyEvents(lastKey, 'C', lastOct);
  piano.appendChild(lastKey);

  blackKeysToAdd.forEach(bk=>{
    const key = document.createElement('div');
    key.className = 'blackKey';
    key.dataset.note = bk.note; key.dataset.oct = bk.oct;
    key.style.left = ((bk.globalIdx+1)*KEY_W - BLACK_W/2) + 'px';
    const hint = (KEY_MAP[bk.oct] && KEY_MAP[bk.oct][bk.note]) ? KEY_MAP[bk.oct][bk.note].toUpperCase() : '';
    key.innerHTML = `<span class="keyLabel">${noteLabel(bk.note)}<span class="keyHint">${hint}</span></span>`;
    attachKeyEvents(key, bk.note, bk.oct);
    piano.appendChild(key);
  });
}

function attachKeyEvents(el, note, oct){
  const press = (e)=>{ e.preventDefault(); pressKey(note, oct, el); };
  const release = (e)=>{ e.preventDefault(); releaseKey(note, oct, el); };
  el.addEventListener('mousedown', press);
  el.addEventListener('mouseup', release);
  el.addEventListener('mouseleave', release);
  el.addEventListener('touchstart', press, {passive:false});
  el.addEventListener('touchend', release, {passive:false});
}

function pressKey(note, oct, el){
  if(!G || G.gameOver) return;
  const key = noteKey(note, oct);
  startNote(key, noteFreq(note, oct));
  if(el) el.classList.add('active');
  if(G.isRecording){
    G.recordedNotes.push({note, oct, t: Date.now()-G.recordStartTime, phase:'on'});
  }
  checkSongProgress(note, oct);
}
function releaseKey(note, oct, el){
  if(!G) return;
  const key = noteKey(note, oct);
  stopNote(key);
  if(el) el.classList.remove('active');
  if(G.isRecording){
    G.recordedNotes.push({note, oct, t: Date.now()-G.recordStartTime, phase:'off'});
  }
}

/* Bilgisayar klavyesi */
const pressedComputerKeys = {};
document.addEventListener('keydown', (e)=>{
  if(!G || G.gameOver) return;
  const k = e.key.toLowerCase();
  if(pressedComputerKeys[k]) return;
  const found = findNoteForComputerKey(k);
  if(found){
    pressedComputerKeys[k] = found;
    const el = document.querySelector(`[data-note="${found.note}"][data-oct="${found.oct}"]`);
    pressKey(found.note, found.oct, el);
  }
});
document.addEventListener('keyup', (e)=>{
  const k = e.key.toLowerCase();
  const found = pressedComputerKeys[k];
  if(found){
    const el = document.querySelector(`[data-note="${found.note}"][data-oct="${found.oct}"]`);
    releaseKey(found.note, found.oct, el);
    delete pressedComputerKeys[k];
  }
});
function findNoteForComputerKey(k){
  for(const oct in KEY_MAP){
    for(const note in KEY_MAP[oct]){
      if(KEY_MAP[oct][note]===k) return {note, oct:parseInt(oct,10)};
    }
  }
  return null;
}

/* ============================================================
   KONTROLLER
   ============================================================ */
document.getElementById('volumeSlider').addEventListener('input', (e)=>{
  if(!G) return;
  G.volume = e.target.value/100;
  saveState();
});
document.getElementById('waveSelect').addEventListener('change', (e)=>{
  if(!G) return;
  G.waveType = e.target.value;
  saveState();
});
document.getElementById('testSoundBtn').addEventListener('click', ()=>{
  unlockAudio();
  playSuccessSound();
  log('🔊 Ses testi çalındı — eğer duymadıysan cihazının sessiz anahtarını/ses düzeyini ve Safari sekmesindeki ses simgesini kontrol et.');
});
document.getElementById('sustainBtn').addEventListener('click', ()=>{
  if(!G) return;
  G.sustain = !G.sustain;
  applyControlsToUI();
  saveState();
});
document.getElementById('recordBtn').addEventListener('click', ()=>{
  if(!G) return;
  if(!G.isRecording){
    G.isRecording = true;
    G.recordedNotes = [];
    G.recordStartTime = Date.now();
    document.getElementById('recordBtn').textContent = '⏹️ Kaydı Bitir';
    document.getElementById('recordBtn').classList.add('on');
    playPreviewSound();
    log('⏺️ Kayıt başladı.');
  } else {
    G.isRecording = false;
    document.getElementById('recordBtn').textContent = '⏺️ Kaydet';
    document.getElementById('recordBtn').classList.remove('on');
    log('⏹️ Kayıt bitti. ('+G.recordedNotes.filter(n=>n.phase==='on').length+' nota)');
    applyControlsToUI();
    saveState();
  }
});
document.getElementById('playRecordBtn').addEventListener('click', ()=>{
  if(!G || G.recordedNotes.length===0) return;
  log('▶️ Kayıt çalınıyor...');
  G.recordedNotes.forEach(evt=>{
    setTimeout(()=>{
      const el = document.querySelector(`[data-note="${evt.note}"][data-oct="${evt.oct}"]`);
      if(evt.phase==='on') pressKey(evt.note, evt.oct, el);
      else releaseKey(evt.note, evt.oct, el);
    }, evt.t);
  });
});
document.getElementById('clearRecordBtn').addEventListener('click', ()=>{
  if(!G) return;
  G.recordedNotes = [];
  applyControlsToUI();
  saveState();
  log('🗑️ Kayıt silindi.');
});

/* ============================================================
   ŞARKI EŞLİĞİ
   ============================================================ */
let songState = null;

function renderSongList(){
  const list = document.getElementById('songList');
  list.innerHTML = '';
  SONGS.forEach((song, idx)=>{
    const row = document.createElement('div');
    row.className = 'songItem';
    row.innerHTML = `<span>🎵 ${song.name} (${song.notes.length} nota)</span><button>Başlat</button>`;
    row.querySelector('button').onclick = ()=>startSong(idx);
    list.appendChild(row);
  });
  document.getElementById('songPlayArea').style.display = songState ? 'block' : 'none';
}

function startSong(idx){
  songState = { songIdx: idx, pos: 0 };
  document.getElementById('songPlayArea').style.display = 'block';
  document.getElementById('songTitle').textContent = '🎵 ' + SONGS[idx].name;
  renderSongProgress();
}
function renderSongProgress(){
  if(!songState) return;
  const song = SONGS[songState.songIdx];
  const cur = song.notes[songState.pos];
  if(!cur){
    document.getElementById('songProgress').textContent = '🎉 Şarkı tamamlandı!';
    return;
  }
  document.getElementById('songProgress').innerHTML =
    `Sıradaki nota: <b>${noteLabel(cur.n)} (${cur.n}${cur.o})</b> — İlerleme: ${songState.pos}/${song.notes.length}`;
}
function checkSongProgress(note, oct){
  if(!songState) return;
  const song = SONGS[songState.songIdx];
  const expected = song.notes[songState.pos];
  if(!expected) return;
  if(expected.n===note && expected.o===oct){
    songState.pos++;
    if(songState.pos>=song.notes.length){
      playSuccessSound();
      log('🎉 "'+song.name+'" şarkısını tamamladın!');
      renderSongProgress();
      setTimeout(()=>{ songState=null; renderSongList(); }, 1800);
    } else {
      renderSongProgress();
    }
  }
}
document.getElementById('stopSongBtn').addEventListener('click', ()=>{
  songState = null;
  renderSongList();
});

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
    const copy = {...G, timerHandle:null, activeNotes:{}, isRecording:false};
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
  Object.keys(G.activeNotes).forEach(k=>stopNoteImmediate(k));
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
  updateTimerDisplay();
  saveState();
}

function showPauseModal(reason, requirePassword){
  let html = `<h3>⏸️ Piyano Duraklatıldı</h3><p>${reason}</p>`;
  if(requirePassword){
    html += `<div style="margin-top:10px;">
        <input type="password" id="resumePassInput" placeholder="Ebeveyn şifresi">
        <button class="primaryBtn" id="resumePassBtn">Devam Et</button>
      </div>
      <p style="font-size:12px;color:#666;">Şifre girmezseniz oturum duraklatılmış kalır.</p>
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
        <button class="close" id="newGameBtn">🏠 Ana Menü</button>
      </div>`;
    showModal(html);
    document.getElementById('continueBtn').onclick = ()=>{ closeModal(); resumeGame(); };
    document.getElementById('newGameBtn').onclick = ()=>{ location.href='index.html'; };
  }
  log(`⏸️ Piyano duraklatıldı: ${reason}`);
}
