import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTaskContext } from '../../context/TaskContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const CATEGORIES = ['vaccination', 'medicine', 'grooming', 'other'];
const REPEATS = ['once', 'daily', 'weekly', 'monthly'];

function ChipPicker({ label, options, value, onChange }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, value === opt && styles.chipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function parseDate(str) {
  const d = str ? new Date(str + 'T00:00:00') : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function AddScreen() {
  const { pets, addTask, editTask, tasks } = useTaskContext();
  const router = useRouter();
  const params = useLocalSearchParams();

  const editing = !!params.editId;
  const existing = editing ? tasks.find(t => t.id === params.editId) : null;

  const [title, setTitle] = useState(existing?.title ?? params.prefillTitle ?? '');
  const [category, setCategory] = useState(existing?.category ?? params.prefillCategory ?? 'medicine');
  const [petId, setPetId] = useState(existing?.petId ?? pets[0]?.id ?? '');
  const [assignee, setAssignee] = useState(existing?.assignee?.name ?? '');
  const [date, setDate] = useState(parseDate(existing?.date));
  const [showDate, setShowDate] = useState(false);
  const [time, setTime] = useState(existing?.time ?? '');
  const [repeat, setRepeat] = useState(existing?.repeat ?? 'once');
  const [note, setNote] = useState(existing?.note ?? '');
  const [errors, setErrors] = useState({});
  // "hydrated" is true when the edit form has been populated. In create mode
  // there's nothing to hydrate. In edit mode the provider may still be loading
  // tasks at mount (useState initializers ran with existing===undefined), so we
  // hydrate from `existing` once it becomes available.
  const [hydrated, setHydrated] = useState(editing ? !!existing : true);

  useEffect(() => {
    if (editing && existing && !hydrated) {
      setTitle(existing.title);
      setCategory(existing.category);
      setPetId(existing.petId);
      setAssignee(existing.assignee?.name ?? '');
      setDate(parseDate(existing.date));
      setTime(existing.time ?? '');
      setRepeat(existing.repeat ?? 'once');
      setNote(existing.note ?? '');
      setHydrated(true);
    }
  }, [editing, existing, hydrated]);

  // Default the pet selection once pets load (create mode / none chosen yet).
  useEffect(() => {
    if (!petId && pets.length) setPetId(pets[0].id);
  }, [pets, petId]);

  function validate() {
    const e = {};
    if (!title.trim()) e.title = 'Task name is required';
    if (!petId) e.petId = 'Please select a pet';
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const dateStr = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const fields = {
      title: title.trim(),
      category,
      petId,
      assignee: { name: assignee.trim() },
      date: dateStr,
      time,
      repeat,
      note: note.trim(),
    };
    try {
      if (editing) {
        await editTask(params.editId, fields);
      } else {
        await addTask({ ...fields, done: false });
      }
      router.replace('/(tabs)/');
    } catch (err) {
      Alert.alert('Save failed', err?.detail || 'Could not reach the server. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>{editing ? 'Edit Task' : 'Add Task'}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Task name *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="e.g. Give Mochi flea medicine"
            placeholderTextColor={COLORS.textSecondary}
            value={title}
            onChangeText={t => { setTitle(t); setErrors(er => ({ ...er, title: undefined })); }}
          />
          {errors.title && <Text style={styles.error}>{errors.title}</Text>}
        </View>

        <ChipPicker label="Category *" options={CATEGORIES} value={category} onChange={setCategory} />

        <View style={styles.field}>
          <Text style={styles.label}>Pet *</Text>
          <View style={styles.chipRow}>
            {pets.map(pet => (
              <TouchableOpacity
                key={pet.id}
                style={[styles.chip, petId === pet.id && styles.chipActive]}
                onPress={() => { setPetId(pet.id); setErrors(er => ({ ...er, petId: undefined })); }}
              >
                <Text style={[styles.chipText, petId === pet.id && styles.chipTextActive]}>{pet.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.petId && <Text style={styles.error}>{errors.petId}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Assignee name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex"
            placeholderTextColor={COLORS.textSecondary}
            value={assignee}
            onChangeText={setAssignee}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDate(true)}>
            <Text style={{ fontSize: 15, color: COLORS.textPrimary }}>{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDate && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, d) => { setShowDate(false); if (d) setDate(d); }}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Time (optional, HH:MM)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 08:30"
            placeholderTextColor={COLORS.textSecondary}
            value={time}
            onChangeText={setTime}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <ChipPicker label="Repeat" options={REPEATS} value={repeat} onChange={setRepeat} />

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Any additional notes..."
            placeholderTextColor={COLORS.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{editing ? 'Save Changes' : 'Save Task'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl * 2 },
  heading: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  field: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.sm + 4, fontSize: 15, color: COLORS.textPrimary,
  },
  inputError: { borderColor: '#E53935' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  error: { fontSize: 12, color: '#E53935', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
