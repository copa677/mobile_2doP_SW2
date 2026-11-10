import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllSessions,
  deleteChatSession,
  getSessionMessages,
} from '../../services/storage/chatHistoryDb';
import { ChatSession, ChatMessage } from '../../types/reports';

export default function AdminHistoryScreen() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await getAllSessions();
      setSessions(data);
    } catch (e: any) {
      console.warn('Error cargando historial:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSelectSession = async (session: ChatSession) => {
    setSelectedSession(session);
    const msgs = await getSessionMessages(session.id);
    setSessionMessages(msgs);
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert('Eliminar Sesión', '¿Estás seguro de que deseas eliminar este reporte?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteChatSession(sessionId);
          if (selectedSession?.id === sessionId) {
            setSelectedSession(null);
            setSessionMessages([]);
          }
          loadSessions();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>APEX INTELLIGENCE • SQLite</Text>
          <Text style={styles.headerTitle}>
            {selectedSession ? 'Detalle de Sesión' : 'Historial de Reportes'}
          </Text>
        </View>
        {selectedSession && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedSession(null)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.accentSage} />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        )}
      </View>

      {!selectedSession ? (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadSessions}
              tintColor={Colors.accentSage}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No hay sesiones de consulta previas.</Text>
              <Text style={styles.emptySubText}>
                Las preguntas y reportes generados con Qwen se guardarán aquí automáticamente.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() => handleSelectSession(item)}
              activeOpacity={0.7}
            >
              <View style={styles.sessionIconWrapper}>
                <Ionicons name="chatbubbles-outline" size={20} color={Colors.accentSage} />
              </View>
              <View style={styles.sessionTextCol}>
                <Text style={styles.sessionTitle} numberOfLines={1}>
                  {item.title || 'Consulta Ejecutiva'}
                </Text>
                <Text style={styles.sessionDate}>
                  {new Date(item.created_at).toLocaleString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteSession(item.id)}
                style={styles.deleteBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.accentDanger} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={sessionMessages}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={[styles.roleTag, isUser ? styles.userTag : styles.assistantTag]}>
                  {isUser ? 'TÚ (ADMIN)' : 'APEX SLM'}
                </Text>
                <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
                  {item.content}
                </Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceElevated,
  },
  appName: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.accentSage,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  backButtonText: {
    color: Colors.accentSage,
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: Spacing.md,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sessionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(144, 171, 139, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  sessionTextCol: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  deleteBtn: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  messageBubble: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    maxWidth: '90%',
  },
  userBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: Colors.surfaceCard,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.surfaceCardBorder,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  userTag: {
    color: Colors.accentCream,
  },
  assistantTag: {
    color: Colors.accentSage,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  userText: {
    color: Colors.accentCream,
  },
  assistantText: {
    color: Colors.textPrimary,
  },
});

