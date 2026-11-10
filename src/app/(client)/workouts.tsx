import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { clientService } from '../../services/client/clientService';
import { WorkoutDayRoutine, WorkoutExercise } from '../../types/client';
import { useAuth } from '@/context/AuthContext';

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<WorkoutDayRoutine[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutines();
  }, [user]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      const data = await clientService.getMyWorkouts(user?.id);
      setRoutines(data);
      // Auto-select today if found
      const todayIndex = data.findIndex((r) => r.esDiaHoy);
      if (todayIndex >= 0) {
        setSelectedDayIndex(todayIndex);
      }
    } catch (error) {
      console.error('Error al cargar rutinas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExercise = (exerciseId: string) => {
    // 1. Notificar al servicio para actualizar el registro en memoria
    clientService.toggleExercise(selectedDayIndex, exerciseId);

    // 2. Actualización instantánea en el estado de React sin parpadeo de red
    setRoutines((prevRoutines) => {
      return prevRoutines.map((routine, rIdx) => {
        if (rIdx !== selectedDayIndex) return routine;
        return {
          ...routine,
          ejercicios: routine.ejercicios.map((ex) => {
            if (ex.id === exerciseId) {
              return { ...ex, completado: !ex.completado };
            }
            return ex;
          }),
        };
      });
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.accentSage} />
          <Text style={styles.loadingText}>Cargando rutina semanal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentRoutine = routines[selectedDayIndex] || routines[0];
  const exercises = currentRoutine?.ejercicios || [];
  const completedCount = exercises.filter((e: WorkoutExercise) => e.completado).length;
  const totalCount = exercises.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header fijo superior con margen seguro de la barra de estado */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>PLAN DE ENTRENAMIENTO</Text>
        <Text style={styles.headerTitle}>Mi Rutina Semanal</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Day Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScroll}
        >
          {routines.map((day: WorkoutDayRoutine, idx: number) => {
            const isSelected = idx === selectedDayIndex;
            const dayCompleted =
              day.ejercicios.length > 0 &&
              day.ejercicios.every((e: WorkoutExercise) => e.completado);
            return (
              <TouchableOpacity
                key={day.diaSemana}
                style={[styles.dayChip, isSelected && styles.dayChipActive]}
                onPress={() => setSelectedDayIndex(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                  {day.diaSemana}
                </Text>
                {day.esDiaHoy && (
                  <View style={[styles.todayIndicator, isSelected && styles.todayIndicatorActive]}>
                    <Text style={[styles.todayIndicatorText, isSelected && styles.todayIndicatorTextActive]}>
                      HOY
                    </Text>
                  </View>
                )}
                {dayCompleted && (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={isSelected ? Colors.forestDeep : Colors.accentSage}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Routine Header */}
        {currentRoutine && (
          <View style={styles.routineHeaderCard}>
            <View style={styles.routineHeaderTop}>
              <View style={styles.routineHeaderLeft}>
                <Text style={styles.routineTitle}>{currentRoutine.titulo}</Text>
                <Text style={styles.routineSubtitle}>
                  {currentRoutine.esDiaHoy ? 'Sesión sugerida para hoy' : 'Planificación semanal'}
                </Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                <Text style={styles.progressLabel}>
                  {completedCount}/{totalCount}
                </Text>
              </View>
            </View>

            {/* Barra de progreso lineal fluida */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressBarLabel}>
                {completedCount === totalCount && totalCount > 0
                  ? '¡Rutina del día completada!'
                  : `${completedCount} de ${totalCount} ejercicios finalizados`}
              </Text>
            </View>
          </View>
        )}

        {/* Exercise List */}
        <View style={styles.exerciseList}>
          <Text style={styles.sectionTitle}>Ejercicios de la sesión</Text>
          {exercises.map((exercise: WorkoutExercise, index: number) => {
            return (
              <TouchableOpacity
                key={exercise.id}
                style={[styles.exerciseCard, exercise.completado && styles.exerciseCardCompleted]}
                onPress={() => handleToggleExercise(exercise.id)}
                activeOpacity={0.8}
              >
                <View style={styles.exerciseLeft}>
                  <View
                    style={[styles.checkbox, exercise.completado && styles.checkboxCompleted]}
                  >
                    {exercise.completado && (
                      <Ionicons name="checkmark" size={16} color={Colors.forestDeep} />
                    )}
                  </View>

                  <View style={styles.exerciseInfo}>
                    <Text
                      style={[
                        styles.exerciseName,
                        exercise.completado && styles.exerciseNameCompleted,
                      ]}
                    >
                      {index + 1}. {exercise.nombre}
                    </Text>
                    <Text style={styles.exerciseMuscle}>{exercise.grupoMuscular}</Text>

                    <View style={styles.exerciseMetaRow}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {exercise.series} series × {exercise.repeticiones}
                        </Text>
                      </View>
                      {exercise.pesoSugerido && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{exercise.pesoSugerido}</Text>
                        </View>
                      )}
                      {exercise.descansoSegundos && (
                        <View style={styles.badge}>
                          <Ionicons name="timer-outline" size={11} color={Colors.textSecondary} />
                          <Text style={[styles.badgeText, { marginLeft: 3 }]}>
                            {exercise.descansoSegundos}s desc.
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Ionicons
                  name={exercise.completado ? 'checkmark-circle' : 'chevron-forward'}
                  size={20}
                  color={exercise.completado ? Colors.accentSage : Colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.accentSage} />
          <Text style={styles.tipText}>
            Toca cualquier ejercicio para marcarlo como completado. Tu instructor asignará nuevas
            rutinas según tus avances en cada evaluación.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.forestDeep,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.forestDeep,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentSage,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.forestDeep,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.forestDeep,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  daysScroll: {
    paddingTop: 6,
    paddingBottom: 16,
    gap: 8,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
  },
  dayChipActive: {
    backgroundColor: Colors.accentSage,
    borderColor: Colors.accentSage,
  },
  dayChipText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  dayChipTextActive: {
    color: Colors.forestDeep,
    fontWeight: '700',
  },
  todayIndicator: {
    backgroundColor: 'rgba(144, 171, 139, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  todayIndicatorActive: {
    backgroundColor: Colors.forestDeep,
  },
  todayIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accentSage,
    letterSpacing: 0.5,
  },
  todayIndicatorTextActive: {
    color: Colors.accentCream,
  },
  routineHeaderCard: {
    backgroundColor: Colors.surfaceElevated,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
    marginBottom: 20,
  },
  routineHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surfaceLighter,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accentSage,
    borderRadius: 3,
  },
  progressBarLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accentCream,
  },
  routineHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  routineSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceLighter,
    borderWidth: 2,
    borderColor: Colors.accentSage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentText: {
    color: Colors.accentCream,
    fontWeight: '800',
    fontSize: 16,
  },
  progressLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accentSage,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  exerciseList: {
    marginBottom: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
    marginBottom: 10,
  },
  exerciseCardCompleted: {
    opacity: 0.65,
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.primaryMuted,
  },
  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.accentSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkboxCompleted: {
    backgroundColor: Colors.accentSage,
    borderColor: Colors.accentSage,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  exerciseMuscle: {
    fontSize: 12,
    color: Colors.accentSage,
    marginTop: 2,
    marginBottom: 6,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLighter,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(90, 120, 99, 0.15)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(144, 171, 139, 0.3)',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
