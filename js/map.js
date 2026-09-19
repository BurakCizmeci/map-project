/**
 * Kur'an Coğrafyası - Map Module (Leaflet.js Engine)
 * Handles layers, custom SVG certainty pins, route polylines, numbered markers and camera animations.
 */

export class QuranMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.onSelectPlace = options.onSelectPlace || (() => {});
    this.currentLang = options.lang || 'tr';
    this.map = null;
    this.markersGroup = null;
    this.routeLayerGroup = null;
    this.placesData = [];
    this.routesData = [];
    this.activeRoute = null;
    this.activeMarker = null;
    this.baseLayers = {};

    this.initMap();
  }

  initMap() {
    // Initial center covering Hijaz, Levant, Egypt, and Mesopotamia
    this.map = L.map(this.containerId, {
      center: [25.0, 39.0],
      zoom: 5,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false, // custom position
      attributionControl: false // Cleans up "carto.com" and clutter
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Layer 1: OpenStreetMap Standard (Clean, crisp, completely free, NO API KEY REQUIRED, NO WATERMARK)
    const minimal = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    });

    // Layer 2: OpenTopoMap (Topographical / Relief contours)
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17
    });

    // Layer 3: ESRI World Imagery (Satellite)
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18
    });

    this.baseLayers = {
      minimal,
      topo,
      satellite
    };

    // Default layer: Minimal (OpenStreetMap without any watermarks)
    minimal.addTo(this.map);

    // Marker & Route Groups
    this.markersGroup = L.layerGroup().addTo(this.map);
    this.routeLayerGroup = L.layerGroup().addTo(this.map);
  }

  setBaseLayer(layerName) {
    Object.values(this.baseLayers).forEach(layer => {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });

    if (this.baseLayers[layerName]) {
      this.baseLayers[layerName].addTo(this.map);
    }
  }

  setLanguage(lang) {
    this.currentLang = lang;
    this.refreshPopups();
  }

  loadData(placesData, routesData) {
    this.placesData = placesData;
    this.routesData = routesData;
  }

  /**
   * Render place markers filtered by minimum certainty and category
   */
  renderMarkers(minCertainty = 1, category = 'all') {
    this.markersGroup.clearLayers();

    const onMapPlaces = this.placesData.filter(p => p.is_on_map && p.coordinates);

    onMapPlaces.forEach(place => {
      if (place.certainty < minCertainty) return;
      if (category !== 'all' && place.category !== category) return;

      const certInt = Math.floor(place.certainty_level || place.certainty);
      const colorClass = `cert-color-${certInt}`;

      // Create Custom SVG Pin Marker
      const customIcon = L.divIcon({
        className: `custom-quran-pin ${colorClass}`,
        html: `
          <div class="pin-glow"></div>
          <div class="pin-core">
            <span class="pin-symbol">☪</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker(place.coordinates, { icon: customIcon });
      marker.placeData = place;

      // Popup Content
      const popupContent = this.createPopupHtml(place);
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        this.setActiveMarker(marker);
        this.onSelectPlace(place);
      });

      this.markersGroup.addLayer(marker);
    });
  }

  setActiveMarker(marker) {
    if (this.activeMarker && this.activeMarker._icon) {
      this.activeMarker._icon.classList.remove('active-pin');
    }
    this.activeMarker = marker;
    if (marker && marker._icon) {
      marker._icon.classList.add('active-pin');
    }
  }

  createPopupHtml(place) {
    const name = place.name[this.currentLang] || place.name.tr;
    const certText = `${place.certainty}/5`;
    const certColor = this.getCertaintyColor(place.certainty);
    const hintText = this.currentLang === 'tr' ? 'Detayları İncele →' : 'View Details →';

    return `
      <div class="popup-mini-card">
        <div class="popup-arabic">${place.quran_name}</div>
        <div class="popup-title">${name}</div>
        <div class="popup-meta">
          <span class="popup-certainty-badge" style="background:${certColor}20; color:${certColor}; border:1px solid ${certColor}50">
            ${certText}
          </span>
          <span class="popup-action-hint">${hintText}</span>
        </div>
      </div>
    `;
  }

  refreshPopups() {
    this.markersGroup.eachLayer(layer => {
      if (layer.placeData) {
        layer.setPopupContent(this.createPopupHtml(layer.placeData));
      }
    });
  }

  getCertaintyColor(certainty) {
    if (certainty >= 5) return '#10B981';
    if (certainty >= 4) return '#0284C7';
    if (certainty >= 3) return '#F59E0B';
    if (certainty >= 2) return '#F97316';
    return '#EF4444';
  }

  /**
   * Draw an active route with polylines and numbered stop badges
   */
  drawRoute(routeId) {
    this.clearRoute();
    if (!routeId) return;

    const route = this.routesData.find(r => r.id === routeId);
    if (!route) return;

    this.activeRoute = route;
    const latLngs = [];

    route.stops.forEach(stop => {
      const place = this.placesData.find(p => p.id === stop.place_id);
      if (place && place.coordinates) {
        latLngs.push({
          latLng: place.coordinates,
          stop,
          place
        });
      }
    });

    if (latLngs.length === 0) return;

    // 1. Draw glowing polyline
    const polylineCoords = latLngs.map(i => i.latLng);
    
    // Outer glow polyline
    const glowLine = L.polyline(polylineCoords, {
      color: route.color || '#F59E0B',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    });

    // Main dashed polyline
    const mainLine = L.polyline(polylineCoords, {
      color: route.color || '#F59E0B',
      weight: 3.5,
      dashArray: '8, 8',
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    });

    this.routeLayerGroup.addLayer(glowLine);
    this.routeLayerGroup.addLayer(mainLine);

    // 2. Add sequential numbered markers
    latLngs.forEach((item, index) => {
      const stopNumber = item.stop.order || (index + 1);
      const numberIcon = L.divIcon({
        className: 'route-number-marker',
        html: `
          <div class="route-badge" style="background: ${route.color || '#F59E0B'}">
            ${stopNumber}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker(item.latLng, { icon: numberIcon, zIndexOffset: 500 });
      marker.on('click', () => {
        this.onSelectPlace(item.place, item.stop);
      });

      this.routeLayerGroup.addLayer(marker);
    });

    // Auto-fit bounds to route with generous padding
    this.map.fitBounds(mainLine.getBounds(), {
      padding: [80, 80],
      maxZoom: 9,
      animate: true,
      duration: 1.2
    });
  }

  clearRoute() {
    this.routeLayerGroup.clearLayers();
    this.activeRoute = null;
  }

  /**
   * Pan to specific coordinate with smooth animation
   */
  flyToPlace(coordinates, zoom = 9) {
    if (!coordinates) return;
    this.map.flyTo(coordinates, zoom, {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.25
    });
  }
}
