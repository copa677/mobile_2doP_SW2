import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolución dinámica del Host:
 * 1. Lee de la variable de entorno EXPO_PUBLIC_SERVER_HOST en .env si está definida.
 * 2. Si se corre en Expo Go en un teléfono físico, extrae la IP del servidor Metro.
 * 3. En navegador web, utiliza el hostname del browser o 'localhost'.
 * 4. Fallback a la IP de red local '192.168.1.12'.
 */
const resolveHost = (): string => {
  const envHost = process.env.EXPO_PUBLIC_SERVER_HOST?.trim();
  if (envHost) {
    // Si viene con protocolo http:// o https://, limpiarlo para el host base
    return envHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
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

const RAW_HOST = resolveHost();

// Detectar si el host configurado es un dominio público con SSL (ej: apexfitness.bratox.me)
const isPublicDomain =
  RAW_HOST.includes('bratox.me') ||
  RAW_HOST.includes('.me') ||
  RAW_HOST.includes('.com') ||
  RAW_HOST.includes('.net') ||
  (RAW_HOST.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(RAW_HOST));

const PROTOCOL = isPublicDomain ? 'https' : 'http';
const HOST = RAW_HOST;

export const API_ENDPOINTS = {
  HOST,
  IS_PUBLIC_DOMAIN: isPublicDomain,
  API_GATEWAY_URL:
    process.env.EXPO_PUBLIC_API_GATEWAY_URL ||
    (isPublicDomain ? `${PROTOCOL}://${HOST}` : `http://${HOST}:3000`),
  MS_AUTH_URL:
    process.env.EXPO_PUBLIC_MS_AUTH_URL ||
    (isPublicDomain ? `${PROTOCOL}://${HOST}` : `http://${HOST}:4000`),
  MS_GIMNASIO_GRAPHQL:
    process.env.EXPO_PUBLIC_MS_GIMNASIO_GRAPHQL ||
    (isPublicDomain ? `${PROTOCOL}://${HOST}/graphql/gimnasio` : `http://${HOST}:8082/graphql`),
  MS_ENTRENAMIENTO_GRAPHQL:
    process.env.EXPO_PUBLIC_MS_ENTRENAMIENTO_GRAPHQL ||
    (isPublicDomain ? `${PROTOCOL}://${HOST}/graphql/entrenamiento` : `http://${HOST}:8083/graphql`),
  MS_INVENTARIO_URL:
    process.env.EXPO_PUBLIC_MS_INVENTARIO_URL ||
    (isPublicDomain ? `${PROTOCOL}://${HOST}/graphql/inventario` : `http://${HOST}:8084`),
  BFF_URL:
    process.env.EXPO_PUBLIC_BFF_URL ||
    (isPublicDomain ? `${PROTOCOL}://${HOST}/api` : `http://${HOST}:8000/api/v1`),
  MCP_URL:
    process.env.EXPO_PUBLIC_MS_MCP_URL ||
    (isPublicDomain ? `${PROTOCOL}://${HOST}/api/reportes` : `http://${HOST}:8090/api/v1`),
  MCP_TOKEN: process.env.EXPO_PUBLIC_MS_MCP_TOKEN || 'mcp_gateway_1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c',
  NOTIFICATIONS_HEALTH:
    process.env.EXPO_PUBLIC_NOTIFICATIONS_HEALTH ||
    `${isPublicDomain ? `${PROTOCOL}://${HOST}` : `http://${HOST}:3000`}/api/notifications/health`,
  NOTIFICATIONS_SEND:
    process.env.EXPO_PUBLIC_NOTIFICATIONS_SEND ||
    `${isPublicDomain ? `${PROTOCOL}://${HOST}` : `http://${HOST}:3000`}/api/notifications/send`,
  NOTIFICATIONS_BROADCAST:
    process.env.EXPO_PUBLIC_NOTIFICATIONS_BROADCAST ||
    `${isPublicDomain ? `${PROTOCOL}://${HOST}` : `http://${HOST}:3000`}/api/notifications/broadcast`,
};
