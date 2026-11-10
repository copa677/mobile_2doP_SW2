import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { clientService } from '@/services/client/clientService';
import { AttendanceRecord } from '@/types/client';

export default function ClientAttendanceHistoryScreen() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await clientService.getMyAttendances();
      setAttendances(data);
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

  const renderItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark-done" size={20} color={Colors.accentSage} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.disciplineTitle}>{item.disciplina}</Text>
        <Text style={styles.recordSubtitle}>
          {item.fecha} a las {item.hora} • {item.instructor || 'Acceso Torniquete'}
        </Text>
      </View>
      <View style={styles.badgePill}>
        <Text style={styles.badgeText}>Ingreso OK</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>REGISTRO DE ACCESOS</Text>
        <Text style={styles.headerTitle}>Mis Asistencias</Text>
      </View>

      {/* Tarjetas de Resumen y Racha */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{attendances.length}</Text>
          <Text style={styles.summaryLabel}>Total Asistencias</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="flame" size={20} color="#F59E0B" />
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>4 Semanas</Text>
          </View>
          <Text style={styles.summaryLabel}>Racha Imparable</Text>
        </View>
      </View>

      {/* Lista de Registros */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.accentSage} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={attendances}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentSage} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin registros aún</Text>
              <Text style={styles.emptyText}>Escanea tu código QR en recepción para marcar tu primer ingreso.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.accentCream,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(144, 171, 139, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disciplineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accentCream,
  },
  recordSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgePill: {
    backgroundColor: 'rgba(144, 171, 139, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.accentSage,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accentCream,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});

