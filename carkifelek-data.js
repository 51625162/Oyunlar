/* ============================================================
   ÇARKIFELEK KELİME/İFADE VERİ BANKASI (GENİŞLETİLMİŞ)
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
    'Dağ dağa kavuşmaz insan insana kavuşur',
    'Aç ayı oynamaz',
    'Bal tutan parmağını yalar',
    'Besle kargayı oysun gözünü',
    'Çamurlu su ile abdest alınmaz',
    'Damlaya damlaya sel olur',
    'Denize düşen yılana sarılır',
    'Dile kolay',
    'El eli yıkar el de yüzü',
    'Görünen köy kılavuz istemez',
    'Gülme komşuna gelir başına',
    'Herkes kendi bildiğini okur',
    'İki cambaz bir ipte oynamaz',
    'İğneyi kendine batır çuvaldızı başkasına',
    'Kafasına göre takılır',
    'Kartal kanadıyla kartaldır',
    'Kork Allahtan korkmayandan',
    'Meyve veren ağaç taşlanır',
    'Ne oldum dememeli ne olacağım demeli',
    'Öfkeyle kalkan zararla oturur',
    'Rüzgar eken fırtına biçer',
    'Sona kalan dona kalır',
    'Sütten ağzı yanan yoğurdu üfleyerek yer',
    'Terzi kendi söküğünü dikemez',
    'Ummadığın taş baş yarar',
    'Ye kürküm ye',
    'Yorgan gitti kavga bitti',
    'Az söyle çok dinle',
    'Bugünün işini yarına bırakma',
    'Denizi gören dere geçmez'
  ]},

  ulkeler: { label:'🌍 Ülkeler', items:[
    'Türkiye','Almanya','Fransa','İtalya','İspanya','Portekiz','Yunanistan','İngiltere',
    'Hollanda','Belçika','İsviçre','Avusturya','Polonya','Çekya','Macaristan','Romanya',
    'Bulgaristan','Rusya','Ukrayna','Norveç','İsveç','Finlandiya','Danimarka','İzlanda',
    'Amerika Birleşik Devletleri','Kanada','Meksika','Brezilya','Arjantin','Şili','Peru',
    'Kolombiya','Mısır','Fas','Cezayir','Güney Afrika','Nijerya','Kenya','Etiyopya',
    'Japonya','Çin','Güney Kore','Hindistan','Endonezya','Tayland','Vietnam','Malezya',
    'Avustralya','Yeni Zelanda','Suudi Arabistan','Birleşik Arap Emirlikleri','İran','Irak',
    'Suriye','Ürdün','İsrail','Pakistan','Afganistan','Kazakistan','Azerbaycan','Gürcistan',
    'Ermenistan','Kıbrıs','Malta','Hırvatistan','Sırbistan','Slovenya','Slovakya',
    'Litvanya','Letonya','Estonya','İrlanda','Lüksemburg','Filipinler','Singapur',
    'Katar','Kuveyt','Umman','Bahreyn','Lübnan','Tunus','Libya'
  ]},

  hayvanlar: { label:'🐾 Hayvanlar', items:[
    'Aslan','Kaplan','Fil','Zürafa','Maymun','Ayı','Kurt','Tilki','Tavşan','At',
    'İnek','Koyun','Keçi','Domuz','Tavuk','Ördek','Baykuş','Papağan','Köpekbalığı',
    'Yunus','Balina','Ahtapot','Yılan','Kaplumbağa','Timsah','Kurbağa','Örümcek',
    'Kelebek','Penguen','Deve','Kanguru','Panda','Koala','Zebra','Geyik',
    'Gergedan','Su Aygırı','Leopar','Çita','Porsuk','Kunduz','Bizon','Manda',
    'Eşek','Katır','Serçe','Güvercin','Leylek','Pelikan','Martı','Kartal',
    'Şahin','Akbaba','Tavus Kuşu','Hindi','Kaz','Yengeç','Istakoz','Kirpi',
    'Sincap','Yarasa','Flamingo','Fok','Karga','Karınca','Arı','Bukalemun'
  ]},

  meslekler: { label:'👷 Meslekler', items:[
    'Doktor','Öğretmen','Mühendis','Avukat','Polis','İtfaiyeci','Aşçı','Şoför','Pilot',
    'Hemşire','Berber','Terzi','Marangoz','Çiftçi','Balıkçı','Ressam','Müzisyen','Yazar',
    'Gazeteci','Fotoğrafçı','Mimar','Eczacı','Veteriner','Diş Hekimi','Garson',
    'Hakim','Muhasebeci','Bankacı','Sekreter','Aktör','Dansçı','Şarkıcı','Sporcu',
    'Antrenör','Dedektif','Asker','Kaptan','Hostes','Şef','Kuaför','Bahçıvan'
  ]},

  yiyecekler: { label:'🍎 Yiyecekler', items:[
    'Karnıyarık','Mantı','Lahmacun','Baklava','Künefe','İskender','Menemen','Çiğ Köfte',
    'Kısır','Dolma','Sarma','Hünkar Beğendi','Tavuk Şiş','Balık Ekmek','Simit',
    'Kuru Fasulye','Mercimek Çorbası','Ezogelin Çorbası','Pide','Gözleme','Börek',
    'Türlü','İmam Bayıldı','Zeytinyağlı Yaprak Sarma','Kadayıf','Sütlaç','Aşure',
    'Revani','Lokma','Tulumba','Şekerpare','Kazandibi','Muhallebi','Güllaç',
    'Mercimek Köftesi','Humus','Cacık','Piyaz','Tarhana Çorbası','Yayla Çorbası',
    'Etli Ekmek','Cağ Kebabı','Adana Kebap','Urfa Kebap','Testi Kebabı','Perde Pilavı',
    'Manti Sos','Su Böreği','Katmer','Çiğ Köfte Dürüm','Ayran Aşı','Keşkek'
  ]},

  sehirler: { label:'🗺️ Türkiye Şehirleri', items:[
    'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin',
    'Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa',
    'Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Edirne','Elazığ','Erzincan',
    'Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Isparta',
    'Mersin','İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir',
    'Kocaeli','Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla',
    'Muş','Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas',
    'Tekirdağ','Tokat','Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak',
    'Aksaray','Bayburt','Karaman','Kırıkkale','Batman','Şırnak','Bartın','Ardahan',
    'Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce'
  ]}
};

const PHRASE_CATEGORY_ORDER = ['atasozu','ulkeler','hayvanlar','meslekler','yiyecekler','sehirler'];

const TR_ALPHABET = ['A','B','C','Ç','D','E','F','G','Ğ','H','I','İ','J','K','L','M','N','O','Ö','P','R','S','Ş','T','U','Ü','V','Y','Z'];
