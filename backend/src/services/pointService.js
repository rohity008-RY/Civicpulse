const wkx = require('wkx');

function parsePoint(location) {
  try {
    if (!location) return { lat: null, lng: null };
    const geometry = typeof location === 'object' && !Buffer.isBuffer(location)
      ? wkx.Geometry.parseGeoJSON(location)
      : wkx.Geometry.parse(typeof location === 'string' && /^(?:\\x)?[0-9a-f]+$/i.test(location)
        ? Buffer.from(location.replace(/^\\x/, ''), 'hex')
        : location);
    const lat = geometry.y;
    const lng = geometry.x;
    if (!(geometry instanceof wkx.Point) || !Number.isFinite(lat) || !Number.isFinite(lng)
      || Math.abs(lat) > 90 || Math.abs(lng) > 180) return { lat: null, lng: null };
    return { lat, lng };
  } catch {
    return { lat: null, lng: null };
  }
}

module.exports = { parsePoint };
