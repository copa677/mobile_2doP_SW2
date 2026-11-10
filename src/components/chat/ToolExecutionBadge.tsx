import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ToolExecutionBadgeProps {
  toolName: string;
  isExecuting?: boolean;
}

export const ToolExecutionBadge: React.FC<ToolExecutionBadgeProps> = ({
  toolName,
  isExecuting = false,
}) => {
  const getToolDisplayName = (name: string) => {
    switch (name) {
      case 'obtener_resumen_diario': return 'Consultando asistencia y caja diaria';
      case 'obtener_resumen_financiero': return 'Calculando MRR y balance mensual';
      case 'obtener_socios_en_riesgo': return 'Analizando inactividad y retención';
      case 'obtener_top_productos': return 'Consultando ventas de tienda';
      case 'obtener_rendimiento_clases': return 'Midiendo aforo de clases';
      default: return `Ejecutando: ${name}`;
    }
  };

  return (
    <View style={styles.badge}>
      {isExecuting ? (
        <ActivityIndicator size="small" color={Colors.accentSecondary} style={styles.spinner} />
      ) : (
        <Ionicons name="checkmark-circle" size={14} color={Colors.accentPrimary} style={styles.icon} />
      )}
      <Text style={styles.text}>{getToolDisplayName(toolName)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 4,
    marginVertical: 4,
  },
  spinner: {
    marginRight: 6,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
