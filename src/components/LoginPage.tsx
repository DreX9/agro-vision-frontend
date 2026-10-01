import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  ImageBackground,
  ScrollView,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Colors, Radius, Spacing, Fonts } from '@/constants/theme';

interface LoginPageProps {
  onLogin: () => void;
}

const VALID_CREDENTIALS = [
  { email: 'admin@santaelena.pe', password: '1234' },
  { email: 'r.bustamante@santaelena.pe', password: '1234' },
  { email: 'admin', password: '1234' },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 860;

  const [email, setEmail] = useState('admin@santaelena.pe');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError('');
    setLoading(true);

    setTimeout(() => {
      const isValid = VALID_CREDENTIALS.some(
        c =>
          c.email.toLowerCase() === email.trim().toLowerCase() &&
          c.password === password.trim()
      );

      if (isValid) {
        onLogin();
      } else {
        setError('Correo o contraseña incorrectos. Usa las credenciales demo.');
      }
      setLoading(false);
    }, 600);
  };

  const handleUseDemo = () => {
    setEmail('admin@santaelena.pe');
    setPassword('1234');
    setError('');
  };

  return (
    <View style={styles.container}>
      {/* Left panel - Agricultural banner (visible on larger screens) */}
      {isLargeScreen && (
        <View style={styles.leftPanel}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&h=1300&fit=crop&auto=format',
            }}
            style={styles.bgImage}
            resizeMode="cover"
          >
            {/* Dark green gradient overlay */}
            <View style={styles.gradientOverlay}>
              <View style={styles.leftContent}>
                {/* Header Logo */}
                <View style={styles.logoRow}>
                  <View style={styles.logoIcon}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 22V12M12 12C12 12 7 9 5 4c3.5 0 6 2 7 8zM12 12C12 12 17 9 19 4c-3.5 0-6 2-7 8z"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M5 22h14" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  </View>
                  <View>
                    <Text style={styles.logoTitle}>AgroSanta Elena</Text>
                    <Text style={styles.logoSubtitle}>Sistema de Gestión Agrícola</Text>
                  </View>
                </View>

                {/* Hero text & stats */}
                <View style={styles.heroSection}>
                  <Text style={styles.heroTitle}>
                    Gestión inteligente{'\n'}de cultivos
                  </Text>
                  <Text style={styles.heroDesc}>
                    Monitoreo centralizado de parcelas, incidencias fitosanitarias y actividades agrícolas para Agrícola Santa Elena S.A.C.
                  </Text>

                  {/* Stats Counter */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statVal}>180+</Text>
                      <Text style={styles.statLabel}>Hectáreas</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statVal}>24</Text>
                      <Text style={styles.statLabel}>Parcelas</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statVal}>62</Text>
                      <Text style={styles.statLabel}>Trabajadores</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>
      )}

      {/* Right panel - Login form */}
      <View style={[styles.rightPanel, !isLargeScreen && styles.rightPanelFull]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            {/* Mobile Header Logo */}
            {!isLargeScreen && (
              <View style={styles.mobileLogoRow}>
                <View style={styles.mobileLogoIcon}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 22V12M12 12C12 12 7 9 5 4c3.5 0 6 2 7 8zM12 12C12 12 17 9 19 4c-3.5 0-6 2-7 8z"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path d="M5 22h14" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.mobileLogoTitle}>AgroSanta Elena</Text>
                  <Text style={styles.mobileLogoSubtitle}>Sistema de Gestión Agrícola</Text>
                </View>
              </View>
            )}

            {/* Title & description */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Iniciar sesión</Text>
              <Text style={styles.subtitle}>
                Ingresa tus credenciales para acceder al sistema
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {/* Email / User input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CORREO O USUARIO</Text>
                <TextInput
                  style={styles.input}
                  placeholder="correo@santaelena.pe"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={t => {
                    setEmail(t);
                    setError('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONTRASEÑA</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={t => {
                      setPassword(t);
                      setError('');
                    }}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(p => !p)}
                    activeOpacity={0.7}
                  >
                    {showPassword ? (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                          stroke={Colors.textSecondary}
                          strokeWidth={1.8}
                          strokeLinecap="round"
                        />
                        <Line
                          x1={1}
                          y1={1}
                          x2={23}
                          y2={23}
                          stroke={Colors.textSecondary}
                          strokeWidth={1.8}
                          strokeLinecap="round"
                        />
                      </Svg>
                    ) : (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                          stroke={Colors.textSecondary}
                          strokeWidth={1.8}
                          strokeLinecap="round"
                        />
                        <Circle
                          cx={12}
                          cy={12}
                          r={3}
                          stroke={Colors.textSecondary}
                          strokeWidth={1.8}
                        />
                      </Svg>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Banner */}
              {error !== '' && (
                <View style={styles.errorBox}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={12} r={10} stroke="#DC2626" strokeWidth={2} />
                    <Line x1={12} y1={8} x2={12} y2={12} stroke="#DC2626" strokeWidth={2} strokeLinecap="round" />
                    <Circle cx={12} cy={16} r={1} fill="#DC2626" />
                  </Svg>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>Iniciar sesión</Text>
                )}
              </TouchableOpacity>

              {/* Forgot password */}
              <TouchableOpacity style={styles.forgotButton} activeOpacity={0.7}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {/* Demo Hint */}
              <TouchableOpacity
                style={styles.demoBox}
                onPress={handleUseDemo}
                activeOpacity={0.8}
              >
                <Text style={styles.demoText}>
                  Demo: <Text style={styles.demoHighlight}>admin@santaelena.pe</Text> /{' '}
                  <Text style={styles.demoHighlight}>1234</Text>
                </Text>
              </TouchableOpacity>

              {/* Company Footer */}
              <Text style={styles.footerText}>
                Agrícola Santa Elena S.A.C. · Sistema de Gestión v1.0
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F7FAF8',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : {}),
  },
  leftPanel: {
    flex: 1.15,
    backgroundColor: Colors.sidebarBg,
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 28, 20, 0.72)',
    padding: Spacing.xxxl,
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts?.display || 'System',
  },
  logoSubtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontFamily: Fonts?.mono || 'monospace',
  },
  heroSection: {
    maxWidth: 420,
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 46,
    marginBottom: Spacing.md,
    fontFamily: Fonts?.display || 'System',
  },
  heroDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.xxl,
    fontFamily: Fonts?.sans || 'System',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxxl,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Fonts?.display || 'System',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: Fonts?.sans || 'System',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPanelFull: {
    backgroundColor: '#F7FAF8',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    width: '100%',
  },
  formCard: {
    width: '100%',
    maxWidth: 390,
  },
  mobileLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  mobileLogoIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileLogoTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts?.display || 'System',
  },
  mobileLogoSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts?.mono || 'monospace',
  },
  titleSection: {
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts?.display || 'System',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: Fonts?.sans || 'System',
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    fontFamily: Fonts?.mono || 'monospace',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts?.sans || 'System',
    height: 48,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts?.display || 'System',
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  forgotText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  demoBox: {
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  demoText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Fonts?.mono || 'monospace',
  },
  demoHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: Spacing.lg,
    fontFamily: Fonts?.sans || 'System',
  },
});
