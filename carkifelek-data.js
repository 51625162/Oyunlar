/* ============================================================
   ÇARKIFELEK KELİME/İFADE VERİ BANKASI
   ============================================================ */

const PHRASE_CATEGORIES = {
  atasozu: { label:'📜 Atasözü ve Deyimler', items:[
    'Damlaya damlaya göl olur',
    'Sakla samanı gelir zamanı',
    'Ateş olmayan yerden duman çıkmaz',
    'Bir elin nesi var iki elin sesi var',
    'Gülü seven dikenine katlanır',
    'Aç tavuk kendini buğday ambarında sanır',
    'Ayağını yorganına göre uzat',
    'Boş çuval ayakta durmaz',
    'Can boğazdan gelir',
    'Dost kara günde belli olur',
    'Emek olmadan yemek olmaz',
    'Fazla mal göz çıkarmaz',
    'Gökten üç elma düştü',
    'Her koyun kendi bacağından asılır',
    'İşleyen demir ışıldar',
    'Komşu komşunun külüne muhtaçtır',
    'Merhamet gösterme',
    'Ne ekersen onu biçersin',
    'Ok yaydan çıktı',
    'Sabreden derviş muradına ermiş',
    'Su uyur düşman uyumaz',
    'Tatlı dil yılanı deliğinden çıkarır',
    'Üzüm üzüme baka baka kararır',
    'Vakit nakittir',
    'Yalancının mumu yatsıya kadar yanar',
    'Zaman her şeyin ilacıdır',
    'Ağaç yaşken eğilir',
    'Bakarsan bağ olur bakmazsan dağ olur',
    'Cesaret bulunmaz cesur olunur',
    'Dağ dağa kavuşmaz insan insana kavuşur'
  ]},

  ulkeler: { label:'🌍 Ülkeler', items:[
    'Türkiye','Almanya','Fransa','İtalya','İspanya','Portekiz','Yunanistan','İngiltere',
    'Hollanda','Belçika','İsviçre','Avusturya','Polonya','Çekya','Macaristan','Romanya',
    'Bulgaristan','Rusya','Ukrayna','Norveç','İsveç','Finlandiya','Danimarka','İzlanda',
    'Amerika Birleşik Devletleri','Kanada','Meksika','Brezilya','Arjantin','Şili','Peru',
    'Kolombiya','Mısır','Fas','Cezayir','Güney Afrika','Nijerya','Kenya','Etiyopya',
    'Japonya','Çin','Güney Kore','Hindistan','Endonezya','Tayland','Vietnam','Malezya',
    'Avustralya','Yeni Zelanda','Suudi Arabistan','Birleşik Arap Emirlikleri','İran','Irak',
    'Suriye','Ürdün','İsrail','Pakistan','Afganistan','Kazakistan','Azerbaycan','Gürcistan'
  ]},

  hayvanlar: { label:'🐾 Hayvanlar', items:[
    'Aslan','Kaplan','Fil','Zürafa','Maymun','Ayı','Kurt','Tilki','Tavşan','At',
    'İnek','Koyun','Keçi','Domuz','Tavuk','Ördek','Baykuş','Papağan','Köpekbalığı',
    'Yunus','Balina','Ahtapot','Yılan','Kaplumbağa','Timsah','Kurbağa','Örümcek',
    'Kelebek','Penguen','Deve','Kanguru','Panda','Koala','Zebra','Geyik'
  ]},

  meslekler: { label:'👷 Meslekler', items:[
    'Doktor','Öğretmen','Mühendis','Avukat','Polis','İtfaiyeci','Aşçı','Şoför','Pilot',
    'Hemşire','Berber','Terzi','Marangoz','Çiftçi','Balıkçı','Ressam','Müzisyen','Yazar',
    'Gazeteci','Fotoğrafçı','Mimar','Eczacı','Veteriner','Diş Hekimi','Garson'
  ]},

  yiyecekler: { label:'🍎 Yiyecekler', items:[
    'Karnıyarık','Mantı','Lahmacun','Baklava','Künefe','İskender','Menemen','Çiğ Köfte',
    'Kısır','Dolma','Sarma','Hünkar Beğendi','Tavuk Şiş','Balık Ekmek','Simit',
    'Kuru Fasulye','Mercimek Çorbası','Ezogelin Çorbası','Pide','Gözleme','Börek',
    'Türlü','İmam Bayıldı','Zeytinyağlı Yaprak Sarma','Kadayıf','Sütlaç','Aşure',
    'Revani','Lokma','Tulumba'
  ]}
};

const PHRASE_CATEGORY_ORDER = ['atasozu','ulkeler','hayvanlar','meslekler','yiyecekler'];

const TR_ALPHABET = ['A','B','C','Ç','D','E','F','G','Ğ','H','I','İ','J','K','L','M','N','O','Ö','P','R','S','Ş','T','U','Ü','V','Y','Z'];
