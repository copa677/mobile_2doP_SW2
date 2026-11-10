import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolución dinámica del Host:
 * 1. Lee de la variable de entorno EXPO_PUBLIC_SERVER_HOST en .env si está definida.
 * 2. Si se corre en Expo Go en un teléfono físico, extrae la IP del servidor Metro.
 * 3. En navegador web, utiliza 'localhost'.
 * 4. Fallback a la IP de red local '192.168.1.12'.
 */
const resolveHost = (): string => {
  if (process.env.EXPO_PUBLIC_SERVER_HOST) {
    return process.env.EXPO_PUBLIC_SERVER_HOST;
  }

  if (Platform.OS === 'web') {
    return 'localhost';
  }

  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const detectedIp = hostUri.split(':')[0];
    if (detectedIp && detectedIp !== 'localhost' && detectedIp !== '127.0.0.1') {
      return detectedIp;
    }
  }

  return '192.168.1.12';
};

const HOST = resolveHost();

export const API_ENDPOINTS = {
  HOST,
  API_GATEWAY_URL: process.env.EXPO_PUBLIC_API_GATEWAY_URL || `http://${HOST}:3000`,
  MS_AUTH_URL: process.env.EXPO_PUBLIC_MS_AUTH_URL || `http://${HOST}:4000`,
  MS_GIMNASIO_GRAPHQL: process.env.EXPO_PUBLIC_MS_GIMNASIO_GRAPHQL || `http://${HOST}:8082/graphql`,
  MS_ENTRENAMIENTO_GRAPHQL: process.env.EXPO_PUBLIC_MS_ENTRENAMIENTO_GRAPHQL || `http://${HOST}:8083/graphql`,
  MS_INVENTARIO_URL: process.env.EXPO_PUBLIC_MS_INVENTARIO_URL || `http://${HOST}:8084`,
  BFF_URL: process.env.EXPO_PUBLIC_BFF_URL || `http://${HOST}:8000/api/v1`,
};
