import { Stack } from 'expo-router';
import { TaskProvider } from '../context/TaskContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <TaskProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </TaskProvider>
  );
}
