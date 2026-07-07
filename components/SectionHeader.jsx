import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export default function SectionHeader({ title, count }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {count !== undefined && (
        <Text style={styles.count}>{count}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.sm, marginHorizontal: SPACING.md },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  count: { fontSize: 13, color: COLORS.textSecondary, backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
});
