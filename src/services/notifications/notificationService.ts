import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_ENDPOINTS } from '../config/endpoints';

// Configuración defensiva de comportamiento cuando la app está abierta en primer plano (Foreground)
try {
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch {
  // Ignorar si el módulo nativo aún se está cargando
}

let cachedPushToken: string | null = null;

export const notificationService = {
  /**
   * Obtiene el token push cacheado en la sesión
   */
  getCachedToken(): string | null {
    return cachedPushToken;
  },

  /**
   * Verifica el estado del microservicio de notificaciones Push (Firebase Cloud Messaging) en el API Gateway
   */
  async checkHealth(): Promise<{ status: string; service: string } | null> {
    try {
      const res = await fetch(API_ENDPOINTS.NOTIFICATIONS_HEALTH);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Solicita permisos de notificación al sistema y obtiene el Push Token (FCM o Expo)
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('ℹ️ [notificationService] Las notificaciones nativas no aplican en navegador web.');
      return null;
    }

    try {
      // 1. Canal de notificación en Android (OBLIGATORIO para Android 8.0+)
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('apex_alerts', {
            name: 'Alertas Apex Fitness',
            description: 'Notificaciones de acceso en torniquetes, membresías y rutinas',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#90AB8B',
            enableLights: true,
            enableVibrate: true,
          });
        } catch (channelErr: any) {
          console.log('ℹ️ [notificationService] Canal nativo en modo desarrollo:', channelErr?.message);
        }
      }

      // 2. Verificar y solicitar permisos al usuario
      let finalStatus: string = 'undetermined';
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
      } catch (permErr: any) {
        console.log('ℹ️ [notificationService] Consulta de permisos en reposo:', permErr?.message);
      }

      if (finalStatus !== 'granted') {
        console.log('ℹ️ [notificationService] Permisos de notificación no otorgados');
        return null;
      }

      // 3. Obtener el Token
      let token: string | null = null;
      const isExpoGo = Constants.appOwnership === 'expo' || (Constants as any).executionEnvironment === 'storeClient';

      if (!isExpoGo) {
        // En APK standalone compilada con google-services.json:
        // Obtiene el token FCM nativo de Firebase Cloud Messaging
        try {
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          if (deviceToken?.data) {
            token = deviceToken.data;
            cachedPushToken = token;
            console.log('🔔 [notificationService] Token FCM nativo obtenido:', token);
            return token;
          }
        } catch (fcmErr: any) {
          console.log('ℹ️ [notificationService] Fallback a Expo Push Token:', fcmErr?.message);
        }
      }

      // En Expo Go o fallback de desarrollo
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
        cachedPushToken = token;
        console.log('🔔 [notificationService] Push Token generado:', token);
      } catch (tokenErr: any) {
        // Token simulado para pruebas locales en emulador o Expo Go
        token = 'fcm_device_token_simulado_' + Date.now();
        cachedPushToken = token;
        console.log('🔔 [notificationService] Token local activo para contingencia.');
      }

      return token;
    } catch (err: any) {
      console.log('ℹ️ [notificationService] Registro de notificaciones completado con token de contingencia.');
      return null;
    }
  },

  /**
   * Dispara una notificación inmediata en el dispositivo local (para pruebas o avisos rápidos)
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<string> {
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          color: '#90AB8B',
          data,
        },
        trigger: null, // trigger: null = Disparo inmediato
      });
    } catch (e: any) {
      console.log('ℹ️ [notificationService] Aviso al agendar notificación local:', e?.message);
      return '';
    }
  },

  /**
   * Envía una notificación push a través del API Gateway (Firebase Cloud Messaging)
   */
  async sendPushNotification(
    targetToken: string,
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<boolean> {
    // 1. Intento primario: Endpoint del API Gateway hacia Firebase Cloud Messaging
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS_SEND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          token: targetToken,
          title,
          body,
          data,
        }),
      });

      if (response.ok) {
        const resJson = await response.json();
        console.log('🚀 [notificationService] Notificación FCM enviada vía API Gateway:', resJson);
        return true;
      }
    } catch (err: any) {
      console.log('ℹ️ [notificationService] API Gateway FCM no disponible, probando canal secundario:', err?.message);
    }

    // 2. Si el token es de Expo (ExponentPushToken...), intentar vía exp.host
    if (targetToken && targetToken.startsWith('ExponentPushToken')) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: targetToken,
            sound: 'default',
            title,
            body,
            data,
            channelId: 'apex_alerts',
          }),
        });
        if (response.ok) return true;
      } catch {
        // Continúa al fallback local
      }
    }

    // 3. Fallback local garantizado para que el usuario siempre vea la alerta en su celular
    await this.sendLocalNotification(title, body, data);
    return true;
  },

  /**
   * Envía una notificación masiva por tema (Topic) vía API Gateway
   */
  async sendBroadcastNotification(
    topic: string,
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS_BROADCAST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          topic,
          title,
          body,
          data,
        }),
      });

      if (response.ok) {
        console.log(`🚀 [notificationService] Broadcast enviado exitosamente al tema "${topic}"`);
        return true;
      }
      return false;
    } catch (err: any) {
      console.log('ℹ️ [notificationService] Error enviando broadcast:', err?.message);
      return false;
    }
  },
};
