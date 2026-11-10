import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { receptionService, SocioInfo } from '@/services/reception/receptionService';

const MOTIVOS = [
  'Olvidó dispositivo móvil',
  'Sin batería / pantalla rota',
  'Pase de cortesía autorizado',
  'Registro manual de ingreso',
];

export default function ReceptionistManualScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [socios, setSocios] = useState<SocioInfo[]>(() => receptionService.buscarSocios(''));
  const [selectedSocio, setSelectedSocio] = useState<SocioInfo | null>(null);
  const [selectedMotivo, setSelectedMotivo] = useState(MOTIVOS[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadRealData = async () => {
    await receptionService.cargarDatosReales();
    setSocios(receptionService.buscarSocios(searchQuery));
  };

  useEffect(() => {
    loadRealData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRealData();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setSocios(receptionService.buscarSocios(text));
  };

  const handleOpenAuthModal = (socio: SocioInfo) => {
    setSelectedSocio(socio);
    setSelectedMotivo(MOTIVOS[0]);
    setModalVisible(true);
  };

  const handleConfirmAccess = async () => {
    if (!selectedSocio) return;
    setProcessing(true);
    try {
      const res = await receptionService.registrarAccesoManual(selectedSocio.id, selectedMotivo);
      setModalVisible(false);
      Alert.alert(
        res.autorizado ? '✅ Acceso Registrado' : '⚠️ Acceso No Autorizado',
        res.mensaje
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al procesar acceso manual');
    } finally {
      setProcessing(false);
    }
  };

  const renderSocioItem = ({ item }: { item: SocioInfo }) => {
    const isVigente = item.estadoMembresia === 'VIGENTE';
    return (
      <View style={styles.socioCard}>
        <View style={styles.socioHeader}>
          <View style={styles.socioTextContainer}>
            <Text style={styles.socioName} numberOfLines={1} ellipsizeMode="tail">
              {item.nombre} {item.apellido}
            </Text>
            <Text style={styles.socioMeta} numberOfLines={1} ellipsizeMode="tail">
              C.I.: <Text style={styles.boldText}>{item.ci}</Text>
              {'  •  '}
              Cód: <Text style={styles.boldText}>{item.codigoSocio}</Text>
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isVigente
                  ? 'rgba(144, 171, 139, 0.15)'
                  : 'rgba(248, 113, 113, 0.15)',
                borderColor: isVigente ? Colors.accentSage : Colors.accentDanger,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: isVigente ? Colors.accentSage : Colors.accentDanger },
              ]}
            >
              {item.estadoMembresia}
            </Text>
          </View>
        </View>

        <View style={styles.socioDetails}>
          <View style={styles.detailPill}>
            <Ionicons name="barbell-outline" size={13} color={Colors.accentSecondary} />
            <Text style={styles.detailPillText} numberOfLines={1}>{item.disciplina}</Text>
          </View>
          <View style={styles.detailPill}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailPillText}>{item.diasRestantes} días restantes</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.authorizeBtn,
            { backgroundColor: isVigente ? Colors.accentWarning : 'rgba(234, 179, 8, 0.2)' },
          ]}
          onPress={() => handleOpenAuthModal(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="enter-outline" size={16} color="#0f171c" />
          <Text style={styles.authorizeBtnText}>Marcar Ingreso Manual</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>CONTINGENCIA DE ACCESO</Text>
        <Text style={styles.headerTitle}>Ingreso Manual</Text>
        <Text style={styles.headerDesc}>
          Registra el ingreso de socios que no cuenten con su móvil o presenten incidencias.
        </Text>

        {/* Barra de Búsqueda */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por Nombre, C.I. o Código (CLI-001)..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={socios}
        keyExtractor={(item) => item.id}
        renderItem={renderSocioItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accentWarning}
            colors={[Colors.accentWarning]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="person-circle-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No se encontraron socios registrados</Text>
          </View>
        }
      />

      {/* Modal de Confirmación y Motivo */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Autorizar Ingreso Manual</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedSocio && (
              <View style={styles.modalSocioInfo}>
                <Text style={styles.modalSocioName}>
                  {selectedSocio.nombre} {selectedSocio.apellido}
                </Text>
                <Text style={styles.modalSocioMeta}>
                  C.I.: {selectedSocio.ci} • Plan: {selectedSocio.planNombre}
                </Text>
              </View>
            )}

            <Text style={styles.motivoLabel}>MOTIVO DEL REGISTRO MANUAL:</Text>
            <View style={styles.motivosList}>
              {MOTIVOS.map((motivo) => {
                const isSelected = selectedMotivo === motivo;
                return (
                  <TouchableOpacity
                    key={motivo}
                    style={[styles.motivoItem, isSelected && styles.motivoItemSelected]}
                    onPress={() => setSelectedMotivo(motivo)}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? Colors.accentWarning : Colors.textMuted}
                    />
                    <Text style={[styles.motivoItemText, isSelected && styles.motivoItemTextActive]}>
                      {motivo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={handleConfirmAccess}
              disabled={processing}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done" size={20} color="#0f171c" />
              <Text style={styles.modalConfirmBtnText}>
                {processing ? 'Registrando...' : 'Confirmar Ingreso en Sala'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
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
  headerDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  socioCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 12,
    overflow: 'hidden',
  },
  socioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  socioTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  socioName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.accentCream,
  },
  socioMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.accentCream,
  },
  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  socioDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    gap: 4,
  },
  detailPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  authorizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 6,
  },
  authorizeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f171c',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#152026',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.xl,
    borderTopWidth: 2,
    borderTopColor: Colors.accentWarning,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.accentCream,
  },
  modalSocioInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  modalSocioName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.accentCream,
  },
  modalSocioMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  motivoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accentWarning,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  motivosList: {
    gap: 8,
    marginBottom: Spacing.xl,
  },
  motivoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  motivoItemSelected: {
    borderColor: Colors.accentWarning,
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  motivoItemText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  motivoItemTextActive: {
    color: Colors.accentCream,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentWarning,
    paddingVertical: 14,
    borderRadius: Radius.md,
    gap: 8,
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f171c',
  },
});
