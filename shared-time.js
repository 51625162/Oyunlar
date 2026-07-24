/* ============================================================
   ORTAK GÜNLÜK SÜRE BÜTÇESİ
   Tüm oyunlar (Molicity, Çiftlik Oyunu T, UNO) bu dosyayı paylaşır.
   Çocuk modunda günlük TOPLAM en fazla 30 dakika oynanabilir;
   bir oyunda geçirilen süre diğer oyunlardan da düşer.
   Gün değiştiğinde (yeni takvim günü) süre otomatik sıfırlanır.
   ============================================================ */

const SHARED_TIME_KEY = 'oyun_gunluk_sure_v1';
const DAILY_LIMIT_SECONDS = 30*60;

function _todayStr(){
  const d = new Date();
  return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
}

function getSharedUsedSeconds(){
  try{
    const raw = localStorage.getItem(SHARED_TIME_KEY);
    if(!raw) return 0;
    const obj = JSON.parse(raw);
    if(obj.date !== _todayStr()) return 0; // yeni gün, sıfırla
    return obj.usedSeconds || 0;
  }catch(e){ return 0; }
}

function addSharedUsedSeconds(sec){
  try{
    let used = getSharedUsedSeconds();
    used += sec;
    localStorage.setItem(SHARED_TIME_KEY, JSON.stringify({date:_todayStr(), usedSeconds:used}));
  }catch(e){ /* localStorage kullanılamıyor olabilir */ }
}

function getSharedRemainingSeconds(){
  return Math.max(0, DAILY_LIMIT_SECONDS - getSharedUsedSeconds());
}
