import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface QuickPromptChipsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPromptChips: React.FC<QuickPromptChipsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const chips = [
    { label: 'Resumen de hoy', prompt: '¿Cómo estuvo la asistencia, recaudación y clases de hoy?', icon: 'calendar-outline' as const },
    { label: 'Finanzas del mes', prompt: 'Dame el balance financiero de este mes, ingresos, MRR y morosidad', icon: 'cash-outline' as const },
    { label: 'Socios en riesgo', prompt: '¿Qué socios tienen más de 14 días sin venir y qué política de retención les aplica?', icon: 'alert-circle-outline' as const },
    { label: 'Top suplementos', prompt: '¿Cuáles son los productos más vendidos en la tienda este mes?', icon: 'barbell-outline' as const },
    { label: 'Aforo de clases', prompt: '¿Cuál es la ocupación promedio de las clases de spinning y crossfit?', icon: 'people-outline' as const },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chips.map((chip, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.chip, disabled && styles.chipDisabled]}
          onPress={() => onSelectPrompt(chip.prompt)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name={chip.icon} size={14} color={Colors.accentSecondary} style={styles.icon} />
          <Text style={styles.chipText}>{chip.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
