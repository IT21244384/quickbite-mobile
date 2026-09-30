import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Banner, Button, FormInput, styles } from '../../components/ui';
import { colors, spacing } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // AuthContext now has a user, so the navigator switches to the app screens
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 34, fontWeight: '800', color: colors.primary }}>QuickBite</Text>
          <Text style={styles.muted}>Order your favourite food in a few taps</Text>
        </View>

        <Banner message={serverError} />

        <FormInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          error={errors.email}
        />
        <FormInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Your password"
          error={errors.password}
        />

        <Button title="Log in" onPress={onSubmit} loading={submitting} />

        <Button
          title="Create an account"
          variant="outline"
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
