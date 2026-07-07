import { SEED_PETS, SEED_TASKS, SEED_USER } from '../../data/seed';

test('seed has 2 pets', () => {
  expect(SEED_PETS).toHaveLength(2);
});

test('seed has 6 tasks', () => {
  expect(SEED_TASKS).toHaveLength(6);
});

test('all tasks have required fields', () => {
  SEED_TASKS.forEach(task => {
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('category');
    expect(task).toHaveProperty('petId');
    expect(task).toHaveProperty('date');
    expect(task).toHaveProperty('done', false);
  });
});

test('seed user has correct structure', () => {
  expect(SEED_USER).toHaveProperty('name', 'Alex');
  expect(SEED_USER.petIds).toHaveLength(2);
});
