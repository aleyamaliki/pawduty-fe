function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getISOWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const toMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + toMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: localDateStr(monday),
    end: localDateStr(sunday),
  };
}

export function filterTasks(tasks, mode) {
  const today = new Date();
  const todayStr = localDateStr(today);

  if (mode === 'daily') {
    return tasks.filter(t => t.date === todayStr);
  }
  if (mode === 'weekly') {
    const { start, end } = getISOWeekBounds(today);
    return tasks.filter(t => t.date >= start && t.date <= end);
  }
  if (mode === 'monthly') {
    const month = todayStr.slice(0, 7); // "YYYY-MM"
    return tasks.filter(t => t.date.startsWith(month));
  }
  return tasks;
}
