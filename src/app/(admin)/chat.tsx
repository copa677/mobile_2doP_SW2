import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { QuickPromptChips } from '../../components/chat/QuickPromptChips';
import { ToolExecutionBadge } from '../../components/chat/ToolExecutionBadge';
import { processUserQuery } from '../../services/llm/llmRunner';
import { createChatSession, insertMessage } from '../../services/storage/chatHistoryDb';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsCalled?: string[];
  isStepProgress?: boolean;
}

export default function AdminChatScreen() {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '¡Hola! Soy tu asistente ejecutivo Apex con SLM local. Puedo generar reportes dinámicos sobre asistencia, finanzas/MRR, cobros pendientes o socios en riesgo de abandono consultando las métricas en tiempo real. ¿Qué deseas analizar hoy?',
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => `sess_${Date.now()}`);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if (!textToSend || loading) return;

    setInputText('');
    const userMsg: MessageItem = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setActiveStep('Analizando intención y seleccionando herramientas de consulta...');

    try {
      await insertMessage(sessionId, 'user', textToSend);

      const result = await processUserQuery(textToSend, (step) => {
        setActiveStep(step);
      });

      const assistantMsg: MessageItem = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: result.narrativeText,
        toolsCalled: result.toolsCalled,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      await insertMessage(
        sessionId,
        'assistant',
        result.narrativeText,
        result.toolsCalled ? JSON.stringify(result.toolsCalled) : undefined
      );
    } catch (error: any) {
      const errorMsg: MessageItem = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Error al procesar la consulta con el modelo local: ${error.message || 'Error desconocido'}. Verifica que el servicio BFF esté disponible.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setActiveStep(null);
    }
  };

  const handleNewSession = async () => {
    const newId = `sess_${Date.now()}`;
    setSessionId(newId);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Nueva sesión iniciada. ¿Qué datos de tu club requieres auditar o proyectar?',
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>APEX INTELLIGENCE • ON-DEVICE SLM</Text>
            <Text style={styles.headerTitle}>Consulta y Reportes IA</Text>
          </View>
          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={handleNewSession}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.accentSage} />
            <Text style={styles.newChatText}>Nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* Message Stream */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {!isUser && (
                  <View style={styles.assistantHeader}>
                    <Ionicons name="sparkles" size={13} color={Colors.accentSage} />
                    <Text style={styles.assistantLabel}>Qwen Local 1.5B</Text>
                  </View>
                )}
                <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
                  {item.content}
                </Text>

                {item.toolsCalled && item.toolsCalled.length > 0 && (
                  <View style={styles.toolsWrapper}>
                    {item.toolsCalled.map((tool: string, idx: number) => (
                      <ToolExecutionBadge key={idx} toolName={tool} />
                    ))}
                  </View>
                )}
              </View>
            );
          }}
        />

        {/* Live Step Indicator */}
        {activeStep && (
          <View style={styles.stepIndicator}>
            <ActivityIndicator size="small" color={Colors.accentSage} style={{ marginRight: 8 }} />
            <Text style={styles.stepText}>{activeStep}</Text>
          </View>
        )}

        {/* Quick Suggestions Chips */}
        <View style={styles.chipsSection}>
          <QuickPromptChips onSelectPrompt={(p) => handleSend(p)} disabled={loading} />
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Pregunta sobre ingresos, retención, asistencias..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            editable={!loading}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.forestDeep} />
            ) : (
              <Ionicons name="arrow-up" size={20} color={Colors.forestDeep} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  newChatText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accentSage,
  },
  messageList: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  messageBubble: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    maxWidth: '88%',
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
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  assistantLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentSage,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: Colors.accentCream,
  },
  assistantText: {
    color: Colors.textPrimary,
  },
  toolsWrapper: {
    marginTop: 8,
    gap: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(90, 120, 99, 0.15)',
    marginHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: 6,
  },
  stepText: {
    fontSize: 12,
    color: Colors.accentSage,
    fontStyle: 'italic',
  },
  chipsSection: {
    paddingBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    color: Colors.textPrimary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accentSage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceHighlight,
    opacity: 0.5,
  },
});
