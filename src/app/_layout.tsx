import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, LogBox } from 'react-native';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthContext';
import * as Notifications from 'expo-notifications';

// Silenciar warnings informativos esperados de Expo Go sobre notificaciones remotas y fallback de reportes
LogBox.ignoreLogs([
  '[expo-notifications] Push notifications (remote notifications) are unavailable in Expo Go',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'ExpoNotificationChannelManager.setNotificationChannelAsync',
  '[notificationService]',
  '[bffService]',
  'Failed to connect to',
]);

function RootNavigationLayout() {
  const router = useRouter();

  useEffect(() => {
    // Escucha cuando el usuario presiona una notificación en la barra de Android/iOS
    let subscription: Notifications.Subscription | null = null;
    try {
      if (Notifications?.addNotificationResponseReceivedListener) {
        subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          console.log('📬 [RootLayout] Notificación pulsada por el usuario:', data);

          if (data?.screen) {
            try {
              router.push(data.screen as any);
            } catch (err) {
              console.warn('[RootLayout] No se pudo redirigir a la pantalla:', data.screen);
            }
          }
        });
      }
    } catch {
      // Ignorar en entornos donde no esté disponible
    }

    return () => {
      subscription?.remove();
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bgBase },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="unauthorized" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
        <Stack.Screen name="(receptionist)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigationLayout />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
});
