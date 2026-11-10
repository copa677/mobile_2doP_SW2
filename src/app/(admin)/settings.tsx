import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { AVAILABLE_MODELS } from '../../services/llm/modelManager';
import { ModelDownloader } from '../../components/model/ModelDownloader';
import { getApiBaseUrl, setApiBaseUrl } from '../../services/bff/apiClient';
import { GYM_KNOWLEDGE_BASE } from '../../services/vector/vectorStore';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { LogoutConfirmModal } from '@/components/common/LogoutConfirmModal';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl());
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setApiBaseUrl(apiUrl);
      const res = await fetch(`${apiUrl}/reports/daily?target_date=2026-11-09`);
      if (res.ok) {
        setTestResult(`✅ Conexión exitosa con el Backend BFF en ${apiUrl}`);
      } else {
        setTestResult(`⚠️ Error HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (e: any) {
      setTestResult(`❌ Error de conexión: ${e.message}`);
    } finally {
      setTesting(false);
    }
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
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>APEX MOTOR IA & CONECTIVIDAD</Text>
          <Text style={styles.headerTitle}>Gestión de Inferencia</Text>
        </View>

        {/* Sección: Descarga de Modelos SLM */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Modelos de Lenguaje Locales (GGUF)</Text>
          <Text style={styles.sectionSub}>
            Los modelos se almacenan directamente en el dispositivo móvil y operan sin conexión a
            internet mediante cuantización Q4_K_M.
          </Text>
        </View>

        {AVAILABLE_MODELS.map((model) => (
          <ModelDownloader key={model.id} model={model} />
        ))}

        {/* Sección: Base Vectorial RAG embebida */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
          <Text style={styles.sectionTitle}>Base de Conocimiento RAG (Local)</Text>
          <Text style={styles.sectionSub}>
            Documentos vectorizados para grounding de políticas de socios, cobros y aforos.
          </Text>
        </View>

        <View style={styles.ragCard}>
          <View style={styles.ragHeader}>
            <Ionicons name="documents-outline" size={20} color={Colors.accentSage} />
            <Text style={styles.ragTitle}>Documentos Indexados ({GYM_KNOWLEDGE_BASE.length})</Text>
          </View>
          {GYM_KNOWLEDGE_BASE.map((doc) => (
            <View key={doc.id} style={styles.ragItem}>
              <View style={styles.ragBadge}>
                <Text style={styles.ragBadgeText}>{doc.category}</Text>
              </View>
              <Text style={styles.ragTitleText}>{doc.title}</Text>
              <Text style={styles.ragText}>{doc.content}</Text>
            </View>
          ))}
        </View>

        {/* Sección: Conexión BFF & Microservicios */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
          <Text style={styles.sectionTitle}>Conexión Microservicios / Gateway</Text>
          <Text style={styles.sectionSub}>
            Dirección del Backend BFF que consolida Auth, Inventario, Asistencia y Pagos.
          </Text>
        </View>

        <View style={styles.networkCard}>
          <Text style={styles.inputLabel}>URL BASE DEL SERVIDOR BFF</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://10.0.2.2:8000 o http://192.168.1.X:8000"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestConnection}
            disabled={testing}
            activeOpacity={0.8}
          >
            <Ionicons name="flash-outline" size={16} color={Colors.forestDeep} />
            <Text style={styles.testBtnText}>
              {testing ? 'Probando...' : 'Probar Conectividad'}
            </Text>
          </TouchableOpacity>

          {testResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{testResult}</Text>
            </View>
          )}
        </View>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.accentDanger} />
          <Text style={styles.logoutText}>Cerrar Sesión Administrador</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Moderno de Confirmación */}
      <LogoutConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
        title="¿Cerrar Sesión?"
        description="Estás a punto de salir del panel de configuración administrativa."
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
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.accentSage,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accentSage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  ragCard: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  ragHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ragTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ragItem: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentSage,
  },
  ragBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(144, 171, 139, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  ragBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentSage,
    textTransform: 'uppercase',
  },
  ragTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  ragText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  networkCard: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  testBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.accentSage,
    borderRadius: Radius.md,
    paddingVertical: 10,
    gap: 6,
  },
  testBtnText: {
    color: Colors.forestDeep,
    fontSize: 13,
    fontWeight: '700',
  },
  resultBox: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceElevated,
  },
  resultText: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: Radius.md,
    paddingVertical: 12,
    marginTop: Spacing.xl,
    gap: 8,
  },
  logoutText: {
    color: Colors.accentDanger,
    fontSize: 13,
    fontWeight: '700',
  },
});
