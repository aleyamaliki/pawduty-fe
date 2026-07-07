import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { scanThermal, MlScanError } from '../../utils/mlApi';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const WARNING = '#E63946';

// Map a { tag, confidence } response from the ml-heat thermal-health service to
// what the result card shows and what an "Add as Task" follow-up prefills.
function describe(health) {
  const pct = Math.round(health.confidence * 100);
  if (health.tag === 'unhealthy') {
    return {
      healthy: false,
      title: 'Possible signs of illness',
      detail: `The thermal scan flagged an abnormal body-heat pattern (${pct}% confidence). A vet check-up is recommended.`,
      prefillTitle: 'Vet check-up',
      prefillCategory: 'other',
    };
  }
  return {
    healthy: true,
    title: 'Looks healthy',
    detail: `No abnormal body-heat pattern detected (${pct}% confidence). Keep up the routine care.`,
    prefillTitle: 'Routine wellness check',
    prefillCategory: 'other',
  };
}

export default function AIScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Both the camera and the library return the same { canceled, assets } shape.
  async function processPicked(picked) {
    if (!picked || picked.canceled) return;
    const uri = picked.assets?.[0]?.uri;
    if (!uri) return;
    setImageUri(uri);
    setResult(null);
    await runScan(uri);
  }

  async function handleCamera() {
    setError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Camera permission is needed to take a photo.');
        return;
      }
      const shot = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
      await processPicked(shot);
    } catch (e) {
      setError('Could not open the camera on this device.');
    }
  }

  async function handlePick() {
    setError(null);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      await processPicked(picked);
    } catch (e) {
      setError('Could not open the image library.');
    }
  }

  async function runScan(uri) {
    setScanning(true);
    setError(null);
    try {
      const health = await scanThermal(uri);
      setResult(describe(health));
    } catch (e) {
      const message =
        e instanceof MlScanError && typeof e.detail === 'string' && e.detail
          ? e.detail
          : e instanceof MlScanError && e.status === 0
          ? 'Could not reach the scan service. Check the connection and try again.'
          : 'Scan failed. Please try again.';
      setError(message);
    } finally {
      setScanning(false);
    }
  }

  function handleAddAsTask() {
    router.push({ pathname: '/(tabs)/add', params: { prefillTitle: result.prefillTitle, prefillCategory: result.prefillCategory } });
    reset();
  }

  function reset() {
    setImageUri(null);
    setResult(null);
    setError(null);
    setScanning(false);
  }

  const showPickers = !imageUri && !scanning;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Thermal Health Scan</Text>
        <Text style={styles.sub}>
          Take or upload a thermal image of your cat (INFERNO-colormapped, with the min/max °C
          badges) to check for abnormal body-heat patterns. A thermal camera is required for a
          live capture — a normal photo isn't a thermal frame.
        </Text>

        {imageUri && (
          <Image testID="scan-preview" source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        )}

        {showPickers && (
          <View style={styles.actions}>
            <TouchableOpacity testID="camera-button" style={styles.actionBtn} onPress={handleCamera} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={40} color={COLORS.primary} />
              <Text style={styles.actionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="pick-button" style={styles.actionBtn} onPress={handlePick} activeOpacity={0.8}>
              <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
              <Text style={styles.actionText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        )}

        {scanning && (
          <View style={styles.center}>
            <ActivityIndicator testID="scan-loading" size="large" color={COLORS.primary} />
            <Text style={styles.scanningText}>Analyzing…</Text>
          </View>
        )}

        {error && !scanning && (
          <View style={styles.errorBox}>
            <Text testID="scan-error" style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
              <Text style={styles.secondaryBtnText}>Try another image</Text>
            </TouchableOpacity>
          </View>
        )}

        {result && !scanning && (
          <View testID="scan-result" style={styles.resultCard}>
            <View style={[styles.statusPill, { backgroundColor: result.healthy ? COLORS.accent : WARNING }]}>
              <Text style={styles.statusPillText}>{result.healthy ? 'HEALTHY' : 'NEEDS ATTENTION'}</Text>
            </View>
            <Text style={styles.resultTitle}>{result.title}</Text>
            <Text style={styles.resultDetail}>{result.detail}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddAsTask}>
              <Text style={styles.addBtnText}>Add as Task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissBtn} onPress={reset}>
              <Text style={styles.dismissText}>Scan another</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Experimental, non-diagnostic aid (~76% accuracy on thermal images). Always consult a vet.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl * 2 },
  heading: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: SPACING.md },
  actionBtn: {
    flex: 1, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.card, gap: SPACING.sm,
  },
  actionText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: RADIUS.lg, backgroundColor: '#000', marginBottom: SPACING.md },
  center: { alignItems: 'center', marginTop: SPACING.lg, gap: SPACING.sm },
  scanningText: { fontSize: 14, color: COLORS.textSecondary },
  errorBox: { marginTop: SPACING.lg, alignItems: 'center', gap: SPACING.md },
  errorText: {
    color: '#fff', backgroundColor: WARNING, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md, textAlign: 'center', fontSize: 14,
  },
  resultCard: {
    marginTop: SPACING.lg, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  statusPill: { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  statusPillText: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  resultTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  resultDetail: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.lg, lineHeight: 20 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dismissBtn: { alignItems: 'center', padding: SPACING.sm },
  dismissText: { color: COLORS.textSecondary, fontSize: 14 },
  secondaryBtn: {
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg, alignItems: 'center',
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  disclaimer: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl, lineHeight: 16 },
});
