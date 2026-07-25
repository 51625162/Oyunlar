/* ============================================================
   RASGELE SAYI ÜRETECİ (seed'e bağlı, tekrarlanabilir)
   ============================================================ */
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function randInt(rng, maxExclusive){ return Math.floor(rng()*maxExclusive); }

/* ============================================================
   LABİRENT ÜRETİMİ
   ============================================================ */
const DIRS = [
  {name:'top',    dr:-1, dc:0,  opp:'bottom'},
  {name:'right',  dr:0,  dc:1,  opp:'left'},
  {name:'bottom', dr:1,  dc:0,  opp:'top'},
  {name:'left',   dr:0,  dc:-1, opp:'right'}
];

function calcDim(level){
  return Math.min(25, 5 + Math.floor((level-1)/10));
}
function obstacleCount(level){
  if(level<81) return 0;
  return Math.min(15, Math.floor((level-81)/8)+1);
}
function enemyCount(level){
  if(level<121) return 0;
  if(level<161) return 1;
  return 2;
}

function makeGrid(dim){
  const grid = [];
  for(let r=0;r<dim;r++){
    const row=[];
    for(let c=0;c<dim;c++){
      row.push({top:true,right:true,bottom:true,left:true,visited:false});
    }
    grid.push(row);
  }
  return grid;
}

function generateMaze(dim, rng){
  const grid = makeGrid(dim);
  const stack = [{r:0,c:0}];
  grid[0][0].visited = true;
  while(stack.length){
    const cur = stack[stack.length-1];
    const options = [];
    DIRS.forEach(d=>{
      const nr = cur.r+d.dr, nc = cur.c+d.dc;
      if(nr>=0 && nr<dim && nc>=0 && nc<dim && !grid[nr][nc].visited){
        options.push({dir:d, nr, nc});
      }
    });
    if(options.length===0){ stack.pop(); continue; }
    const choice = options[randInt(rng, options.length)];
    grid[cur.r][cur.c][choice.dir.name] = false;
    grid[choice.nr][choice.nc][choice.dir.opp] = false;
    grid[choice.nr][choice.nc].visited = true;
    stack.push({r:choice.nr, c:choice.nc});
  }
  return grid;
}

function addExtraLoops(grid, dim, rng, count){
  let added = 0, guard = 0;
  while(added<count && guard<count*40){
    guard++;
    const r = randInt(rng, dim), c = randInt(rng, dim);
    const d = DIRS[randInt(rng, 4)];
    const nr = r+d.dr, nc = c+d.dc;
    if(nr<0||nr>=dim||nc<0||nc>=dim) continue;
    if(grid[r][c][d.name]){
      grid[r][c][d.name] = false;
      grid[nr][nc][d.opp] = false;
      added++;
    }
  }
}

function bfsDistances(grid, dim, from){
  const dist = Array.from({length:dim},()=>Array(dim).fill(-1));
  dist[from.r][from.c] = 0;
  const q = [from];
  let qi = 0;
  while(qi<q.length){
    const cur = q[qi++];
    DIRS.forEach(d=>{
      if(grid[cur.r][cur.c][d.name]) return;
      const nr = cur.r+d.dr, nc = cur.c+d.dc;
      if(nr<0||nr>=dim||nc<0||nc>=dim) return;
      if(dist[nr][nc]===-1){
        dist[nr][nc] = dist[cur.r][cur.c]+1;
        q.push({r:nr,c:nc});
      }
    });
  }
  return dist;
}

function bfsNextStep(grid, dim, from, to){
  if(from.r===to.r && from.c===to.c) return from;
  const dist = bfsDistances(grid, dim, from);
  // to noktasından from'a doğru geri izleyerek ilk adımı bul
  let cur = to;
  const path = [cur];
  let guard = 0;
  while(!(cur.r===from.r && cur.c===from.c) && guard<dim*dim+5){
    guard++;
    let best = null;
    DIRS.forEach(d=>{
      if(grid[cur.r][cur.c][d.name]) return;
      const nr = cur.r+d.dr, nc = cur.c+d.dc;
      if(nr<0||nr>=dim||nc<0||nc>=dim) return;
      if(dist[nr][nc] === dist[cur.r][cur.c]-1){
        best = {r:nr,c:nc};
      }
    });
    if(!best) break;
    cur = best;
    path.push(cur);
  }
  // path: to -> ... -> from (ters). from'dan sonraki hücre = path[path.length-2]
  if(path.length>=2) return path[path.length-2];
  return from;
}

function placeObstaclesAndEnemies(grid, dim, rng, level){
  const oCount = obstacleCount(level);
  const eCount = enemyCount(level);
  const distFromStart = bfsDistances(grid, dim, {r:0,c:0});
  const candidates = [];
  for(let r=0;r<dim;r++) for(let c=0;c<dim;c++){
    if(r===0 && c===0) continue;
    if(r===dim-1 && c===dim-1) continue;
    if(distFromStart[r][c] < 2) continue;
    candidates.push({r,c});
  }
  // karıştır
  for(let i=candidates.length-1;i>0;i--){
    const j = randInt(rng, i+1);
    [candidates[i],candidates[j]] = [candidates[j],candidates[i]];
  }
  const obstacles = candidates.slice(0, oCount).map(p=>({r:p.r,c:p.c}));
  const usedKeys = new Set(obstacles.map(o=>o.r+'_'+o.c));
  const farCandidates = candidates.filter(p=>distFromStart[p.r][p.c] >= Math.max(3, Math.floor(dim/2)) && !usedKeys.has(p.r+'_'+p.c));
  const enemies = [];
  for(let i=0;i<eCount && i<farCandidates.length;i++){
    enemies.push({r:farCandidates[i].r, c:farCandidates[i].c, spawnR:farCandidates[i].r, spawnC:farCandidates[i].c});
  }
  return {obstacles, enemies};
}

function generateLevel(level){
  const dim = calcDim(level);
  const rng = mulberry32(level*7919 + 13);
  const grid = generateMaze(dim, rng);
  const extraLoops = Math.min(20, Math.floor(level/15));
  if(extraLoops>0) addExtraLoops(grid, dim, rng, extraLoops);
  const {obstacles, enemies} = placeObstaclesAndEnemies(grid, dim, rng, level);
  return {
    dim, grid,
    playerPos:{r:0,c:0},
    exitPos:{r:dim-1,c:dim-1},
    obstacles, enemies
  };
}

/* ============================================================
   KUPA ÜRETİMİ
   ============================================================ */
function trophyTier(level){
  if(level<=40) return {name:'Bronz', emoji:'🥉', hue:25, glow:'#cd7f32'};
  if(level<=80) return {name:'Gümüş', emoji:'🥈', hue:0,  glow:'#c0c0c0'};
  if(level<=120) return {name:'Altın', emoji:'🥇', hue:45, glow:'#ffd700'};
  if(level<=160) return {name:'Elmas', emoji:'💎', hue:190,glow:'#00e5ff'};
  return {name:'Efsane', emoji:'👑', hue:280, glow:'#b388ff'};
}
function buildTrophy(level){
  const tier = trophyTier(level);
  const hue = (tier.hue + level*3) % 360;
  return {level, emoji:tier.emoji, tierName:tier.name, hue, glow:tier.glow};
}

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
function playMoveSound(){ beep(300,0.05,'square',0,0.08); }
function playBumpSound(){ beep(150,0.12,'sawtooth',0,0.16); }
function playTrapSound(){ [280,220,160].forEach((f,i)=>beep(f,0.18,'sawtooth',i*0.1,0.2)); }
function playCaughtSound(){ [220,180,140,100].forEach((f,i)=>beep(f,0.22,'square',i*0.13,0.22)); }
function playLevelCompleteSound(){ [523.25,659.25,783.99,1046.5].forEach((f,i)=>beep(f,0.2,'sine',i*0.1,0.22)); }
function playAllCompleteSound(){ [523.25,659.25,783.99,1046.5,1318.5,1567.98].forEach((f,i)=>beep(f,0.25,'sine',i*0.12,0.24)); }
function playPauseSound(){ [392,349.23,311.13,261.63].forEach((f,i)=>beep(f,0.22,'sawtooth',i*0.16,0.18)); }
function playResumeSound(){ [523.25,659.25,880,1046.5].forEach((f,i)=>beep(f,0.16,'sine',i*0.08,0.2)); }

/* ============================================================
   DURUM
   ============================================================ */
const SAVE_KEY = 'labirent_save_v1';
const PROGRESS_KEY = 'labirent_progress_v1';
const TROPHY_KEY = 'labirent_trophies_v1';
let G = null;

function log(msg){
  const el = document.getElementById('log');
  if(!el) return;
  const d = document.createElement('div');
  d.innerHTML = msg;
  el.prepend(d);
}

function loadProgress(){
  try{
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {maxUnlocked:1};
  }catch(e){ return {maxUnlocked:1}; }
}
function saveProgress(maxUnlocked){
  try{ localStorage.setItem(PROGRESS_KEY, JSON.stringify({maxUnlocked})); }catch(e){}
}
function loadTrophies(){
  try{
    const raw = localStorage.getItem(TROPHY_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function saveTrophy(level, trophy){
  try{
    const t = loadTrophies();
    t[level] = trophy;
    localStorage.setItem(TROPHY_KEY, JSON.stringify(t));
  }catch(e){}
}

/* ============================================================
   KURULUM EKRANI
   ============================================================ */

function setupSwitchTab(name){
  ['Levels','Trophies','Help'].forEach(n=>{
    document.getElementById('setup'+(n==='Levels'?'':''));
  });
  document.getElementById('levelSelectTab').classList.remove('show');
  document.getElementById('trophyTab').classList.remove('show');
  document.getElementById('helpSetupTab').classList.remove('show');
  document.getElementById('setupTabLevels').classList.remove('active');
  document.getElementById('setupTabTrophies').classList.remove('active');
  document.getElementById('setupTabHelp').classList.remove('active');
  if(name==='levels'){ document.getElementById('levelSelectTab').classList.add('show'); document.getElementById('setupTabLevels').classList.add('active'); }
  if(name==='trophies'){ document.getElementById('trophyTab').classList.add('show'); document.getElementById('setupTabTrophies').classList.add('active'); renderTrophyGrid(); }
  if(name==='help'){ document.getElementById('helpSetupTab').classList.add('show'); document.getElementById('setupTabHelp').classList.add('active'); }
}
document.getElementById('setupTabLevels').addEventListener('click', ()=>setupSwitchTab('levels'));
document.getElementById('setupTabTrophies').addEventListener('click', ()=>setupSwitchTab('trophies'));
document.getElementById('setupTabHelp').addEventListener('click', ()=>setupSwitchTab('help'));

document.querySelectorAll('input[name="userMode"]').forEach(r=>{
  r.addEventListener('change', ()=>{
    const mode = document.querySelector('input[name="userMode"]:checked').value;
    document.getElementById('parentPassBox').style.display = (mode==='parent') ? 'block' : 'none';
  });
});

function renderLevelGrid(){
  const progress = loadProgress();
  const grid = document.getElementById('levelGrid');
  grid.innerHTML = '';
  for(let lvl=1; lvl<=200; lvl++){
    const btn = document.createElement('button');
    const done = lvl < progress.maxUnlocked;
    const unlocked = lvl <= progress.maxUnlocked;
    btn.className = 'levelBtn ' + (done?'done':(unlocked?'unlocked':'locked'));
    btn.textContent = unlocked ? lvl : '🔒';
    if(unlocked){
      btn.onclick = ()=>{ tryStartLevel(lvl); };
    } else {
      btn.disabled = true;
    }
    grid.appendChild(btn);
  }
}
renderLevelGrid();

function renderTrophyGrid(){
  const trophies = loadTrophies();
  const grid = document.getElementById('trophyGrid');
  grid.innerHTML = '';
  for(let lvl=1; lvl<=200; lvl++){
    const slot = document.createElement('div');
    const t = trophies[lvl];
    if(t){
      slot.className = 'trophySlot';
      slot.innerHTML = `<span style="filter:hue-rotate(${t.hue}deg) drop-shadow(0 0 6px ${t.glow});">${t.emoji}</span><span class="lvl">${lvl}</span>`;
    } else {
      slot.className = 'trophySlot empty';
      slot.innerHTML = `<span>🔒</span>`;
    }
    grid.appendChild(slot);
  }
}

function tryStartLevel(level){
  const modeInput = document.querySelector('input[name="userMode"]:checked');
  const mode = modeInput ? modeInput.value : 'child';
  if(mode==='parent'){
    const pass = document.getElementById('parentPass').value;
    if(pass !== '1247'){ alert('Ebeveyn şifresi yanlış!'); return; }
  }
  clearState();
  startLevelSession(mode, level);
}

document.getElementById('resumeBtn').addEventListener('click', ()=>{
  const saved = loadState();
  if(!saved){ alert('Kayıtlı oyun bulunamadı.'); checkResume(); return; }
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

/* ============================================================
   OYUN BAŞLATMA / BÖLÜM YÜKLEME
   ============================================================ */

function startLevelSession(mode, level){
  G = {
    mode: mode || 'child',
    level,
    viewMode: 'inside',
    moveCount: 0,
    startTime: Date.now(),
    elapsedSeconds: 0,
    gameOver: false,
    caughtFlash: false,
    timeLeft: (mode==='parent') ? DAILY_LIMIT_SECONDS : getSharedRemainingSeconds(),
    timerHandle: null
  };
  loadLevelData();
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  log(`🌀 Bölüm ${level} başladı! (${G.levelData.dim}x${G.levelData.dim})`);
  if(G.mode==='child' && G.timeLeft<=0){
    pauseGame('⏰ Bugünkü 30 dakikalık toplam oyun süreniz doldu! (Tüm oyunlar dahil)', true);
    return;
  }
  startTimer();
  renderAll();
}

function loadLevelData(){
  G.levelData = generateLevel(G.level);
}

function startTimer(){
  if(G.mode==='parent'){
    document.getElementById('timerDisplay').textContent = '👨‍👩‍👧 Sınırsız';
    return;
  }
  G.timerHandle = setInterval(()=>{
    if(G.gameOver) return;
    G.elapsedSeconds++;
    G.timeLeft--;
    addSharedUsedSeconds(1);
    updateTopbar();
    if(G.timeLeft<=0){
      pauseGame('⏰ Bugünkü 30 dakikalık toplam oyun süreniz doldu! (Tüm oyunlar dahil)', true);
    }
  },1000);
}

function updateTopbar(){
  if(!G) return;
  document.getElementById('levelInfo').textContent = `Bölüm ${G.level}/200`;
  document.getElementById('moveInfo').textContent = `👣 ${G.moveCount}`;
  const m = Math.floor(G.elapsedSeconds/60), s = G.elapsedSeconds%60;
  document.getElementById('elapsedInfo').textContent = `⏱️ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  if(G.mode==='parent'){
    document.getElementById('timerDisplay').textContent = '👨‍👩‍👧 Sınırsız';
  } else {
    const dm = Math.floor(G.timeLeft/60), ds = G.timeLeft%60;
    document.getElementById('timerDisplay').textContent = String(dm).padStart(2,'0')+':'+String(ds).padStart(2,'0');
  }
}

/* ============================================================
   GÖRÜNÜM MODU
   ============================================================ */
document.getElementById('viewToggleBtn').addEventListener('click', ()=>{
  if(!G) return;
  G.viewMode = (G.viewMode==='inside') ? 'top' : 'inside';
  document.getElementById('viewToggleBtn').textContent = G.viewMode==='inside' ? '🔍 İçeriden' : '🗺️ Yukarıdan';
  renderMaze();
});

document.getElementById('levelSelectBtn').addEventListener('click', ()=>{
  if(confirm('Bölüm seçim ekranına dönmek istiyor musun? Bu bölümdeki ilerlemen (konumun) sıfırlanır.')){
    if(G){ clearInterval(G.timerHandle); G.timerHandle=null; }
    document.getElementById('gameScreen').style.display='none';
    document.getElementById('setupScreen').style.display='block';
    renderLevelGrid();
    checkResume();
  }
});

document.getElementById('homeBtn').addEventListener('click', ()=>{
  if(G) saveState();
  location.href = 'index.html';
});

document.getElementById('endGameBtn').addEventListener('click', ()=>{
  pauseGame('Oyun kullanıcı tarafından duraklatıldı.', false);
});

/* ============================================================
   HAREKET
   ============================================================ */

function attemptMove(dirName){
  if(!G || G.gameOver) return;
  const d = DIRS.find(x=>x.name===dirName);
  const {grid, dim} = G.levelData;
  const p = G.levelData.playerPos;
  if(grid[p.r][p.c][d.name]){
    playBumpSound();
    return;
  }
  const nr = p.r+d.dr, nc = p.c+d.dc;
  if(nr<0||nr>=dim||nc<0||nc>=dim){ playBumpSound(); return; }
  p.r = nr; p.c = nc;
  G.moveCount++;
  playMoveSound();

  // engel kontrolü
  const hitObstacle = G.levelData.obstacles.some(o=>o.r===p.r && o.c===p.c);
  if(hitObstacle){
    playTrapSound();
    log('⚠️ Tuzağa bastın! Başlangıca döndün.');
    flashAndReset(false);
    return;
  }

  // düşman hareketi
  moveEnemies();

  // yakalanma kontrolü
  const caught = G.levelData.enemies.some(e=>e.r===p.r && e.c===p.c);
  if(caught){
    playCaughtSound();
    log('🐺 Yakalandın! Başlangıca döndün.');
    flashAndReset(true);
    return;
  }

  // çıkış kontrolü
  if(p.r===G.levelData.exitPos.r && p.c===G.levelData.exitPos.c){
    levelComplete();
    return;
  }

  renderAll();
  saveMidLevelPosition();
}

function flashAndReset(resetEnemies){
  G.levelData.playerPos = {r:0,c:0};
  if(resetEnemies){
    G.levelData.enemies.forEach(e=>{ e.r = e.spawnR; e.c = e.spawnC; });
  }
  renderAll();
  saveMidLevelPosition();
}

function moveEnemies(){
  const {grid, dim, playerPos} = G.levelData;
  G.levelData.enemies.forEach(e=>{
    const next = bfsNextStep(grid, dim, {r:e.r,c:e.c}, {r:playerPos.r,c:playerPos.c});
    e.r = next.r; e.c = next.c;
  });
}

function saveMidLevelPosition(){
  saveState();
}

['Up','Down','Left','Right'].forEach(dir=>{
  const map = {Up:'top', Down:'bottom', Left:'left', Right:'right'};
  const btn = document.getElementById('btn'+dir);
  if(btn) btn.addEventListener('click', ()=>attemptMove(map[dir]));
});

document.addEventListener('keydown', (e)=>{
  if(!G || G.gameOver) return;
  const key = e.key;
  if(key==='ArrowUp' || key==='w' || key==='W') attemptMove('top');
  else if(key==='ArrowDown' || key==='s' || key==='S') attemptMove('bottom');
  else if(key==='ArrowLeft' || key==='a' || key==='A') attemptMove('left');
  else if(key==='ArrowRight' || key==='d' || key==='D') attemptMove('right');
});

/* ============================================================
   BÖLÜM TAMAMLAMA / KUPA
   ============================================================ */

function levelComplete(){
  G.gameOver = true;
  clearInterval(G.timerHandle);
  G.timerHandle = null;
  playLevelCompleteSound();
  const progress = loadProgress();
  if(G.level+1 > progress.maxUnlocked){
    saveProgress(Math.min(201, G.level+1));
  }
  const trophy = buildTrophy(G.level);
  saveTrophy(G.level, trophy);
  clearState();
  log(`🏆 Bölüm ${G.level} tamamlandı! ${G.moveCount} hamle, ${G.elapsedSeconds} saniye.`);
  showLevelCompleteModal(trophy);
}

function showLevelCompleteModal(trophy){
  const isLast = G.level>=200;
  let html = `<h3>${isLast?'🎉 TÜM BÖLÜMLER TAMAMLANDI!':'🏁 Bölüm '+G.level+' Tamamlandı!'}</h3>
    <div class="trophyBig glow" id="trophyDisplay" style="--hue:${trophy.hue}deg; --glow:${trophy.glow};">${trophy.emoji}</div>
    <p><b>${trophy.tierName} Kupa</b> — Bölüm ${trophy.level}</p>
    <p>👣 ${G.moveCount} hamle — ⏱️ ${G.elapsedSeconds} saniye</p>
    <div class="btnrow">
      <button class="shareBtn" id="shareTrophyBtn">📤 Paylaş</button>
      ${!isLast ? `<button class="primaryBtn" id="nextLevelBtn">▶️ Sonraki Bölüm</button>` : ''}
      <button class="close" id="backToSelectBtn">🗺️ Bölüm Seç</button>
    </div>`;
  showModal(html);
  if(isLast) playAllCompleteSound();

  document.getElementById('shareTrophyBtn').onclick = ()=>shareTrophy(trophy);
  if(!isLast){
    document.getElementById('nextLevelBtn').onclick = ()=>{
      closeModal();
      startLevelSession(G.mode, G.level+1);
    };
  }
  document.getElementById('backToSelectBtn').onclick = ()=>{
    closeModal();
    document.getElementById('gameScreen').style.display='none';
    document.getElementById('setupScreen').style.display='block';
    renderLevelGrid();
    checkResume();
  };
}

function shareTrophy(trophy){
  try{
    const canvas = document.createElement('canvas');
    canvas.width = 500; canvas.height = 500;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(250,250,20,250,250,300);
    grad.addColorStop(0, trophy.glow);
    grad.addColorStop(1, '#111');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,500,500);
    ctx.shadowColor = trophy.glow;
    ctx.shadowBlur = 40;
    ctx.font = '220px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(trophy.emoji, 250, 220);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('Bölüm '+trophy.level+' — '+trophy.tierName+' Kupa', 250, 400);
    ctx.font = '24px sans-serif';
    ctx.fillText('🌀 LABİRENT', 250, 445);

    canvas.toBlob(blob=>{
      if(!blob) return;
      const file = new File([blob], 'kupa-bolum-'+trophy.level+'.png', {type:'image/png'});
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        navigator.share({
          files:[file],
          title:'Labirent Kupası',
          text:'🏆 Bölüm '+trophy.level+' - '+trophy.tierName+' Kupasını kazandım!'
        }).catch(()=>{});
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'kupa-bolum-'+trophy.level+'.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(()=>URL.revokeObjectURL(url), 3000);
      }
    }, 'image/png');
  }catch(e){
    if(navigator.share){
      navigator.share({title:'Labirent Kupası', text:'🏆 Bölüm '+trophy.level+' - '+trophy.tierName+' Kupasını kazandım!'}).catch(()=>{});
    }
  }
}

/* ============================================================
   ÇİZİM (CANVAS)
   ============================================================ */

function renderAll(){
  updateTopbar();
  renderMaze();
}

function renderMaze(){
  if(!G) return;
  const canvas = document.getElementById('mazeCanvas');
  const ctx = canvas.getContext('2d');
  if(G.viewMode==='inside') renderInsideView(canvas, ctx);
  else renderTopView(canvas, ctx);
}

function renderTopView(canvas, ctx){
  const {dim, grid, playerPos, exitPos, obstacles, enemies} = G.levelData;
  const size = 320;
  canvas.width = size; canvas.height = size;
  const cell = size/dim;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,size,size);
  drawWalls(ctx, grid, dim, cell, 0, 0);
  drawMarker(ctx, 0, 0, cell, '#43a047', '🚩'.replace('🚩',''), true);
  ctx.fillStyle='#43a047'; ctx.fillRect(2,2,cell-4,cell-4);
  ctx.fillStyle='#e53935'; ctx.fillRect(exitPos.c*cell+2, exitPos.r*cell+2, cell-4, cell-4);
  obstacles.forEach(o=>{
    ctx.fillStyle = '#ff9800';
    ctx.beginPath();
    ctx.arc(o.c*cell+cell/2, o.r*cell+cell/2, cell*0.28, 0, Math.PI*2);
    ctx.fill();
  });
  enemies.forEach(e=>{
    ctx.fillStyle = '#8e24aa';
    ctx.beginPath();
    ctx.arc(e.c*cell+cell/2, e.r*cell+cell/2, cell*0.32, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.fillStyle = '#1565c0';
  ctx.beginPath();
  ctx.arc(playerPos.c*cell+cell/2, playerPos.r*cell+cell/2, cell*0.32, 0, Math.PI*2);
  ctx.fill();
}

function renderInsideView(canvas, ctx){
  const {dim, grid, playerPos, exitPos, obstacles, enemies} = G.levelData;
  const radius = 2;
  const cell = 60;
  const size = cell*(radius*2+1);
  canvas.width = size; canvas.height = size;
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,size,size);

  for(let dr=-radius; dr<=radius; dr++){
    for(let dc=-radius; dc<=radius; dc++){
      const r = playerPos.r+dr, c = playerPos.c+dc;
      const x = (dc+radius)*cell, y = (dr+radius)*cell;
      if(r<0||r>=dim||c<0||c>=dim){
        ctx.fillStyle = '#000';
        ctx.fillRect(x,y,cell,cell);
        continue;
      }
      ctx.fillStyle = '#fff';
      ctx.fillRect(x,y,cell,cell);
      if(r===exitPos.r && c===exitPos.c){ ctx.fillStyle='#e53935'; ctx.fillRect(x+3,y+3,cell-6,cell-6); }
      if(r===0 && c===0){ ctx.fillStyle='#43a047'; ctx.fillRect(x+3,y+3,cell-6,cell-6); }
    }
  }
  // duvarlar
  for(let dr=-radius; dr<=radius; dr++){
    for(let dc=-radius; dc<=radius; dc++){
      const r = playerPos.r+dr, c = playerPos.c+dc;
      if(r<0||r>=dim||c<0||c>=dim) continue;
      const x = (dc+radius)*cell, y = (dr+radius)*cell;
      drawCellWalls(ctx, grid[r][c], x, y, cell);
    }
  }
  // engel/düşman (yarıçap içindeyse)
  obstacles.forEach(o=>{
    const dr=o.r-playerPos.r, dc=o.c-playerPos.c;
    if(Math.abs(dr)<=radius && Math.abs(dc)<=radius){
      const x=(dc+radius)*cell, y=(dr+radius)*cell;
      ctx.fillStyle='#ff9800';
      ctx.beginPath(); ctx.arc(x+cell/2,y+cell/2,cell*0.22,0,Math.PI*2); ctx.fill();
    }
  });
  enemies.forEach(e=>{
    const dr=e.r-playerPos.r, dc=e.c-playerPos.c;
    if(Math.abs(dr)<=radius && Math.abs(dc)<=radius){
      const x=(dc+radius)*cell, y=(dr+radius)*cell;
      ctx.fillStyle='#8e24aa';
      ctx.beginPath(); ctx.arc(x+cell/2,y+cell/2,cell*0.26,0,Math.PI*2); ctx.fill();
    }
  });
  // oyuncu (merkezde)
  ctx.fillStyle = '#1565c0';
  ctx.beginPath();
  ctx.arc(radius*cell+cell/2, radius*cell+cell/2, cell*0.26, 0, Math.PI*2);
  ctx.fill();
}

function drawCellWalls(ctx, cellData, x, y, cell){
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if(cellData.top){ ctx.moveTo(x,y); ctx.lineTo(x+cell,y); }
  if(cellData.right){ ctx.moveTo(x+cell,y); ctx.lineTo(x+cell,y+cell); }
  if(cellData.bottom){ ctx.moveTo(x,y+cell); ctx.lineTo(x+cell,y+cell); }
  if(cellData.left){ ctx.moveTo(x,y); ctx.lineTo(x,y+cell); }
  ctx.stroke();
}

function drawWalls(ctx, grid, dim, cell){
  for(let r=0;r<dim;r++){
    for(let c=0;c<dim;c++){
      drawCellWalls(ctx, grid[r][c], c*cell, r*cell, cell);
    }
  }
}
function drawMarker(){ /* yardımcı, kullanılmıyor */ }

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
}

function showPauseModal(reason, requirePassword){
  let html = `<h3>⏸️ Labirent Duraklatıldı</h3><p>${reason}</p>
    <p>Bölüm ${G.level}/200 — 👣 ${G.moveCount} hamle</p>`;
  if(requirePassword){
    html += `<div style="margin-top:10px;">
        <input type="password" id="resumePassInput" placeholder="Ebeveyn şifresi">
        <button class="primaryBtn" id="resumePassBtn">Devam Et</button>
      </div>
      <p style="font-size:12px;color:#666;">Şifre girmezseniz oyun duraklatılmış kalır; ana menüden "Kaldığın Bölümden Devam Et" ile şifreyi girip sürdürebilirsiniz.</p>
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
        <button class="close" id="backToMenuBtn2">🗺️ Bölüm Seç</button>
      </div>`;
    showModal(html);
    document.getElementById('continueBtn').onclick = ()=>{ closeModal(); resumeGame(); };
    document.getElementById('backToMenuBtn2').onclick = ()=>{
      closeModal();
      document.getElementById('gameScreen').style.display='none';
      document.getElementById('setupScreen').style.display='block';
      renderLevelGrid();
      checkResume();
    };
  }
  log(`⏸️ Labirent duraklatıldı: ${reason}`);
}
