import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Linking, Image
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import LanguagePicker from '../components/LanguagePicker';
import { useT } from '../utils/i18n';
import api from '../utils/api';
import { colors } from '../utils/theme';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

const AWARENESS_ITEMS = [
  {
    category: 'ALERT',
    title: 'Monsoon watch',
    summary: 'Report waterlogging early with a clear road name, landmark, and photo.',
  },
  {
    category: 'GUIDE',
    title: 'Better pothole reports',
    summary: 'A wide road photo plus close-up helps the right team verify faster.',
  },
  {
    category: 'SAFETY',
    title: 'Streetlight night safety',
    summary: 'Mention pole number or nearest shop when reporting dark stretches.',
  },
];

const LOGIN_PUZZLE = {
  title: 'Today’s civic puzzle',
  prompt: 'Which detail helps a pothole complaint move fastest?',
  choices: ['Nearest landmark', 'Only angry text', 'No location'],
  answer: 0,
  note: 'Landmarks make field verification much faster.',
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuthStore();
  const { t, language } = useT();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [mode, setMode] = useState('landing');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [wardSearch, setWardSearch] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [locatingWard, setLocatingWard] = useState(false);
  const [activeAwareness, setActiveAwareness] = useState(0);
  const [puzzleChoice, setPuzzleChoice] = useState(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingIssue, setTrackingIssue] = useState(false);
  const [previewWard, setPreviewWard] = useState(null);
  const authConfig = useQuery({ queryKey: ['auth-config'], queryFn: () => api.get('/api/auth/config').then(result => result.data), staleTime: 60000 });
  const googleClientId = GOOGLE_WEB_CLIENT_ID || authConfig.data?.google_web_client_id || '';
  const googleConfigured = Boolean(googleClientId);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAwareness((index) => (index + 1) % AWARENESS_ITEMS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { data: locations, isLoading: wardsLoading } = useQuery({
    queryKey: ['signup-locations'],
    queryFn: () => api.get('/api/reps/locations', { params: { limit: 1000 } }).then((r) => r.data),
    enabled: mode === 'email' && isRegister,
    staleTime: 10 * 60 * 1000,
  });

  const statsQuery = useQuery({
    queryKey: ['login-impact-stats'],
    queryFn: () => api.get('/api/feed/stats').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const wards = locations?.wards || [];
  const wardOptions = useMemo(() => {
    const q = wardSearch.trim().toLowerCase();
    const base = q
      ? wards.filter((ward) => [ward.name, ward.ward_number, ward.city, ward.state_name].filter(Boolean).join(' ').toLowerCase().includes(q))
      : wards;
    return base.slice(0, 8);
  }, [wardSearch, wards]);
  const selectedWard = wards.find((ward) => ward.id === selectedWardId);

  const handleAuth = async () => {
    if (!form.email || !form.password) { Alert.alert(t('error'), t('credentialsRequired')); return; }
    if (isRegister && !form.name) { Alert.alert(t('error'), t('nameRequired')); return; }
    if (isRegister && !selectedWardId) { Alert.alert(t('homeWard'), t('wardRequired')); return; }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const { data } = await api.post(endpoint, {
        ...form,
        preferred_language: language,
        home_ward_id: isRegister ? selectedWardId : undefined,
      });
      await setLanguage(data.user?.preferred_language || language);
      await login(data.user, data.token);
    } catch (err) {
      Alert.alert(t('error'), t('authFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    navigation.navigate('Explore');
  };

  const handleGoogle = async () => {
    if (!googleConfigured) {
      Alert.alert(t('googleNeedsSetup'), t('googleNeedsSetupCopy'));
      return;
    }
    if (Platform.OS !== 'android') {
      Alert.alert(t('googleUnavailable'), t('googleNeedsSetupCopy'));
      return;
    }
    setLoading(true);
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: googleClientId, offlineAccess: false });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      if (result.type === 'cancelled') return;
      const credential = result.data?.idToken;
      if (!credential) throw new Error(t('googleTokenMissing'));
      const { data } = await api.post('/api/auth/social', { provider: 'google', id_token: credential, preferred_language: language, home_ward_id: selectedWardId || undefined });
      await setLanguage(data.user?.preferred_language || language);
      await login(data.user, data.token);
    } catch (error) {
      if (error.response?.data?.code === 'WARD_REQUIRED') {
        setMode('email');
        setIsRegister(true);
        Alert.alert(t('homeWard'), t('googleChooseWard'));
      } else if (error.code !== 'SIGN_IN_CANCELLED' && error.code !== 'IN_PROGRESS') {
        Alert.alert(t('error'), error.response?.data?.error || t('googleSignInFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      Alert.alert(t('error'), t('emailRequired'));
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email: form.email });
      if (data.reset_url) {
        Alert.alert(t('resetLinkSent'), t('resetEmailNotConfigured'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('openResetLink'), onPress: () => Linking.openURL(data.reset_url) },
        ]);
      } else if (data.email_configured) {
        Alert.alert(t('resetLinkSent'), t('resetEmailConfigured'));
      } else {
        Alert.alert(t('resetLinkSent'), t('resetIfAccountExists'));
      }
      setMode('email');
      setIsRegister(false);
    } catch (err) {
      Alert.alert(t('error'), err.response?.data?.error || t('resetRequestFailed'));
    } finally {
      setLoading(false);
    }
  };

  const trackIssue = async () => {
    const code = trackingCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Tracking ID', 'Enter a CivicsPulse issue ID.');
      return;
    }
    setTrackingIssue(true);
    try {
      const { data } = await api.get(`/api/issues/track/${encodeURIComponent(code)}`);
      setTrackingCode('');
      navigation.navigate('IssueDetail', { id: data.issue.id });
    } catch (err) {
      Alert.alert('Issue not found', err.response?.data?.error || 'Check the ID and try again.');
    } finally {
      setTrackingIssue(false);
    }
  };

  const startVoiceIntro = () => {
    Alert.alert('Voice AI', 'Sign in first, then use Create → Voice to speak your issue and review AI-filled details.');
    setMode('email');
    setIsRegister(false);
  };

  const detectWard = async () => {
    setLocatingWard(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Location permission', 'Allow location or search ward manually.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { data } = await api.get('/api/reps/ward-lookup', {
        params: { lat: loc.coords.latitude, lng: loc.coords.longitude },
      });
      if (data.ward?.id) {
        setSelectedWardId(data.ward.id);
        setWardSearch(data.ward.name || data.ward.ward_number || '');
        setPreviewWard(data.ward);
        Alert.alert('Ward detected', data.ward.name || data.ward.ward_number || 'Mapped ward');
      } else {
        Alert.alert('Ward not found', 'Search your ward manually.');
      }
    } catch (err) {
      Alert.alert('Ward lookup', err.response?.data?.error || 'Could not detect ward. Search manually.');
    } finally {
      setLocatingWard(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.heroTop}>
          <Image source={require('../../assets/icon.png')} style={styles.logoImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>CivicsPulse</Text>
            <Text style={styles.tagline}>{t('welcomeTagline')}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            [statsQuery.data?.total_issues ?? '—', t('issuesRaised')],
            [`${statsQuery.data?.resolution_rate ?? 0}%`, t('resolved')],
            [statsQuery.data?.active_reps ?? '—', t('wardReps')],
          ].map(([v,l]) => (
            <View key={l} style={styles.statItem}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLbl}>{l}</Text>
            </View>
          ))}
        </View>

        <LinearGradient colors={['rgba(59,130,246,0.18)','rgba(16,185,129,0.12)']} style={styles.awarenessCard}>
          <View style={styles.cardTopline}>
            <Text style={styles.cardEyebrow}>Awareness news</Text>
            <Text style={styles.cardBadge}>{AWARENESS_ITEMS[activeAwareness].category}</Text>
          </View>
          <Text style={styles.awarenessTitle}>{AWARENESS_ITEMS[activeAwareness].title}</Text>
          <Text style={styles.awarenessCopy}>{AWARENESS_ITEMS[activeAwareness].summary}</Text>
          <View style={styles.dots}>
            {AWARENESS_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[styles.dot, activeAwareness === index && styles.dotActive]}
                onPress={() => setActiveAwareness(index)}
              />
            ))}
          </View>
        </LinearGradient>

        <View style={styles.utilityGrid}>
          <View style={styles.utilityCard}>
            <Text style={styles.utilityTitle}>Track issue</Text>
            <Text style={styles.utilityCopy}>Check public status without login.</Text>
            <View style={styles.trackRow}>
              <TextInput
                style={styles.trackInput}
                placeholder="CP-MH-MUMB..."
                placeholderTextColor={colors.text3}
                value={trackingCode}
                onChangeText={setTrackingCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.miniButton} onPress={trackIssue} disabled={trackingIssue}>
                <Text style={styles.miniButtonText}>{trackingIssue ? '...' : 'Go'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.utilityCard}>
            <Text style={styles.utilityTitle}>Detect ward</Text>
            <Text style={styles.utilityCopy}>{previewWard ? (previewWard.name || previewWard.ward_number) : 'Use GPS or search during signup.'}</Text>
            <TouchableOpacity style={styles.secondaryMiniButton} onPress={detectWard} disabled={locatingWard}>
              <Text style={styles.secondaryMiniText}>{locatingWard ? 'Detecting…' : 'Use location'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.puzzleCard}>
          <Text style={styles.cardEyebrow}>{LOGIN_PUZZLE.title}</Text>
          <Text style={styles.puzzlePrompt}>{LOGIN_PUZZLE.prompt}</Text>
          <View style={styles.puzzleOptions}>
            {LOGIN_PUZZLE.choices.map((choice, index) => (
              <TouchableOpacity
                key={choice}
                style={[
                  styles.puzzleChip,
                  puzzleChoice === index && styles.puzzlePicked,
                  puzzleChoice !== null && index === LOGIN_PUZZLE.answer && styles.puzzleRight,
                ]}
                onPress={() => setPuzzleChoice(index)}
              >
                <Text style={[
                  styles.puzzleChipText,
                  (puzzleChoice === index || (puzzleChoice !== null && index === LOGIN_PUZZLE.answer)) && { color: '#fff' },
                ]}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {puzzleChoice !== null && <Text style={styles.puzzleNote}>{LOGIN_PUZZLE.note}</Text>}
        </View>

        <View style={styles.tipRow}>
          {['Photo proof', 'Right category', 'Mapped reps'].map((item) => (
            <View key={item} style={styles.tipPill}>
              <Text style={styles.tipText}>{item}</Text>
            </View>
          ))}
        </View>

        {mode === 'landing' && (
          <View style={styles.btns}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setMode('email')}>
              <Text style={styles.btnPrimaryTxt}>✉  {t('continueEmail')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGoogle} onPress={handleGoogle} disabled={loading}>
              <Text style={styles.btnGoogleTxt}>G  {t('continueWithGoogle')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnVoice} onPress={startVoiceIntro}>
              <Text style={styles.btnVoiceText}>🎙  Speak your issue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={handleDemo} disabled={loading}>
              <Text style={styles.btnOutlineTxt}>{loading ? 'Loading…' : `⚡  ${t('quickDemo')}`}</Text>
            </TouchableOpacity>
            <LanguagePicker />
            <TouchableOpacity onPress={() => Linking.openURL('https://civicspulse.in/privacy')}><Text style={styles.terms}>{t('privacyNotice')}</Text></TouchableOpacity>
          </View>
        )}

        {mode === 'email' && (
          <View style={styles.form}>
            <TouchableOpacity onPress={() => setMode('landing')} style={styles.backRow}>
              <Text style={styles.backTxt}>← {t('back')}</Text>
              <Text style={styles.formTitle}>{isRegister ? t('createAccount') : t('signIn')}</Text>
            </TouchableOpacity>

            <LanguagePicker />
            {isRegister && (
              <TextInput style={styles.input} placeholder={t('fullName')} placeholderTextColor={colors.text3}
                value={form.name} onChangeText={t => setForm(p => ({ ...p, name: t }))} />
            )}
            <TextInput style={styles.input} placeholder={t('email')} placeholderTextColor={colors.text3}
              keyboardType="email-address" autoCapitalize="none"
              value={form.email} onChangeText={t => setForm(p => ({ ...p, email: t }))} />
            <TextInput style={styles.input} placeholder={t('password')} placeholderTextColor={colors.text3}
              secureTextEntry={!showPassword} value={form.password} onChangeText={t => setForm(p => ({ ...p, password: t }))} />
            {!!form.password && (
              <TouchableOpacity style={styles.showPasswordRow} onPress={() => setShowPassword((value) => !value)}>
                <Text style={styles.checkBox}>{showPassword ? '☑' : '☐'}</Text>
                <Text style={styles.showPasswordText}>{t('showPassword')}</Text>
              </TouchableOpacity>
            )}

            {isRegister && (
              <View style={styles.wardBox}>
                <View style={styles.wardHeader}>
                  <Text style={styles.wardTitle}>{t('wardZone')}</Text>
                  <TouchableOpacity onPress={detectWard} disabled={locatingWard}>
                    <Text style={styles.wardLocate}>{locatingWard ? t('detecting') : t('useLocation')}</Text>
                  </TouchableOpacity>
                </View>
                {!!selectedWard && (
                  <Text style={styles.selectedWardText}>
                    {selectedWard.name} {[selectedWard.ward_number, selectedWard.city].filter(Boolean).join(' · ')}
                  </Text>
                )}
                <TextInput
                  style={styles.input}
                  placeholder={wardsLoading ? t('loadingWards') : t('searchWards')}
                  placeholderTextColor={colors.text3}
                  value={wardSearch}
                  onChangeText={setWardSearch}
                />
                <View style={styles.wardGrid}>
                  {wardOptions.map((ward) => (
                    <TouchableOpacity
                      key={ward.id}
                      style={[styles.wardChip, selectedWardId === ward.id && styles.wardChipActive]}
                      onPress={() => setSelectedWardId(ward.id)}
                    >
                      <Text style={[styles.wardChipTitle, selectedWardId === ward.id && { color: '#fff' }]}>{ward.name}</Text>
                      <Text style={[styles.wardChipMeta, selectedWardId === ward.id && { color: 'rgba(255,255,255,0.82)' }]}>
                        {[ward.ward_number, ward.city].filter(Boolean).join(' · ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {!wardsLoading && !wardOptions.length && <Text style={styles.helpTxt}>{t('noWards')}</Text>}
                </View>
              </View>
            )}

            <TouchableOpacity style={[styles.btnPrimary, { opacity: loading ? 0.7 : 1 }]} onPress={handleAuth} disabled={loading}>
              <Text style={styles.btnPrimaryTxt}>{loading ? t('pleaseWait') : isRegister ? t('createAccount') : t('signIn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnGoogle} onPress={handleGoogle} disabled={loading}>
              <Text style={styles.btnGoogleTxt}>G  {t('continueWithGoogle')}</Text>
            </TouchableOpacity>

            {!isRegister && (
              <TouchableOpacity onPress={() => setMode('forgot')}>
                <Text style={styles.linkTxt}>{t('forgotPasswordQuestion')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
              <Text style={styles.linkTxt}>
                {isRegister ? t('alreadyHaveAccount') : t('newHere')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'forgot' && (
          <View style={styles.form}>
            <TouchableOpacity onPress={() => { setMode('email'); setIsRegister(false); }} style={styles.backRow}>
              <Text style={styles.backTxt}>← {t('back')}</Text>
              <Text style={styles.formTitle}>{t('forgotPassword')}</Text>
            </TouchableOpacity>
            <Text style={styles.helpTxt}>{t('forgotPasswordCopy')}</Text>
            <TextInput style={styles.input} placeholder={t('email')} placeholderTextColor={colors.text3}
              keyboardType="email-address" autoCapitalize="none"
              value={form.email} onChangeText={text => setForm(prev => ({ ...prev, email: text }))} />
            <TouchableOpacity style={[styles.btnPrimary, { opacity: loading ? 0.7 : 1 }]} onPress={handleForgotPassword} disabled={loading}>
              <Text style={styles.btnPrimaryTxt}>{loading ? t('pleaseWait') : t('sendResetLink')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 64, alignItems: 'center' },
  heroTop: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 18 },
  logoImage: { width: 58, height: 58, borderRadius: 18 },
  brand: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  tagline: { fontSize: 13, color: colors.text2, lineHeight: 19 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 14, width: '100%' },
  statItem: { flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.border },
  statVal: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLbl: { fontSize: 10, color: colors.text3, marginTop: 2 },
  awarenessCard: { width: '100%', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', padding: 16, marginBottom: 12 },
  cardTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  cardEyebrow: { color: colors.accent2, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  cardBadge: { color: colors.yellow2, fontSize: 10, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(245,158,11,0.16)' },
  awarenessTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginBottom: 6 },
  awarenessCopy: { color: colors.text2, fontSize: 13, lineHeight: 19 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 13 },
  dot: { width: 24, height: 5, borderRadius: 99, backgroundColor: colors.surface3 },
  dotActive: { backgroundColor: colors.accent2 },
  utilityGrid: { width: '100%', flexDirection: 'row', gap: 10, marginBottom: 12 },
  utilityCard: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12 },
  utilityTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginBottom: 4 },
  utilityCopy: { color: colors.text3, fontSize: 11, lineHeight: 16, minHeight: 32 },
  trackRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  trackInput: { flex: 1, minHeight: 38, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, color: colors.text, fontSize: 11, paddingHorizontal: 8 },
  miniButton: { width: 42, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  miniButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  secondaryMiniButton: { marginTop: 10, minHeight: 38, borderRadius: 10, backgroundColor: 'rgba(96,165,250,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.25)', alignItems: 'center', justifyContent: 'center' },
  secondaryMiniText: { color: colors.accent2, fontSize: 11, fontWeight: '900' },
  puzzleCard: { width: '100%', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, marginBottom: 12 },
  puzzlePrompt: { color: colors.text, fontSize: 14, fontWeight: '800', lineHeight: 20, marginTop: 5 },
  puzzleOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  puzzleChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border2, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.surface },
  puzzlePicked: { backgroundColor: colors.accent, borderColor: colors.accent },
  puzzleRight: { backgroundColor: colors.green, borderColor: colors.green },
  puzzleChipText: { color: colors.text2, fontSize: 11, fontWeight: '900' },
  puzzleNote: { color: colors.green2, fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: 10 },
  tipRow: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
  tipPill: { borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 10, paddingVertical: 6 },
  tipText: { color: colors.green2, fontSize: 11, fontWeight: '900' },
  btns: { width: '100%', gap: 10 },
  btnPrimary: { backgroundColor: colors.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnOutline: { backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
  btnOutlineTxt: { color: colors.green2, fontSize: 14, fontWeight: '600' },
  btnGoogle: { backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#D7DEE9' },
  btnGoogleTxt: { color: '#1F2937', fontSize: 14, fontWeight: '800' },
  btnVoice: { backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.28)' },
  btnVoiceText: { color: colors.yellow2, fontSize: 14, fontWeight: '800' },
  terms: { textAlign: 'center', fontSize: 11, color: colors.text3, marginTop: 8 },
  form: { width: '100%', gap: 12 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backTxt: { color: colors.text3, fontSize: 16 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14 },
  showPasswordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4 },
  checkBox: { color: colors.text2, fontSize: 15 },
  showPasswordText: { color: colors.text2, fontSize: 12, fontWeight: '700' },
  wardBox: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, gap: 10 },
  wardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wardTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  wardLocate: { color: colors.accent2, fontSize: 12, fontWeight: '900' },
  selectedWardText: { color: colors.green2, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  wardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wardChip: { width: '48%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10 },
  wardChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  wardChipTitle: { color: colors.text, fontSize: 11, fontWeight: '800' },
  wardChipMeta: { color: colors.text3, fontSize: 9, marginTop: 2 },
  linkTxt: { color: colors.accent2, textAlign: 'center', fontSize: 13, marginTop: 4, fontWeight: '700' },
  helpTxt: { color: colors.text2, fontSize: 13, lineHeight: 20 },
});
