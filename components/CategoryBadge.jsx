import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS } from '../constants/theme';

const CONFIG = {
  vaccination: { label: 'Vaccination', bg: '#FFE0CC', text: '#E65C00' },
  medicine:    { label: 'Medicine',    bg: '#D4F5EB', text: '#00875A' },
  grooming:    { label: 'Grooming',    bg: '#E8E0FF', text: '#5B21B6' },
  other:       { label: 'Other',       bg: '#F0F0F0', text: '#555555' },
};

export default function CategoryBadge({ category }) {
  const cfg = CONFIG[category] ?? CONFIG.other;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  label: { fontSize: 11, fontWeight: '600' },
});
