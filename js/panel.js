/**
 * Kur'an Coğrafyası - Panel & UI Controllers
 * Manages:
 * 1. Place Detail Panel (Wikipedia, Quran verses, academic notes)
 * 2. Off-Map / Uncharted Places Drawer
 * 3. Route Playback Controller Bar (Next/Prev step navigation with historical timeline/year)
 */

import { api } from './api.js';

export class PanelController {
  constructor(options = {}) {
    this.lang = options.lang || 'tr';
    this.placesData = [];
    this.routesData = [];
    this.currentPlace = null;
    this.currentRoute = null;
    this.currentStopIndex = 0;
    this.onNavigateStop = options.onNavigateStop || (() => {});

    // DOM Elements
    this.detailPanel = document.getElementById('detailPanel');
    this.panelCloseBtn = document.getElementById('panelCloseBtn');
    this.arabicTitle = document.getElementById('arabicTitle');
    this.placeMainTitle = document.getElementById('placeMainTitle');
    this.categoryBadge = document.getElementById('categoryBadge');
    this.certaintyBadge = document.getElementById('certaintyBadge');
    this.wikiCoverContainer = document.getElementById('wikiCoverContainer');
    this.wikiText = document.getElementById('wikiText');
    this.wikiLink = document.getElementById('wikiLink');
    this.versePillsContainer = document.getElementById('versePillsContainer');
    this.verseDisplayBox = document.getElementById('verseDisplayBox');
    this.contextText = document.getElementById('contextText');

    // Off-map modal
    this.offMapModal = document.getElementById('offMapModal');
    this.offMapGrid = document.getElementById('offMapGrid');
    this.btnOffMap = document.getElementById('btnOffMap');
    this.closeOffMapBtn = document.getElementById('closeOffMapBtn');

    // Route playback bar
    this.routePlaybackBar = document.getElementById('routePlaybackBar');
    this.routeStepCounter = document.getElementById('routeStepCounter');
    this.routeStepTitle = document.getElementById('routeStepTitle');
    this.routeStepNote = document.getElementById('routeStepNote');
    this.routePrevBtn = document.getElementById('routePrevBtn');
    this.routeNextBtn = document.getElementById('routeNextBtn');
    this.routeCloseBtn = document.getElementById('routeCloseBtn');

    this.initEventListeners();
  }

  initEventListeners() {
    this.panelCloseBtn?.addEventListener('click', () => this.closeDetailPanel());
    
    // Off-map triggers
    this.btnOffMap?.addEventListener('click', () => this.openOffMapModal());
    this.closeOffMapBtn?.addEventListener('click', () => this.closeOffMapModal());
    this.offMapModal?.addEventListener('click', (e) => {
      if (e.target === this.offMapModal) this.closeOffMapModal();
    });

    // Route playback buttons
    this.routePrevBtn?.addEventListener('click', () => this.prevRouteStop());
    this.routeNextBtn?.addEventListener('click', () => this.nextRouteStop());
    this.routeCloseBtn?.addEventListener('click', () => this.closeRoutePlayback());
  }

  setData(placesData, routesData) {
    this.placesData = placesData;
    this.routesData = routesData;
    this.renderOffMapGrid();
  }

  setLanguage(lang) {
    this.lang = lang;
    this.renderOffMapGrid();
    if (this.currentPlace) {
      this.showPlaceDetails(this.currentPlace);
    }
    if (this.currentRoute) {
      this.updateRoutePlaybackUI();
    }
  }

  /* ==========================================================================
     Place Detail Panel
     ========================================================================== */
  async showPlaceDetails(place, routeStop = null) {
    this.currentPlace = place;
    this.detailPanel.classList.add('open');

    // 1. Basic Place Info
    const name = place.name[this.lang] || place.name.tr;
    this.arabicTitle.textContent = place.quran_name || '';
    this.placeMainTitle.textContent = name;

    // Category Badge
    const categoryLabels = {
      city: this.lang === 'tr' ? 'Şehir' : 'City',
      holy_place: this.lang === 'tr' ? 'Kutsal Mekân' : 'Sacred Sanctuary',
      region: this.lang === 'tr' ? 'Bölge / Diyar' : 'Region',
      valley: this.lang === 'tr' ? 'Vadi' : 'Valley',
      mountain: this.lang === 'tr' ? 'Dağ' : 'Mountain',
      ruined_site: this.lang === 'tr' ? 'Antik / Harabe' : 'Ancient / Ruin',
      unknown: this.lang === 'tr' ? 'Konumu Meçhul' : 'Uncharted'
    };
    this.categoryBadge.textContent = categoryLabels[place.category] || place.category;

    // Certainty Badge
    const certColor = this.getCertaintyColor(place.certainty);
    const certLabels = {
      5: this.lang === 'tr' ? '5/5 • Çok Yüksek Kesinlik' : '5/5 • Definitive',
      4: this.lang === 'tr' ? '4/5 • Yüksek Kesinlik' : '4/5 • High Certainty',
      3: this.lang === 'tr' ? '3/5 • Orta (Bölge Makul)' : '3/5 • Moderate (Probable)',
      2: this.lang === 'tr' ? '2/5 • Düşük (Adaylar Var)' : '2/5 • Low (Multiple Hypotheses)',
      1: this.lang === 'tr' ? '1/5 • Bilinmiyor / Meçhul' : '1/5 • Uncharted / Debated'
    };
    const certLevel = Math.floor(place.certainty_level || place.certainty);
    this.certaintyBadge.textContent = certLabels[certLevel] || `${place.certainty}/5`;
    this.certaintyBadge.style.backgroundColor = `${certColor}20`;
    this.certaintyBadge.style.color = certColor;
    this.certaintyBadge.style.borderColor = `${certColor}50`;

    // Academic Context Note
    const contextNote = place.context_note?.[this.lang] || place.context_note?.tr || '';
    let routeNoteHtml = '';
    if (routeStop) {
      const stopNoteText = routeStop.note?.[this.lang] || routeStop.note?.tr || '';
      routeNoteHtml = `
        <div style="margin-bottom:12px; padding:10px 12px; background:rgba(245,158,11,0.12); border-left:3px solid #f59e0b; border-radius:6px; font-size:12px; color:#fef08a;">
          <strong>${this.lang === 'tr' ? 'Rota Notu:' : 'Route Note:'}</strong> ${stopNoteText}
        </div>
      `;
    }
    this.contextText.innerHTML = routeNoteHtml + (contextNote || (this.lang === 'tr' ? 'Akademik not bulunmuyor.' : 'No context note available.'));

    // 2. Fetch Wikipedia Summary & Cover Image
    this.wikiText.innerHTML = '<div class="skeleton-loader" style="height:60px;"></div>';
    this.wikiCoverContainer.style.display = 'none';
    this.wikiLink.style.display = 'none';

    const wikiSlug = place.wiki_slug?.[this.lang] || place.wiki_slug?.tr || place.wiki_slug?.en;
    if (wikiSlug) {
      api.getWikipediaSummary(wikiSlug, this.lang).then(wikiData => {
        if (this.currentPlace !== place) return; // Prevent race conditions
        if (wikiData?.thumbnail) {
          this.wikiCoverContainer.innerHTML = `<img src="${wikiData.thumbnail}" alt="${name}" loading="lazy" />`;
          this.wikiCoverContainer.style.display = 'block';
        } else {
          this.wikiCoverContainer.style.display = 'none';
        }

        this.wikiText.textContent = wikiData?.extract || (this.lang === 'tr' ? 'Özet bulunamadı.' : 'No summary found.');
        if (wikiData?.url) {
          this.wikiLink.href = wikiData.url;
          this.wikiLink.textContent = this.lang === 'tr' ? 'Wikipedia Maddesini Oku →' : 'Read Wikipedia Article →';
          this.wikiLink.style.display = 'inline-flex';
        }
      });
    } else {
      this.wikiText.textContent = this.lang === 'tr' ? 'Wikipedia bağlantısı mevcut değil.' : 'No Wikipedia link available.';
    }

    // 3. Render Quran Verses
    this.renderVersesSection(place);
  }

  closeDetailPanel() {
    this.detailPanel.classList.remove('open');
    this.currentPlace = null;
  }

  renderVersesSection(place) {
    const verses = place.verses || [];
    this.versePillsContainer.innerHTML = '';

    if (verses.length === 0) {
      this.verseDisplayBox.innerHTML = `
        <div style="font-size:13px; color:var(--text-muted); text-align:center;">
          ${this.lang === 'tr' ? 'Doğrudan ayet referansı bulunmuyor.' : 'No direct verse references found.'}
        </div>
      `;
      return;
    }

    verses.forEach((verseKey, idx) => {
      const btn = document.createElement('button');
      btn.className = `verse-pill-btn ${idx === 0 ? 'active' : ''}`;
      btn.textContent = `${this.lang === 'tr' ? 'Sure' : 'Surah'} ${verseKey}`;
      btn.addEventListener('click', () => {
        this.versePillsContainer.querySelectorAll('.verse-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadVerseData(verseKey);
      });
      this.versePillsContainer.appendChild(btn);
    });

    // Load first verse initially
    this.loadVerseData(verses[0]);
  }

  async loadVerseData(verseKey) {
    this.verseDisplayBox.innerHTML = `
      <div class="skeleton-loader" style="height:35px; margin-bottom:10px;"></div>
      <div class="skeleton-loader" style="height:50px;"></div>
    `;

    const verseData = await api.getQuranVerse(verseKey, this.lang);
    if (!verseData) return;

    let audioButtonHtml = '';
    if (verseData.audioUrl) {
      audioButtonHtml = `
        <button class="verse-audio-btn" id="btnPlayVerseAudio" data-audio="${verseData.audioUrl}">
          <span>▶</span> ${this.lang === 'tr' ? 'Dinle' : 'Listen'}
        </button>
      `;
    }

    const surahLabel = this.lang === 'tr' ? 'Kur\'an-ı Kerîm' : 'The Holy Quran';
    const translationSource = this.lang === 'tr' ? 'Diyanet İşleri Meali' : 'The Clear Quran (Dr. M. Khattab)';

    this.verseDisplayBox.innerHTML = `
      ${verseData.textArabic ? `<div class="verse-arabic-text">${verseData.textArabic}</div>` : ''}
      <div class="verse-translation-text">"${verseData.translation}"</div>
      <div class="verse-meta">
        <span>${surahLabel} • ${verseKey} (${translationSource})</span>
        ${audioButtonHtml}
      </div>
    `;

    // Audio Playback handler
    const audioBtn = document.getElementById('btnPlayVerseAudio');
    if (audioBtn) {
      let currentAudio = null;
      audioBtn.addEventListener('click', () => {
        if (currentAudio && !currentAudio.paused) {
          currentAudio.pause();
          audioBtn.innerHTML = `<span>▶</span> ${this.lang === 'tr' ? 'Dinle' : 'Listen'}`;
        } else {
          currentAudio = new Audio(audioBtn.dataset.audio);
          currentAudio.play();
          audioBtn.innerHTML = `<span>⏸</span> ${this.lang === 'tr' ? 'Durdur' : 'Pause'}`;
          currentAudio.onended = () => {
            audioBtn.innerHTML = `<span>▶</span> ${this.lang === 'tr' ? 'Dinle' : 'Listen'}`;
          };
        }
      });
    }
  }

  /* ==========================================================================
     Off-Map / Uncharted Places Modal
     ========================================================================== */
  renderOffMapGrid() {
    if (!this.offMapGrid) return;
    const offMapPlaces = this.placesData.filter(p => !p.is_on_map || !p.coordinates);

    // Update count on trigger button
    const badgeCount = document.querySelector('#btnOffMap .badge-count');
    if (badgeCount) badgeCount.textContent = offMapPlaces.length;

    this.offMapGrid.innerHTML = '';
    offMapPlaces.forEach(place => {
      const name = place.name[this.lang] || place.name.tr;
      const context = place.context_note?.[this.lang] || place.context_note?.tr || '';
      const certColor = this.getCertaintyColor(place.certainty);
      const verses = (place.verses || []).map(v => `<span class="badge badge-category" style="font-size:10px;">${v}</span>`).join(' ');

      const card = document.createElement('div');
      card.className = 'off-map-card';
      card.innerHTML = `
        <div class="off-map-card-header">
          <div>
            <div class="off-map-name">${name}</div>
            <span class="badge badge-certainty" style="margin-top:4px; background:${certColor}20; color:${certColor}; border-color:${certColor}50">
              ${place.certainty}/5 • ${this.lang === 'tr' ? 'Konumu Meçhul' : 'Uncharted'}
            </span>
          </div>
          <div class="off-map-arabic">${place.quran_name}</div>
        </div>
        <div class="off-map-desc">${context}</div>
        <div class="off-map-verses">${verses}</div>
      `;

      card.addEventListener('click', () => {
        this.closeOffMapModal();
        this.showPlaceDetails(place);
      });

      this.offMapGrid.appendChild(card);
    });
  }

  openOffMapModal() {
    this.offMapModal.classList.add('open');
  }

  closeOffMapModal() {
    this.offMapModal.classList.remove('open');
  }

  /* ==========================================================================
     Route Playback Controller Bar
     ========================================================================== */
  startRoutePlayback(routeId) {
    if (!routeId) {
      this.closeRoutePlayback();
      return;
    }
    const route = this.routesData.find(r => r.id === routeId);
    if (!route || !route.stops || route.stops.length === 0) return;

    this.currentRoute = route;
    this.currentStopIndex = 0;
    this.routePlaybackBar.classList.add('visible');
    this.updateRoutePlaybackUI();
    this.jumpToStop(this.currentStopIndex);
  }

  closeRoutePlayback() {
    this.routePlaybackBar.classList.remove('visible');
    this.currentRoute = null;
    this.currentStopIndex = 0;
    this.onNavigateStop(null);
  }

  updateRoutePlaybackUI() {
    if (!this.currentRoute) return;
    const totalStops = this.currentRoute.stops.length;
    const currentStop = this.currentRoute.stops[this.currentStopIndex];
    const place = this.placesData.find(p => p.id === currentStop.place_id);

    const routeTitle = this.currentRoute.title[this.lang] || this.currentRoute.title.tr;
    const routeYear = this.currentRoute.year ? (this.currentRoute.year[this.lang] || this.currentRoute.year.tr) : '';
    const yearSnippet = routeYear ? ` • ⏳ ${routeYear}` : '';
    const placeName = place ? (place.name[this.lang] || place.name.tr) : '';
    const stopNote = currentStop.note?.[this.lang] || currentStop.note?.tr || '';

    this.routeStepCounter.textContent = `${routeTitle}${yearSnippet} • ${this.lang === 'tr' ? 'Durak' : 'Stop'} ${this.currentStopIndex + 1} / ${totalStops}`;
    this.routeStepTitle.textContent = `${this.currentStopIndex + 1}. ${placeName}`;
    this.routeStepNote.textContent = stopNote;

    this.routePrevBtn.disabled = this.currentStopIndex === 0;
    this.routeNextBtn.disabled = this.currentStopIndex === totalStops - 1;
  }

  prevRouteStop() {
    if (this.currentStopIndex > 0) {
      this.currentStopIndex--;
      this.updateRoutePlaybackUI();
      this.jumpToStop(this.currentStopIndex);
    }
  }

  nextRouteStop() {
    if (this.currentRoute && this.currentStopIndex < this.currentRoute.stops.length - 1) {
      this.currentStopIndex++;
      this.updateRoutePlaybackUI();
      this.jumpToStop(this.currentStopIndex);
    }
  }

  jumpToStop(index) {
    if (!this.currentRoute) return;
    const stop = this.currentRoute.stops[index];
    const place = this.placesData.find(p => p.id === stop.place_id);
    if (place) {
      this.showPlaceDetails(place, stop);
      this.onNavigateStop(place);
    }
  }

  getCertaintyColor(certainty) {
    if (certainty >= 5) return '#10B981';
    if (certainty >= 4) return '#0284C7';
    if (certainty >= 3) return '#F59E0B';
    if (certainty >= 2) return '#F97316';
    return '#EF4444';
  }
}
