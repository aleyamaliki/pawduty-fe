import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import CategoryBadge from './CategoryBadge';
import PetAvatar from './PetAvatar';

export default function TaskCard({ task, pet, onToggle }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        testID="task-checkbox"
        onPress={() => onToggle(task.id)}
        style={styles.checkbox}
        accessibilityLabel="Toggle task done"
      >
        <Ionicons
          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={task.done ? COLORS.accent : COLORS.textSecondary}
        />
      </TouchableOpacity>
      <View style={styles.body}>
        <Text style={[styles.title, task.done && styles.done]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.meta}>
          <CategoryBadge category={task.category} />
          {pet && (
            <View style={styles.petRow}>
              <PetAvatar name={pet.name} avatarColor={pet.avatarColor} size={20} />
              <Text style={styles.petName}>{pet.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.footer}>
          {!!task.time && (
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.time}>{task.time}</Text>
            </View>
          )}
          {!!task.assignee?.initials && (
            <View style={styles.assignee}>
              <Text style={styles.assigneeText}>{task.assignee.initials}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md, marginVertical: SPACING.xs, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  checkbox: { marginRight: SPACING.sm, paddingTop: 2 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  done: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  petName: { fontSize: 12, color: COLORS.textSecondary },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  time: { fontSize: 12, color: COLORS.textSecondary },
  assignee: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  assigneeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
});
