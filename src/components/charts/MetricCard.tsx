import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  badgeText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  iconName,
  accentColor = Colors.accentPrimary,
  badgeText,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrapper, { backgroundColor: `${accentColor}1A` }]}>
          <Ionicons name={iconName} size={18} color={accentColor} />
        </View>
        {badgeText && (
          <View style={[styles.badge, { backgroundColor: `${accentColor}20` }]}>
            <Text style={[styles.badgeText, { color: accentColor }]}>{badgeText}</Text>
          </View>
        )}
      </View>

      <Text style={styles.valueText}>{value}</Text>
      <Text style={styles.labelText}>{label.toUpperCase()}</Text>
      {subValue && <Text style={styles.subValueText}>{subValue}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flex: 1,
    minWidth: 150,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  subValueText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
