import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Banner, Button, FormInput, styles } from '../../components/ui';
import { spacing } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+94|0)\d{9}$/;

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  // Same rules as the backend, checked here first so the user gets instant feedback
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (form.phone && !PHONE_RE.test(form.phone.trim())) e.phone = 'Use 0771234567 or +94771234567';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { marginBottom: spacing.lg }]}>Create your account</Text>
        <Banner message={serverError} />

        <FormInput label="Full name" value={form.name} onChangeText={set('name')} error={errors.name} />
        <FormInput
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />
        <FormInput
          label="Phone (optional)"
          value={form.phone}
          onChangeText={set('phone')}
          keyboardType="phone-pad"
          placeholder="0771234567"
          error={errors.phone}
        />
        <FormInput label="Password" value={form.password} onChangeText={set('password')} secureTextEntry error={errors.password} />
        <FormInput label="Confirm password" value={form.confirm} onChangeText={set('confirm')} secureTextEntry error={errors.confirm} />

        <Button title="Register" onPress={onSubmit} loading={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
