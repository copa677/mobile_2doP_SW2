import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'identifier' | 'password' | null>(null);

  const handleLogin = async () => {
    const idToUse = identifier.trim();
    const passToUse = password;

    if (!idToUse || !passToUse) {
      setErrorMsg('Por favor completa todos los campos');
      return;
    }

    setErrorMsg(null);
    try {
      const user = await login({ identifier: idToUse, password: passToUse });
      if (user.role === 'ADMINISTRADOR') {
        router.replace('/(admin)' as any);
      } else if (user.role === 'CLIENTE') {
        router.replace('/(client)' as any);
      } else if (user.role === 'RECEPCIONISTA') {
        router.replace('/(receptionist)' as any);
      } else {
        router.replace('/unauthorized' as any);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al autenticar credenciales');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo y Encabezado de Marca */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="barbell" size={32} color={Colors.accentCream} />
            </View>
            <Text style={styles.brandTitle}>APEX FITNESS</Text>
            <Text style={styles.brandSubtitle}>GymPulse Executive & Member App</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>Administración, Recepción & Socios</Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>
            <Text style={styles.formDescription}>
              Ingresa con tu correo corporativo, carnet de identidad o código de socio.
            </Text>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.accentDanger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Input Identificador */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IDENTIFICADOR (EMAIL / CÓDIGO / CI)</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'identifier' && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={focusedField === 'identifier' ? Colors.accentSage : Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="admin@apexfitness.com"
                  placeholderTextColor={Colors.textMuted}
                  value={identifier}
                  onChangeText={setIdentifier}
                  onFocus={() => setFocusedField('identifier')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Input Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONTRASEÑA</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={focusedField === 'password' ? Colors.accentSage : Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="•••••••"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Principal */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.accentCream} />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Entrar al Sistema</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.accentCream} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.accentPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.accentCream,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleTag: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  roleTagText: {
    fontSize: 11,
    color: Colors.accentSage,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  formDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderColor: Colors.accentDanger,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: Colors.accentDanger,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderSubtle,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputWrapperFocused: {
    borderColor: Colors.accentSage,
    backgroundColor: 'rgba(144, 171, 139, 0.08)',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    height: 48,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  loginBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.accentPrimary,
    borderRadius: Radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accentCream,
  },
});
