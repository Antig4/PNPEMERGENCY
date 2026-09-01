/**
 * Patrol sub-route layout.
 *
 * NOTE: PatrolAuthProvider is now mounted at the root _layout.tsx level,
 * so it does NOT need to be wrapped here again. This layout simply defines
 * the screen stack for the /patrol/* routes.
 */
import React from 'react';
import { Stack } from 'expo-router';

export default function PatrolLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F172A' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="incident/[id]" />
      <Stack.Screen name="map" />
      <Stack.Screen name="resolve/[id]" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
