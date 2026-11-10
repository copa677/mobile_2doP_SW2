import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface LogoutConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading = false,
  title = '¿Cerrar Sesión?',
  description = 'Estás a punto de salir de tu cuenta. Tendrás que ingresar tus credenciales nuevamente para acceder.',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose} disabled={loading}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Micro-etiqueta institucional de contexto */}
              <View style={styles.brandBadge}>
                <Ionicons name="shield-checkmark-outline" size={12} color={Colors.accentSage} />
                <Text style={styles.brandBadgeText}>APEX FITNESS • SESIÓN SEGURA</Text>
              </View>

              {/* Contenedor del Icono de Desconexión sobrio y equilibrado */}
              <View style={styles.iconContainer}>
                <Ionicons name="log-out-outline" size={26} color={Colors.accentDanger} />
              </View>

              {/* Título y Mensaje descriptivo con contraste y jerarquía cuidada */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>

              {/* Fila de Acciones Ergonómicas (mínimo 48dp de área táctil) */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={loading}
                  activeOpacity={0.75}
                >
                  <Text style={styles.cancelButtonText}>Permanecer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={onConfirm}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.accentCream} />
                  ) : (
                    <>
                      <Ionicons name="exit-outline" size={16} color={Colors.accentCream} style={styles.confirmIcon} />
                      <Text style={styles.confirmButtonText}>Cerrar Sesión</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceCardBorder,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(144, 171, 139, 0.12)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(144, 171, 139, 0.25)',
    marginBottom: Spacing.md,
  },
  brandBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.accentSage,
    letterSpacing: 0.8,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  confirmButton: {
    flex: 1.15,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: '#992D2D',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmIcon: {
    marginRight: 6,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accentCream,
  },
});

