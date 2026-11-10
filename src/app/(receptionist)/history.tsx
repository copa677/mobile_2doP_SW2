import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  receptionService,
  AccessLogItem,
  AforoInfo,
} from '@/services/reception/receptionService';

export default function ReceptionistHistoryScreen() {
  const [logs, setLogs] = useState<AccessLogItem[]>([]);
  const [aforo, setAforo] = useState<AforoInfo>({
    actual: 0,
    capacidadMaxima: 120,
    porcentajeOcupacion: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setLogs(receptionService.obtenerHistorial());
    setAforo(receptionService.obtenerAforo());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const getAforoColor = () => {
    if (aforo.porcentajeOcupacion >= 90) return Colors.accentDanger;
    if (aforo.porcentajeOcupacion >= 70) return Colors.accentWarning;
    return Colors.accentSage;
  };

  const renderLogItem = ({ item }: { item: AccessLogItem }) => (
    <View style={styles.logCard}>
      <View
        style={[
          styles.statusIconWrap,
          {
            backgroundColor: item.autorizado
              ? 'rgba(144, 171, 139, 0.15)'
              : 'rgba(248, 113, 113, 0.15)',
          },
        ]}
      >
        <Ionicons
          name={item.autorizado ? 'checkmark-circle' : 'close-circle'}
          size={24}
          color={item.autorizado ? Colors.accentSage : Colors.accentDanger}
        />
      </View>

      <View style={styles.logInfo}>
        <View style={styles.logHeaderRow}>
          <Text style={styles.logSocioName}>{item.socioNombre}</Text>
          <Text style={styles.logTime}>{item.hora}</Text>
        </View>

        <Text style={styles.logMeta}>
          {item.codigoSocio} • CI: {item.ci} • {item.disciplina}
        </Text>

        <View style={styles.logFooterRow}>
          <View
            style={[
              styles.methodPill,
              {
                backgroundColor:
                  item.tipoAcceso === 'QR_MOVIL'
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(234, 179, 8, 0.15)',
              },
            ]}
          >
            <Ionicons
              name={item.tipoAcceso === 'QR_MOVIL' ? 'qr-code' : 'create'}
              size={11}
              color={
                item.tipoAcceso === 'QR_MOVIL'
                  ? Colors.accentSecondary
                  : Colors.accentWarning
              }
            />
            <Text
              style={[
                styles.methodPillText,
                {
                  color:
                    item.tipoAcceso === 'QR_MOVIL'
                      ? Colors.accentSecondary
                      : Colors.accentWarning,
                },
              ]}
            >
              {item.tipoAcceso === 'QR_MOVIL' ? 'QR Móvil' : 'Manual Recepción'}
            </Text>
          </View>
          <Text
            style={[
              styles.logStatusText,
              { color: item.autorizado ? Colors.accentSage : Colors.accentDanger },
            ]}
          >
            {item.autorizado ? 'AUTORIZADO' : 'DENEGADO'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>MONITOREO DE CONTROL DE ACCESO</Text>
          <Text style={styles.headerTitle}>Aforo & Bitácora</Text>
        </View>
        <TouchableOpacity style={styles.reloadBtn} onPress={handleRefresh} activeOpacity={0.7}>
          <Ionicons name="refresh" size={18} color={Colors.accentWarning} />
        </TouchableOpacity>
      </View>

      {/* Widget de Aforo en Sala */}
      <View style={styles.aforoCard}>
        <View style={styles.aforoTop}>
          <View>
            <Text style={styles.aforoLabel}>AFORO EN SALA EN TIEMPO REAL</Text>
            <Text style={styles.aforoCount}>
              {aforo.actual} <Text style={styles.aforoMax}>/ {aforo.capacidadMaxima} socios</Text>
            </Text>
          </View>
          <View
            style={[
              styles.aforoPercentBadge,
              {
                backgroundColor: `${getAforoColor()}25`,
                borderColor: getAforoColor(),
              },
            ]}
          >
            <Text style={[styles.aforoPercentText, { color: getAforoColor() }]}>
              {aforo.porcentajeOcupacion}%
            </Text>
          </View>
        </View>

        {/* Barra de progreso de aforo */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${aforo.porcentajeOcupacion}%`,
                backgroundColor: getAforoColor(),
              },
            ]}
          />
        </View>

        <Text style={styles.aforoHint}>
          {aforo.porcentajeOcupacion >= 90
            ? '⚠️ Advertencia: Aforo próximo a capacidad máxima'
            : aforo.porcentajeOcupacion >= 70
            ? '⚡ Afluencia moderada en salas y máquinas'
            : '✅ Afluencia regular y espacio disponible'}
        </Text>
      </View>

      {/* Bitácora de accesos */}
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Historial del Turno</Text>
        <Text style={styles.feedBadge}>{logs.length} eventos registrados</Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accentWarning}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No se registraron accesos todavía en este turno</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accentWarning,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.accentCream,
    marginTop: 2,
  },
  reloadBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  aforoCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    backgroundColor: '#152026',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  aforoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  aforoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accentWarning,
    letterSpacing: 1,
  },
  aforoCount: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.accentCream,
    marginTop: 2,
  },
  aforoMax: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  aforoPercentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  aforoPercentText: {
    fontSize: 14,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  aforoHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.accentCream,
  },
  feedBadge: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 12,
    alignItems: 'center',
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logInfo: {
    flex: 1,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logSocioName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accentCream,
  },
  logTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  logMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },
  logFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  methodPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  logStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});
