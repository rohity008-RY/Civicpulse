const supabase = require('../config/supabase');

/**
 * Resolves ward, zone, corporator, MLA, MP from GPS coordinates
 * Uses PostGIS ST_Within for spatial matching
 */
async function resolveRepresentatives(lat, lng) {
  // Step 1: Find ward by GPS point
  const { data: ward, error: wardError } = await supabase
    .rpc('find_ward_by_point', { lat, lng });

  if (wardError || !ward) {
    console.warn(`No ward found for lat:${lat} lng:${lng}`);
    return { ward_id: null, zone_id: null, corporator_id: null, mla_id: null, mp_id: null };
  }

  // Step 2: Get active corporator for ward
  const { data: corporator } = await supabase
    .from('corporators')
    .select('id')
    .eq('ward_id', ward.id)
    .eq('is_active', true)
    .maybeSingle();

  // Step 3: Get zone for ward, then MLA and MP
  const { data: zone } = await supabase
    .from('zones')
    .select('id, mla_id, mp_id')
    .eq('id', ward.zone_id)
    .single();

  return {
    ward_id:      ward.id,
    zone_id:      ward.zone_id,
    corporator_id: corporator?.id || null,
    mla_id:       zone?.mla_id || null,
    mp_id:        zone?.mp_id || null,
  };
}

module.exports = { resolveRepresentatives };
