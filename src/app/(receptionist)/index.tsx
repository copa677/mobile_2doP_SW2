import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { receptionService, AccessValidationResult } from '@/services/reception/receptionService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { LogoutConfirmModal } from '@/components/common/LogoutConfirmModal';

export default function ReceptionistScannerScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<AccessValidationResult | null>(null);
  const [torch, setTorch] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Auto-cierre de modal de éxito en 2.5s para no detener el flujo de socios en fila
  useEffect(() => {
    if (result?.autorizado) {
      const timer = setTimeout(() => {
        handleCloseModal();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      const res = await receptionService.validarAccesoQr(data);
      setResult(res);
    } catch (e: any) {
      setResult({
        autorizado: false,
        mensaje: e.message || 'Error al validar el código QR',
        fechaHora: new Date().toLocaleTimeString(),
        tipoAcceso: 'QR_MOVIL',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulateScan = () => {
    handleBarcodeScanned({
      data: `APEX_QR_CLI-001_${Date.now()}_HMAC_VALID`,
    });
  };

  const handleCloseModal = () => {
    setResult(null);
    setScanned(false);
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

  const renderResultModal = () => (
    <Modal visible={!!result} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            {
              borderColor: result?.autorizado
                ? Colors.accentSage
                : Colors.accentDanger,
            },
          ]}
        >
          {/* Icono de Resultado */}
          <View
            style={[
              styles.modalIconWrap,
              {
                backgroundColor: result?.autorizado
                  ? 'rgba(144, 171, 139, 0.2)'
                  : 'rgba(248, 113, 113, 0.2)',
              },
            ]}
          >
            <Ionicons
              name={result?.autorizado ? 'checkmark-circle' : 'close-circle'}
              size={56}
              color={result?.autorizado ? Colors.accentSage : Colors.accentDanger}
            />
          </View>

          <Text
            style={[
              styles.modalTitle,
              {
                color: result?.autorizado
                  ? Colors.accentSage
                  : Colors.accentDanger,
              },
            ]}
          >
            {result?.autorizado ? '¡ACCESO AUTORIZADO!' : 'ACCESO DENEGADO'}
          </Text>

          <Text style={styles.modalMsg}>{result?.mensaje}</Text>

          {/* Ficha de Información del Socio */}
          {result?.socio && (
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Socio:</Text>
                <Text style={styles.detailValBold}>
                  {result.socio.nombre} {result.socio.apellido} ({result.socio.codigoSocio})
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>C.I.:</Text>
                <Text style={styles.detailVal}>{result.socio.ci}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Disciplina / Sala:</Text>
                <Text style={styles.detailVal}>{result.socio.disciplina}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan Suscrito:</Text>
                <Text style={styles.detailVal}>{result.socio.planNombre}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Días Restantes:</Text>
                <Text
                  style={[
                    styles.detailVal,
                    {
                      color:
                        result.socio.diasRestantes > 0
                          ? Colors.accentSage
                          : Colors.accentDanger,
                      fontWeight: '800',
                    },
                  ]}
                >
                  {result.socio.diasRestantes} días
                </Text>
              </View>
              {result.motivoRechazo && (
                <View style={[styles.detailRow, { marginTop: 6 }]}>
                  <Text style={[styles.detailLabel, { color: Colors.accentDanger }]}>
                    Motivo:
                  </Text>
                  <Text style={[styles.detailVal, { color: Colors.accentDanger }]}>
                    {result.motivoRechazo}
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.modalCloseBtn,
              {
                backgroundColor: result?.autorizado
                  ? Colors.accentSage
                  : Colors.accentDanger,
              },
            ]}
            onPress={handleCloseModal}
            activeOpacity={0.8}
          >
            <Text style={styles.modalCloseBtnText}>
              {result?.autorizado ? 'Listo • Siguiente Socio (2.5s)' : 'Cerrar y Revisar Socio'}
            </Text>
          </TouchableOpacity>

          {result?.autorizado && (
            <Text style={styles.autoCloseHint}>
              Avanzando automáticamente al siguiente en fila...
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra Superior de Recepción */}
      <View style={styles.topBar}>
        <View style={styles.staffInfo}>
          <View style={styles.staffIconBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.accentWarning} />
          </View>
          <View>
            <Text style={styles.topBarRole}>RECEPCIÓN • TORNIQUETE MÓVIL</Text>
            <Text style={styles.topBarName}>
              {user?.nombre || 'Staff'} {user?.apellido || 'Recepción'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Viewport de Cámara o Permisos */}
      <View style={styles.cameraContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webFallbackContainer}>
            <Ionicons name="scan" size={64} color={Colors.accentWarning} />
            <Text style={styles.webFallbackTitle}>Modo Torniquete Virtual</Text>
            <Text style={styles.webFallbackSubtitle}>
              Simula el escaneo con la cámara del dispositivo móvil para validar códigos QR de socios.
            </Text>
            <TouchableOpacity
              style={styles.simulateScanBtn}
              onPress={handleSimulateScan}
              disabled={processing}
              activeOpacity={0.8}
            >
              {processing ? (
                <ActivityIndicator color={Colors.accentCream} />
              ) : (
                <>
                  <Ionicons name="qr-code-outline" size={20} color={Colors.accentCream} />
                  <Text style={styles.simulateScanBtnText}>Simular Escaneo de Socio</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : !permission ? (
          <View style={styles.permissionBox}>
            <ActivityIndicator size="small" color={Colors.accentWarning} />
            <Text style={styles.permissionText}>Comprobando permisos de cámara...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <Ionicons name="videocam-off-outline" size={48} color={Colors.accentDanger} />
            <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
            <Text style={styles.permissionText}>
              Para que el móvil funcione como torniquete y escanee pases QR, se necesita acceso a la cámara.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.permissionBtnText}>Conceder Acceso</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              enableTorch={torch}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            {/* Overlay Visor Torniquete posicionado como hermano absoluto */}
            <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="box-none">
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                {processing && (
                  <View style={styles.scanningBadge}>
                    <ActivityIndicator size="small" color={Colors.accentWarning} />
                    <Text style={styles.scanningBadgeText}>Validando credencial...</Text>
                  </View>
                )}
              </View>

              <Text style={styles.overlayGuideText}>
                Apunta al código QR del carnet digital del socio
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Controles Inferiores */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[styles.torchBtn, torch && styles.torchBtnActive]}
          onPress={() => setTorch(!torch)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={torch ? 'flashlight' : 'flashlight-outline'}
            size={22}
            color={torch ? Colors.accentWarning : Colors.textSecondary}
          />
          <Text style={[styles.torchText, torch && { color: Colors.accentWarning }]}>
            {torch ? 'Luz ON' : 'Linterna'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.simulateQuickBtn}
          onPress={handleSimulateScan}
          disabled={processing}
          activeOpacity={0.8}
        >
          <Ionicons name="barcode-outline" size={20} color={Colors.accentCream} />
          <Text style={styles.simulateQuickText}>Simular Pase QR</Text>
        </TouchableOpacity>
      </View>

      {renderResultModal()}

      {/* Modal Moderno de Confirmación para Recepcionista */}
      <LogoutConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
        title="¿Cerrar Sesión Staff?"
        description="Estás a punto de salir del modo torniquete y lector de recepción. El escaneo de socios se pausará."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  staffIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarRole: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accentWarning,
    letterSpacing: 1,
  },
  topBarName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accentCream,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: 250,
    height: 250,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.accentWarning,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  scanningBadgeText: {
    color: Colors.accentCream,
    fontSize: 12,
    fontWeight: '700',
  },
  overlayGuideText: {
    marginTop: Spacing.xl,
    color: Colors.accentCream,
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    gap: 12,
  },
  torchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  torchBtnActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: Colors.accentWarning,
  },
  torchText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  simulateQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentWarning,
  },
  simulateQuickText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f171c',
  },
  webFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  webFallbackTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.accentCream,
    marginTop: Spacing.md,
  },
  webFallbackSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  simulateScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.accentWarning,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  simulateScanBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f171c',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accentCream,
    marginTop: Spacing.md,
  },
  permissionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  permissionBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.accentWarning,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  permissionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f171c',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#152026',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalMsg: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  detailVal: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailValBold: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentCream,
  },
  modalCloseBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f171c',
  },
  autoCloseHint: {
    marginTop: 10,
    fontSize: 11,
    color: Colors.accentSage,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
