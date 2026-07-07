import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Dimensions,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { PieChart } from 'react-native-chart-kit';
import { useTaskContext } from '../../context/TaskContext';
import { filterTasks } from '../../utils/dateFilters';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const MODES = ['Daily', 'Weekly', 'Monthly'];
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProgressScreen() {
  const { tasks } = useTaskContext();
  const [mode, setMode] = useState('Monthly');
  const [selectedDay, setSelectedDay] = useState(null);

  const filtered = filterTasks(tasks, mode.toLowerCase());
  const done = filtered.filter(t => t.done).length;
  const pending = filtered.length - done;

  const markedDates = {};
  tasks.forEach(t => {
    if (!markedDates[t.date]) markedDates[t.date] = { dots: [] };
    markedDates[t.date].dots.push({ key: t.id, color: t.done ? COLORS.accent : COLORS.primary });
  });
  if (selectedDay) {
    markedDates[selectedDay] = { ...(markedDates[selectedDay] ?? {}), selected: true, selectedColor: COLORS.primary };
  }

  const dayTasks = selectedDay ? tasks.filter(t => t.date === selectedDay) : [];

  const pieData = [
    { name: 'Done', population: done || 0, color: COLORS.accent, legendFontColor: COLORS.textPrimary, legendFontSize: 13 },
    { name: 'Pending', population: pending || 0, color: COLORS.primary, legendFontColor: COLORS.textPrimary, legendFontSize: 13 },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Progress</Text>

        <View style={styles.segment}>
          {MODES.map(m => (
            <TouchableOpacity key={m} style={[styles.segBtn, mode === m && styles.segActive]} onPress={() => setMode(m)}>
              <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Calendar
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={day => setSelectedDay(day.dateString === selectedDay ? null : day.dateString)}
            theme={{
              selectedDayBackgroundColor: COLORS.primary,
              todayTextColor: COLORS.primary,
              dotColor: COLORS.primary,
              arrowColor: COLORS.primary,
            }}
          />
        </View>

        {selectedDay && dayTasks.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tasks on {selectedDay}</Text>
            {dayTasks.map(t => (
              <View key={t.id} style={styles.dayTask}>
                <View style={[styles.dot, { backgroundColor: t.done ? COLORS.accent : COLORS.primary }]} />
                <Text style={[styles.dayTaskTitle, t.done && styles.strikethrough]}>{t.title}</Text>
              </View>
            ))}
          </View>
        )}

        {filtered.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Completion — {mode}</Text>
            <PieChart
              data={pieData}
              width={SCREEN_WIDTH - SPACING.md * 4}
              height={180}
              chartConfig={{ color: (opacity = 1) => `rgba(45,45,45,${opacity})`, backgroundGradientFrom: COLORS.card, backgroundGradientTo: COLORS.card }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          </View>
        )}

        <View style={styles.statsRow}>
          {[{ label: 'Total', value: filtered.length }, { label: 'Done', value: done }, { label: 'Pending', value: pending }].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl * 2 },
  heading: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, margin: SPACING.md },
  segment: {
    flexDirection: 'row', marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 3,
  },
  segBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: RADIUS.sm },
  segActive: { backgroundColor: COLORS.primary },
  segText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  segTextActive: { color: COLORS.white },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    margin: SPACING.md, marginTop: 0, padding: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
  dayTask: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingHorizontal: SPACING.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dayTaskTitle: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  strikethrough: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', marginHorizontal: SPACING.md, gap: SPACING.sm },
  statBox: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
