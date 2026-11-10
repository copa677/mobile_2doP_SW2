import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function UnauthorizedScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="desktop-outline" size={44} color={Colors.accentWarning} />
        </View>

        <Text style={styles.title}>Acceso Restringido en Móvil</Text>
        <Text style={styles.subtitle}>
          Hola <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>. Tu rol actual es{' '}
          <Text style={styles.roleHighlight}>{user?.role || 'Staff'}</Text>.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            La aplicación móvil de GymPulse está reservada exclusivamente para:
          </Text>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accentSage} />
            <Text style={styles.bulletText}>
              <Text style={{ fontWeight: '700' }}>Administradores:</Text> Cuadro de mando ejecutivo y reportes con IA local.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accentSage} />
            <Text style={styles.bulletText}>
              <Text style={{ fontWeight: '700' }}>Recepcionistas:</Text> Torniquete móvil, escaneo de QR y aforo.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accentSage} />
            <Text style={styles.bulletText}>
              <Text style={{ fontWeight: '700' }}>Clientes / Socios:</Text> Carnet digital con QR y rutinas personales.
            </Text>
          </View>

          <Text style={styles.noticeText}>
            Por favor ingresa desde el <Text style={{ color: Colors.accentCream, fontWeight: '700' }}>Portal Web de Escritorio</Text> en tu navegador (puerto 5173) para acceder a tus herramientas operativas.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.accentCream} />
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: Colors.accentWarning,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.accentCream,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  userName: {
    color: Colors.accentCream,
    fontWeight: '700',
  },
  roleHighlight: {
    color: Colors.accentWarning,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  cardText: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  noticeText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accentCream,
  },
});
