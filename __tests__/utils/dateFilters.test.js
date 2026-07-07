import { filterTasks } from '../../utils/dateFilters';

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function makeTask(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return { id: String(daysOffset), date: localDateStr(d) };
}

test('daily: returns only today', () => {
  const tasks = [makeTask(0), makeTask(1), makeTask(-1)];
  expect(filterTasks(tasks, 'daily')).toHaveLength(1);
  expect(filterTasks(tasks, 'daily')[0].id).toBe('0');
});

test('monthly: excludes tasks more than 31 days away', () => {
  const tasks = [makeTask(0), makeTask(35), makeTask(-35)];
  const result = filterTasks(tasks, 'monthly');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('0');
});

test('weekly: includes today', () => {
  const tasks = [makeTask(0)];
  expect(filterTasks(tasks, 'weekly')).toHaveLength(1);
});

test('weekly: excludes tasks 8 days from now', () => {
  // 8 days ahead is always outside the current ISO week (max span is Mon–Sun = 7 days)
  const tasks = [makeTask(8)];
  expect(filterTasks(tasks, 'weekly')).toHaveLength(0);
});
