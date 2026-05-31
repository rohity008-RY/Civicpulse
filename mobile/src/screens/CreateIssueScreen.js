import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Image, Platform, Animated
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import api, { postMultipart } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { colors, CAT_CONFIG } from '../utils/theme';

const CATS = Object.keys(CAT_CONFIG);

const createUploadFormData = () => (
  Platform.OS === 'web' && typeof window !== 'undefined' ? new window.FormData() : new FormData()
);

const getPickedMediaName = (asset, index) => {
  const fromPicker = asset.fileName || asset.name;
  if (fromPicker) return fromPicker;
  const fromUri = asset.uri?.split('/').pop()?.split('?')[0];
  if (fromUri && fromUri.includes('.')) return fromUri;
  return asset.type === 'video' ? `media_${index}.mp4` : `media_${index}.jpg`;
};

const getPickedMediaMime = (asset) => {
  if (asset.mimeType?.includes('/')) return asset.mimeType;
  if (asset.type === 'video') return 'video/mp4';
  if (asset.type === 'audio') return 'audio/m4a';
  return 'image/jpeg';
};

const appendPickedMedia = async (fd, asset, index) => {
  if (Platform.OS === 'web') {
    const webFile = asset.file || await fetch(asset.uri).then((response) => response.blob());
    fd.append('media', webFile, getPickedMediaName(asset, index));
    return;
  }

  fd.append('media', {
    uri: asset.uri,
    name: getPickedMediaName(asset, index),
    type: getPickedMediaMime(asset),
  });
};

export default function CreateIssueScreen({ navigation, route }) {
  const initVoice = route?.params?.voiceMode === true;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [form, setForm]       = useState({ title: '', description: '', category: '', is_anonymous: false });
  const [location, setLoc]    = useState(null);
  const [media, setMedia]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [voiceMode, setVoiceMode] = useState(initVoice);
  const [recording, setRecording]   = useState(null);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceStep, setVoiceStep]   = useState(initVoice ? 'starting' : 'idle');
  const [voiceError, setVoiceError] = useState('');
  const [wardSearch, setWardSearch] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(user?.home_ward_id || '');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { data: locations } = useQuery({
    queryKey: ['locations-create'],
    queryFn: () => api.get('/api/reps/locations', { params: { limit: 1000 } }).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const wards = locations?.wards || [];
  const selectedWard = wards.find((ward) => ward.id === selectedWardId) || user?.home_ward || null;
  const wardOptions = useMemo(() => {
    const q = wardSearch.trim().toLowerCase();
    const base = q
      ? wards.filter((ward) => [ward.name, ward.ward_number, ward.city, ward.state_name].filter(Boolean).join(' ').toLowerCase().includes(q))
      : wards;
    return base.slice(0, 10);
  }, [wardSearch, wards]);

  useEffect(() => { getLocation(); if (initVoice) startRecording(); }, []);

  useEffect(() => {
    if (voiceStep === 'recording') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])).start();
    } else { pulseAnim.setValue(1); }
  }, [voiceStep]);

  const getLocation = async () => {
    setLocating(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Location permission denied'); setLocating(false); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    setLocating(false);
  };

  const startRecording = async () => {
    if (recording || processing) return;
    try {
      setVoiceMode(true);
      setVoiceStep('starting');
      setVoiceError('');
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setVoiceMode(false);
        setVoiceStep('idle');
        Alert.alert('Microphone permission needed', 'Allow microphone access or continue by typing the issue.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setVoiceStep('recording');
    } catch (e) {
      setVoiceError('Microphone could not start. Please type the issue manually.');
      Alert.alert('Microphone Error', e.message);
      setVoiceStep('idle');
      setVoiceMode(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      setVoiceMode(false);
      setVoiceStep('idle');
      setVoiceError('Microphone recording was not ready. Please type the issue manually.');
      return;
    }
    try {
      setVoiceStep('processing');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('Recording file was not created');
      await processAudio(uri);
    } catch (err) {
      setRecording(null);
      setVoiceMode(false);
      setVoiceStep('idle');
      setVoiceError('Recording could not be processed. Please type the issue manually.');
    }
  };

  const processAudio = async (uri) => {
    setProcessing(true);
    try {
      const fd = createUploadFormData();
      if (Platform.OS === 'web') {
        const audioBlob = await fetch(uri).then((response) => response.blob());
        fd.append('audio', audioBlob, 'recording.webm');
      } else {
        fd.append('audio', { uri, name: 'recording.m4a', type: 'audio/m4a' });
      }
      const { data: stt } = await postMultipart('/api/voice/transcribe', fd);
      setTranscript(stt.transcript);
      const { data: nlp } = await api.post('/api/voice/extract', { transcript: stt.transcript });
      const { title, category, description } = nlp.extracted;
      setForm(p => ({ ...p, title: title || p.title, description: description || p.description, category: category || p.category }));
      setVoiceStep('review');
    } catch (err) {
      const code = err.response?.data?.code;
      const message = code === 'OPENAI_NOT_CONFIGURED'
        ? 'Voice AI is not configured on the backend yet. Typed issue submission is ready.'
        : (err.response?.data?.error || 'Processing failed. Please type manually.');
      setVoiceError(message);
      Alert.alert('Voice fallback', message);
      setVoiceMode(false);
      setVoiceStep('idle');
    } finally {
      setProcessing(false);
    }
  };

  const pickImage = async () => {
    if (media.length >= 4) { Alert.alert('Max 4 files'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) setMedia(p => [...p, ...result.assets.slice(0, 4 - p.length)]);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.category) { Alert.alert('Required', 'Title and category required'); return; }
    if (!location && !selectedWard) { Alert.alert('Location', 'Please enable GPS or select a ward'); return; }
    setLoading(true);
    try {
      const fd = createUploadFormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (location) {
        fd.append('lat', location.lat);
        fd.append('lng', location.lng);
      }
      if (selectedWard) {
        fd.append('ward_id', selectedWard.id);
        fd.append('ward_name', selectedWard.name || '');
        fd.append('ward_number', selectedWard.ward_number || '');
        fd.append('city', selectedWard.city || '');
        fd.append('state_code', selectedWard.state_code || '');
        fd.append('state_name', selectedWard.state_name || '');
      }
      fd.append('source', voiceStep === 'review' ? 'VOICE' : 'TYPED');
      await Promise.all(media.map((m, i) => appendPickedMedia(fd, m, i)));
      const { data } = await postMultipart('/api/issues', fd);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['feed-list'] }),
      ]);
      Alert.alert('✅ Success', data.media_warning || 'Issue raised!', [{ text: 'View', onPress: () => openIssue(data.issue.id) }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  const openIssue = (id) => {
    const root = navigation.getParent();
    if (root) root.navigate('IssueDetail', { id });
    else navigation.navigate('IssueDetail', { id });
  };

  const cancelVoice = async () => {
    try {
      if (recording) await recording.stopAndUnloadAsync();
    } catch {}
    setRecording(null);
    setVoiceMode(false);
    setVoiceStep('idle');
    goBack();
  };

  // Voice recording screen
  if (voiceMode && (voiceStep === 'starting' || voiceStep === 'recording' || voiceStep === 'processing')) {
    const voiceTitle = voiceStep === 'processing' ? '🤖 Processing…'
      : voiceStep === 'starting' ? '🎤 Preparing mic…'
        : '🎤 Listening…';
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={cancelVoice}>
          <Text style={{ color: colors.text2, fontSize: 16 }}>←</Text>
        </TouchableOpacity>

        <Text style={styles.voiceTitle}>{voiceTitle}</Text>
        <Text style={styles.voiceSub}>Speak in English, Hindi or Marathi</Text>

        <Animated.View style={[styles.micOrb, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={{ fontSize: 44 }}>{voiceStep === 'processing' || voiceStep === 'starting' ? '⏳' : '🎙️'}</Text>
        </Animated.View>

        {voiceStep === 'recording' && (
          <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
            <Text style={styles.stopBtnTxt}>⬛ Stop Recording</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Text style={{ color: colors.text2, fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{voiceStep === 'review' ? '📋 Review Issue' : 'Raise an Issue'}</Text>
        <TouchableOpacity onPress={() => { setVoiceMode(true); startRecording(); }} disabled={voiceStep === 'recording' || voiceStep === 'processing'}
          style={{ backgroundColor: 'rgba(59,130,246,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' }}>
          <Text style={{ color: colors.accent2, fontSize: 12, fontWeight: '600' }}>{voiceStep === 'processing' ? 'Processing…' : '🎤 Voice'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {voiceStep === 'review' && (
          <View style={styles.aiNotice}>
            <Text style={{ fontSize: 12, color: colors.purple2, fontWeight: '600' }}>AI filled this from your voice. Please review.</Text>
            {!!transcript && <Text style={{ fontSize: 11, color: colors.text3, marginTop: 4, fontStyle: 'italic' }}>"{transcript.slice(0,80)}…"</Text>}
          </View>
        )}

        {!!voiceError && (
          <View style={styles.voiceFallback}>
            <Text style={styles.voiceFallbackTitle}>Voice fallback active</Text>
            <Text style={styles.voiceFallbackText}>{voiceError}</Text>
          </View>
        )}

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        <View style={styles.catGrid}>
          {CATS.map(cat => {
            const c = CAT_CONFIG[cat];
            return (
              <TouchableOpacity key={cat} onPress={() => setForm(p => ({ ...p, category: cat }))}
                style={[styles.catBtn, form.category === cat && { borderColor: colors.accent, backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
                <Text style={[styles.catBtnTxt, form.category === cat && { color: colors.accent2 }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Title */}
        <Text style={styles.label}>Issue Title *</Text>
        <TextInput style={styles.input} placeholder="e.g. Large pothole near Andheri Station" placeholderTextColor={colors.text3}
          value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} maxLength={80} />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, { height: 80 }]} placeholder="Add more details…" placeholderTextColor={colors.text3}
          value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))}
          multiline textAlignVertical="top" maxLength={500} />

        {/* Location */}
        <Text style={styles.label}>Location *</Text>
        <View style={[styles.input, styles.locRow]}>
          <Text style={{ flex: 1, color: location ? colors.text : colors.text3, fontSize: 13 }}>
            {locating ? '📍 Detecting…' : location ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : '📍 Not detected'}
          </Text>
          <TouchableOpacity onPress={getLocation}>
            <Text style={{ color: colors.accent2, fontSize: 12, fontWeight: '600' }}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Ward mapping */}
        <Text style={styles.label}>Ward Mapping</Text>
        {!!selectedWard && (
          <View style={styles.selectedWard}>
            <Text style={styles.selectedWardTitle}>Mapped to {selectedWard.name}</Text>
            <Text style={styles.selectedWardMeta}>{[selectedWard.ward_number, selectedWard.city, selectedWard.state_name].filter(Boolean).join(' · ')}</Text>
          </View>
        )}
        <TextInput
          style={styles.input}
          placeholder="Search ward / city for correct representative"
          placeholderTextColor={colors.text3}
          value={wardSearch}
          onChangeText={setWardSearch}
        />
        <View style={styles.wardGrid}>
          {wardOptions.map((ward) => (
            <TouchableOpacity
              key={ward.id}
              style={[styles.wardOption, selectedWardId === ward.id && styles.wardOptionActive]}
              onPress={() => setSelectedWardId(ward.id)}
            >
              <Text style={[styles.wardOptionTitle, selectedWardId === ward.id && { color: '#fff' }]}>{ward.name}</Text>
              <Text style={[styles.wardOptionMeta, selectedWardId === ward.id && { color: 'rgba(255,255,255,0.82)' }]}>
                {[ward.ward_number, ward.city].filter(Boolean).join(' · ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photos */}
        <Text style={styles.label}>Photos / Video</Text>
        <View style={styles.mediaRow}>
          {media.map((m, i) => (
            <View key={i} style={styles.mediaThumb}>
              <Image source={{ uri: m.uri }} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
              <TouchableOpacity onPress={() => setMedia(p => p.filter((_, j) => j !== i))} style={styles.mediaRemove}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {media.length < 4 && (
            <TouchableOpacity style={styles.mediaAdd} onPress={pickImage}>
              <Text style={{ fontSize: 24 }}>📷</Text>
              <Text style={{ fontSize: 9, color: colors.text3 }}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Anonymous toggle */}
        <TouchableOpacity style={styles.anonRow} onPress={() => setForm(p => ({ ...p, is_anonymous: !p.is_anonymous }))}>
          <View style={[styles.toggle, form.is_anonymous && styles.toggleOn]}>
            <View style={[styles.toggleKnob, form.is_anonymous && styles.toggleKnobOn]} />
          </View>
          <Text style={{ fontSize: 13, color: colors.text2 }}>Submit anonymously</Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity style={[styles.submitBtn, ((!location && !selectedWard) || loading) && styles.submitBtnDisabled]}
          onPress={handleSubmit} disabled={(!location && !selectedWard) || loading}>
          <Text style={styles.submitBtnTxt}>{loading ? 'Submitting…' : '🚨 Submit Issue'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backBtn:   { position: 'absolute', top: 52, left: 20, zIndex: 10, padding: 8 },
  voiceTitle:{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8, marginTop: 60, textAlign: 'center' },
  voiceSub:  { fontSize: 13, color: colors.text3, marginBottom: 40, textAlign: 'center' },
  micOrb:    { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 30, elevation: 10, marginBottom: 40 },
  stopBtn:   { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  stopBtnTxt:{ color: colors.red2, fontWeight: '700', fontSize: 14 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingTop: 56 },
  headerTitle:{ fontSize: 18, fontWeight: '700', color: colors.text },
  body:      { padding: 14, paddingBottom: 40, gap: 14 },
  aiNotice:  { backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', borderRadius: 12, padding: 12 },
  voiceFallback: { backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', borderRadius: 12, padding: 12 },
  voiceFallbackTitle: { color: colors.yellow2, fontSize: 12, fontWeight: '800', marginBottom: 3 },
  voiceFallbackText: { color: colors.text2, fontSize: 12, lineHeight: 18 },
  label:     { fontSize: 11, fontWeight: '600', color: colors.text3, textTransform: 'uppercase', letterSpacing: 1 },
  catGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn:    { width: '22%', padding: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: 'center', gap: 4 },
  catBtnTxt: { fontSize: 8, fontWeight: '600', color: colors.text3 },
  input:     { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14 },
  locRow:    { flexDirection: 'row', alignItems: 'center' },
  selectedWard: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.28)', borderRadius: 12, padding: 12 },
  selectedWardTitle: { color: colors.green2, fontSize: 13, fontWeight: '800' },
  selectedWardMeta: { color: colors.text2, fontSize: 11, marginTop: 2 },
  wardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wardOption: { width: '48%', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10 },
  wardOptionActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  wardOptionTitle: { color: colors.text, fontSize: 11, fontWeight: '800' },
  wardOptionMeta: { color: colors.text3, fontSize: 9, marginTop: 2 },
  mediaRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  mediaThumb:{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  mediaRemove:{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, backgroundColor: colors.red, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  mediaAdd:  { width: 72, height: 72, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border2, borderStyle: 'dashed', borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  anonRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggle:    { width: 40, height: 22, borderRadius: 11, backgroundColor: colors.surface3, padding: 2 },
  toggleOn:  { backgroundColor: colors.accent },
  toggleKnob:{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  toggleKnobOn:{ marginLeft: 18 },
  submitBtn: { backgroundColor: colors.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnDisabled:{ backgroundColor: colors.surface3 },
  submitBtnTxt:{ color: '#fff', fontSize: 15, fontWeight: '800' },
});
