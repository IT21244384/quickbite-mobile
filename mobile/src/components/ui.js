// Small reusable UI pieces used across screens
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, spacing, STATUS_COLORS } from '../theme';

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }) {
  const isDisabled = disabled || loading;
  const variantStyle = {
    primary: { backgroundColor: colors.primary },
    danger: { backgroundColor: colors.danger },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
    secondary: { backgroundColor: colors.text },
  }[variant];
  const textColor = variant === 'outline' ? colors.primary : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        (pressed || isDisabled) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>}
    </Pressable>
  );
}

export function FormInput({ label, error, style, ...props }) {
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, error && { borderColor: colors.danger }, props.multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function LoadingView({ message = 'Loading...' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, message, actionTitle, onAction }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={[styles.muted, { textAlign: 'center' }]}>{message}</Text> : null}
      {actionTitle ? <Button title={actionTitle} onPress={onAction} style={{ marginTop: spacing.lg, minWidth: 160 }} /> : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={[styles.muted, { textAlign: 'center' }]}>{message}</Text>
      {onRetry ? <Button title="Try again" onPress={onRetry} style={{ marginTop: spacing.lg, minWidth: 160 }} /> : null}
    </View>
  );
}

export function Banner({ message, type = 'error' }) {
  if (!message) return null;
  const color = type === 'error' ? colors.danger : colors.success;
  return (
    <View style={[styles.banner, { borderColor: color, backgroundColor: `${color}15` }]}>
      <Text style={{ color }}>{message}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || colors.muted;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: color }]}>
      <Text style={{ color, fontWeight: '600', fontSize: 12 }}>{status}</Text>
    </View>
  );
}

export function QuantityStepper({ value, onChange, min = 1, max = 20 }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepBtn} disabled={value <= min}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepBtn} disabled={value >= max}>
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { color: colors.muted, marginTop: spacing.xs },
  label: { fontWeight: '600', marginBottom: spacing.xs, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  errorText: { color: colors.danger, marginTop: spacing.xs, fontSize: 13 },
  button: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  banner: { borderWidth: 1, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  stepBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  stepText: { fontSize: 20, color: colors.primary, fontWeight: '700' },
  stepValue: { minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: '600' },
});
