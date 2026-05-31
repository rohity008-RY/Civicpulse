import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { colors } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuthStore();
  const [mode, setMode] = useState('landing');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleAuth = async () => {
    if (!form.email || !form.password) { Alert.alert('Error', 'Email and password required'); return; }
    if (isRegister && !form.name) { Alert.alert('Error', 'Name required'); return; }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const { data } = await api.post(endpoint, form);
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
      await login(data.user, data.token);
    } catch {
      try {
        const { data } = await api.post('/api/auth/register', { name: 'Demo Citizen', email: 'demo@civicpulse.in', password: 'demo1234' });
        await login(data.user, data.token);
      } catch (e) {
        Alert.alert('Error', 'Demo login failed. Check backend connection.');
      }
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
        <Text style={styles.tagline}>Raise issues. Track resolutions.{'\n'}Hold your representative accountable.</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[['12.4K','Issues Raised'],['78%','Resolved'],['227','Ward Reps']].map(([v,l]) => (
            <View key={l} style={styles.statItem}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLbl}>{l}</Text>
            </View>
          ))}
        </View>

        {mode === 'landing' && (
          <View style={styles.btns}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setMode('email')}>
              <Text style={styles.btnPrimaryTxt}>✉  Continue with Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={handleDemo} disabled={loading}>
              <Text style={styles.btnOutlineTxt}>{loading ? 'Loading…' : '⚡  Quick Demo — Explore App'}</Text>
            </TouchableOpacity>
            <Text style={styles.terms}>By continuing you agree to our Terms of Service</Text>
          </View>
        )}

        {mode === 'email' && (
          <View style={styles.form}>
            <TouchableOpacity onPress={() => setMode('landing')} style={styles.backRow}>
              <Text style={styles.backTxt}>← Back</Text>
              <Text style={styles.formTitle}>{isRegister ? 'Create Account' : 'Sign In'}</Text>
            </TouchableOpacity>

            {isRegister && (
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={colors.text3}
                value={form.name} onChangeText={t => setForm(p => ({ ...p, name: t }))} />
            )}
            <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={colors.text3}
              keyboardType="email-address" autoCapitalize="none"
              value={form.email} onChangeText={t => setForm(p => ({ ...p, email: t }))} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.text3}
              secureTextEntry value={form.password} onChangeText={t => setForm(p => ({ ...p, password: t }))} />

            <TouchableOpacity style={[styles.btnPrimary, { opacity: loading ? 0.7 : 1 }]} onPress={handleAuth} disabled={loading}>
              <Text style={styles.btnPrimaryTxt}>{loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
              <Text style={{ color: colors.accent2, textAlign: 'center', fontSize: 13, marginTop: 12 }}>
                {isRegister ? 'Already have an account? Sign in' : "New here? Create account"}
              </Text>
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
  terms: { textAlign: 'center', fontSize: 11, color: colors.text3, marginTop: 8 },
  form: { width: '100%', gap: 12 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backTxt: { color: colors.text3, fontSize: 16 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14 },
});
