import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { clientService } from '@/services/client/clientService';
import QRCode from 'qrcode';

const { width } = Dimensions.get('window');

/**
 * Componente de renderizado de Código QR nativo en React Native
 * No requiere DOM ni elemento <canvas>, opera 100% offline con la matriz matemática de módulos.
 */
function NativeQrMatrix({ value, size = 220 }: { value: string; size?: number }) {
  const matrixData = useMemo(() => {
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      return {
        moduleCount: qr.modules.size,
        data: qr.modules.data,
      };
    } catch (e) {
      return null;
    }
  }, [value]);

  if (!matrixData) {
    return (
      <View style={[styles.qrFallback, { width: size, height: size }]}>
        <Ionicons name="qr-code-outline" size={size * 0.6} color={Colors.textMuted} />
      </View>
    );
  }

  const { moduleCount, data } = matrixData;
  const cellSize = Math.floor(size / moduleCount);
  const realSize = cellSize * moduleCount;

  const rows = [];
  for (let r = 0; r < moduleCount; r++) {
    const cols = [];
    for (let c = 0; c < moduleCount; c++) {
      const isDark = data[r * moduleCount + c] === 1;
      cols.push(
        <View
          key={`c-${c}`}
          style={{
            width: cellSize,
            height: cellSize,
            backgroundColor: isDark ? '#0f171c' : '#ffffff',
          }}
        />
      );
    }
    rows.push(
      <View key={`r-${r}`} style={{ flexDirection: 'row' }}>
        {cols}
      </View>
    );
  }

  return (
    <View
      style={{
        width: realSize,
        height: realSize,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {rows}
    </View>
  );
}

export default function ClientDigitalPassScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [passData, setPassData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const generatePass = useCallback(async () => {
    try {
      const fullName = user?.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : undefined;
      const data = await clientService.getDigitalPassInfo(user?.id, user?.codigo, fullName, user?.ci);
      setPassData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[ClientDigitalPass] Error generando credencial:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    generatePass();
  }, [generatePass]);

  const handleRefresh = () => {
    setRefreshing(true);
    generatePass();
  };

  const handleShare = async () => {
    if (!passData) return;
    try {
      await Share.share({
        message: `Pase de Acceso Apex Fitness\nSocio: ${user?.nombre || passData.socioNombre} (${user?.codigo || 'CLI-001'})\nToken: ${passData.qrToken}`,
      });
    } catch (e) {
      // Ignorar
    }
  };

  const qrTokenToRender = passData?.qrToken || `APEX_QR_${user?.codigo || 'CLI-001'}_${Date.now()}`;
  const qrBoxSize = Math.min(width - 120, 230);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>APEX FITNESS PASS</Text>
            <Text style={styles.headerTitle}>Mi Pase Digital</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={handleRefresh}
            disabled={refreshing}
            activeOpacity={0.7}
          >
            <Ionicons
              name="reload"
              size={20}
              color={Colors.accentSage}
              style={refreshing ? styles.rotating : undefined}
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accentSage} />
            <Text style={styles.loadingText}>Consultando credencial en ms-gimnasio...</Text>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            {/* Carnet Virtual */}
            <View style={styles.membershipCard}>
              {/* Franja superior del Carnet */}
              <View style={styles.cardTopRow}>
                <View style={styles.brandBadge}>
                  <Ionicons name="barbell" size={16} color={Colors.accentCream} />
                  <Text style={styles.brandBadgeText}>APEX MEMBER</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDotWrapper}>
                    <View style={styles.statusDotHalo} />
                    <View style={styles.statusDot} />
                  </View>
                  <Text style={styles.statusBadgeText}>
                    {passData?.membership?.estado || 'VIGENTE'}
                  </Text>
                </View>
              </View>

              {/* Datos del Socio */}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {user?.nombre ? `${user.nombre} ${user.apellido || ''}` : passData?.socioNombre}
                </Text>
                <Text style={styles.memberMeta}>
                  Código: <Text style={styles.boldText}>{user?.codigo || passData?.membership?.codigoSocio}</Text>
                  {'  •  '}
                  CI: <Text style={styles.boldText}>{user?.ci || passData?.ci}</Text>
                </Text>
                <Text style={styles.planName}>{passData?.membership?.planNombre}</Text>
              </View>

              {/* Contenedor del Código QR Nativo (Sin Canvas) */}
              <View style={styles.qrWrapper}>
                <NativeQrMatrix value={qrTokenToRender} size={qrBoxSize} />
                <View style={styles.scanNoticeRow}>
                  <Ionicons name="shield-checkmark" size={14} color={Colors.accentSage} />
                  <Text style={styles.scanNoticeText}>Token criptográfico dinámico</Text>
                </View>
              </View>

              {/* Pie del carnet */}
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>DÍAS RESTANTES</Text>
                  <Text style={styles.footerValue}>
                    {passData?.membership?.diasRestantes ?? 52} días
                  </Text>
                </View>
                <View style={styles.footerDivider} />
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>ACCESO</Text>
                  <Text style={styles.footerValue}>Torniquetes / Sala</Text>
                </View>
              </View>
            </View>

            {/* Instrucción de uso */}
            <View style={styles.instructionBox}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.accentSecondary} />
              <Text style={styles.instructionText}>
                Presenta este código QR frente a la cámara del torniquete o ante la recepcionista para registrar tu ingreso.
              </Text>
            </View>

            {/* Botones de acción */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={handleRefresh}
                disabled={refreshing}
                activeOpacity={0.8}
              >
                <Ionicons name="sync-outline" size={18} color={Colors.accentCream} />
                <Text style={styles.actionBtnText}>
                  {refreshing ? 'Actualizando...' : 'Refrescar Token'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnShare}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={18} color={Colors.accentSage} />
                <Text style={[styles.actionBtnText, { color: Colors.accentSage }]}>Compartir</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.updatedAtText}>
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accentSage,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.accentCream,
    marginTop: 2,
  },
  refreshIconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  rotating: {
    opacity: 0.6,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cardContainer: {
    alignItems: 'center',
  },
  membershipCard: {
    width: '100%',
    backgroundColor: '#152026',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(144, 171, 139, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    gap: 6,
  },
  brandBadgeText: {
    color: Colors.accentCream,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(144, 171, 139, 0.15)',
    borderColor: Colors.accentSage,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
  },
  statusDotWrapper: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDotHalo: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(144, 171, 139, 0.4)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentSage,
  },
  statusBadgeText: {
    color: Colors.accentSage,
    fontSize: 11,
    fontWeight: '800',
  },
  memberInfo: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  memberName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.accentCream,
  },
  memberMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.accentCream,
    fontVariant: ['tabular-nums'],
  },
  planName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentSecondary,
    marginTop: 6,
  },
  qrWrapper: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  qrFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  scanNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accentCream,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.lg,
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 8,
  },
  actionBtnShare: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(144, 171, 139, 0.15)',
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accentSage,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentCream,
  },
  updatedAtText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },
});
