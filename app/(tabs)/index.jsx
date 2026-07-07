import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useTaskContext } from '../../context/TaskContext';
import { filterTasks } from '../../utils/dateFilters';
import TaskCard from '../../components/TaskCard';
import SectionHeader from '../../components/SectionHeader';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const MODES = ['Daily', 'Weekly', 'Monthly'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function HomeScreen() {
  const { tasks, pets, toggleTaskDone, user } = useTaskContext();
  const [mode, setMode] = useState('Daily');
  const filtered = filterTasks(tasks, mode.toLowerCase());

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}, {user.name || 'Friend'} 🐾</Text>
          <Text style={styles.date}>{formatDate()}</Text>
        </View>

        <View style={styles.segment}>
          {MODES.map(m => (
            <TouchableOpacity key={m} style={[styles.segBtn, mode === m && styles.segActive]} onPress={() => setMode(m)}>
              <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader title="Tasks" count={filtered.length} />

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🐾</Text>
            <Text style={styles.emptyText}>No tasks — add one!</Text>
          </View>
        ) : (
          filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              pet={pets.find(p => p.id === task.petId)}
              onToggle={toggleTaskDone}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl },
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  date: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  segment: {
    flexDirection: 'row', marginHorizontal: SPACING.md, marginVertical: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 3,
  },
  segBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: RADIUS.sm },
  segActive: { backgroundColor: COLORS.primary },
  segText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  segTextActive: { color: COLORS.white },
  empty: { alignItems: 'center', marginTop: SPACING.xl * 2 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.sm },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});
