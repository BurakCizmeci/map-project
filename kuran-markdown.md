# Kur'an Coğrafyası İnteraktif Harita Projesi (Teknik Şartname & Genişletilmiş Veri Seti)

Bu doküman; Kur'an-ı Kerim'de adı veya somut vasıfları geçen coğrafi ve kutsal mekânları interaktif bir harita üzerinde iki dilli (Türkçe / İngilizce), kesinlik derecelerine göre renklendirilmiş, Wikipedia ve Kur'an API entegrasyonlu olarak sunan web uygulamasının mimarisini, veri tabanını ve bileşen gereksinimlerini içerir.

---

## 1. Temel Özellikler & Fonksiyonel Gereksinimler

### 1.1. Harita Altyapısı ve Katmanlar
* **Harita Motoru:** Leaflet.js veya MapLibre GL JS.
* **Varsayılan Görünüm:** Minimalist ve temiz bir altlık (CartoDB Positron / OpenStreetMap).
* **Ek Katman Seçeneği (Topografik / Rölyef / Uydu):** 
  * Kullanıcının tek tıkla geçiş yapabileceği **ESRI World Imagery (Uydu)** veya **OpenTopoMap (Topografik/Rölyef)** katman seçeneği.
  * Antik vadi, dağ ve çöl coğrafyasının yükseklik eğrileriyle incelenmesini sağlar.

### 1.2. 5 Seviyeli Kesinlik Skalası ve Renk Kodları
Harita pinleri ve lejant aşağıdaki 5 renk sınıflandırmasına göre renklendirilecektir:
1. **5/5 (Çok Yüksek):** Zümrüt Yeşili (`#10B981`) — Modern yerle özdeşleştirmede problem yok; fiziki süreklilik mutlak.
2. **4 – 4.5/5 (Yüksek):** Canlı Mavi (`#0284C7`) — Güçlü tarihsel/geleneksel/arkeolojik dayanak var, metinsel veya konumsal ufak nüanslar mevcut.
3. **3 – 3.5/5 (Orta):** Kehribar/Sarı (`#F59E0B`) — Genel bölge makul, tam nokta veya tarihsel bağlantı akademik olarak tartışmalı.
4. **2 – 2.5/5 (Düşük):** Turuncu (`#F97316`) — Birden fazla aday var, kesin lokasyon belirsiz.
5. **1 – 1.5/5 (Çok Düşük / Bilinmeyen):** Mercan Kırmızısı (`#EF4444`) — İsim veya niteleme mevcut fakat somut fiziki referans tamamen meçhul.

### 1.3. Kesinlik Filtresi
* Haritanın üst kontrol panelinde 1 ile 5 arası butonlar veya bir aralık kaydırıcısı (slider) bulunacaktır.
* Örneğin kullanıcı "Yalnızca 4/5 ve üzeri kesin yerler" seçtiğinde, spekülatif veya tartışmalı noktalar haritadan gizlenerek yalnızca tarihsel olarak sağlam noktalar filtrelenecektir.

### 1.4. Kıssalar ve Tarihsel Rotalar Modu
Harita üzerinde kesikli çizgilerle (polyline) ve sıralı adımlarla gösterilebilen rotalar:
* **Rota A: Hz. Mûsâ Kıssası:** Mısır $\rightarrow$ Medyen $\rightarrow$ Tuvâ Vadisi $\rightarrow$ Tûr-i Sînâ $\rightarrow$ el-Arzü'l-Mukaddese.
* **Rota B: Erken İslâm & Hicret Havzası:** Mekke $\rightarrow$ Medine (Yesrib) $\rightarrow$ Bedir $\rightarrow$ Sel Dağı (Hendek) $\rightarrow$ Hudeybiye $\rightarrow$ Huneyn.
* **Rota C: Kur'an'da Hac & Kutsal Menâsik Hattı:** Mescid-i Harâm $\rightarrow$ Safâ ve Merve $\rightarrow$ Minâ $\rightarrow$ el-Meş'arü'l-Harâm (Müzdelife) $\rightarrow$ Arafat.
* **Rota D: Kuzey Seferleri & Tebük Hattı:** Medine $\rightarrow$ el-Hicr (Medâin Sâlih) $\rightarrow$ Tebük.
* Rota seçildiğinde ilgili duraklar sırayla vurgulanır ve kameranın odağı rotayı kapsayacak şekilde ayarlanır (`fitBounds`).

### 1.5. Bilinmeyen / Tartışmalı Mekânlar Çekmecesi ("Off-Map / Uncharted")
* İrem, Eyke, er-Rass, er-Rakîm, Mecma'u'l-Bahreyn ve Sedd-i Zülkarneyn gibi kesin koordinatı olmayan veya soyut/tartışmalı yerler haritada yanıltıcı bir nokta olarak gösterilmez.
* Haritanın sağında veya altında **"Konumu Belirsiz Mekânlar"** özel paneli yer alır. Tıklandığında ilgili ayet ve akademik tartışma kartı açılır.

### 1.6. Dış Kaynak ve API Entegrasyonları
1. **Wikipedia API:**
   * Tıklanan mekân için ilgili dilde dinamik özet ve kapak görseli çeker:
   * TR: `https://tr.wikipedia.org/api/rest_v1/page/summary/{wiki_slug_tr}`
   * EN: `https://en.wikipedia.org/api/rest_v1/page/summary/{wiki_slug_en}`
2. **Kur'an API (Quran.com API v4):**
   * Lokasyona bağlı ayetlere tıklandığında Arapça metin ve seçili dildeki meal getirilir:
   * `https://api.quran.com/api/v4/verses/by_key/{surah:ayah}?language={tr|en}&words=false`
   * Türkçe için Diyanet İşleri / Elmalılı meali, İngilizce için Sahih International / ClearQuran.

---

## 2. Arayüz & UI/UX Düzeni (Layout)

```
+----------------------------------------------------------------------------------------------------+
| [Kur'an Coğrafyası / Quranic Geo] | [Dil: TR/EN] | [Filtre: 1..5] | [Kategori: Tümü/Şehir/Kutsal] | [Rotalar] |
+----------------------------------------------------+-----------------------------------------------+
|                                                    | [SAĞ / ALT BİLGİ PANELİ]                      |
|                                                    | - Mekân Adı & Kur'an'daki Adı (Arapça)        |
|                                                    | - Kesinlik Rozeti (örn. 3.5/5 - Kehribar Sarı)|
|         İNTERAKTİF HARİTA                          | - Wikipedia Özeti & Görseli                  |
|   (Leaflet / MapLibre)                             | - Kur'an Ayetleri (Arapça & Çeviri Meali)     |
|                                                    | - Akademik, Arkeolojik & Tefsir Notu          |
|   [Katman: Minimal / Topo / Uydu]                  | --------------------------------------------- |
|                                                    | [BELİRSİZ / HARİTA DIŞI MEKÂNLAR ÇEKMECESİ]   |
|                                                    | (İrem, Eyke, er-Rass, er-Rakîm, Sedd, Mecma') |
+----------------------------------------------------+-----------------------------------------------+
```

---

## 3. Genişletilmiş Ana Veri Seti (`placesData.json`)

Toplam **38 mekân** (32 harita üzerinde koordinatlı, 6 harita dışı/bilinmeyen).

```json
[
  {
    "id": "mekke",
    "name": {
      "tr": "Mekke",
      "en": "Mecca"
    },
    "quran_name": "مَكَّة",
    "category": "city",
    "certainty": 5.0,
    "certainty_level": 5,
    "coordinates": [
      21.4225,
      39.8262
    ],
    "is_on_map": true,
    "verses": [
      "48:24"
    ],
    "wiki_slug": {
      "tr": "Mekke",
      "en": "Mecca"
    },
    "context_note": {
      "tr": "Kur'an'daki özel isim bugünkü Mekke ile özdeşleştirilir; İslami tarih ve hac geleneği kesintisiz biçimde aynı merkezi gösterir.",
      "en": "Directly identified with modern Mecca; uninterrupted Islamic tradition and pilgrimage history confirm the same sanctuary."
    }
  },
  {
    "id": "bekke",
    "name": {
      "tr": "Bekke",
      "en": "Bakkah"
    },
    "quran_name": "بَكَّة",
    "category": "holy_place",
    "certainty": 4.5,
    "certainty_level": 4,
    "coordinates": [
      21.4229,
      39.8257
    ],
    "is_on_map": true,
    "verses": [
      "3:96"
    ],
    "wiki_slug": {
      "tr": "Bekke",
      "en": "Bakkah"
    },
    "context_note": {
      "tr": "İslami gelenekte Mekke'nin diğer adı kabul edilir. Ancak Kur'an 'Bakka = Mekke' diye ayrıca açıklama yapmaz; bağlam ve gelenek üzerinden kurulur.",
      "en": "Traditionally recognized as an ancient name for Mecca, derived from historical context and Quranic exegesis."
    }
  },
  {
    "id": "medine",
    "name": {
      "tr": "Medine / Yesrib",
      "en": "Medina / Yathrib"
    },
    "quran_name": "المَدِينَة / يَثْرِب",
    "category": "city",
    "certainty": 5.0,
    "certainty_level": 5,
    "coordinates": [
      24.4672,
      39.6111
    ],
    "is_on_map": true,
    "verses": [
      "9:101",
      "9:120",
      "33:13",
      "33:60",
      "63:8"
    ],
    "wiki_slug": {
      "tr": "Medine",
      "en": "Medina"
    },
    "context_note": {
      "tr": "Yesrib, Medine'nin İslam öncesi adıdır. Erken İslam tarihindeki şehirle modern Medine'nin coğrafi özdeşliği mutlaktır.",
      "en": "Yathrib is the pre-Islamic name of Medina. Identification with the modern city is historically definitive."
    }
  },
  {
    "id": "misir",
    "name": {
      "tr": "Mısır",
      "en": "Egypt"
    },
    "quran_name": "مِصْر",
    "category": "region",
    "certainty": 5.0,
    "certainty_level": 5,
    "coordinates": [
      30.0444,
      31.2357
    ],
    "is_on_map": true,
    "verses": [
      "10:87",
      "12:21",
      "12:99",
      "43:51",
      "2:61"
    ],
    "wiki_slug": {
      "tr": "Mısır",
      "en": "Egypt"
    },
    "context_note": {
      "tr": "Yusuf ve Musa kıssalarında Mısır ülkesi olduğu açıktır. Ancak Bakara 2:61'deki 'mişr' kelimesi genel 'herhangi bir şehir/kasaba' anlamında da tefsir edilmiştir.",
      "en": "Clearly denotes Egypt in the narratives of Joseph and Moses. However, the term 'misr' in 2:61 is also interpreted generically as 'a settled town'."
    }
  },
  {
    "id": "babil",
    "name": {
      "tr": "Babil",
      "en": "Babylon"
    },
    "quran_name": "بَابِل",
    "category": "city",
    "certainty": 5.0,
    "certainty_level": 5,
    "coordinates": [
      32.5422,
      44.4211
    ],
    "is_on_map": true,
    "verses": [
      "2:102"
    ],
    "wiki_slug": {
      "tr": "Babil",
      "en": "Babylon"
    },
    "context_note": {
      "tr": "Antik Babil gerçek ve arkeolojik olarak Hillah (Irak) çevresinde mükemmel belgelenmiş bir şehirdir; Hârut ve Mârut kıssasında anılır.",
      "en": "Ancient Babylon is thoroughly documented archeologically near modern Hillah, Iraq; referenced in the account of Harut and Marut."
    }
  },
  {
    "id": "bedir",
    "name": {
      "tr": "Bedir",
      "en": "Badr"
    },
    "quran_name": "بَدْر",
    "category": "city",
    "certainty": 5.0,
    "certainty_level": 5,
    "coordinates": [
      23.7824,
      38.7908
    ],
    "is_on_map": true,
    "verses": [
      "3:123"
    ],
    "wiki_slug": {
      "tr": "Bedir_Savaşı",
      "en": "Badr,_Saudi_Arabia"
    },
    "context_note": {
      "tr": "Modern Bedir yerleşimi ve vadi sistemi iyi bilinir; Bedir Gazvesi'nin cereyan ettiği Hicaz bölgesidir.",
      "en": "Modern Badr settlement and valley in the Hejaz; site of the historic Battle of Badr."
    }
  },
  {
    "id": "huneyn",
    "name": {
      "tr": "Huneyn Vadisi",
      "en": "Hunayn Valley"
    },
    "quran_name": "حُنَيْن",
    "category": "valley",
    "certainty": 5.0,
    "certainty_level": 5,
    "coordinates": [
      21.4925,
      40.0536
    ],
    "is_on_map": true,
    "verses": [
      "9:25"
    ],
    "wiki_slug": {
      "tr": "Huneyn_Muharebesi",
      "en": "Battle_of_Hunayn"
    },
    "context_note": {
      "tr": "Mekke ile Taif arasındaki vadidir. Hem klasik hem modern kaynaklarda yeri kesin olarak belirlenmiştir.",
      "en": "Valley located between Mecca and Ta'if; definitively documented across Islamic and contemporary geographies."
    }
  },
  {
    "id": "mescid-i-haram",
    "name": {
      "tr": "Mescid-i Harâm",
      "en": "Al-Masjid al-Haram"
    },
    "quran_name": "المَسْجِد الحَرَام",
    "category": "holy_place",
    "certainty": 5.0,
    "certainty_level": 5,
    "coordinates": [
      21.4225,
      39.8262
    ],
    "is_on_map": true,
    "verses": [
      "2:144",
      "2:149",
      "2:150",
      "9:19",
      "17:1",
      "48:27"
    ],
    "wiki_slug": {
      "tr": "Mescid-i_Haram",
      "en": "Masjid_al-Haram"
    },
    "context_note": {
      "tr": "Kâbe'yi çevreleyen kutsal mescittir. İslami coğrafyada kesintisiz biçimde aynı mekândır.",
      "en": "The sacred mosque encompassing the Kaaba in Mecca, having continuous historical continuity."
    }
  },
  {
    "id": "safa-merve",
    "name": {
      "tr": "Safâ ve Merve",
      "en": "Safa and Marwah"
    },
    "quran_name": "الصَّفَا وَالمَرْوَة",
    "category": "holy_place",
    "certainty": 5.0,
    "certainty_level": 5,
    "coordinates": [
      21.4234,
      39.8274
    ],
    "is_on_map": true,
    "verses": [
      "2:158"
    ],
    "wiki_slug": {
      "tr": "Safa_ve_Merve",
      "en": "Safa_and_Marwa"
    },
    "context_note": {
      "tr": "Mekke'de Mescid-i Haram içinde yer alan iki tepe; sa'y ibadetinin yapıldığı fiziki tepelerdir.",
      "en": "Two historical hills within the Great Mosque of Mecca between which pilgrims perform the Sa'i."
    }
  },
  {
    "id": "arafat",
    "name": {
      "tr": "Arafat",
      "en": "Mount Arafat"
    },
    "quran_name": "عَرَفَات",
    "category": "holy_place",
    "certainty": 5.0,
    "certainty_level": 5,
    "coordinates": [
      21.3549,
      39.9841
    ],
    "is_on_map": true,
    "verses": [
      "2:198"
    ],
    "wiki_slug": {
      "tr": "Arafat",
      "en": "Mount_Arafat"
    },
    "context_note": {
      "tr": "Mekke'nin doğusunda hac vakfesinin yapıldığı ova ve tepe. Coğrafi süreklilik mutlaktır.",
      "en": "The plain and granite hill east of Mecca where the central standing vigil (Wuquf) of Hajj takes place."
    }
  },
  {
    "id": "mescid-i-kuba",
    "name": {
      "tr": "Mescid-i Kubâ",
      "en": "Quba Mosque"
    },
    "quran_name": "مَسْجِد قُبَاء / مَسْجِد أُسِّسَ عَلَى التَّقْوَى",
    "category": "holy_place",
    "certainty": 5.0,
    "certainty_level": 5,
    "coordinates": [
      24.4392,
      39.6172
    ],
    "is_on_map": true,
    "verses": [
      "9:108"
    ],
    "wiki_slug": {
      "tr": "Kuba_Mescidi",
      "en": "Quba_Mosque"
    },
    "context_note": {
      "tr": "Tevbe 108'de 'ilk günden takva üzerine kurulan mescid' olarak övülen İslam tarihinin ilk ibadethanesidir; Medine'nin güneyinde fiziksel konumu kesintisiz sabittir.",
      "en": "Praised in Surah at-Tawbah (9:108) as the mosque 'founded upon piety from the first day'; the first mosque in Islamic history with unbroken continuity."
    }
  },
  {
    "id": "mescid-i-aksa",
    "name": {
      "tr": "Mescid-i Aksâ",
      "en": "Al-Aqsa"
    },
    "quran_name": "المَسْجِد الأَقْصَى",
    "category": "holy_place",
    "certainty": 4.5,
    "certainty_level": 4,
    "coordinates": [
      31.7761,
      35.2358
    ],
    "is_on_map": true,
    "verses": [
      "17:1"
    ],
    "wiki_slug": {
      "tr": "Mescid-i_Aksa",
      "en": "Al-Aqsa"
    },
    "context_note": {
      "tr": "Metinsel kesinlik 5/5'tir; Kur'an 'en uzak mescid' lafzını kullanır. Kudüs/Beytülmakdis ile özdeşleştirilmesi erken tefsir geleneğinde çok güçlüdür, ancak Kur'an bizzat Kudüs kelimesini telaffuz etmez.",
      "en": "Literally 'the farthest mosque'. Erudite early Islamic tafsir unanimously identified it with Jerusalem (Bayt al-Maqdis), though the text itself does not say 'Jerusalem'."
    }
  },
  {
    "id": "makam-i-ibrahim",
    "name": {
      "tr": "Makâm-ı İbrâhîm",
      "en": "Station of Abraham"
    },
    "quran_name": "مَقَام إِبْرَاهِيم",
    "category": "holy_place",
    "certainty": 4.5,
    "certainty_level": 4,
    "coordinates": [
      21.4226,
      39.8263
    ],
    "is_on_map": true,
    "verses": [
      "2:125",
      "3:97"
    ],
    "wiki_slug": {
      "tr": "Makam-ı_İbrahim",
      "en": "Station_of_Abraham"
    },
    "context_note": {
      "tr": "Kâbe yakınında Hz. İbrahim'in ayak izinin bulunduğuna inanılan taştır. Ritüel yeri sabittir, Kur'an mimari detay vermez.",
      "en": "The sacred stone near the Kaaba bearing the footprint impression; physically documented in Islamic architectural history."
    }
  },
  {
    "id": "hudeybiye",
    "name": {
      "tr": "Hudeybiye",
      "en": "Al-Hudaybiyyah"
    },
    "quran_name": "الحُدَيْبِيَة",
    "category": "holy_place",
    "certainty": 4.5,
    "certainty_level": 4,
    "coordinates": [
      21.4394,
      39.6389
    ],
    "is_on_map": true,
    "verses": [
      "48:18",
      "48:24",
      "48:25"
    ],
    "wiki_slug": {
      "tr": "Hudeybiye_Antlaşması",
      "en": "Treaty_of_Hudaybiyyah"
    },
    "context_note": {
      "tr": "Fetih Suresi'nde 'ağacın altında sana biat eden müminler' (Rıdvan Biatı) ve Mekke sınırındaki barış mahalli olarak zikredilir. Modern Şümeysi bölgesinde yeri kesindir.",
      "en": "Site of the historic Pledge of the Tree (Bay'at al-Ridwan) and treaty commemorated in Surah al-Fath; situated on the western entrance of Mecca."
    }
  },
  {
    "id": "hendek-sel",
    "name": {
      "tr": "Sel' Dağı & Hendek Havzası",
      "en": "Mount Sal' & Trench Area"
    },
    "quran_name": "جَبَل سَلْع / الأَحْزَاب",
    "category": "holy_place",
    "certainty": 4.5,
    "certainty_level": 4,
    "coordinates": [
      24.4752,
      39.5986
    ],
    "is_on_map": true,
    "verses": [
      "33:9",
      "33:10",
      "33:11",
      "33:25"
    ],
    "wiki_slug": {
      "tr": "Hendek_Muharebesi",
      "en": "Battle_of_the_Trench"
    },
    "context_note": {
      "tr": "Ahzâb Suresi'nde 'orduların üstünüzden ve altınızdan geldiği' kuşatma hattı. Medine'nin kuzeybatısındaki Sel' Dağı eteklerinde kazılan hendek ve karargâh mevkii bugün de belirgindir.",
      "en": "The defensive perimeter and military command site commemorated in Surah al-Ahzab (33:9-25) situated around Mount Sal' northwest of the Prophet's Mosque."
    }
  },
  {
    "id": "mina",
    "name": {
      "tr": "Minâ",
      "en": "Mina"
    },
    "quran_name": "مِنَى / الأَيَّام المَعْدُودَات",
    "category": "holy_place",
    "certainty": 4.5,
    "certainty_level": 4,
    "coordinates": [
      21.4133,
      39.8933
    ],
    "is_on_map": true,
    "verses": [
      "2:203"
    ],
    "wiki_slug": {
      "tr": "Mina,_Suudi_Arabistan",
      "en": "Mina,_Saudi_Arabia"
    },
    "context_note": {
      "tr": "Bakara 203'te 'sayılı günlerde Allah'ı anın' (eyyâm-ı ma'dûdât) olarak anılan Teşrik günlerinin ve remy-i cimâr (taşlama) ritüelinin yapıldığı kutsal vadi.",
      "en": "Designated in Surah al-Baqarah (2:203) as the 'numbered days'; the central valley between Mecca and Muzdalifah where Hajj stoning rites occur."
    }
  },
  {
    "id": "taif",
    "name": {
      "tr": "Tâif",
      "en": "Ta'if"
    },
    "quran_name": "الطَّائِف / القَرْيَتَيْن",
    "category": "city",
    "certainty": 4.5,
    "certainty_level": 4,
    "coordinates": [
      21.2854,
      40.4244
    ],
    "is_on_map": true,
    "verses": [
      "43:31"
    ],
    "wiki_slug": {
      "tr": "Taif",
      "en": "Taif"
    },
    "context_note": {
      "tr": "Zuhruf 31'de geçen 'iki şehrin' (el-Karyeteyn) tefsirlerde Mekke ile birlikte ittifakla Tâif olduğu kabul edilir. Hicaz dağlarındaki konumu sabittir.",
      "en": "Unanimously recognized in classical exegesis as one of the 'two towns' referenced in Surah az-Zukhruf (43:31) alongside Mecca; a major historic Hijaz highland city."
    }
  },
  {
    "id": "tebuk",
    "name": {
      "tr": "Tebük",
      "en": "Tabuk"
    },
    "quran_name": "تَبُوك / سَاعَة العُسْرَة",
    "category": "city",
    "certainty": 4.5,
    "certainty_level": 4,
    "coordinates": [
      28.3835,
      36.5662
    ],
    "is_on_map": true,
    "verses": [
      "9:117"
    ],
    "wiki_slug": {
      "tr": "Tebük",
      "en": "Tabuk,_Saudi_Arabia"
    },
    "context_note": {
      "tr": "Tevbe Suresi'nde 'zorluk zamanı' (saatü'l-usre) seferi olarak anılan ve Bizans sınırına yapılan son gazvenin varış noktası olan kuzey Hicaz vahasıdır.",
      "en": "Target of the final campaign led by the Prophet during the 'hour of difficulty' (Surah at-Tawbah 9:117); a pivotal strategic oasis in northwestern Arabia."
    }
  },
  {
    "id": "ashabul-uhdud",
    "name": {
      "tr": "Ashâbü'l-Uhdûd (Necran)",
      "en": "People of the Ditch (Najran)"
    },
    "quran_name": "أَصْحَابُ الأُخْدُود / نَجْرَان",
    "category": "ruined_site",
    "certainty": 4.5,
    "certainty_level": 4,
    "coordinates": [
      17.488,
      44.179
    ],
    "is_on_map": true,
    "verses": [
      "85:4",
      "85:5",
      "85:6",
      "85:7",
      "85:8"
    ],
    "wiki_slug": {
      "tr": "Necran",
      "en": "Najran"
    },
    "context_note": {
      "tr": "Bürûc Suresi'nde zikredilen hendek katliamı olayıdır. Tarihsel ve arkeolojik olarak Güney Arabistan'daki Necran antik kenti (el-Uhdûd harabeleri) ile mükemmel biçimde örtüşür.",
      "en": "Depicts the martyrs of the ditch in Surah al-Buruj. Archeologically confirmed at the ancient ruins of Al-Ukhdud in Najran, Saudi Arabia."
    }
  },
  {
    "id": "medyen",
    "name": {
      "tr": "Medyen",
      "en": "Midian"
    },
    "quran_name": "مَدْيَن",
    "category": "region",
    "certainty": 4.0,
    "certainty_level": 4,
    "coordinates": [
      28.53,
      35.0
    ],
    "is_on_map": true,
    "verses": [
      "7:85",
      "9:70",
      "11:84",
      "20:40",
      "22:44",
      "28:22",
      "29:36"
    ],
    "wiki_slug": {
      "tr": "Medyen",
      "en": "Midian"
    },
    "context_note": {
      "tr": "Kuzeybatı Arabistan ve Akabe Körfezi çevresindedir. Al-Bad önemli adaylardan biridir ve arkeolojik bulgular bu bölgeyi destekler.",
      "en": "Northwestern Arabian Peninsula / Gulf of Aqaba. Al-Bad is considered a primary center based on recent archaeological surveys."
    }
  },
  {
    "id": "sebe",
    "name": {
      "tr": "Sebe",
      "en": "Sheba / Saba"
    },
    "quran_name": "سَبَأ",
    "category": "region",
    "certainty": 4.0,
    "certainty_level": 4,
    "coordinates": [
      15.42,
      45.33
    ],
    "is_on_map": true,
    "verses": [
      "27:22",
      "34:15"
    ],
    "wiki_slug": {
      "tr": "Saba_Krallığı",
      "en": "Sabaeans"
    },
    "context_note": {
      "tr": "Güney Arabistan/Yemen merkezli tarihsel Saba krallığı son derece sağlam belgelenmiştir. Ancak Kur'an'daki Sebe'nin tek bir şehir mi yoksa krallık/toplum mu olduğu nüanslıdır.",
      "en": "Well-documented ancient South Arabian kingdom based in Marib, Yemen. In the Quranic text it functions primarily as a socio-political entity."
    }
  },
  {
    "id": "mesaril-haram",
    "name": {
      "tr": "el-Meş'arü'l-Harâm (Müzdelife)",
      "en": "Al-Mash'ar al-Haram"
    },
    "quran_name": "المَشْعَر الحَرَام",
    "category": "holy_place",
    "certainty": 4.0,
    "certainty_level": 4,
    "coordinates": [
      21.3789,
      39.9078
    ],
    "is_on_map": true,
    "verses": [
      "2:198"
    ],
    "wiki_slug": {
      "tr": "Müzdelife",
      "en": "Muzdalifah"
    },
    "context_note": {
      "tr": "İslami ritüel coğrafyasında Müzdelife ile özdeşleştirilir; ancak Kur'an'ın bizzat kullandığı lafız 'Meş'ar-i Haram'dır.",
      "en": "Identified in ritual tradition with Muzdalifah; designated by the sacred marker mentioned in Surah al-Baqarah."
    }
  },
  {
    "id": "cudi",
    "name": {
      "tr": "Cûdî Dağı",
      "en": "Mount Judi"
    },
    "quran_name": "الجُودِيّ",
    "category": "mountain",
    "certainty": 3.5,
    "certainty_level": 3,
    "coordinates": [
      37.368,
      42.496
    ],
    "is_on_map": true,
    "verses": [
      "11:44"
    ],
    "wiki_slug": {
      "tr": "Cudi_Dağı",
      "en": "Mount_Judi"
    },
    "context_note": {
      "tr": "Kur'an'da Nuh'un gemisinin oturduğu dağ. Şırnak çevresindeki dağla özdeşleştirme İslami coğrafyada güçlüdür, fakat bağımsız arkeolojik kanıt yoktur.",
      "en": "Identified in Quranic tradition with Mount Judi in southeastern Turkey (Sirnak), though independent empirical proof of Noah's Ark remains absent."
    }
  },
  {
    "id": "tur-i-sina",
    "name": {
      "tr": "Tûr-i Sînâ / Sînîn",
      "en": "Mount Sinai"
    },
    "quran_name": "طُورِ سِينِينَ / الطُّور",
    "category": "mountain",
    "certainty": 3.5,
    "certainty_level": 3,
    "coordinates": [
      28.5394,
      33.9753
    ],
    "is_on_map": true,
    "verses": [
      "2:63",
      "2:93",
      "4:154",
      "23:20",
      "28:46",
      "95:2"
    ],
    "wiki_slug": {
      "tr": "Sina_Dağı",
      "en": "Mount_Sinai"
    },
    "context_note": {
      "tr": "Sina yarımadası genel olarak bellidir; fakat Hz. Musa'nın vahiy aldığı zirvenin bugünkü Cebel Musa olup olmadığı mutlak kesinlikte değildir.",
      "en": "The Sinai region is generally identifiable, but the exact peak (Jabal Musa vs other candidates) lacks definitive historical certainty."
    }
  },
  {
    "id": "lut-golu",
    "name": {
      "tr": "Lût Gölü & Sadûm (el-Mü'tefikât)",
      "en": "Dead Sea & Sodom"
    },
    "quran_name": "المُؤْتَفِكَات / قَوْم لُوط",
    "category": "ruined_site",
    "certainty": 3.5,
    "certainty_level": 3,
    "coordinates": [
      31.2,
      35.5
    ],
    "is_on_map": true,
    "verses": [
      "15:76",
      "25:40",
      "37:137",
      "53:53"
    ],
    "wiki_slug": {
      "tr": "Lut_Gölü",
      "en": "Dead_Sea"
    },
    "context_note": {
      "tr": "Kur'an'da altı üstüne getirilen şehirler ('el-mü'tefikât') ve 'işlek bir yol üzerinde' (15:76) sabah-akşam yanından geçilen bölge olarak anılır. Ölü Deniz havzası olduğu ittifakla kabul edilir, ancak Sadum kentinin tam arkeolojik konumu tartışmalıdır.",
      "en": "Referenced as the overturned cities ('al-mu'tafikah') located along an established roadway (15:76). Definitively located in the Dead Sea basin, though the exact archaeological site of Sodom remains debated."
    }
  },
  {
    "id": "hicr",
    "name": {
      "tr": "Hicr (el-Hicr)",
      "en": "Al-Hijr / Hegra"
    },
    "quran_name": "الحِجْر",
    "category": "city",
    "certainty": 3.0,
    "certainty_level": 3,
    "coordinates": [
      26.8,
      37.95
    ],
    "is_on_map": true,
    "verses": [
      "15:80"
    ],
    "wiki_slug": {
      "tr": "Medain_Salih",
      "en": "Hegra_(Mada'in_Salih)"
    },
    "context_note": {
      "tr": "Semûd kavmiyle ilişkilendirilir. Günümüzdeki Medâin Sâlih (Hegra) en güçlü adaydır; ancak Semûd kavminin buradaki Nabati kalıntılarıyla doğrudan bağı akademik olarak tartışmalıdır.",
      "en": "Strongly linked with Nabataean Hegra (Mada'in Salih); scholars investigate whether Thamudic memory simply coalesced around these preexisting stone facades."
    }
  },
  {
    "id": "arzu-mukaddese",
    "name": {
      "tr": "el-Arzü'l-Mukaddese",
      "en": "The Holy Land (Levant)"
    },
    "quran_name": "الأَرْض المُقَدَّسَة",
    "category": "region",
    "certainty": 3.0,
    "certainty_level": 3,
    "coordinates": [
      31.9,
      35.2
    ],
    "is_on_map": true,
    "verses": [
      "5:21"
    ],
    "wiki_slug": {
      "tr": "Kutsal_Topraklar",
      "en": "Holy_Land"
    },
    "context_note": {
      "tr": "Filistin ve Levant bölgesindeki kutsal topraklardır. Bölgenin kimliği açık olmakla beraber sınırları Kur'an'da çizilmemiştir.",
      "en": "Refers to the blessed Palestinian/Levantine landscape; boundaries are spiritual and thematic rather than cartographically explicit."
    }
  },
  {
    "id": "rum",
    "name": {
      "tr": "Rûm",
      "en": "Byzantine / Rome"
    },
    "quran_name": "الرُّوم",
    "category": "region",
    "certainty": 3.0,
    "certainty_level": 3,
    "coordinates": [
      39.0,
      34.0
    ],
    "is_on_map": true,
    "verses": [
      "30:2"
    ],
    "wiki_slug": {
      "tr": "Bizans_İmparatorluğu",
      "en": "Byzantine_Empire"
    },
    "context_note": {
      "tr": "Doğu Roma (Bizans) İmparatorluğu ve Levant/Anadolu coğrafyası. Ayette 'en yakın/alçak yerde yenildiler' (edna'l-ard) ifadesi yer alır.",
      "en": "Designates Eastern Roman / Byzantine territory. Mentioned regarding their defeat and subsequent victory in 'the lowest land'."
    }
  },
  {
    "id": "ashabul-karye-antakya",
    "name": {
      "tr": "Ashâbü'l-Karye (Antakya)",
      "en": "People of the City (Antioch)"
    },
    "quran_name": "أَصْحَابُ القَرْيَة / أَنطَاكِيَة",
    "category": "city",
    "certainty": 3.0,
    "certainty_level": 3,
    "coordinates": [
      36.2021,
      36.1606
    ],
    "is_on_map": true,
    "verses": [
      "36:13",
      "36:20"
    ],
    "wiki_slug": {
      "tr": "Antakya",
      "en": "Antioch"
    },
    "context_note": {
      "tr": "Yâsîn Suresi'nde elçilerin tebliğ ettiği ve 'şehrin öte yakasından bir adamın koşarak geldiği' yerleşim. Erken tefsir geleneğinde (Taberî, İbn Kesîr) ezici çoğunlukla Antakya olarak kabul edilir.",
      "en": "Featured in Surah Ya-Sin (36:13-20) where messengers were sent and a believer arrived from the outskirts. Predominantly identified as historic Antioch in classical exegesis."
    }
  },
  {
    "id": "ahkaf",
    "name": {
      "tr": "Ahkâf",
      "en": "Al-Ahqaf"
    },
    "quran_name": "الأَحْقَاف",
    "category": "region",
    "certainty": 2.5,
    "certainty_level": 2,
    "coordinates": [
      18.0,
      50.0
    ],
    "is_on_map": true,
    "verses": [
      "46:21"
    ],
    "wiki_slug": {
      "tr": "Ahkaf",
      "en": "Ahqaf"
    },
    "context_note": {
      "tr": "Âd kavminin yaşadığı rüzgârla savrulan kum tepeleri / çöl alanı. Güney Arabistan (Yemen-Umman-Rubülhali) çevresi düşünülür; kelime sözlükte 'eğri büğrü kumul' demektir.",
      "en": "Dune / sand-ridge region of the people of Ad in Southern Arabia; the noun intrinsically means wind-curved dunes."
    }
  },
  {
    "id": "tuva",
    "name": {
      "tr": "Tuvâ Vadisi",
      "en": "Valley of Tuwa"
    },
    "quran_name": "طُوًى",
    "category": "valley",
    "certainty": 2.0,
    "certainty_level": 2,
    "coordinates": [
      28.53,
      34.01
    ],
    "is_on_map": true,
    "verses": [
      "20:12",
      "79:16"
    ],
    "wiki_slug": {
      "tr": "Tuva_Vadisi",
      "en": "Tuwa"
    },
    "context_note": {
      "tr": "Hz. Musa'ya ilk hitabın yapıldığı kutsal vadi. Sina coğrafyasında aranır ancak modern haritada yeri tespit edilememiştir.",
      "en": "Sacred valley of Moses' first theophany; sought near Sinai but lacks precise physical attribution."
    }
  },
  {
    "id": "irem",
    "name": {
      "tr": "İrem",
      "en": "Iram of the Pillars"
    },
    "quran_name": "إِرَم",
    "category": "unknown",
    "certainty": 1.5,
    "certainty_level": 1,
    "coordinates": null,
    "is_on_map": false,
    "verses": [
      "89:7"
    ],
    "wiki_slug": {
      "tr": "İrem_şehri",
      "en": "Iram_of_the_Pillars"
    },
    "context_note": {
      "tr": "Sütunlar sahibi İrem; şehir, kabile veya hanedan adı olarak tartışmalıdır. Modern Ubar ile özdeşleştirilmesi kanıtlanmamıştır.",
      "en": "Debated as an ancient lost city, tribal name, or architectural wonder ('of the pillars'); identification with Ubar remains unverified."
    }
  },
  {
    "id": "eyke",
    "name": {
      "tr": "Eyke / Ashâbü'l-Eyke",
      "en": "Al-Aykah"
    },
    "quran_name": "أَصْحَابُ الأَيْكَة",
    "category": "unknown",
    "certainty": 1.5,
    "certainty_level": 1,
    "coordinates": null,
    "is_on_map": false,
    "verses": [
      "15:78",
      "26:176",
      "38:13",
      "50:14"
    ],
    "wiki_slug": {
      "tr": "Ashab-ı_Eyke",
      "en": "Companions_of_the_Wood"
    },
    "context_note": {
      "tr": "Hz. Şuayb'ın tebliğ yaptığı ormanlık/ağaçlık alan halkı. Medyen'e yakın bir vaha olabileceği düşünülür, kesin konumu yoktur.",
      "en": "Lush wooded thicket community preached to by Prophet Shu'ayb; presumed near Midian but without physical boundaries."
    }
  },
  {
    "id": "mecmau-bahreyn",
    "name": {
      "tr": "Mecma'u'l-Bahreyn",
      "en": "Junction of the Two Seas"
    },
    "quran_name": "مَجْمَعَ البَحْرَيْن",
    "category": "unknown",
    "certainty": 1.5,
    "certainty_level": 1,
    "coordinates": null,
    "is_on_map": false,
    "verses": [
      "18:60",
      "18:61"
    ],
    "wiki_slug": {
      "tr": "Hızır",
      "en": "Khidr"
    },
    "context_note": {
      "tr": "Hz. Musa ile Hızır kıssasında balığın canlanıp denize daldığı kavşak noktası. Ras Muhammed, Cebelitarık veya Bahreyn gibi coğrafi iddialar olsa da Kur'an'da yeri meçhuldür.",
      "en": "The setting in Surah al-Kahf (18:60) where Moses meets al-Khidr. Variously speculated as Ras Muhammad (Sinai tip), Gibraltar, or the Persian Gulf; lacks cartographic certainty."
    }
  },
  {
    "id": "er-rass",
    "name": {
      "tr": "er-Rass",
      "en": "Ashab al-Rass"
    },
    "quran_name": "أَصْحَابُ الرَّسّ",
    "category": "unknown",
    "certainty": 1.0,
    "certainty_level": 1,
    "coordinates": null,
    "is_on_map": false,
    "verses": [
      "25:38",
      "50:12"
    ],
    "wiki_slug": {
      "tr": "Rass_halkı",
      "en": "People_of_the_Well"
    },
    "context_note": {
      "tr": "'Kuyu halkı' anlamına gelir. Şehir mi, su kuyusu çevresinde bir kabile mi olduğu ve coğrafyası tamamen meçhuldür.",
      "en": "Translates as 'People of the Water Well'; exact location or whether it reflects an eponymous town is unknown."
    }
  },
  {
    "id": "er-rakim",
    "name": {
      "tr": "er-Rakîm",
      "en": "Al-Raqim"
    },
    "quran_name": "الرَّقِيم",
    "category": "unknown",
    "certainty": 1.0,
    "certainty_level": 1,
    "coordinates": null,
    "is_on_map": false,
    "verses": [
      "18:9"
    ],
    "wiki_slug": {
      "tr": "Ashab-ı_Kehf",
      "en": "Seven_Sleepers"
    },
    "context_note": {
      "tr": "Ashâb-ı Kehf ile birlikte geçer. Mağaranın bulunduğu vadi/köy veya gençlerin isimlerinin yazılı olduğu kurşun/taş levha olduğu yönünde ihtilaflar vardır.",
      "en": "Mentioned alongside the Cave Companions. Interpreted variously as the geographic dale/village or an inscribed tablet bearing their names."
    }
  },
  {
    "id": "sedd-i-zulkarneyn",
    "name": {
      "tr": "Sedd-i Zülkarneyn",
      "en": "Rampart of Dhul-Qarnayn"
    },
    "quran_name": "سَدّ ذِي القَرْنَيْن",
    "category": "unknown",
    "certainty": 1.0,
    "certainty_level": 1,
    "coordinates": null,
    "is_on_map": false,
    "verses": [
      "18:93",
      "18:94",
      "18:95",
      "18:96",
      "18:97"
    ],
    "wiki_slug": {
      "tr": "Zülkarneyn",
      "en": "Dhul-Qarnayn"
    },
    "context_note": {
      "tr": "Kehf Suresi'nde Zülkarneyn'in iki dağ (seddeyn) arasına demir kütleleri ve erimiş bakır dökerek inşa ettiği aşılmaz engel. Kafkaslardaki Derbent Kapısı veya Çin Seddi gibi benzetmeler yapılmışsa da fiziki mevkii Kur'an'da ve tarihte tespit edilememiştir.",
      "en": "The monumental iron and molten bronze rampart built by Dhul-Qarnayn between two mountain barriers (Surah al-Kahf 18:93-97). Associated traditionally with the Gates of Derbent or northern Eurasian passes, but remains geographically unverifiable."
    }
  },
  {
    "id": "habesistan",
    "name": {
      "tr": "Habeşistan (Etiyopya / Aksum)",
      "en": "Abyssinia (Ethiopia / Aksum)"
    },
    "quran_name": "الحَبَشَة / هَاجَرُوا فِي اللَّهِ",
    "category": "region",
    "certainty": 4.0,
    "certainty_level": 4,
    "coordinates": [
      14.13,
      38.72
    ],
    "is_on_map": true,
    "verses": [
      "16:41",
      "16:42"
    ],
    "wiki_slug": {
      "tr": "Habeşistan'a_Hicret",
      "en": "Migration_to_Abyssinia"
    },
    "context_note": {
      "tr": "Nahl Suresi 41-42'de 'Zulme uğradıktan sonra Allah yolunda hicret edenler' ifadesiyle işaret edilen ilk hicret yurdudur. Müslümanların ilk sığınağı olan Aksum Krallığı ve Necâşî Ashame'nin adalet diyarıdır.",
      "en": "Directly referenced in Surah an-Nahl (16:41-42) as the destination for those who emigrated in the cause of Allah after being oppressed; the Kingdom of Aksum under the righteous Christian King Negus (al-Najashi)."
    }
  }
]
```

---

## 4. Zenginleştirilmiş Kıssalar ve Rotalar Konfigürasyonu (`routesData.json`)

```json
[
  {
    "id": "musa_route",
    "title": {
      "tr": "Hz. Mûsâ Kıssası Rotası",
      "en": "Route of Prophet Moses"
    },
    "year": {
      "tr": "M.Ö. ~13. Yüzyıl (Geç Tunç Çağı)",
      "en": "c. 13th Century BCE (Late Bronze Age)"
    },
    "color": "#F59E0B",
    "stops": [
      {
        "place_id": "misir",
        "order": 1,
        "note": {
          "tr": "Doğumu ve Firavun Sarayı",
          "en": "Birth and Pharaoh's Court"
        }
      },
      {
        "place_id": "medyen",
        "order": 2,
        "note": {
          "tr": "Firavun'dan Kaçış ve 10 Yıl İkamet",
          "en": "Exile and Refuge in Midian"
        }
      },
      {
        "place_id": "tuva",
        "order": 3,
        "note": {
          "tr": "Tuvâ Mukaddes Vadisi & İlk Vahiy",
          "en": "Sacred Valley of Tuwa & First Revelation"
        }
      },
      {
        "place_id": "tur-i-sina",
        "order": 4,
        "note": {
          "tr": "Tûr Dağı & Levhaların Verilmesi",
          "en": "Mount Sinai & The Tablets"
        }
      },
      {
        "place_id": "arzu-mukaddese",
        "order": 5,
        "note": {
          "tr": "Kutsal Topraklara Giriş Emri",
          "en": "Order to Enter the Holy Land"
        }
      }
    ]
  },
  {
    "id": "abyssinia_migration_route",
    "title": {
      "tr": "1. Hicret: Habeşistan'a Hicret (Nahl 41-42)",
      "en": "1st Hijrah: Emigration to Abyssinia (Nahl 41-42)"
    },
    "year": {
      "tr": "Miladi 615 (Bi'setin 5. Yılı / Hicret Öncesi 7)",
      "en": "615 CE (5th Year of Prophethood / 7 BH)"
    },
    "color": "#EC4899",
    "stops": [
      {
        "place_id": "mekke",
        "order": 1,
        "note": {
          "tr": "Kureyş Zulmü ve Mekke'den Ayrılış (M. 615)",
          "en": "Persecution in Mecca & Departure (615 CE)"
        }
      },
      {
        "place_id": "habesistan",
        "order": 2,
        "note": {
          "tr": "Kızıldeniz Geçişi ve Necâşî'nin Himayesi (Aksum)",
          "en": "Red Sea Crossing & Protection under the Negus (Aksum)"
        }
      }
    ]
  },
  {
    "id": "early_islam_route",
    "title": {
      "tr": "Erken İslâm & Hicret Havzası",
      "en": "Early Islam & Hijrah Basin"
    },
    "year": {
      "tr": "Miladi 622 – 630 (Hicri 1 – 8)",
      "en": "622 – 630 CE (1 – 8 AH)"
    },
    "color": "#10B981",
    "stops": [
      {
        "place_id": "mekke",
        "order": 1,
        "note": {
          "tr": "İlk Vahiy & Mescid-i Harâm (M. 610)",
          "en": "First Revelation & Mecca (610 CE)"
        }
      },
      {
        "place_id": "medine",
        "order": 2,
        "note": {
          "tr": "Medine'ye Hicret (M. 622 / Hicri 1)",
          "en": "The Great Migration (Hijrah) to Yathrib (622 CE / 1 AH)"
        }
      },
      {
        "place_id": "bedir",
        "order": 3,
        "note": {
          "tr": "Bedir Gazvesi (M. 624 / Hicri 2)",
          "en": "Battle of Badr (624 CE / 2 AH)"
        }
      },
      {
        "place_id": "hendek-sel",
        "order": 4,
        "note": {
          "tr": "Hendek Muharebesi & Sel' Dağı Savunması (M. 627 / Hicri 5)",
          "en": "Battle of the Trench & Mount Sal' (627 CE / 5 AH)"
        }
      },
      {
        "place_id": "hudeybiye",
        "order": 5,
        "note": {
          "tr": "Hudeybiye Barışı & Rıdvan Biati (M. 628 / Hicri 6)",
          "en": "Treaty of Hudaybiyyah & Pledge of the Tree (628 CE / 6 AH)"
        }
      },
      {
        "place_id": "huneyn",
        "order": 6,
        "note": {
          "tr": "Huneyn Vadisi Gazvesi (M. 630 / Hicri 8)",
          "en": "Battle of Hunayn (630 CE / 8 AH)"
        }
      }
    ]
  },
  {
    "id": "hajj_pilgrimage_route",
    "title": {
      "tr": "Kur'an'da Hac & Kutsal Menâsik Hattı",
      "en": "Hajj & Sacred Sanctuary Circuit"
    },
    "year": {
      "tr": "Hz. İbrâhîm'den M. 632 Veda Haccı'na (Hicri 10)",
      "en": "From Abraham to the Farewell Pilgrimage (632 CE / 10 AH)"
    },
    "color": "#0284C7",
    "stops": [
      {
        "place_id": "mescid-i-haram",
        "order": 1,
        "note": {
          "tr": "Kâbe & Tavaf (Bakara 2:125)",
          "en": "Kaaba & Tawaf (2:125)"
        }
      },
      {
        "place_id": "makam-i-ibrahim",
        "order": 2,
        "note": {
          "tr": "Makam-ı İbrahim'de Namaz (Bakara 2:125)",
          "en": "Prayer at Station of Abraham (2:125)"
        }
      },
      {
        "place_id": "safa-merve",
        "order": 3,
        "note": {
          "tr": "Safâ ile Merve Arasında Sa'y (Bakara 2:158)",
          "en": "Sa'i between Safa and Marwah (2:158)"
        }
      },
      {
        "place_id": "mina",
        "order": 4,
        "note": {
          "tr": "Minâ & Eyyâm-ı Ma'dûdât (Bakara 2:203)",
          "en": "Mina & The Numbered Days (2:203)"
        }
      },
      {
        "place_id": "mesaril-haram",
        "order": 5,
        "note": {
          "tr": "Müzdelife & el-Meş'arü'l-Harâm (Bakara 2:198)",
          "en": "Muzdalifah & Al-Mash'ar al-Haram (2:198)"
        }
      },
      {
        "place_id": "arafat",
        "order": 6,
        "note": {
          "tr": "Arafat Vakfesi & İfâza (Bakara 2:198)",
          "en": "Standing at Arafat & Inflow (2:198)"
        }
      }
    ]
  },
  {
    "id": "northern_expeditions_route",
    "title": {
      "tr": "Kuzey Seferleri & Tebük Hattı",
      "en": "Northern Expeditions & Tabuk Route"
    },
    "year": {
      "tr": "Miladi 630 (Hicri 9, Receb ayı)",
      "en": "630 CE (9 AH, Rajab)"
    },
    "color": "#8B5CF6",
    "stops": [
      {
        "place_id": "medine",
        "order": 1,
        "note": {
          "tr": "Medine'den Hareket & Hazırlık (Tevbe 9:117)",
          "en": "Departure from Medina & Preparation (9:117)"
        }
      },
      {
        "place_id": "hicr",
        "order": 2,
        "note": {
          "tr": "Semûd Diyarı el-Hicr (Medâin Sâlih) Güzergâhı",
          "en": "Passage through Al-Hijr (Hegra / Thamud)"
        }
      },
      {
        "place_id": "tebuk",
        "order": 3,
        "note": {
          "tr": "Saatü'l-Usre & Tebük Karargâhı (Tevbe 9:117)",
          "en": "The Hour of Difficulty & Tabuk Camp (9:117)"
        }
      }
    ]
  }
]
```