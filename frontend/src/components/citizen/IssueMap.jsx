import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocateFixed, Maximize2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { statusLabel, useT } from '../../utils/i18n';
import { citizenText } from './copy';

export const hasCoordinates = point => point?.lat !== null && point?.lng !== null
  && point?.lat !== '' && point?.lng !== '' && Number.isFinite(Number(point?.lat))
  && Number.isFinite(Number(point?.lng)) && Math.abs(Number(point.lat)) <= 90 && Math.abs(Number(point.lng)) <= 180;

export default function IssueMap({ points = [], selected, onPick, className = '', center, height = 400 }) {
  const container = useRef(null);
  const instance = useRef(null);
  const layers = useRef(null);
  const pick = useRef(onPick);
  const [tileError, setTileError] = useState(false);
  const navigate = useNavigate();
  const { language, t } = useT();
  const c = citizenText(language);
  pick.current = onPick;

  useEffect(() => {
    const map = L.map(container.current, { scrollWheelZoom: false, zoomControl: false }).setView([19.076, 72.8777], 11);
    instance.current = map;
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).on('tileerror', () => setTileError(true)).on('tileload', () => setTileError(false)).addTo(map);
    layers.current = L.layerGroup().addTo(map);
    map.on('click', event => pick.current?.({ lat: event.latlng.lat, lng: event.latlng.lng }));
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); map.remove(); instance.current = null; };
  }, []);

  useEffect(() => {
    if (!instance.current || !layers.current) return;
    layers.current.clearLayers();
    const valid = points.filter(hasCoordinates);
    valid.forEach(point => {
      const color = point.status === 'RESOLVED' ? '#158062'
        : point.status?.startsWith('ESCALATED') ? '#b74932' : point.status === 'IN_PROGRESS' ? '#bb7d14' : '#2563eb';
      const marker = L.circleMarker([Number(point.lat), Number(point.lng)], { radius: 9, color: '#ffffff', weight: 3, fillColor: color, fillOpacity: 1 }).addTo(layers.current);
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = point.title;
      const status = document.createElement('p');
      status.textContent = statusLabel(language, point.status);
      const link = document.createElement('a');
      link.href = `/issues/${point.id}`;
      link.textContent = point.public_id || point.title;
      link.addEventListener('click', event => { event.preventDefault(); navigate(`/issues/${point.id}`); });
      popup.append(title, status, link);
      marker.bindPopup(popup);
    });
    if (hasCoordinates(selected)) {
      L.circleMarker([Number(selected.lat), Number(selected.lng)], { color: '#0c806d', radius: 11, fillOpacity: 0.65 }).addTo(layers.current);
      instance.current.setView([Number(selected.lat), Number(selected.lng)], 16);
    } else if (valid.length) {
      instance.current.fitBounds(L.latLngBounds(valid.map(point => [Number(point.lat), Number(point.lng)])), { padding: [35, 35], maxZoom: 15 });
    } else if (hasCoordinates(center)) {
      instance.current.setView([Number(center.lat), Number(center.lng)], 13);
    } else {
      instance.current.setView([19.076, 72.8777], 11);
    }
  }, [points, selected, center, language, navigate]);

  const fit = () => {
    const valid = points.filter(hasCoordinates);
    if (valid.length) instance.current?.fitBounds(L.latLngBounds(valid.map(p => [Number(p.lat), Number(p.lng)])), { padding: [35, 35], maxZoom: 15 });
    else instance.current?.setView([19.076, 72.8777], 11);
  };
  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(position => {
      const point = { lat: position.coords.latitude, lng: position.coords.longitude };
      instance.current?.setView([point.lat, point.lng], 15);
      pick.current?.(point);
    }, () => setTileError('location'), { timeout: 10000 });
  };

  return (
    <div className={`civic-real-map ${className}`} style={{ height }}>
      <div ref={container} className="civic-map-canvas" role="region" aria-label={c.map} />
      <div className="civic-map-tools">
        <button type="button" onClick={fit} title={c.map} aria-label={c.map}><Maximize2 size={17} /></button>
        <button type="button" onClick={locate} title={t('useLocation')} aria-label={t('useLocation')}><LocateFixed size={17} /></button>
      </div>
      {tileError && <div className="map-service-notice" role="status">{c.tryAgain} {tileError === 'location' ? c.chooseWard : c.listView}</div>}
    </div>
  );
}
