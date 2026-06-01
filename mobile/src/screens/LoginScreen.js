import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import LanguagePicker from '../components/LanguagePicker';
import { useT } from '../utils/i18n';
import api from '../utils/api';
import { colors } from '../utils/theme';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export default function LoginScreen({ navigation }) {
  const { login } = useAuthStore();
  const { t, language } = useT();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [mode, setMode] = useState('landing');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const googleConfigured = Boolean(GOOGLE_WEB_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID);
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    const completeGoogleSignIn = async () => {
      if (response?.type !== 'success') return;
      const idToken = response.params?.id_token || response.authentication?.idToken;
      if (!idToken) {
        Alert.alert(t('error'), t('googleTokenMissing'));
        return;
      }

      setLoading(true);
      try {
        const { data } = await api.post('/api/auth/social', {
          provider: 'google',
          id_token: idToken,
          preferred_language: language,
        });
        await setLanguage(data.user?.preferred_language || language);
        await login(data.user, data.token);
      } catch (err) {
        Alert.alert(t('error'), err.response?.data?.error || t('googleSignInFailed'));
      } finally {
        setLoading(false);
      }
    };

    completeGoogleSignIn();
  }, [response]);

  const handleAuth = async () => {
    if (!form.email || !form.password) { Alert.alert('Error', 'Email and password required'); return; }
    if (isRegister && !form.name) { Alert.alert('Error', 'Name required'); return; }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const { data } = await api.post(endpoint, { ...form, preferred_language: language });
      await setLanguage(data.user?.preferred_language || language);
      await login(data.user, data.token);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email: 'demo@civicpulse.in', password: 'demo1234' });
      await setLanguage(data.user?.preferred_language || language);
      await login(data.user, data.token);
    } catch {
      try {
        const { data } = await api.post('/api/auth/register', { name: 'Demo Citizen', email: 'demo@civicpulse.in', password: 'demo1234', preferred_language: language });
        await setLanguage(data.user?.preferred_language || language);
        await login(data.user, data.token);
      } catch (e) {
        Alert.alert('Error', 'Demo login failed. Check backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!googleConfigured) {
      Alert.alert(t('googleNeedsSetup'), t('googleNeedsSetupCopy'));
      return;
    }
    if (!request) {
      Alert.alert(t('error'), t('googleUnavailable'));
      return;
    }
    await promptAsync();
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

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <LinearGradient colors={['#3B82F6','#8B5CF6']} style={styles.logoBox}>
          <Text style={styles.logoIcon}>🛡️</Text>
        </LinearGradient>
        <Text style={styles.brand}>CivicPulse</Text>
        <Text style={styles.tagline}>{t('welcomeTagline')}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[['12.4K',t('issuesRaised')],['78%',t('resolved')],['227',t('wardReps')]].map(([v,l]) => (
            <View key={l} style={styles.statItem}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLbl}>{l}</Text>
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
            <TouchableOpacity style={styles.btnOutline} onPress={handleDemo} disabled={loading}>
              <Text style={styles.btnOutlineTxt}>{loading ? 'Loading…' : `⚡  ${t('quickDemo')}`}</Text>
            </TouchableOpacity>
            <LanguagePicker />
            <Text style={styles.terms}>By continuing you agree to our Terms of Service</Text>
          </View>
        )}

        {mode === 'email' && (
          <View style={styles.form}>
            <TouchableOpacity onPress={() => setMode('landing')} style={styles.backRow}>
              <Text style={styles.backTxt}>← Back</Text>
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
              secureTextEntry value={form.password} onChangeText={t => setForm(p => ({ ...p, password: t }))} />

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
  container: { flexGrow: 1, padding: 20, paddingTop: 80, alignItems: 'center' },
  logoBox: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 },
  logoIcon: { fontSize: 32 },
  brand: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 8 },
  tagline: { fontSize: 14, color: colors.text2, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 32, width: '100%' },
  statItem: { flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.border },
  statVal: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLbl: { fontSize: 10, color: colors.text3, marginTop: 2 },
  btns: { width: '100%', gap: 10 },
  btnPrimary: { backgroundColor: colors.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnOutline: { backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
  btnOutlineTxt: { color: colors.green2, fontSize: 14, fontWeight: '600' },
  btnGoogle: { backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#D7DEE9' },
  btnGoogleTxt: { color: '#1F2937', fontSize: 14, fontWeight: '800' },
  terms: { textAlign: 'center', fontSize: 11, color: colors.text3, marginTop: 8 },
  form: { width: '100%', gap: 12 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backTxt: { color: colors.text3, fontSize: 16 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14 },
  linkTxt: { color: colors.accent2, textAlign: 'center', fontSize: 13, marginTop: 4, fontWeight: '700' },
  helpTxt: { color: colors.text2, fontSize: 13, lineHeight: 20 },
});
