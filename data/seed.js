function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export const SEED_PETS = [
  { id: 'p1', name: 'Mochi', species: 'cat', breed: 'Scottish Fold', avatarColor: '#FFD166' },
  { id: 'p2', name: 'Buddy', species: 'dog', breed: 'Golden Retriever', avatarColor: '#FF8C42' },
];

export const SEED_TASKS = [
  {
    id: 't1', title: 'Give Mochi her flea medicine', category: 'medicine',
    petId: 'p1', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(0), time: '08:00', repeat: 'daily', note: '', done: false,
  },
  {
    id: 't2', title: "Buddy's rabies booster shot", category: 'vaccination',
    petId: 'p2', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(3), time: '', repeat: 'once', note: 'Check with Dr. Smith', done: false,
  },
  {
    id: 't3', title: "Trim Mochi's nails", category: 'grooming',
    petId: 'p1', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(5), time: '14:00', repeat: 'weekly', note: '', done: false,
  },
  {
    id: 't4', title: 'Monthly heartworm pill for Buddy', category: 'medicine',
    petId: 'p2', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(10), time: '', repeat: 'monthly', note: '', done: false,
  },
  {
    id: 't5', title: 'Vet checkup for Buddy', category: 'other',
    petId: 'p2', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(15), time: '10:00', repeat: 'once', note: 'Annual checkup', done: false,
  },
  {
    id: 't6', title: "Mochi's deworming tablet", category: 'medicine',
    petId: 'p1', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(20), time: '', repeat: 'monthly', note: '', done: false,
  },
];

export const SEED_USER = {
  name: 'Alex',
  avatarColor: '#06D6A0',
  petIds: ['p1', 'p2'],
};
