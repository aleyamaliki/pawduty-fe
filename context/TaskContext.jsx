import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED_USER } from '../data/seed';
import { api } from '../utils/api';

const USER_KEY = '@pawduty_user';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [pets, setPets] = useState([]);
  const [user, setUser] = useState(SEED_USER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mirror `user` so updateUser can merge without reading a stale closure value.
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, p] = await Promise.all([api.listTasks(), api.listPets()]);
      setTasks(t);
      setPets(p);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        // ignore corrupted/unreadable stored user; keep SEED_USER default
      }
    })();
  }, []);

  async function addTask(input) {
    const { id, ...body } = input;
    const created = await api.createTask(body);
    setTasks(prev => [...prev, created]);
    return created;
  }

  async function editTask(id, fields) {
    const updated = await api.updateTask(id, fields);
    setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
    return updated;
  }

  async function toggleTaskDone(id) {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const next = !target.done;
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: next } : t)));
    try {
      const updated = await api.updateTask(id, { done: next });
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (e) {
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !next } : t)));
    }
  }

  async function deleteTask(id) {
    const snapshot = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await api.deleteTask(id);
    } catch (e) {
      setTasks(snapshot);
    }
  }

  async function updateUser(fields) {
    const next = { ...userRef.current, ...fields };
    userRef.current = next;
    setUser(next);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
  }

  return (
    <TaskContext.Provider value={{
      tasks, pets, user, loading, error, reload,
      addTask, editTask, toggleTaskDone, deleteTask, updateUser,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider');
  return ctx;
}
