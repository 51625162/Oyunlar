/* ============================ VERİ TANIMLARI ============================ */

const CROPS = [
  {id:'bugday', name:'Buğday', icon:'🌾', seedCost:5, growSeconds:20, sellPrice:12, xp:3},
  {id:'misir', name:'Mısır', icon:'🌽', seedCost:10, growSeconds:35, sellPrice:22, xp:5},
  {id:'domates', name:'Domates', icon:'🍅', seedCost:18, growSeconds:55, sellPrice:38, xp:8}
];

const ANIMALS = [
  {id:'tavuk', name:'Tavuk', icon:'🐔', buyCost:30, feedCost:3, produceSeconds:25, product:'Yumurta', productIcon:'🥚', sellPrice:15, xp:4},
  {id:'inek', name:'İnek', icon:'🐄', buyCost:80, feedCost:8, produceSeconds:45, product:'Süt', productIcon:'🥛', sellPrice:30, xp:7}
];

const PLOT_COUNT = 8;
const PEN_COUNT = 4;
const SAVE_KEY = 'ciftlik_save_v1';

function cropById(id){ return CROPS.find(c=>c.id===id); }
function animalById(id){ return ANIMALS.find(a=>a.id===id); }

/* ============================ OYUN DURUMU ============================ */

let G = null;
let farmTickHandle = null;

function log(msg){
  const el = document.getElementById('log');
  const d = document.createElement('div');
  d.innerHTML = msg;
  el.prepend(d);
}
function fmt(n){ return Math.round(n).toLocaleString('tr-TR'); }

/* ============================ SES MOTORU (Web Audio API — dosya gerekmez) ============================ */

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

function playPlantSound(){ // Ekim sesi
  [392,466.16,523.25].forEach((f,i)=>beep(f,0.12,'sine',i*0.07,0.16));
}
function playHarvestSound(){ // Hasat sesi
  [659.25,783.99,987.77].forEach((f,i)=>beep(f,0.14,'triangle',i*0.06,0.18));
}
function playCoinSound(){ // Para kazanma "cha-ching"
  [880,1108.73,1318.5].forEach((f,i)=>beep(f,0.12,'square',i*0.05,0.14));
}
function playFeedSound(){ // Hayvan besleme
  [294,349.23,415.3].forEach((f,i)=>beep(f,0.13,'sine',i*0.08,0.17));
}
function playCollectSound(){ // Ürün toplama (yumurta/süt)
  [523.25,659.25,880].forEach((f,i)=>beep(f,0.13,'triangle',i*0.07,0.18));
}
function playLevelUpSound(){ // Seviye atlama
  [523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>beep(f,0.2,'sine',i*0.1,0.22));
}
function playErrorSound(){ // Yetersiz para / hatalı işlem
  [220,196].forEach((f,i)=>beep(f,0.18,'sawtooth',i*0.15,0.18));
}
function playBuyAnimalSound(){ // Hayvan satın alma
  [349.23,440,523.25,659.25].forEach((f,i)=>beep(f,0.13,'sine',i*0.07,0.18));
}
function playPauseSound(){ // Süre doldu / duraklatma
  [392,349.23,311.13,261.63].forEach((f,i)=>beep(f,0.22,'sawtooth',i*0.16,0.18));
}
function playResumeSound(){ // Devam etme
  [523.25,659.25,880,1046.5].forEach((f,i)=>beep(f,0.16,'sine',i*0.08,0.2));
}

/* ============================ KURULUM ============================ */

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
  startGame(mode);
});

document.getElementById('resumeBtn').addEventListener('click', ()=>{
  const saved = loadState();
  if(!saved){ alert('Kayıtlı çiftlik bulunamadı.'); checkResume(); return; }
  G = saved;
  G.timerHandle = null;
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  renderAll();
  resumeGame();
});

function checkResume(){
  const saved = loadState();
  const box = document.getElementById('resumeBox');
  if(box) box.style.display = saved ? 'block' : 'none';
}
checkResume();

/* ============================ OYUN BAŞLATMA ============================ */

function startGame(mode){
  G = {
    mode: mode || 'child',
    coins: 50,
    xp: 0,
    level: 1,
    timeLeft: 30*60,
    gameOver: false,
    timerHandle: null,
    plots: Array.from({length:PLOT_COUNT}, ()=>({crop:null, plantedAt:null})),
    pens: Array.from({length:PEN_COUNT}, ()=>({animal:null, state:'empty', fedAt:null}))
  };
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  renderAll();
  startTimer();
  startFarmTick();
  log('🚜 Çiftliğine hoş geldin! Başlangıç sermayen: 💰 50');
}

/* ============================ ZAMAN / SÜRE ============================ */

function startTimer(){
  if(G.mode==='parent'){
    updateTimerDisplay();
    return;
  }
  G.timerHandle = setInterval(()=>{
    if(G.gameOver) return;
    G.timeLeft--;
    updateTimerDisplay();
    if(G.timeLeft<=0){
      pauseGame('⏰ 30 dakikalık çocuk süresi doldu!', true);
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

function startFarmTick(){
  clearInterval(farmTickHandle);
  farmTickHandle = setInterval(()=>{
    if(!G) return;
    renderFarm();
    renderBarn();
    saveState();
  }, 1000);
}

/* ============================ ÜST BAR / XP ============================ */

function xpForLevel(level){ return level*50; }

function addXp(amount){
  G.xp += amount;
  let leveled = false;
  while(G.xp >= xpForLevel(G.level)){
    G.xp -= xpForLevel(G.level);
    G.level++;
    leveled = true;
  }
  if(leveled){
    playLevelUpSound();
    log(`⭐ Tebrikler! Seviye <b>${G.level}</b> oldun!`);
  }
  updateTopbar();
}

function updateTopbar(){
  if(!G) return;
  document.getElementById('coinsDisplay').textContent = fmt(G.coins);
  document.getElementById('levelDisplay').textContent = G.level;
  const pct = Math.min(100, Math.round((G.xp / xpForLevel(G.level))*100));
  document.getElementById('xpBarFill').style.width = pct+'%';
  updateTimerDisplay();
}

/* ============================ SEKME YÖNETİMİ ============================ */

function switchTab(name){
  ['farmTab','barnTab','helpTab'].forEach(id=>document.getElementById(id).classList.remove('show'));
  ['tabFarmBtn','tabBarnBtn','tabHelpBtn'].forEach(id=>document.getElementById(id).classList.remove('active'));
  document.getElementById(name+'Tab').classList.add('show');
  document.getElementById('tab'+name.charAt(0).toUpperCase()+name.slice(1)+'Btn').classList.add('active');
}
document.getElementById('tabFarmBtn').addEventListener('click', ()=>switchTab('farm'));
document.getElementById('tabBarnBtn').addEventListener('click', ()=>switchTab('barn'));
document.getElementById('tabHelpBtn').addEventListener('click', ()=>switchTab('help'));

document.getElementById('endGameBtn').addEventListener('click', ()=>{
  if(confirm('Çiftliği duraklatmak istediğine emin misin? Daha sonra kaldığın yerden devam edebilirsin.')){
    pauseGame('Çiftlik kullanıcı tarafından duraklatıldı.', false);
  }
});

/* ============================ TARLA (CROPS) ============================ */

function renderFarm(){
  const grid = document.getElementById('farmGrid');
  grid.innerHTML = '';
  G.plots.forEach((plot, idx)=>{
    const div = document.createElement('div');
    if(!plot.crop){
      div.className = 'plot empty';
      div.innerHTML = `<div class="icon">➕</div><div class="label">Boş Tarla</div>`;
      div.onclick = ()=>openPlantModal(idx);
    } else {
      const crop = cropById(plot.crop);
      const elapsed = (Date.now() - plot.plantedAt)/1000;
      if(elapsed >= crop.growSeconds){
        div.className = 'plot ready';
        div.innerHTML = `<div class="icon">${crop.icon}</div><div class="label">Hasat Et! 💰${crop.sellPrice}</div>`;
        div.onclick = ()=>harvestPlot(idx);
      } else {
        const remain = Math.ceil(crop.growSeconds - elapsed);
        div.className = 'plot growing';
        div.innerHTML = `<div class="icon">🌱${crop.icon}</div><div class="label">${remain} sn</div>`;
      }
    }
    grid.appendChild(div);
  });
}

function openPlantModal(idx){
  if(G.gameOver) return;
  let html = `<h3>🌱 Ne Ekmek İstersin?</h3>`;
  CROPS.forEach(c=>{
    html += `<div class="optionRow">
      <span>${c.icon} <b>${c.name}</b> — Tohum: 💰${c.seedCost} | Büyüme: ${c.growSeconds}sn | Satış: 💰${c.sellPrice}</span>
      <button onclick="plantCrop(${idx},'${c.id}')">Ek</button>
    </div>`;
  });
  html += `<div class="btnrow"><button class="close" onclick="closeModal()">Kapat</button></div>`;
  showModal(html);
}

function plantCrop(idx, cropId){
  const crop = cropById(cropId);
  if(G.coins < crop.seedCost){
    playErrorSound();
    alert('Yeterli paran yok!');
    return;
  }
  G.coins -= crop.seedCost;
  G.plots[idx] = {crop:cropId, plantedAt: Date.now()};
  playPlantSound();
  log(`🌱 ${crop.icon} ${crop.name} ektin.`);
  closeModal();
  updateTopbar();
  renderFarm();
  saveState();
}

function harvestPlot(idx){
  const plot = G.plots[idx];
  const crop = cropById(plot.crop);
  G.coins += crop.sellPrice;
  addXp(crop.xp);
  playHarvestSound();
  setTimeout(playCoinSound, 150);
  log(`🌾 ${crop.icon} ${crop.name} hasat ettin: +💰${crop.sellPrice}, +${crop.xp} XP`);
  G.plots[idx] = {crop:null, plantedAt:null};
  updateTopbar();
  renderFarm();
  saveState();
}

/* ============================ AHIR (ANIMALS) ============================ */

function renderBarn(){
  const grid = document.getElementById('barnGrid');
  grid.innerHTML = '';
  G.pens.forEach((pen, idx)=>{
    const div = document.createElement('div');
    if(!pen.animal){
      div.className = 'pen empty';
      div.innerHTML = `<div class="icon">➕</div><div class="label">Boş Ahır</div>`;
      div.onclick = ()=>openBuyAnimalModal(idx);
    } else {
      const animal = animalById(pen.animal);
      if(pen.state==='idle'){
        div.className = 'pen idle';
        div.innerHTML = `<div class="icon">${animal.icon}</div><div class="label">Besle (💰${animal.feedCost})</div>`;
        div.onclick = ()=>feedAnimal(idx);
      } else if(pen.state==='growing'){
        const elapsed = (Date.now() - pen.fedAt)/1000;
        if(elapsed >= animal.produceSeconds){
          div.className = 'pen ready';
          div.innerHTML = `<div class="icon">${animal.productIcon}</div><div class="label">Topla! 💰${animal.sellPrice}</div>`;
          div.onclick = ()=>collectProduct(idx);
        } else {
          const remain = Math.ceil(animal.produceSeconds - elapsed);
          div.className = 'pen growing';
          div.innerHTML = `<div class="icon">${animal.icon}</div><div class="label">${remain} sn</div>`;
        }
      }
    }
    grid.appendChild(div);
  });
}

function openBuyAnimalModal(idx){
  if(G.gameOver) return;
  let html = `<h3>🐔 Hangi Hayvanı Almak İstersin?</h3>`;
  ANIMALS.forEach(a=>{
    html += `<div class="optionRow">
      <span>${a.icon} <b>${a.name}</b> — Fiyat: 💰${a.buyCost} | Ürün: ${a.productIcon} ${a.product} (${a.produceSeconds}sn) | Satış: 💰${a.sellPrice}</span>
      <button onclick="buyAnimal(${idx},'${a.id}')">Al</button>
    </div>`;
  });
  html += `<div class="btnrow"><button class="close" onclick="closeModal()">Kapat</button></div>`;
  showModal(html);
}

function buyAnimal(idx, animalId){
  const animal = animalById(animalId);
  if(G.coins < animal.buyCost){
    playErrorSound();
    alert('Yeterli paran yok!');
    return;
  }
  G.coins -= animal.buyCost;
  G.pens[idx] = {animal:animalId, state:'idle', fedAt:null};
  playBuyAnimalSound();
  log(`🐾 ${animal.icon} ${animal.name} satın aldın.`);
  closeModal();
  updateTopbar();
  renderBarn();
  saveState();
}

function feedAnimal(idx){
  const pen = G.pens[idx];
  const animal = animalById(pen.animal);
  if(G.coins < animal.feedCost){
    playErrorSound();
    alert('Yeterli paran yok!');
    return;
  }
  G.coins -= animal.feedCost;
  pen.state = 'growing';
  pen.fedAt = Date.now();
  playFeedSound();
  log(`🌿 ${animal.icon} ${animal.name} besledin.`);
  updateTopbar();
  renderBarn();
  saveState();
}

function collectProduct(idx){
  const pen = G.pens[idx];
  const animal = animalById(pen.animal);
  G.coins += animal.sellPrice;
  addXp(animal.xp);
  playCollectSound();
  setTimeout(playCoinSound, 150);
  log(`${animal.productIcon} ${animal.product} topladın: +💰${animal.sellPrice}, +${animal.xp} XP`);
  pen.state = 'idle';
  pen.fedAt = null;
  updateTopbar();
  renderBarn();
  saveState();
}

/* ============================ MODAL ============================ */

function showModal(html){
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalOverlay').style.display='flex';
}
function closeModal(){
  document.getElementById('modalOverlay').style.display='none';
}

/* ============================ KAYIT / DEVAM ETME ============================ */

function saveState(){
  if(!G) return;
  try{
    const copy = {...G, timerHandle:null};
    localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
  }catch(e){ /* localStorage kullanılamıyor olabilir */ }
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
  G.gameOver = false;
  playResumeSound();
  if(G.mode==='child' && !G.timerHandle){ startTimer(); }
  startFarmTick();
  updateTopbar();
  renderFarm();
  renderBarn();
  saveState();
}

function showPauseModal(reason, requirePassword){
  let html = `<h3>⏸️ Çiftlik Duraklatıldı</h3><p>${reason}</p>
    <p>💰 Paran: ${fmt(G.coins)} — ⭐ Seviye: ${G.level}</p>`;

  if(requirePassword){
    html += `<div style="margin-top:10px;">
        <input type="password" id="resumePassInput" placeholder="Ebeveyn şifresi">
        <button class="optionRow" style="display:inline-block;" id="resumePassBtn">Devam Et</button>
      </div>
      <p class="hint">Şifre girmezseniz çiftlik duraklatılmış kalır; ana menüden "Kaldığın Yerden Devam Et" ile şifreyi girip sürdürebilirsiniz.</p>
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
        <button style="background:#2e7d32;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:bold;" id="continueBtn">▶️ Devam Et</button>
        <button class="close" id="newGameBtn">🆕 Yeni Çiftlik</button>
      </div>`;
    showModal(html);
    document.getElementById('continueBtn').onclick = ()=>{ closeModal(); resumeGame(); };
    document.getElementById('newGameBtn').onclick = ()=>{ clearState(); location.reload(); };
  }
  log(`⏸️ Çiftlik duraklatıldı: ${reason}`);
}

/* ============================ GENEL RENDER ============================ */

function renderAll(){
  updateTopbar();
  renderFarm();
  renderBarn();
}
