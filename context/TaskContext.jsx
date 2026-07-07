import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED_PETS, SEED_TASKS, SEED_USER } from '../data/seed';

const KEYS = {
  tasks: '@pawduty_tasks',
  pets: '@pawduty_pets',
  user: '@pawduty_user',
};

const TaskContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { ...state, ...action.payload, loaded: true };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'TOGGLE_DONE':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, done: !t.done } : t
        ),
      };
    case 'SYNC_TASKS':
      return { ...state, tasks: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { tasks: [], pets: [], user: {}, loaded: false });

  useEffect(() => {
    (async () => {
      const [rawTasks, rawPets, rawUser] = await Promise.all([
        AsyncStorage.getItem(KEYS.tasks),
        AsyncStorage.getItem(KEYS.pets),
        AsyncStorage.getItem(KEYS.user),
      ]);
      if (rawTasks && rawPets && rawUser) {
        dispatch({
          type: 'LOAD',
          payload: { tasks: JSON.parse(rawTasks), pets: JSON.parse(rawPets), user: JSON.parse(rawUser) },
        });
      } else {
        await Promise.all([
          AsyncStorage.setItem(KEYS.tasks, JSON.stringify(SEED_TASKS)),
          AsyncStorage.setItem(KEYS.pets, JSON.stringify(SEED_PETS)),
          AsyncStorage.setItem(KEYS.user, JSON.stringify(SEED_USER)),
        ]);
        dispatch({ type: 'LOAD', payload: { tasks: SEED_TASKS, pets: SEED_PETS, user: SEED_USER } });
      }
    })();
  }, []);

  async function addTask(task) {
    const updated = [...state.tasks, task];
    dispatch({ type: 'SYNC_TASKS', payload: updated });
    await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(updated));
  }

  async function toggleTaskDone(id) {
    const updated = state.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    dispatch({ type: 'SYNC_TASKS', payload: updated });
    await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(updated));
  }

  async function updateUser(fields) {
    dispatch({ type: 'UPDATE_USER', payload: fields });
    const updated = { ...state.user, ...fields };
    await AsyncStorage.setItem(KEYS.user, JSON.stringify(updated));
  }

  return (
    <TaskContext.Provider value={{ tasks: state.tasks, pets: state.pets, user: state.user, addTask, toggleTaskDone, updateUser }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider');
  return ctx;
}
