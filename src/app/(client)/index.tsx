import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { clientService } from '@/services/client/clientService';
import { MembershipInfo } from '@/types/client';
import { useRouter } from 'expo-router';
import { LogoutConfirmModal } from '@/components/common/LogoutConfirmModal';

export default function ClientMembershipScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadData = async () => {
    try {
      const data = await clientService.getMyMembership();
      setMembership(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
      router.replace('/login' as any);
    } catch {
      // Ignorar
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentSage} />}
      >
        {/* Header de Bienvenida */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtitle}>PORTAL DEL SOCIO</Text>
            <Text style={styles.headerTitle}>Hola, {user?.nombre || 'Socio'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutIconButton} onPress={() => setShowLogoutModal(true)}>
            <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tarjeta Digital de Membresía (Carnet Virtual) */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.accentSage} style={{ marginVertical: 40 }} />
        ) : (
          <>
            <View style={styles.membershipCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.gymBrandBadge}>
                  <Ionicons name="barbell" size={16} color={Colors.accentCream} />
                  <Text style={styles.gymBrandText}>APEX FITNESS</Text>
                </View>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{membership?.estado || 'VIGENTE'}</Text>
                </View>
              </View>

              <Text style={styles.planName}>{membership?.planNombre || 'Pase Libre Black'}</Text>
              <Text style={styles.disciplineText}>{membership?.disciplina || 'Acceso Integral'}</Text>

              <View style={styles.divider} />

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.fieldLabel}>SOCIO</Text>
                  <Text style={styles.fieldValue}>{user?.nombre} {user?.apellido}</Text>
                  <Text style={styles.codeText}>{user?.codigo || 'CLI-001'} • CI: {user?.ci}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.fieldLabel}>DÍAS RESTANTES</Text>
                  <Text style={styles.daysHighlight}>{membership?.diasRestantes || 67}</Text>
                  <Text style={styles.expDateText}>Vence: {membership?.fechaFin}</Text>
                </View>
              </View>
            </View>

            {/* Botón de Acción Principal: Marcar Asistencia */}
            <TouchableOpacity
              style={styles.actionScanButton}
              onPress={() => router.push('/(client)/scanner' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.scanIconWrap}>
                <Ionicons name="qr-code" size={24} color={Colors.accentCream} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scanBtnTitle}>Marcar Asistencia con QR</Text>
                <Text style={styles.scanBtnSubtitle}>Escanea el código en recepción para ingresar</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.accentSage} />
            </TouchableOpacity>

            {/* Beneficios Incluidos en tu Plan */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Beneficios de tu Suscripción</Text>
              
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.accentSage} />
                <Text style={styles.benefitText}>Acceso libre a sala de pesas y cardio 24/7</Text>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.accentSage} />
                <Text style={styles.benefitText}>Clases grupales: Spinning, CrossFit, Box y Yoga</Text>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.accentSage} />
                <Text style={styles.benefitText}>Seguimiento de rutinas personalizadas por instructor</Text>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.accentSage} />
                <Text style={styles.benefitText}>Locker y duchas con vestuario VIP</Text>
              </View>
            </View>

            {/* Accesos directos a Rutinas e Historial */}
            <View style={styles.shortcutsGrid}>
              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => router.push('/(client)/workouts' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="fitness" size={26} color={Colors.accentSage} />
                <Text style={styles.shortcutTitle}>Rutina de Hoy</Text>
                <Text style={styles.shortcutSub}>Ver ejercicios asignados</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => router.push('/(client)/history' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={26} color={Colors.accentSecondary} />
                <Text style={styles.shortcutTitle}>Asistencias</Text>
                <Text style={styles.shortcutSub}>Racha y registros</Text>
              </TouchableOpacity>
            </View>

            {/* Botón de Cerrar Sesión Destacado */}
            <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={18} color={Colors.accentDanger} />
              <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Modal Moderno y Elegante de Confirmación de Cierre de Sesión */}
      <LogoutConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
        title="¿Cerrar Sesión?"
        description="Estás a punto de salir de tu cuenta de socio. Tendrás que ingresar tus credenciales nuevamente para acceder a tu carnet y rutinas."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentSage,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.accentCream,
    marginTop: 2,
  },
  logoutIconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membershipCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(235, 244, 221, 0.25)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: Spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  gymBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gymBrandText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accentCream,
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 244, 221, 0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentCream,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentCream,
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.accentCream,
  },
  disciplineText: {
    fontSize: 13,
    color: Colors.accentCream,
    opacity: 0.85,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(235, 244, 221, 0.2)',
    marginVertical: Spacing.md,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentCream,
    opacity: 0.75,
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accentCream,
    marginTop: 2,
  },
  codeText: {
    fontSize: 11,
    color: Colors.accentCream,
    opacity: 0.8,
    marginTop: 2,
  },
  daysHighlight: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.accentCream,
  },
  expDateText: {
    fontSize: 11,
    color: Colors.accentCream,
    opacity: 0.8,
    marginTop: 2,
  },
  actionScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  scanIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scanBtnSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  benefitText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  shortcutSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: Spacing.xl,
    gap: 8,
  },
  logoutBtnText: {
    color: Colors.accentDanger,
    fontSize: 14,
    fontWeight: '700',
  },
});
