/* ============================ VERİ TANIMLARI ============================ */

const GROUP_COLORS = {
  turuncu:'#e07b39', acikmavi:'#87ceeb', bordo:'#8b4513', yesil:'#2e8b57',
  kirmizi:'#e53935', sari:'#fbc02d', pembe:'#ec407a', mor:'#5e35b1',
  kamu:'#455a64', tax:'#795548', card:'#7e57c2', corner:'#333'
};
const GROUP_NAMES = {
  turuncu:'Turuncu Grup', acikmavi:'Açık Mavi Grup', bordo:'Bordo Grup', yesil:'Yeşil Grup',
  kirmizi:'Kırmızı Grup', sari:'Sarı Grup', pembe:'Pembe Grup', mor:'Mor Grup'
};

function P(name, group, price, rent, houseCost, mortgage){
  return {name, type:'property', group, price, rent, houseCost, mortgage, owner:null, houses:0, mortgaged:false};
}
function U(name, price, mortgage){
  return {name, type:'utility', price, mortgage, owner:null, mortgaged:false};
}
function T(name, amount){ return {name, type:'tax', amount}; }
function C(deck){ return {name: deck==='sans' ? 'Şans Kartları' : 'Hazine Bonusu', type:'card', deck}; }
function CORNER(name, sub){ return {name, type:'corner', sub}; }

const CELLS = [
  CORNER('BAŞLA','start'),                                                              //0
  P('Türkiye','mor',40000,[5000,20000,60000,140000,170000,200000],20000,20000),          //1
  T('Oturum Vergisi',10000),                                                             //2
  P('Amerika','mor',35000,[4200,17000,50000,110000,130000,150000],20000,17500),          //3
  C('sans'),                                                                             //4
  U('Demir Yolu',20000,10000),                                                           //5
  P('Almanya','pembe',32000,[4000,15000,45000,100000,120000,140000],20000,16000),        //6
  C('hazine'),                                                                           //7
  P('İngiltere','pembe',30000,[3700,13000,39000,90000,110000,127000],20000,15000),       //8
  P('Fransa','pembe',30000,[3700,13000,39000,90000,110000,127000],20000,15000),          //9
  CORNER('SINIR DIŞI HAVA ALANINA GİT','gotojail'),                                      //10
  P('Hollanda','kirmizi',22000,[2600,9000,25000,70000,87000,105000],15000,11000),        //11
  C('sans'),                                                                             //12
  P('İtalya','kirmizi',22000,[2600,9000,25000,70000,87000,105000],15000,11000),          //13
  P('İsviçre','kirmizi',24000,[3000,10000,30000,75000,92000,110000],15000,12000),        //14
  U('Körfez Limanı',20000,10000),                                                        //15
  P('Japonya','sari',26000,[3500,11000,33000,80000,97000,115000],15000,13000),           //16
  U('Hava Yolu',20000,10000),                                                            //17
  P('Çin','sari',26000,[3200,11000,33000,80000,97000,115000],15000,13000),               //18
  P('Rusya','sari',28000,[3500,12000,36000,85000,102000,120000],15000,14000),            //19
  CORNER('DÜNYA BANKASI','freeparking'),                                                 //20
  P('Brezilya','yesil',20000,[2500,8000,22000,60000,80000,100000],10000,10000),          //21
  P('Uruguay','yesil',18000,[2200,7000,20000,55000,75000,95000],5000,9000),              //22
  C('hazine'),                                                                           //23
  P('Arjantin','yesil',18000,[2200,7000,20000,55000,75000,95000],5000,9000),             //24
  U('Şangay Limanı',20000,10000),                                                        //25
  P('Küba','bordo',14000,[1500,5000,15000,45000,62000,75000],5000,7000),                 //26
  P('Kosta Rika','bordo',16000,[2200,6000,18000,50000,70000,90000],5000,8000),           //27
  C('sans'),                                                                             //28
  P('Meksika','bordo',14000,[1500,5000,15000,45000,62000,75000],5000,7000),              //29
  CORNER('HAVA ALANI (SINIR DIŞI)','jail'),                                              //30
  U('Sosyal Medya',20000,10000),                                                         //31
  P('Yeni Zelanda','acikmavi',12000,[1200,4000,10000,30000,45000,50000],5000,5000),      //32
  P('Avustralya','acikmavi',10000,[1000,3000,9000,27000,40000,55000],5000,5000),         //33
  P('Papua Yeni Gine','acikmavi',10000,[1000,3000,9000,27000,40000,55000],5000,5000),    //34
  U('Nükleer Santral',20000,10000),                                                      //35
  T('Vize Vergisi',20000),                                                               //36
  P('Tunus','turuncu',10000,[800,3000,6000,18000,32000,40000],5000,5000),                //37
  P('Nijerya','turuncu',6000,[500,2000,4000,10000,18000,30000],5000,3000),               //38
  P('Senegal','turuncu',6000,[500,1000,3000,9000,16000,25000],5000,3000)                 //39
];

const UTILITY_INDEXES = CELLS.map((c,i)=>c.type==='utility'?i:null).filter(x=>x!==null);

const SANS_CARDS = [
  {text:"İhbar tazminatı. 2.000$ al.", money:2000},
  {text:"1.000$ ceza öde.", money:-1000},
  {text:"Bedelli askerlik yapacaksın. Kasaya 10.000$ öde.", toKasa:10000},
  {text:"Senegal'e git.", moveTo:'Senegal'},
  {text:"Döviz yükseldi. 5.000$ al.", money:5000},
  {text:"Akrabandan miras kaldı. 10.000$ al.", money:10000},
  {text:"Sınır dışına git. Başlangıçtan geçme, 20.000$ alma.", goToJail:true},
  {text:"Başlangıç noktasına git.", moveTo:'BAŞLA'},
  {text:"Repo geliri. 5.000$ al.", money:5000},
  {text:"Sağlık kontrolü masrafı. 10.000$ öde.", money:-10000},
  {text:"İddiayı kazandın. Her oyuncudan 1.000$ al.", collectFromEach:1000},
  {text:"Saç ektirme operasyonu. 10.000$ öde.", money:-10000},
  {text:"Karın yağlarını aldırdın. 5.000$ öde.", money:-5000},
  {text:"Şirket kâr payı olarak 10.000$ al.", money:10000},
  {text:"Af çıktı, serbestsin! Bu kartı sınır dışına yollandığında kullanabilir ya da satabilirsin.", getOutOfJail:true},
  {text:"Vergi oranları arttırıldı. Kasaya 5.000$ öde.", toKasa:5000},
  {text:"Kasa fazlası. 20.000$ al.", money:20000},
  {text:"Birikmiş nafaka borcu. 5.000$ öde.", money:-5000},
  {text:"Milli piyango biletine amorti çıktı. 1.000$ al.", money:1000},
  {text:"Yolsuzlukla suçlanıyorsun. Sınır dışına git.", goToJail:true}
];

const HAZINE_CARDS = [
  {text:"Evlilik yıldönümünüz. Eşine araba al. 20.000$ öde.", money:-20000},
  {text:"Maaşına zam yapıldı. 5.000$ al.", money:5000},
  {text:"İsviçre'ye ilerle.", moveTo:'İsviçre'},
  {text:"Borsadan kazandın. 5.000$ al.", money:5000},
  {text:"Dört hane geri git.", moveRel:-4},
  {text:"Kırmızı ışıkta geçtin. 1.500$ öde.", money:-1500},
  {text:"Başlangıç noktasına git.", moveTo:'BAŞLA'},
  {text:"Türkiye'ye git.", moveTo:'Türkiye'},
  {text:"Meksika'da ilerle.", moveTo:'Meksika'},
  {text:"Loto'da 6 tutturdun! 20.000$ al.", money:20000},
  {text:"Yılbaşı hediyen. 15.000$ al.", money:15000},
  {text:"Af çıktı, serbestsin! Bu kartı saklayabilir ya da satabilirsin.", getOutOfJail:true},
  {text:"Alkollü araç kullandın. 20.000$ ceza öde.", money:-20000},
  {text:"Teşvik kredin onaylandı. 15.000$ al.", money:15000},
  {text:"Sağlık sigortası primini öde. 15.000$.", money:-15000},
  {text:"Çöp vergisi. Her ev için 3.000$, her plaza için 12.000$ öde.", perHouse:3000, perHotel:12000},
  {text:"Yatırdığın banka battı. Kasaya 20.000$ öde.", toKasa:20000},
  {text:"Sınır dışına git.", goToJail:true},
  {text:"Deprem vergisi. Her ev için 2.500$, her plaza için 10.000$ öde.", perHouse:2500, perHotel:10000},
  {text:"Şangay Limanı'nda gezintiye çık.", moveTo:'Şangay Limanı'}
];

const TOKENS = [
  {id:'plane', icon:'✈️', label:'Uçak'},
  {id:'car', icon:'🚗', label:'Araba'},
  {id:'hat', icon:'🎩', label:'Şapka'},
  {id:'ship', icon:'🚢', label:'Gemi'}
];

/* ============================ OYUN DURUMU ============================ */

let G = null; // { players, cells, kasa, current, timeLeft, timerHandle, gameOver, awaitingAction, doublesCount }

function fmt(n){
  return '$' + Math.round(n).toLocaleString('tr-TR');
}

function log(msg){
  const el = document.getElementById('log');
  const d = document.createElement('div');
  d.innerHTML = msg;
  el.prepend(d);
}

/* ============================ KURULUM EKRANI ============================ */

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
      <div class="tokenPick" data-idx="${idx}">
        ${TOKENS.map(t=>`<button data-token="${t.id}" data-idx="${idx}" class="${p.token===t.id?'selected':''}" title="${t.label}">${t.icon}</button>`).join('')}
      </div>
      ${setupPlayers.length>2 ? `<button class="remove" data-idx="${idx}">Sil</button>` : ''}
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.nameInput').forEach(inp=>{
    inp.addEventListener('input', e=>{
      setupPlayers[+e.target.dataset.idx].name = e.target.value;
    });
  });
  list.querySelectorAll('.typeSelect').forEach(sel=>{
    sel.addEventListener('change', e=>{
      setupPlayers[+e.target.dataset.idx].type = e.target.value;
    });
  });
  list.querySelectorAll('.tokenPick button').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = +e.target.dataset.idx;
      const token = e.target.dataset.token;
      const takenBy = setupPlayers.findIndex((p,i)=>p.token===token && i!==idx);
      if(takenBy>-1){
        // swap tokens
        setupPlayers[takenBy].token = setupPlayers[idx].token;
      }
      setupPlayers[idx].token = token;
      renderSetup();
    });
  });
  list.querySelectorAll('button.remove').forEach(btn=>{
    btn.addEventListener('click', e=>{
      setupPlayers.splice(+e.target.dataset.idx,1);
      renderSetup();
    });
  });
}

function initSetup(){
  setupPlayers = [
    {name:'Oyuncu 1', type:'human', token:'plane'},
    {name:'Oyuncu 2', type:'human', token:'car'}
  ];
  renderSetup();
}
initSetup();
checkResume();

document.getElementById('addPlayerBtn').addEventListener('click', ()=>{
  if(setupPlayers.length>=4){ alert('En fazla 4 oyuncu ile oynanabilir.'); return; }
  const usedTokens = setupPlayers.map(p=>p.token);
  const freeToken = TOKENS.find(t=>!usedTokens.includes(t.id));
  setupPlayers.push({name:'Oyuncu '+(setupPlayers.length+1), type:'human', token: freeToken? freeToken.id : 'plane'});
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
  for(const p of setupPlayers){
    if(!p.name.trim()){ alert('Tüm oyuncuların bir adı olmalı.'); return; }
  }
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
  if(!saved){ alert('Kayıtlı oyun bulunamadı.'); checkResume(); return; }
  G = saved;
  G.timerHandle = null;
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  renderBoard();
  renderPlayerTabs();
  renderFinance();
  updateTopbar();
  resumeGame();
});

/* ============================ OYUN BAŞLATMA ============================ */

function startGame(mode){
  const cellsCopy = CELLS.map(c=>({...c}));
  const players = setupPlayers.map((p,i)=>({
    id:i, name:p.name, type:p.type, token:p.token, money:150000, position:0,
    properties:[], inJail:false, jailTurns:0, getOutOfJailCards:0, bankrupt:false, doublesInRow:0
  }));

  G = {
    cells: cellsCopy, players, kasa:0, current:0, timeLeft: 30*60,
    mode: mode || 'child',
    gameOver:false, awaitingAction:false, timerHandle:null
  };

  document.getElementById('setupScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';

  renderBoard();
  renderPlayerTabs();
  updateTopbar();
  renderFinance();
  startTimer();
  log('🎮 Oyun başladı! <b>'+players.map(p=>p.name+' ('+(p.type==='human'?'İnsan':'Bilgisayar')+')').join(', ')+'</b>');
  beginTurn();
}

function startTimer(){
  if(G.mode==='parent'){
    updateTimerDisplay();
    return; // ebeveyn modunda süre sınırı yok
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
  const m = Math.floor(G.timeLeft/60);
  const s = G.timeLeft%60;
  document.getElementById('timerDisplay').textContent =
    String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

function updateTopbar(){
  updateTimerDisplay();
  document.getElementById('kasaDisplay').textContent = 'Kasa: ' + fmt(G.kasa);
  const cp = G.players[G.current];
  document.getElementById('turnInfo').textContent = cp ? ('Sırada: '+cp.name+(cp.type==='cpu'?' 🤖':' 👤')) : '-';
  document.getElementById('curPlayerName').textContent = cp ? cp.name : '-';
  saveState();
}

/* ============================ TAB YÖNETİMİ ============================ */

function switchTab(name){
  ['boardTab','financeTab','helpTab'].forEach(id=>document.getElementById(id).classList.remove('show'));
  ['tabBoardBtn','tabFinanceBtn','tabHelpBtn'].forEach(id=>document.getElementById(id).classList.remove('active'));
  document.getElementById(name+'Tab').classList.add('show');
  document.getElementById('tab'+name.charAt(0).toUpperCase()+name.slice(1)+'Btn').classList.add('active');
  if(name==='finance') renderFinance();
}
document.getElementById('tabBoardBtn').addEventListener('click', ()=>switchTab('board'));
document.getElementById('tabFinanceBtn').addEventListener('click', ()=>switchTab('finance'));
document.getElementById('tabHelpBtn').addEventListener('click', ()=>switchTab('help'));

document.getElementById('endGameBtn').addEventListener('click', ()=>{
  if(confirm('Oyunu duraklatmak istediğinize emin misiniz? Daha sonra kaldığınız yerden devam edebilirsiniz.')){
    pauseGame('Oyun kullanıcı tarafından duraklatıldı.', false);
  }
});

/* ============================ KAYIT / DEVAM ETME ============================ */

const SAVE_KEY = 'molicity_save_v1';

function saveState(){
  if(!G) return;
  try{
    const copy = {...G, timerHandle:null};
    localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
  }catch(e){ /* localStorage kullanılamıyor olabilir, sessizce geç */ }
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
function checkResume(){
  const saved = loadState();
  const box = document.getElementById('resumeBox');
  if(box) box.style.display = saved ? 'block' : 'none';
}

function pauseGame(reason, requirePassword){
  if(!G || G.gameOver) return;
  G.gameOver = true;
  clearInterval(G.timerHandle);
  G.timerHandle = null;
  document.getElementById('rollBtn').disabled = true;
  saveState();
  showEndModal(reason, requirePassword);
}

function resumeGame(){
  if(!G) return;
  G.gameOver = false;
  document.getElementById('rollBtn').disabled = false;
  if(G.mode==='child' && !G.timerHandle){ startTimer(); }
  updateTopbar();
  renderFinance();
  refreshTokensOnBoard();
  refreshOwnershipMarks();
  saveState();
  beginTurn();
}

function computeRanking(){
  return G.players.map(p=>{
    let value = p.money;
    p.properties.forEach(i=>{
      const c = G.cells[i];
      value += c.mortgaged ? c.price/2 : c.price;
      if(c.type==='property' && c.houses>0 && c.houses<5) value += c.houseCost*c.houses;
      if(c.type==='property' && c.houses===5) value += c.houseCost*4;
    });
    return {id:p.id, name:p.name, value, bankrupt:p.bankrupt};
  }).sort((a,b)=>b.value-a.value);
}

function showEndModal(reason, requirePassword){
  const ranking = computeRanking();
  playWinSound();
  setTimeout(playLoseSound, 500);
  let html = `<h3>⏸️ Oyun Duraklatıldı</h3><p>${reason}</p><ol style="text-align:left;">`;
  ranking.forEach((r,i)=>{
    html += `<li><b>${r.name}</b> — ${fmt(r.value)} ${r.bankrupt?'(İflas etti)':''} ${i===0?'👑':''}</li>`;
  });
  html += `</ol>`;

  if(requirePassword){
    html += `<div style="margin-top:10px;">
        <input type="password" id="resumePassInput" placeholder="Ebeveyn şifresi">
        <button class="btn-buy" id="resumePassBtn">Devam Et</button>
      </div>
      <p class="hint">Şifre girmezseniz oyun duraklatılmış kalır; daha sonra ana menüden "Kaldığın Yerden Devam Et" ile şifreyi girerek sürdürebilirsiniz.</p>
      <div class="btnrow"><button class="btn-neutral" id="backToMenuBtn">Ana Menüye Dön</button></div>`;
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
        <button class="btn-buy" id="continueBtn">▶️ Devam Et</button>
        <button class="btn-neutral" id="newGameBtn">🆕 Yeni Oyun</button>
      </div>`;
    showModal(html);
    document.getElementById('continueBtn').onclick = ()=>{ closeModal(); resumeGame(); };
    document.getElementById('newGameBtn').onclick = ()=>{ clearState(); location.reload(); };
  }
  log(`⏸️ Oyun duraklatıldı: ${reason}`);
}


/* ============================ TAHTA ÇİZİMİ ============================ */

function cellPosition(i){
  if(i===0) return {row:11,col:11};
  if(i>=1 && i<=9) return {row:11, col:11-i};
  if(i===10) return {row:11,col:1};
  if(i>=11 && i<=19) return {row:11-(i-10), col:1};
  if(i===20) return {row:1,col:1};
  if(i>=21 && i<=29) return {row:1, col:1+(i-20)};
  if(i===30) return {row:1,col:11};
  if(i>=31 && i<=39) return {row:1+(i-30), col:11};
}

function renderBoard(){
  const board = document.getElementById('board');
  board.innerHTML='';
  G.cells.forEach((cell,i)=>{
    const pos = cellPosition(i);
    const div = document.createElement('div');
    div.className='cell'+(cell.type==='corner'?' corner':'');
    div.id = 'cell-'+i;
    div.style.gridRow = pos.row;
    div.style.gridColumn = pos.col;

    if(cell.type==='property'){
      div.innerHTML = `<div class="grp" style="background:${GROUP_COLORS[cell.group]}"></div>
                        <div class="nm">${cell.name}</div><div class="pr">${fmt(cell.price)}</div>
                        <div class="tokens"></div>`;
    } else if(cell.type==='utility'){
      div.innerHTML = `<div class="grp" style="background:${GROUP_COLORS.kamu}"></div>
                        <div class="nm">${cell.name}</div><div class="pr">${fmt(cell.price)}</div>
                        <div class="tokens"></div>`;
    } else if(cell.type==='tax'){
      div.innerHTML = `<div class="grp" style="background:${GROUP_COLORS.tax}"></div>
                        <div class="nm">${cell.name}</div><div class="pr">${fmt(cell.amount)}</div>
                        <div class="tokens"></div>`;
    } else if(cell.type==='card'){
      div.innerHTML = `<div class="grp" style="background:${GROUP_COLORS.card}"></div>
                        <div class="nm">${cell.name}</div><div class="tokens"></div>`;
    } else {
      div.innerHTML = `<div class="nm">${cell.name}</div><div class="tokens"></div>`;
    }
    board.appendChild(div);
  });

  const center = document.createElement('div');
  center.className='center';
  center.innerHTML = '<h2>🌍 MOLİCİTY</h2><p style="font-size:12px;text-align:center;">Sıra düzeninde zar atın, mülk satın alın, kira ödeyin. Bütçenizi ve mülklerinizi "Bütçe &amp; Mülklerim" sekmesinden takip edin.</p>';
  board.appendChild(center);

  refreshTokensOnBoard();
  refreshOwnershipMarks();
}

function refreshTokensOnBoard(){
  document.querySelectorAll('.cell .tokens').forEach(el=>el.innerHTML='');
  G.players.forEach(p=>{
    if(p.bankrupt) return;
    const cellEl = document.getElementById('cell-'+p.position);
    if(!cellEl) return;
    const tEl = cellEl.querySelector('.tokens');
    const tokInfo = TOKENS.find(t=>t.id===p.token);
    const span = document.createElement('span');
    span.textContent = tokInfo.icon;
    span.title = p.name;
    tEl.appendChild(span);
  });
}

function refreshOwnershipMarks(){
  G.cells.forEach((cell,i)=>{
    const el = document.getElementById('cell-'+i);
    if(!el) return;
    el.classList.remove('owned-mark');
    if((cell.type==='property'||cell.type==='utility') && cell.owner!==null && cell.owner!==undefined){
      el.classList.add('owned-mark');
    }
  });
}

/* ============================ FİNANS SEKMESİ ============================ */

let financeSelectedPlayer = 0;

function renderPlayerTabs(){
  const wrap = document.getElementById('playerTabs');
  wrap.innerHTML='';
  G.players.forEach(p=>{
    const btn = document.createElement('button');
    btn.textContent = TOKENS.find(t=>t.id===p.token).icon+' '+p.name+(p.bankrupt?' (İflas)':'');
    btn.className = (p.id===financeSelectedPlayer)?'active':'';
    btn.addEventListener('click', ()=>{ financeSelectedPlayer=p.id; renderPlayerTabs(); renderFinance(); });
    wrap.appendChild(btn);
  });
}

function renderFinance(){
  const p = G.players[financeSelectedPlayer];
  const card = document.getElementById('financeCard');
  if(!p){ card.innerHTML=''; return; }

  let jailHtml='';
  if(p.inJail){
    jailHtml = `<div class="jailBox"><b>🚫 Sınır Dışı (Havaalanında)</b> — ${p.jailTurns} tur bekledi.
      ${p.id===G.current && !G.awaitingAction ? `
        <div style="margin-top:6px;">
          <button class="btn-pay" onclick="jailPayFine(${p.id})">5.000$ Ceza Öde ve Çık</button>
          ${p.getOutOfJailCards>0 ? `<button class="btn-buy" onclick="jailUseCard(${p.id})">Af Kartı Kullan (${p.getOutOfJailCards})</button>` : ''}
        </div>` : ''}
      </div>`;
  }

  const props = p.properties.map(i=>G.cells[i]);
  const propGroups = {};
  props.forEach(c=>{
    const g = c.type==='utility' ? 'kamu' : c.group;
    if(!propGroups[g]) propGroups[g]=[];
    propGroups[g].push(c);
  });

  let propsHtml = '<div class="propGrid">';
  props.forEach(c=>{
    const idx = G.cells.indexOf(c);
    const color = c.type==='utility'?GROUP_COLORS.kamu:GROUP_COLORS[c.group];
    const buildingLabel = c.type==='property' ? (c.houses===5?'🏨 Plaza':(c.houses>0?('🏠 x'+c.houses):'Arsa boş')) : '';
    const isMonopoly = c.type==='property' && ownsFullGroup(p, c.group);
    let btns='';
    if(p.id===G.current && !G.awaitingAction && !G.gameOver){
      if(c.type==='property' && isMonopoly && c.houses<5 && !c.mortgaged){
        btns += `<button onclick="buildHouse(${idx})">${c.houses===4?'Plaza Yap ('+fmt(c.houseCost)+')':'Ev Yap ('+fmt(c.houseCost)+')'}</button>`;
      }
      if(c.type==='property' && c.houses>0){
        btns += `<button onclick="sellHouse(${idx})">Bina Sat</button>`;
      }
      if(!c.mortgaged && c.houses===0){
        btns += `<button onclick="mortgageProp(${idx})">İpotek Et (+${fmt(c.mortgage)})</button>`;
      }
      if(c.mortgaged){
        btns += `<button onclick="unmortgageProp(${idx})">İpoteği Kaldır (-${fmt(Math.round(c.mortgage*1.1))})</button>`;
      }
    }
    propsHtml += `<div class="propCard ${c.mortgaged?'mortgaged':''}" style="background:${color}">
        <div class="pname">${c.name}${c.mortgaged?' (İPOTEKLİ)':''}</div>
        <div class="miniStat">${buildingLabel||'Kamu Kuruluşu'}</div>
        ${btns}
      </div>`;
  });
  propsHtml += '</div>';
  if(props.length===0) propsHtml = '<p style="color:#777;">Henüz mülk sahibi değil.</p>';

  card.innerHTML = `
    <h2>${TOKENS.find(t=>t.id===p.token).icon} ${p.name} ${p.type==='cpu'?'(Bilgisayar)':''}</h2>
    <div class="cashRow">💵 Nakit: ${fmt(p.money)}</div>
    ${p.getOutOfJailCards>0 && !p.inJail ? '<p>🎫 Af Kartı: '+p.getOutOfJailCards+'</p>' : ''}
    ${jailHtml}
    <h3>Sahip Olunan Mülkler (${props.length})</h3>
    ${propsHtml}
  `;
}

function ownsFullGroup(player, group){
  const groupCells = G.cells.map((c,i)=>({c,i})).filter(x=>x.c.type==='property' && x.c.group===group);
  return groupCells.every(x=>x.c.owner===player.id);
}

/* ============================ ZAR & SIRA YÖNETİMİ ============================ */

document.getElementById('rollBtn').addEventListener('click', ()=>{
  const p = G.players[G.current];
  if(!p || p.type!=='human' || G.awaitingAction || G.gameOver) return;
  humanRoll();
});

function beginTurn(){
  if(G.gameOver) return;
  const p = G.players[G.current];
  updateTopbar();
  renderPlayerTabs();
  if(p.bankrupt){ nextPlayer(); return; }

  if(p.inJail){
    log(`🚫 <b>${p.name}</b> hâlâ sınır dışında (${p.jailTurns}. tur).`);
  }

  if(p.type==='cpu'){
    document.getElementById('rollBtn').disabled = true;
    setTimeout(()=>cpuTakeTurn(p), 700);
  } else {
    document.getElementById('rollBtn').disabled = false;
  }
}

function rollTwoDice(){
  return [1+Math.floor(Math.random()*6), 1+Math.floor(Math.random()*6)];
}

function animateDiceRoll(finalD1, finalD2, onDone){
  playDiceSound();
  const d1el = document.getElementById('die1');
  const d2el = document.getElementById('die2');
  d1el.classList.add('rolling');
  d2el.classList.add('rolling');
  const tick = setInterval(()=>{
    d1el.textContent = 1+Math.floor(Math.random()*6);
    d2el.textContent = 1+Math.floor(Math.random()*6);
  }, 100);
  setTimeout(()=>{
    clearInterval(tick);
    d1el.classList.remove('rolling');
    d2el.classList.remove('rolling');
    d1el.textContent = finalD1;
    d2el.textContent = finalD2;
    onDone();
  }, 3000);
}

function humanRoll(){
  const p = G.players[G.current];
  const [d1,d2] = rollTwoDice();
  document.getElementById('rollBtn').disabled = true;

  animateDiceRoll(d1, d2, ()=>{
    if(p.inJail){
      handleJailRoll(p, d1, d2);
      return;
    }
    resolveDoubleTracking(p, d1, d2, ()=>{
      movePlayer(p, d1+d2, ()=>{
        landOnCell(p, ()=>{
          afterLanding(p, d1===d2);
        });
      });
    });
  });
}

function resolveDoubleTracking(p, d1, d2, cb){
  if(d1===d2){
    p.doublesInRow++;
    if(p.doublesInRow>=3){
      log(`🎲 <b>${p.name}</b> art arda 3. kez çift zar attı! Doğrudan Sınır Dışı'na gönderiliyor.`);
      p.doublesInRow=0;
      sendToJail(p);
      setTimeout(()=>{ nextPlayer(); },900);
      return;
    }
  } else {
    p.doublesInRow=0;
  }
  cb();
}

function afterLanding(p, wasDouble){
  if(G.gameOver) return;
  if(G.awaitingAction) return; // bekleyen aksiyon var (satın alma modalı vs.)
  if(wasDouble && !p.inJail){
    log(`🔁 <b>${p.name}</b> çift zar attı, tekrar oynuyor!`);
    if(p.type==='human'){
      document.getElementById('rollBtn').disabled=false;
    } else {
      setTimeout(()=>cpuTakeTurn(p), 700);
    }
  } else {
    setTimeout(nextPlayer, 900);
  }
}

function showDice(d1,d2){
  document.getElementById('die1').textContent = d1;
  document.getElementById('die2').textContent = d2;
}

function nextPlayer(){
  if(G.gameOver) return;
  const activeCount = G.players.filter(p=>!p.bankrupt).length;
  if(activeCount<=1){
    pauseGame('Sadece bir oyuncu kaldı!', false);
    return;
  }
  do{
    G.current = (G.current+1)%G.players.length;
  } while(G.players[G.current].bankrupt);
  const p = G.players[G.current];
  p.doublesInRow = 0;
  beginTurn();
}

/* ============================ HAREKET & HÜCRE İŞLEME ============================ */

function movePlayer(p, steps, cb){
  const old = p.position;
  let np = (old + steps) % 40;
  if(np < old){ // başlangıçtan geçti
    p.money += 20000;
    log(`💰 <b>${p.name}</b> Başlangıç noktasından geçti, 20.000$ aldı.`);
    playPassStartSound();
  }
  p.position = np;
  refreshTokensOnBoard();
  renderFinance();
  setTimeout(cb, 350);
}

function moveToNamed(p, name, collectIfPass, cb){
  const idx = G.cells.findIndex(c=>c.name===name);
  if(idx<0){ cb(); return; }
  const old = p.position;
  if(collectIfPass!==false && idx < old){
    p.money += 20000;
    log(`💰 <b>${p.name}</b> Başlangıç noktasından geçti, 20.000$ aldı.`);
    playPassStartSound();
  }
  p.position = idx;
  refreshTokensOnBoard();
  renderFinance();
  setTimeout(cb, 350);
}

function sendToJail(p){
  p.position = 30;
  p.inJail = true;
  p.jailTurns = 0;
  refreshTokensOnBoard();
  renderFinance();
  log(`🚨 <b>${p.name}</b> Sınır Dışı edildi ve Havaalanı'na gönderildi!`);
}

function landOnCell(p, cb){
  const cell = G.cells[p.position];
  updateTopbar();

  if(cell.type==='corner'){
    if(cell.sub==='gotojail'){
      sendToJail(p);
    } else if(cell.sub==='freeparking'){
      playBankSound();
      if(G.kasa>0){
        p.money += G.kasa;
        log(`🏦 <b>${p.name}</b> Dünya Bankası'na geldi ve kasadaki ${fmt(G.kasa)} parayı aldı!`);
        G.kasa = 0;
      } else {
        log(`🏦 <b>${p.name}</b> Dünya Bankası'nda mola verdi. Kasa boş.`);
      }
    } else if(cell.sub==='jail'){
      if(!p.inJail) log(`✈️ <b>${p.name}</b> Havaalanı'nı ziyaret etti (sınır dışı değil).`);
    } else if(cell.sub==='start'){
      log(`🏁 <b>${p.name}</b> Başlangıç noktasında.`);
    }
    updateTopbar(); renderFinance(); refreshOwnershipMarks();
    cb();
    return;
  }

  if(cell.type==='tax'){
    p.money -= cell.amount;
    G.kasa += cell.amount;
    log(`🧾 <b>${p.name}</b> ${cell.name} ödedi: ${fmt(cell.amount)}`);
    checkBankruptcyThen(p, ()=>{ updateTopbar(); renderFinance(); cb(); });
    return;
  }

  if(cell.type==='card'){
    drawCard(p, cell.deck, cb);
    return;
  }

  if(cell.type==='property' || cell.type==='utility'){
    if(cell.owner===null || cell.owner===undefined){
      offerPurchase(p, cb);
      return;
    } else if(cell.owner===p.id){
      log(`🏠 <b>${p.name}</b> kendi mülkü olan ${cell.name} üzerinde duruyor.`);
      cb();
      return;
    } else {
      payRentTo(p, cell, cb);
      return;
    }
  }

  cb();
}

/* ============================ SATIN ALMA ============================ */

function offerPurchase(p, cb){
  const cell = G.cells[p.position];
  const price = cell.price;

  if(p.type==='cpu'){
    const shouldBuy = p.money >= price * 1.4;
    if(shouldBuy){
      buyProperty(p, cb);
    } else {
      log(`🤖 <b>${p.name}</b> ${cell.name} mülkünü almadı (yetersiz bütçe/temkinli).`);
      cb();
    }
    return;
  }

  G.awaitingAction = true;
  document.getElementById('rollBtn').disabled = true;
  showModal(`
    <h3>${cell.name}</h3>
    <p>Fiyatı: <b>${fmt(price)}</b></p>
    <p>${p.name}, bu mülkü satın almak ister misiniz?</p>
    <div class="btnrow">
      <button class="btn-buy" id="buyYes">Satın Al</button>
      <button class="btn-pass" id="buyNo">Vazgeç</button>
    </div>
  `);
  document.getElementById('buyYes').onclick = ()=>{
    closeModal();
    G.awaitingAction=false;
    if(p.money>=price){
      buyProperty(p, ()=>{ afterLanding(p, false); });
    } else {
      alert('Yeterli paranız yok!');
      afterLanding(p, false);
    }
  };
  document.getElementById('buyNo').onclick = ()=>{
    closeModal();
    G.awaitingAction=false;
    log(`⏭️ <b>${p.name}</b> ${cell.name} mülkünü almadı.`);
    afterLanding(p, false);
  };
}

function buyProperty(p, cb){
  const cell = G.cells[p.position];
  p.money -= cell.price;
  cell.owner = p.id;
  p.properties.push(p.position);
  playBuyPropertySound();
  log(`🏷️ <b>${p.name}</b>, ${cell.name} mülkünü ${fmt(cell.price)} karşılığında satın aldı.`);
  refreshOwnershipMarks();
  renderFinance();
  updateTopbar();
  cb();
}

/* ============================ KİRA ÖDEME ============================ */

function calcRent(cell, diceTotal){
  const owner = G.players[cell.owner];
  if(cell.mortgaged) return 0;
  if(cell.type==='utility'){
    const ownedUtilCount = UTILITY_INDEXES.filter(i=>G.cells[i].owner===cell.owner).length;
    const mult = ownedUtilCount>=2 ? 1000 : 500;
    return diceTotal * mult;
  }
  if(cell.type==='property'){
    if(cell.houses>0){
      return cell.rent[cell.houses];
    }
    let base = cell.rent[0];
    if(ownsFullGroup(owner, cell.group)) base *= 2;
    return base;
  }
  return 0;
}

function payRentTo(p, cell, cb){
  const owner = G.players[cell.owner];
  const diceTotal = lastDiceTotal || (1+Math.floor(Math.random()*6)+1+Math.floor(Math.random()*6));
  const rent = calcRent(cell, diceTotal);
  if(rent<=0){
    log(`ℹ️ ${cell.name} ipotekli olduğu için kira alınmadı.`);
    cb();
    return;
  }
  p.money -= rent;
  owner.money += rent;
  log(`💸 <b>${p.name}</b>, <b>${owner.name}</b>'e ${cell.name} için ${fmt(rent)} kira ödedi.`);
  renderFinance();
  updateTopbar();
  checkBankruptcyThen(p, cb);
}

let lastDiceTotal = 0;

/* ============================ ŞANS / HAZİNE KARTLARI ============================ */

function drawCard(p, deck, cb){
  const arr = deck==='sans' ? SANS_CARDS : HAZINE_CARDS;
  const card = arr[Math.floor(Math.random()*arr.length)];
  const deckLabel = deck==='sans' ? '🎴 ŞANS' : '💰 HAZİNE BONUSU';
  showModal(`<h3>${deckLabel}</h3><p>${card.text}</p><div class="btnrow"><button class="btn-neutral" id="cardOk">Tamam</button></div>`);
  const finish = ()=>{
    closeModal();
    G.awaitingAction=false;
    applyCard(p, card, cb);
  };
  if(p.type==='cpu'){
    setTimeout(finish, 900);
  } else {
    G.awaitingAction = true;
    document.getElementById('cardOk').onclick = finish;
  }
}

function applyCard(p, card, cb){
  log(`🃏 <b>${p.name}</b> kart çekti: "${card.text}"`);

  const finalize = ()=>{ checkBankruptcyThen(p, cb); };

  if(card.getOutOfJail){
    p.getOutOfJailCards++;
    renderFinance();
    finalize();
    return;
  }
  if(card.goToJail){
    sendToJail(p);
    finalize();
    return;
  }
  if(card.moveTo){
    moveToNamed(p, card.moveTo, true, ()=>{
      landOnCell(p, finalize);
    });
    return;
  }
  if(card.moveRel){
    const np = ((p.position + card.moveRel) % 40 + 40) % 40;
    p.position = np;
    refreshTokensOnBoard();
    landOnCell(p, finalize);
    return;
  }
  if(card.toKasa){
    p.money -= card.toKasa;
    G.kasa += card.toKasa;
    renderFinance(); updateTopbar();
    finalize();
    return;
  }
  if(card.collectFromEach){
    G.players.forEach(op=>{
      if(op.id!==p.id && !op.bankrupt){
        const amt = Math.min(card.collectFromEach, Math.max(0,op.money));
        op.money -= card.collectFromEach;
        p.money += card.collectFromEach;
      }
    });
    renderFinance();
    finalize();
    return;
  }
  if(card.perHouse || card.perHotel){
    let total = 0;
    p.properties.forEach(i=>{
      const c = G.cells[i];
      if(c.type==='property'){
        if(c.houses>0 && c.houses<5) total += (card.perHouse||0)*c.houses;
        if(c.houses===5) total += (card.perHotel||0);
      }
    });
    p.money -= total;
    log(`🧾 Toplam bina vergisi: ${fmt(total)}`);
    renderFinance(); updateTopbar();
    finalize();
    return;
  }
  if(card.money){
    p.money += card.money;
    renderFinance(); updateTopbar();
    finalize();
    return;
  }
  finalize();
}

/* ============================ HAPİS / SINIR DIŞI İŞLEMLERİ ============================ */

function handleJailRoll(p, d1, d2){
  lastDiceTotal = d1+d2;
  if(d1===d2){
    log(`🎲 <b>${p.name}</b> çift zar attı ve Sınır Dışı'ndan kurtuldu!`);
    p.inJail = false;
    p.jailTurns = 0;
    movePlayer(p, d1+d2, ()=>{ landOnCell(p, ()=>afterLanding(p, false)); });
    return;
  }
  p.jailTurns++;
  if(p.jailTurns>=3){
    log(`⏳ <b>${p.name}</b> 3 tur doldu, 5.000$ ceza ödeyip çıkıyor.`);
    p.money -= 5000;
    p.inJail=false; p.jailTurns=0;
    checkBankruptcyThen(p, ()=>{
      movePlayer(p, d1+d2, ()=>{ landOnCell(p, ()=>afterLanding(p, false)); });
    });
    return;
  }
  log(`🚫 <b>${p.name}</b> çift zar atamadı, Sınır Dışı'nda kalmaya devam ediyor (${p.jailTurns}. tur).`);
  renderFinance();
  setTimeout(nextPlayer, 900);
}

function jailPayFine(playerId){
  const p = G.players[playerId];
  if(p.id!==G.current || !p.inJail) return;
  if(p.money<5000){ alert('Yeterli paranız yok!'); return; }
  p.money -= 5000;
  p.inJail=false; p.jailTurns=0;
  log(`💵 <b>${p.name}</b> 5.000$ ceza ödeyip Sınır Dışı'ndan çıktı.`);
  renderFinance(); updateTopbar();
  document.getElementById('rollBtn').disabled=false;
}
function jailUseCard(playerId){
  const p = G.players[playerId];
  if(p.id!==G.current || !p.inJail || p.getOutOfJailCards<=0) return;
  p.getOutOfJailCards--;
  p.inJail=false; p.jailTurns=0;
  log(`🎫 <b>${p.name}</b> Af Kartı kullanarak Sınır Dışı'ndan çıktı.`);
  renderFinance(); updateTopbar();
  document.getElementById('rollBtn').disabled=false;
}

function cpuHandleJail(p, afterCb){
  if(p.getOutOfJailCards>0){
    p.getOutOfJailCards--;
    p.inJail=false; p.jailTurns=0;
    log(`🤖 <b>${p.name}</b> Af Kartı kullanarak çıktı.`);
    afterCb();
    return;
  }
  if(p.jailTurns>=1 && p.money>15000){
    p.money -= 5000;
    p.inJail=false; p.jailTurns=0;
    log(`🤖 <b>${p.name}</b> ceza ödeyip çıktı.`);
    renderFinance();
    afterCb();
    return;
  }
  const [d1,d2] = rollTwoDice();
  animateDiceRoll(d1, d2, ()=>handleJailRoll(p, d1, d2));
}

/* ============================ BİNA / İPOTEK İŞLEMLERİ ============================ */

function buildHouse(cellIdx){
  const cell = G.cells[cellIdx];
  const p = G.players[G.current];
  if(cell.owner!==p.id) return;
  if(!ownsFullGroup(p, cell.group)) return;
  if(cell.houses>=5) return;
  if(p.money < cell.houseCost){ alert('Yeterli paranız yok!'); return; }
  p.money -= cell.houseCost;
  cell.houses++;
  if(cell.houses===5){ playPlazaSound(); } else { playBuyHouseSound(); }
  log(`🏗️ <b>${p.name}</b>, ${cell.name} üzerine ${cell.houses===5?'plaza':'ev'} inşa etti.`);
  renderFinance(); updateTopbar();
}

function sellHouse(cellIdx){
  const cell = G.cells[cellIdx];
  const p = G.players[G.current];
  if(cell.owner!==p.id || cell.houses<=0) return;
  cell.houses--;
  p.money += Math.round(cell.houseCost/2);
  log(`🔨 <b>${p.name}</b>, ${cell.name} üzerinden bir bina sattı.`);
  renderFinance(); updateTopbar();
}

function mortgageProp(cellIdx){
  const cell = G.cells[cellIdx];
  const p = G.players[G.current];
  if(cell.owner!==p.id || cell.mortgaged || cell.houses>0) return;
  cell.mortgaged = true;
  p.money += cell.mortgage;
  log(`🏦 <b>${p.name}</b>, ${cell.name} mülkünü ipotek etti (+${fmt(cell.mortgage)}).`);
  renderFinance(); updateTopbar();
}

function unmortgageProp(cellIdx){
  const cell = G.cells[cellIdx];
  const p = G.players[G.current];
  const cost = Math.round(cell.mortgage*1.1);
  if(cell.owner!==p.id || !cell.mortgaged) return;
  if(p.money<cost){ alert('Yeterli paranız yok!'); return; }
  p.money -= cost;
  cell.mortgaged = false;
  log(`🏦 <b>${p.name}</b>, ${cell.name} mülkünün ipoteğini kaldırdı (-${fmt(cost)}).`);
  renderFinance(); updateTopbar();
}

/* ============================ İFLAS KONTROLÜ ============================ */

function checkBankruptcyThen(p, cb){
  if(p.money>=0 || p.bankrupt){ cb(); return; }

  // Otomatik kurtarma: ipotek yapılabilecek mülkleri ipotek et
  for(const i of p.properties){
    if(p.money>=0) break;
    const c = G.cells[i];
    if(c.type==='property' && c.houses>0){
      p.money += Math.round(c.houseCost/2)*c.houses;
      c.houses = 0;
    }
  }
  for(const i of p.properties){
    if(p.money>=0) break;
    const c = G.cells[i];
    if(!c.mortgaged && c.houses===0){
      c.mortgaged = true;
      p.money += c.mortgage;
    }
  }

  if(p.money<0){
    p.bankrupt = true;
    p.properties.forEach(i=>{
      const c = G.cells[i];
      c.owner=null; c.mortgaged=false; c.houses=0;
    });
    p.properties = [];
    playBankruptSound();
    log(`💥 <b>${p.name}</b> İFLAS ETTİ ve oyundan çekildi!`);
    refreshOwnershipMarks();
  }
  renderFinance(); updateTopbar();
  cb();
}

/* ============================ CPU OYNAMA ============================ */

function cpuTakeTurn(p){
  if(G.gameOver || p.bankrupt) return;
  if(p.inJail){
    cpuHandleJail(p, ()=>{});
    return;
  }
  const [d1,d2] = rollTwoDice();
  lastDiceTotal = d1+d2;
  animateDiceRoll(d1, d2, ()=>{
    log(`🤖 <b>${p.name}</b> zar attı: ${d1} + ${d2} = ${d1+d2}`);
    resolveDoubleTracking(p, d1, d2, ()=>{
      movePlayer(p, d1+d2, ()=>{
        landOnCell(p, ()=>{
          cpuMaybeBuild(p);
          afterLanding(p, d1===d2);
        });
      });
    });
  });
}

function cpuMaybeBuild(p){
  const groups = {};
  p.properties.forEach(i=>{
    const c = G.cells[i];
    if(c.type==='property'){
      groups[c.group] = groups[c.group] || [];
      groups[c.group].push(i);
    }
  });
  for(const g in groups){
    if(ownsFullGroup(p, g)){
      const idxs = groups[g].sort((a,b)=>G.cells[a].houses-G.cells[b].houses);
      const target = G.cells[idxs[0]];
      if(target.houses<5 && !target.mortgaged && p.money > target.houseCost*3){
        p.money -= target.houseCost;
        target.houses++;
        if(target.houses===5){ playPlazaSound(); } else { playBuyHouseSound(); }
        log(`🤖 <b>${p.name}</b>, ${target.name} üzerine ${target.houses===5?'plaza':'ev'} yaptı.`);
      }
    }
  }
  renderFinance();
}

/* ============================ MODAL ============================ */

function showModal(html){
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalOverlay').style.display='flex';
}
function closeModal(){
  document.getElementById('modalOverlay').style.display='none';
}

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

function playDiceSound(){
  for(let i=0;i<6;i++){ beep(180+Math.random()*350, 0.06, 'square', i*0.09, 0.15); }
}
function playPassStartSound(){ // Başlangıçtan geçme sesi
  [523.25,659.25,783.99,1046.5].forEach((f,i)=>beep(f,0.18,'sine',i*0.11,0.2));
}
function playBankSound(){ // Dünya Bankası'na (kasa/free parking) geliş sesi — farklı ton
  [659.25,880,987.77,1318.5].forEach((f,i)=>beep(f,0.16,'triangle',i*0.1,0.22));
}
function playBuyPropertySound(){ // Arsa satın alma
  [440,554.37,659.25].forEach((f,i)=>beep(f,0.16,'sine',i*0.1,0.2));
}
function playBuyHouseSound(){ // Ev alma
  [329.63,415.3,493.88,659.25].forEach((f,i)=>beep(f,0.12,'square',i*0.08,0.16));
}
function playPlazaSound(){ // Plaza — alkış benzeri + zafer akoru
  for(let i=0;i<14;i++){ beep(150+Math.random()*900, 0.045,'sawtooth', i*0.028, 0.09); }
  [523.25,659.25,783.99,1046.5].forEach((f,i)=>beep(f,0.3,'sine',0.4+i*0.06,0.2));
}
function playBankruptSound(){ // İflas — olumsuz
  [392,349.23,311.13,261.63,220].forEach((f,i)=>beep(f,0.26,'sawtooth',i*0.18,0.2));
}
function playLoseSound(){ // Oyunu kaybetme — farklı olumsuz
  [293.66,261.63,220,196,146.83].forEach((f,i)=>beep(f,0.35,'square',i*0.22,0.22));
}
function playWinSound(){ // Kazanma
  [523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>beep(f,0.22,'sine',i*0.1,0.22));
}
