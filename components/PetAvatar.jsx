import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PetAvatar({ name = '', avatarColor = '#FFD166', size = 36 }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '700' },
});
