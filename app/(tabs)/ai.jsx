import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const cameraRef = useRef(null);
  const router = useRouter();

  if (!permission) {
    return <View style={styles.center}><Text>Checking camera…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is needed to scan.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleScan() {
    if (scanning || result) return;
    setScanning(true);
    setError(null);
    try {
      const photo = await cameraRef.current?.takePictureAsync?.({ quality: 0.7 });
      if (!photo?.uri) throw new MlScanError(0, 'Could not capture an image.');
      const health = await scanThermal(photo.uri);
      setResult(describe(health));
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
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
    setResult(null);
    slideAnim.setValue(300);
  }

  function handleDismiss() {
    setResult(null);
    slideAnim.setValue(300);
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <View style={styles.overlay}>
        <View style={styles.topLabel}>
          <Text style={styles.topLabelText}>Point at your pet to scan its thermal health</Text>
        </View>

        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            {[styles.tl, styles.tr, styles.bl, styles.br].map((pos, i) => (
              <View key={i} style={[styles.corner, pos]} />
            ))}
          </View>
        </View>

        {!result && (
          <View style={styles.bottomArea}>
            {error && (
              <Text testID="scan-error" style={styles.errorText}>{error}</Text>
            )}
            {scanning ? (
              <ActivityIndicator testID="scan-loading" size="large" color={COLORS.white} />
            ) : (
              <TouchableOpacity testID="scan-button" style={styles.scanBtn} onPress={handleScan} activeOpacity={0.8}>
                <View style={styles.scanBtnInner} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {result && (
        <Animated.View testID="scan-result" style={[styles.resultCard, { transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.statusPill, { backgroundColor: result.healthy ? COLORS.accent : WARNING }]}>
            <Text style={styles.statusPillText}>{result.healthy ? 'HEALTHY' : 'NEEDS ATTENTION'}</Text>
          </View>
          <Text style={styles.resultDetected}>{result.title}</Text>
          <Text style={styles.resultSuggestion}>{result.detail}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddAsTask}>
            <Text style={styles.addBtnText}>Add as Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, padding: SPACING.xl },
  permText: { fontSize: 16, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.md },
  permBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, paddingHorizontal: SPACING.xl },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  overlay: { flex: 1 },
  topLabel: { backgroundColor: 'rgba(0,0,0,0.5)', padding: SPACING.md, alignItems: 'center', marginTop: 60 },
  topLabelText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  frameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#fff', borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  bottomArea: { alignItems: 'center', paddingBottom: SPACING.xl * 2 },
  errorText: { color: '#fff', backgroundColor: 'rgba(230,57,70,0.85)', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, textAlign: 'center', fontSize: 14, maxWidth: 320 },
  scanBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  scanBtnInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff' },
  resultCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg * 2, borderTopRightRadius: RADIUS.lg * 2,
    padding: SPACING.xl, paddingBottom: SPACING.xl * 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  statusPill: { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  statusPillText: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  resultDetected: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  resultSuggestion: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dismissBtn: { alignItems: 'center', padding: SPACING.sm },
  dismissText: { color: COLORS.textSecondary, fontSize: 14 },
});
