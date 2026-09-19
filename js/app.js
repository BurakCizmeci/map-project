/**
 * Kur'an Coğrafyası - Main Application Orchestrator
 * Coordinates state, UI event listeners, dataset loading, and reactive translations.
 */

import { QuranMap } from './map.js';
import { PanelController } from './panel.js';

class App {
  constructor() {
    this.currentLang = 'tr';
    this.minCertainty = 1;
    this.currentCategory = 'all';
    this.selectedRouteId = '';
    this.placesData = [];
    this.routesData = [];

    this.mapInstance = null;
    this.panelController = null;

    // Translations Dictionary for Static UI
    this.i18n = {
      tr: {
        appTitle: "Kur'an Coğrafyası",
        appSubtitle: "İnteraktif Tarihsel Mekân Haritası",
        certLabel: "Kesinlik:",
        allPlaces: "1+ (Tümü)",
        catLabel: "Kategori:",
        catAll: "Tüm Kategoriler",
        catCity: "Şehirler",
        catHoly: "Kutsal Mekânlar",
        catRegion: "Bölgeler",
        catValley: "Vadiler",
        catMountain: "Dağlar",
        catRuins: "Antik / Harabe",
        routesLabel: "Tarihsel Rotalar:",
        routesPlaceholder: "Rota Seçiniz...",
        btnOffMap: "Konumu Meçhul Mekânlar",
        layerMinimal: "Minimal",
        layerTopo: "Topografik",
        layerSatellite: "Uydu",
        legendTitle: "Kesinlik Dereceleri",
        legend5: "5/5 Çok Yüksek",
        legend4: "4/5 Yüksek",
        legend3: "3/5 Orta",
        legend2: "2/5 Düşük",
        legend1: "1/5 Çok Düşük / Meçhul",
        offMapModalTitle: "Konumu Kesin Olarak Bilinmeyen Mekânlar",
        offMapModalDesc: "Aşağıdaki mekânlar Kur'an'da anılmakla birlikte, coğrafi koordinatları mutlak olarak tespit edilemediğinden haritada sahte bir nokta olarak gösterilmemiştir:",
        secWiki: "Tarihsel & Ansiklopedik Bilgi",
        secVerses: "İlgili Kur'an Ayetleri",
        secContext: "Akademik & Tefsir Bağlamı"
      },
      en: {
        appTitle: "Quranic Geography",
        appSubtitle: "Interactive Historical Sanctuary Map",
        certLabel: "Certainty:",
        allPlaces: "1+ (All)",
        catLabel: "Category:",
        catAll: "All Categories",
        catCity: "Cities",
        catHoly: "Sacred Sanctuaries",
        catRegion: "Regions",
        catValley: "Valleys",
        catMountain: "Mountains",
        catRuins: "Ancient / Ruins",
        routesLabel: "Historical Routes:",
        routesPlaceholder: "Select Route...",
        btnOffMap: "Uncharted Locations",
        layerMinimal: "Minimal",
        layerTopo: "Topography",
        layerSatellite: "Satellite",
        legendTitle: "Certainty Scale",
        legend5: "5/5 Definitive",
        legend4: "4/5 High",
        legend3: "3/5 Moderate",
        legend2: "2/5 Low",
        legend1: "1/5 Uncharted",
        offMapModalTitle: "Geographically Uncharted / Speculative Sites",
        offMapModalDesc: "The following locations are explicitly or thematically mentioned in the Quran, but cannot be assigned definitive geographic coordinates and are cataloged contextually:",
        secWiki: "Historical & Encyclopedic Overview",
        secVerses: "Referenced Quranic Verses",
        secContext: "Scholarly & Exegetical Context"
      }
    };

    this.init();
  }

  async init() {
    try {
      // 1. Fetch JSON datasets
      const [placesRes, routesRes] = await Promise.all([
        fetch('./data/placesData.json'),
        fetch('./data/routesData.json')
      ]);

      this.placesData = await placesRes.json();
      this.routesData = await routesRes.json();

      // 2. Initialize Controllers
      this.panelController = new PanelController({
        lang: this.currentLang,
        onNavigateStop: (place) => {
          if (place && place.coordinates) {
            this.mapInstance.flyToPlace(place.coordinates, 8);
          }
        }
      });
      this.panelController.setData(this.placesData, this.routesData);

      this.mapInstance = new QuranMap('map', {
        lang: this.currentLang,
        onSelectPlace: (place, routeStop = null) => {
          this.panelController.showPlaceDetails(place, routeStop);
          if (place.coordinates) {
            this.mapInstance.flyToPlace(place.coordinates, 7);
          }
        }
      });
      this.mapInstance.loadData(this.placesData, this.routesData);

      // 3. Populate Routes Dropdown
      this.populateRoutesDropdown();

      // 4. Initial Marker Render
      this.mapInstance.renderMarkers(this.minCertainty, this.currentCategory);

      // 5. Setup UI Event Listeners
      this.setupEventListeners();

      // 6. Apply Initial Translations
      this.updateTranslations();
    } catch (err) {
      console.error('Initialization error:', err);
    }
  }

  setupEventListeners() {
    // Language Switcher
    const langBtn = document.getElementById('btnToggleLang');
    langBtn?.addEventListener('click', () => {
      this.currentLang = this.currentLang === 'tr' ? 'en' : 'tr';
      langBtn.textContent = this.currentLang === 'tr' ? 'EN' : 'TR';
      
      this.updateTranslations();
      this.populateRoutesDropdown();
      this.mapInstance.setLanguage(this.currentLang);
      this.panelController.setLanguage(this.currentLang);
      this.mapInstance.renderMarkers(this.minCertainty, this.currentCategory);
      if (this.selectedRouteId) {
        this.mapInstance.drawRoute(this.selectedRouteId);
      }
    });

    // Certainty Filter Buttons (1+, 2+, 3+, 4+, 5)
    const certBtns = document.querySelectorAll('.cert-btn');
    certBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        certBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.minCertainty = parseFloat(btn.dataset.min || 1);
        this.mapInstance.renderMarkers(this.minCertainty, this.currentCategory);
      });
    });

    // Category Selector
    const categorySelect = document.getElementById('categoryFilter');
    categorySelect?.addEventListener('change', (e) => {
      this.currentCategory = e.target.value;
      this.mapInstance.renderMarkers(this.minCertainty, this.currentCategory);
    });

    // Route Selector
    const routeSelect = document.getElementById('routeSelector');
    routeSelect?.addEventListener('change', (e) => {
      this.selectedRouteId = e.target.value;
      if (this.selectedRouteId) {
        this.mapInstance.drawRoute(this.selectedRouteId);
        this.panelController.startRoutePlayback(this.selectedRouteId);
      } else {
        this.mapInstance.clearRoute();
        this.panelController.closeRoutePlayback();
      }
    });

    // Listen to route playback bar close to reset selector
    const routeCloseBtn = document.getElementById('routeCloseBtn');
    routeCloseBtn?.addEventListener('click', () => {
      if (routeSelect) routeSelect.value = '';
      this.selectedRouteId = '';
      this.mapInstance.clearRoute();
    });

    // Layer Switcher Buttons
    const layerBtns = document.querySelectorAll('.layer-btn');
    layerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        layerBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const layerName = btn.dataset.layer;
        this.mapInstance.setBaseLayer(layerName);
      });
    });
  }

  populateRoutesDropdown() {
    const routeSelect = document.getElementById('routeSelector');
    if (!routeSelect) return;

    const currentVal = routeSelect.value;
    routeSelect.innerHTML = `<option value="">${this.i18n[this.currentLang].routesPlaceholder}</option>`;

    this.routesData.forEach(route => {
      const opt = document.createElement('option');
      opt.value = route.id;
      const title = route.title[this.currentLang] || route.title.tr;
      const year = route.year ? (route.year[this.currentLang] || route.year.tr) : '';
      opt.textContent = year ? `${title} (${year})` : title;
      routeSelect.appendChild(opt);
    });

    routeSelect.value = currentVal;
  }

  updateTranslations() {
    const t = this.i18n[this.currentLang];
    
    // Header
    document.getElementById('brandTitle').textContent = t.appTitle;
    document.getElementById('brandSubtitle').textContent = t.appSubtitle;
    document.getElementById('labelCert').textContent = t.certLabel;
    document.getElementById('labelCat').textContent = t.catLabel;
    document.getElementById('labelRoute').textContent = t.routesLabel;
    
    const btn1 = document.querySelector('.cert-btn[data-min="1"]');
    if (btn1) btn1.textContent = t.allPlaces;

    // Categories
    const catOptAll = document.querySelector('#categoryFilter option[value="all"]');
    const catOptCity = document.querySelector('#categoryFilter option[value="city"]');
    const catOptHoly = document.querySelector('#categoryFilter option[value="holy_place"]');
    const catOptRegion = document.querySelector('#categoryFilter option[value="region"]');
    const catOptValley = document.querySelector('#categoryFilter option[value="valley"]');
    const catOptMountain = document.querySelector('#categoryFilter option[value="mountain"]');
    const catOptRuins = document.querySelector('#categoryFilter option[value="ruined_site"]');

    if (catOptAll) catOptAll.textContent = t.catAll;
    if (catOptCity) catOptCity.textContent = t.catCity;
    if (catOptHoly) catOptHoly.textContent = t.catHoly;
    if (catOptRegion) catOptRegion.textContent = t.catRegion;
    if (catOptValley) catOptValley.textContent = t.catValley;
    if (catOptMountain) catOptMountain.textContent = t.catMountain;
    if (catOptRuins) catOptRuins.textContent = t.catRuins;

    // Off-map button
    const btnOffMapText = document.getElementById('btnOffMapText');
    if (btnOffMapText) btnOffMapText.textContent = t.btnOffMap;

    // Layer Buttons
    document.getElementById('btnLayerMinimalText').textContent = t.layerMinimal;
    document.getElementById('btnLayerTopoText').textContent = t.layerTopo;
    document.getElementById('btnLayerSatelliteText').textContent = t.layerSatellite;

    // Legend
    document.getElementById('legendTitle').textContent = t.legendTitle;
    document.getElementById('legendText5').textContent = t.legend5;
    document.getElementById('legendText4').textContent = t.legend4;
    document.getElementById('legendText3').textContent = t.legend3;
    document.getElementById('legendText2').textContent = t.legend2;
    document.getElementById('legendText1').textContent = t.legend1;

    // Off-map modal
    document.getElementById('offMapModalTitle').textContent = t.offMapModalTitle;
    document.getElementById('offMapModalDesc').textContent = t.offMapModalDesc;

    // Detail Panel Section Labels
    document.getElementById('secWikiLabel').textContent = t.secWiki;
    document.getElementById('secVersesLabel').textContent = t.secVerses;
    document.getElementById('secContextLabel').textContent = t.secContext;

    // Footer
    const footerLeft = document.getElementById('footerTextLeft');
    const footerRight = document.getElementById('footerTextRight');
    if (footerLeft) {
      footerLeft.textContent = this.currentLang === 'tr'
        ? "Kur'an Coğrafyası • Dijital Beşeri Bilimler & Arkeolojik Harita Projesi"
        : "Quranic Geography • Digital Humanities & Archeological Map Project";
    }
    if (footerRight) {
      footerRight.innerHTML = this.currentLang === 'tr'
        ? "<span>38 Mekân</span> • <span>5 Rota</span> • <span>Quran.com API v4 & Wikipedia</span>"
        : "<span>38 Locations</span> • <span>5 Routes</span> • <span>Quran.com API v4 & Wikipedia</span>";
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.quranApp = new App();
});
