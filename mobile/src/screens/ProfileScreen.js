import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image, Platform
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import api, { postMultipart } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { colors } from '../utils/theme';

const createUploadFormData = () => (
  Platform.OS === 'web' && typeof window !== 'undefined' ? new window.FormData() : new FormData()
);

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [wardSearch, setWardSearch] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(user?.home_ward_id || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setSelectedWardId(user?.home_ward_id || '');
    setAvatarPreview(user?.avatar_url || null);
  }, [user?.id, user?.name, user?.phone, user?.home_ward_id, user?.avatar_url]);

  const { data, isLoading: locationsLoading, isError: locationsError } = useQuery({
    queryKey: ['locations-profile'],
    queryFn: () => api.get('/api/reps/locations', { params: { limit: 1000 } }).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const wards = data?.wards || [];
  const selectedWard = wards.find((ward) => ward.id === selectedWardId) || user?.home_ward;
  const filteredWards = useMemo(() => {
    const q = wardSearch.trim().toLowerCase();
    if (!q) return wards.slice(0, 12);
    return wards.filter((ward) => [
      ward.name, ward.ward_number, ward.city, ward.state_name,
    ].filter(Boolean).join(' ').toLowerCase().includes(q)).slice(0, 20);
  }, [wardSearch, wards]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: response } = await api.put('/api/auth/me', {
        name,
        phone,
        home_ward_id: selectedWardId || null,
      });
      await updateUser(response.user);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Profile update failed');
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to update your profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.55,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setAvatarPreview(asset.uri);
      setUploadingAvatar(true);

      const ext = asset.uri?.split('.').pop()?.split('?')[0] || 'jpg';
      const type = asset.mimeType || (ext.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg');
      const fd = createUploadFormData();
      if (Platform.OS === 'web') {
        const webFile = asset.file || await fetch(asset.uri).then((response) => response.blob());
        fd.append('avatar', webFile, asset.file?.name || `avatar.${ext}`);
      } else {
        fd.append('avatar', {
          uri: asset.uri,
          name: `avatar.${ext}`,
          type,
        });
      }

      const { data: response } = await postMultipart('/api/auth/me/avatar', fd);
      await updateUser(response.user);
      setAvatarPreview(response.user.avatar_url);
      Alert.alert('Updated', 'Profile image updated.');
    } catch (err) {
      setAvatarPreview(user?.avatar_url || null);
      Alert.alert('Image Error', err.response?.data?.error || 'Could not update profile image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const { data: response } = await api.put('/api/auth/me', { avatar_url: null });
      await updateUser(response.user);
      setAvatarPreview(null);
    } catch (err) {
      Alert.alert('Image Error', err.response?.data?.error || 'Could not remove profile image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const doLogout = () => {
    Alert.alert('Sign out', 'Do you want to sign out of CivicPulse?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatar} onPress={pickAvatar} disabled={uploadingAvatar}>
          {avatarPreview ? (
            <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'C'}</Text>
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{user?.name || 'Citizen'}</Text>
          <Text style={styles.subtitle}>{user?.email || user?.phone || 'CivicPulse account'}</Text>
          <View style={styles.avatarActions}>
            <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar}>
              <Text style={styles.avatarActionText}>{uploadingAvatar ? 'Uploading…' : 'Change photo'}</Text>
            </TouchableOpacity>
            {!!avatarPreview && (
              <TouchableOpacity onPress={removeAvatar} disabled={uploadingAvatar}>
                <Text style={[styles.avatarActionText, { color: colors.red2 }]}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.text3} />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Optional phone number" placeholderTextColor={colors.text3} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Home ward</Text>
        <Text style={styles.helper}>Set your ward so your feed and reports can be mapped to the right corporator and MLA.</Text>
        {!!selectedWard && (
          <View style={styles.selectedWard}>
            <Text style={styles.selectedTitle}>{selectedWard.name}</Text>
            <Text style={styles.selectedMeta}>{[selectedWard.ward_number, selectedWard.city, selectedWard.state_name].filter(Boolean).join(' · ')}</Text>
          </View>
        )}
        <TextInput
          style={styles.input}
          value={wardSearch}
          onChangeText={setWardSearch}
          placeholder="Search city, ward number, ward name"
          placeholderTextColor={colors.text3}
        />
        <View style={styles.wardList}>
          {locationsLoading && <Text style={styles.helper}>Loading wards…</Text>}
          {!locationsLoading && locationsError && <Text style={styles.helper}>Could not load wards. Please try again later.</Text>}
          {!locationsLoading && !locationsError && filteredWards.map((ward) => (
            <TouchableOpacity
              key={ward.id}
              style={[styles.wardChip, selectedWardId === ward.id && styles.wardChipActive]}
              onPress={() => setSelectedWardId(ward.id)}
            >
              <Text style={[styles.wardChipTitle, selectedWardId === ward.id && { color: '#fff' }]}>{ward.name}</Text>
              <Text style={[styles.wardChipMeta, selectedWardId === ward.id && { color: 'rgba(255,255,255,0.82)' }]}>
                {[ward.ward_number, ward.city, ward.state_name].filter(Boolean).join(' · ')}
              </Text>
            </TouchableOpacity>
          ))}
          {!locationsLoading && !locationsError && !filteredWards.length && <Text style={styles.helper}>No wards found. Admin can import more state-city-ward data from web admin.</Text>}
        </View>
      </View>

      <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.7 }]} onPress={saveProfile} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save profile'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={doLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingTop: 56, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.fire, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  avatarActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  avatarActionText: { color: colors.accent2, fontSize: 12, fontWeight: '800' },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.text3, fontSize: 12, marginTop: 3 },
  card: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 8 },
  helper: { color: colors.text3, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  label: { color: colors.text3, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, color: colors.text, fontSize: 14, marginBottom: 10 },
  selectedWard: { borderRadius: 12, padding: 12, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.28)', marginBottom: 10 },
  selectedTitle: { color: colors.green2, fontSize: 13, fontWeight: '900' },
  selectedMeta: { color: colors.text2, fontSize: 11, marginTop: 2 },
  wardList: { gap: 8 },
  wardChip: { padding: 10, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  wardChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  wardChipTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  wardChipMeta: { color: colors.text3, fontSize: 10, marginTop: 2 },
  saveButton: { backgroundColor: colors.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  logoutButton: { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: 14, padding: 15, alignItems: 'center' },
  logoutText: { color: colors.red2, fontSize: 14, fontWeight: '800' },
});
