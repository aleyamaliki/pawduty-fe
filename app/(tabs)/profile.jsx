import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Switch, StyleSheet, SafeAreaView,
} from 'react-native';
import { useTaskContext } from '../../context/TaskContext';
import PetAvatar from '../../components/PetAvatar';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const APP_VERSION = '1.0.0';

export default function ProfileScreen() {
  const { user, pets, tasks, updateUser } = useTaskContext();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name ?? '');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const totalTasks = tasks.length;
  const doneThisMonth = tasks.filter(t => t.done && t.date.startsWith(thisMonth)).length;

  function saveUserName() {
    updateUser({ name: nameInput.trim() || user.name });
    setEditingName(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <View style={[styles.bigAvatar, { backgroundColor: user.avatarColor ?? COLORS.primary }]}>
            <Text style={styles.bigInitial}>{(user.name ?? 'A').charAt(0).toUpperCase()}</Text>
          </View>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                onSubmitEditing={saveUserName}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.saveNameBtn} onPress={saveUserName}>
                <Text style={styles.saveNameText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setNameInput(user.name ?? ''); setEditingName(true); }}>
              <Text style={styles.userName}>{user.name ?? 'Alex'}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.userSub}>Tap name to edit</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Pets</Text>
          {pets.map(pet => (
            <View key={pet.id} style={styles.petRow}>
              <PetAvatar name={pet.name} avatarColor={pet.avatarColor} size={44} />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petBreed}>{pet.breed}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalTasks}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: COLORS.accent }]}>{doneThisMonth}</Text>
              <Text style={styles.statLabel}>Done This Month</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: COLORS.primary }} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark mode (visual only)</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: COLORS.primary }} />
          </View>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingLabel}>App version</Text>
            <Text style={styles.settingValue}>{APP_VERSION}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl * 2 },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.xl },
  bigAvatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  bigInitial: { fontSize: 40, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  nameInput: {
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.md,
    padding: SPACING.sm, fontSize: 18, fontWeight: '700', minWidth: 140,
    textAlign: 'center', color: COLORS.textPrimary,
  },
  saveNameBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.sm },
  saveNameText: { color: '#fff', fontWeight: '700' },
  userSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  section: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.md, marginBottom: SPACING.md, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  petInfo: { flex: 1 },
  petName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  petBreed: { fontSize: 12, color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', gap: SPACING.md },
  statBox: { flex: 1, alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.background, borderRadius: RADIUS.md },
  statValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  settingLabel: { fontSize: 15, color: COLORS.textPrimary },
  settingValue: { fontSize: 14, color: COLORS.textSecondary },
});
