import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { bffService } from '../../services/bff/apiClient';
import { DailyReportData, FinancialReportData } from '../../types/reports';
import { MetricCard } from '../../components/charts/MetricCard';
import { AttendanceChart } from '../../components/charts/AttendanceChart';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LogoutConfirmModal } from '@/components/common/LogoutConfirmModal';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dailyData, setDailyData] = useState<DailyReportData | null>(null);
  const [finData, setFinData] = useState<FinancialReportData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadData = async () => {
    try {
      setErrorMsg(null);
      const hoy = new Date();
      const [daily, fin] = await Promise.all([
        bffService.getDailyReport(),
        bffService.getFinancialReport(hoy.getFullYear(), hoy.getMonth() + 1),
      ]);
      setDailyData(daily);
      setFinData(fin);
    } catch (err: any) {
      setErrorMsg('No se pudieron sincronizar las métricas ejecutivas en tiempo real. Desliza hacia abajo para reintentar.');
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentSage}
          />
        }
      >
        {/* Header Ejecutivo */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>APEX FITNESS • EJECUTIVO</Text>
            <Text style={styles.pageTitle}>Panel de Control</Text>
            {user && (
              <Text style={styles.userSubtitle}>
                {user.nombre} ({user.role})
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <View style={styles.modelStatusBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.modelStatusText}>Servidor En Línea</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutModal(true)} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={Colors.accentCream} />
            </TouchableOpacity>
          </View>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons
              name="warning-outline"
              size={16}
              color={Colors.accentWarning}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accentSage} />
            <Text style={styles.loadingText}>Cargando métricas consolidadas...</Text>
          </View>
        ) : (
          <>
            {/* Grid de KPIs Rápidos */}
            <View style={styles.gridRow}>
              <MetricCard
                label="Asistentes Hoy"
                value={dailyData?.total_asistentes ?? '--'}
                subValue={`Pico: ${dailyData?.pico_horario ?? '--'}`}
                iconName="people-outline"
                accentColor={Colors.accentSage}
              />
              <MetricCard
                label="Recaudación Hoy"
                value={`Bs ${
                  dailyData ? Number(dailyData.recaudacion_total_hoy).toLocaleString() : '--'
                }`}
                subValue={`Ventas: Bs ${dailyData?.ventas_mostrador_hoy ?? '0'}`}
                iconName="wallet-outline"
                accentColor={Colors.accentPrimary}
              />
            </View>

            <View style={styles.gridRow}>
              <MetricCard
                label="MRR Estimado"
                value={`Bs ${finData ? Number(finData.mrr_estimado).toLocaleString() : '--'}`}
                subValue={`${finData?.socios_al_dia ?? 0} socios activos`}
                iconName="trending-up-outline"
                accentColor={Colors.accentSage}
              />
              <MetricCard
                label="Socios Morosos"
                value={finData?.socios_morosos ?? '--'}
                subValue={`Deuda: Bs ${
                  finData ? Number(finData.cuotas_vencidas_monto).toLocaleString() : '--'
                }`}
                iconName="alert-circle-outline"
                accentColor={Colors.accentWarning}
                badgeText={`${finData?.tasa_churn_porcentaje ?? 0}% churn`}
              />
            </View>

            {/* Gráfico de Aforo de Clases */}
            {dailyData && dailyData.clases_hoy && (
              <AttendanceChart classes={dailyData.clases_hoy} />
            )}

            {/* Tarjeta de Acción Rápida para el Chat SLM */}
            <TouchableOpacity
              style={styles.chatActionCard}
              onPress={() => router.push('/(admin)/chat' as any)}
              activeOpacity={0.85}
            >
              <View style={styles.chatActionLeft}>
                <View style={styles.chatIconCircle}>
                  <Ionicons name="sparkles" size={20} color={Colors.accentSage} />
                </View>
                <View style={styles.chatActionTextCol}>
                  <Text style={styles.chatActionTitle}>Consultar al Asistente Local SLM</Text>
                  <Text style={styles.chatActionSub}>
                    Pregunta en lenguaje natural sobre socios, retención, flujo de caja y aforo.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Modal Moderno de Confirmación de Cierre de Sesión */}
      <LogoutConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
        title="¿Salir del Panel?"
        description="Estás a punto de cerrar tu sesión de Administrador. Se pausarán las consultas ejecutivas en tiempo real."
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
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentSage,
    letterSpacing: 1.2,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  userSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  modelStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentSage,
    marginRight: 6,
  },
  modelStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.accentWarning,
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chatActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  chatActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  chatIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(144, 171, 139, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(144, 171, 139, 0.3)',
  },
  chatActionTextCol: {
    flex: 1,
  },
  chatActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  chatActionSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
