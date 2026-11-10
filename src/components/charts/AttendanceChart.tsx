import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { DailyReportClassItem } from '@/types/reports';

interface AttendanceChartProps {
  classes: DailyReportClassItem[];
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ classes }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ocupación de Clases Grupales</Text>
      {classes.map((c) => {
        const isFull = c.ocupacion_porcentaje >= 95;
        const barColor = isFull ? Colors.accentDanger : Colors.accentSecondary;

        return (
          <View key={c.id} style={styles.row}>
            <View style={styles.textColumn}>
              <View style={styles.classHeader}>
                <Text style={styles.className}>{c.nombre}</Text>
                <Text style={styles.classTime}>{c.hora} • {c.instructor}</Text>
              </View>
              <Text style={styles.occupancyLabel}>
                {c.asistentes}/{c.capacidad} ({c.ocupacion_porcentaje}%)
              </Text>
            </View>

            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(c.ocupacion_porcentaje, 100)}%`,
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  row: {
    marginBottom: Spacing.md,
  },
  textColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  classHeader: {
    flex: 1,
  },
  className: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  classTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  occupancyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressBackground: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
