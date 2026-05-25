const supabase = require('../config/supabase');

const normalizeText = (value) => String(value || '').trim();
const normalizeCode = (value) => normalizeText(value).toUpperCase();

async function buildRepresentativePayload(ward) {
  if (!ward?.id) {
    return {
      ward_id: null,
      zone_id: null,
      corporator_id: null,
      mla_id: null,
      mp_id: null,
      state_code: null,
      state_name: null,
      city: null,
      ward_number: null,
      ward_name: null,
    };
  }

  const { data: corporator } = await supabase
    .from('corporators')
    .select('id')
    .eq('ward_id', ward.id)
    .eq('is_active', true)
    .maybeSingle();

  const { data: zone } = await supabase
    .from('zones')
    .select('id, mla_id, mp_id, state_code, state_name, city')
    .eq('id', ward.zone_id)
    .single();

  return {
    ward_id: ward.id,
    zone_id: ward.zone_id,
    corporator_id: corporator?.id || null,
    mla_id: zone?.mla_id || null,
    mp_id: zone?.mp_id || null,
    state_code: ward.state_code || zone?.state_code || null,
    state_name: ward.state_name || zone?.state_name || null,
    city: ward.city || zone?.city || null,
    ward_number: ward.ward_number || null,
    ward_name: ward.name || null,
  };
}

async function resolveRepresentativesByWard(wardId) {
  if (!wardId) return buildRepresentativePayload(null);

  const { data: ward, error } = await supabase
    .from('wards')
    .select('id, name, zone_id, ward_number, state_code, state_name, city')
    .eq('id', wardId)
    .maybeSingle();

  if (error || !ward) {
    console.warn(`No ward found for ward_id:${wardId}`);
    return buildRepresentativePayload(null);
  }

  return buildRepresentativePayload(ward);
}

async function resolveRepresentativesByHierarchy({ state_code, state_name, city, ward_number, ward_name }) {
  const normalizedCity = normalizeText(city);
  const normalizedWardNumber = normalizeText(ward_number);
  const normalizedWardName = normalizeText(ward_name);
  const normalizedStateCode = normalizeCode(state_code);
  const normalizedStateName = normalizeText(state_name);

  if (!normalizedCity || (!normalizedWardNumber && !normalizedWardName)) {
    return buildRepresentativePayload(null);
  }

  let query = supabase
    .from('wards')
    .select('id, name, zone_id, ward_number, state_code, state_name, city')
    .ilike('city', normalizedCity);

  if (normalizedStateCode) query = query.eq('state_code', normalizedStateCode);
  if (!normalizedStateCode && normalizedStateName) query = query.ilike('state_name', normalizedStateName);
  if (normalizedWardNumber) query = query.ilike('ward_number', normalizedWardNumber);
  else query = query.ilike('name', normalizedWardName);

  const { data: ward, error } = await query.limit(1).maybeSingle();
  if (error || !ward) {
    console.warn(`No ward found for hierarchy:${normalizedStateCode || normalizedStateName}/${normalizedCity}/${normalizedWardNumber || normalizedWardName}`);
    return buildRepresentativePayload(null);
  }

  return buildRepresentativePayload(ward);
}

/**
 * Resolves ward, zone, corporator, MLA, MP from GPS coordinates
 * Uses PostGIS ST_Within for spatial matching
 */
async function resolveRepresentatives(lat, lng, fallback = {}) {
  if (fallback.ward_id) return resolveRepresentativesByWard(fallback.ward_id);
  if (fallback.city && (fallback.ward_number || fallback.ward_name)) {
    const hierarchy = await resolveRepresentativesByHierarchy(fallback);
    if (hierarchy.ward_id) return hierarchy;
  }

  // Step 1: Find ward by GPS point
  const { data: wards, error: wardError } = await supabase
    .rpc('find_ward_by_point', { lat, lng });

  const ward = Array.isArray(wards) ? wards[0] : wards;
  if (wardError || !ward) {
    console.warn(`No ward found for lat:${lat} lng:${lng}`);
    return buildRepresentativePayload(null);
  }

  return buildRepresentativePayload(ward);
}

module.exports = {
  resolveRepresentatives,
  resolveRepresentativesByWard,
  resolveRepresentativesByHierarchy,
};
