import React from 'react';
import {Alert, StyleSheet, View} from 'react-native';

import {Button, Input, Text} from '../components/atoms';
import {colors, radius, spacing} from '../components/config';
import {registerUser} from '../services/api/apiEndpoints';
import {
  firstValidationError,
  hasValidationErrors,
  matchValue,
  minLength,
  requireValue,
  validateEmail,
} from '../utils/authValidation';

export interface RegistrationScreenProps {
  onBackToLogin: () => void;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({onBackToLogin}) => {
  const [email, setEmail] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const [emailError, setEmailError] = React.useState('');
  const [usernameError, setUsernameError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [confirmPasswordError, setConfirmPasswordError] = React.useState('');

  const handleRegister = async () => {
    const errors = {
      email: validateEmail(email, 'Enter a valid email address.'),
      username: requireValue(username, 'Username is required.'),
      password: firstValidationError(
        minLength(password, 8, 'Password must be at least 8 characters.'),
      ),
      confirmPassword: matchValue(
        confirmPassword,
        password,
        'Passwords do not match.',
      ),
    };

    setEmailError(errors.email);
    setUsernameError(errors.username);
    setPasswordError(errors.password);
    setConfirmPasswordError(errors.confirmPassword);

    if (hasValidationErrors(errors)) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await registerUser({
        email: email.trim(),
        username: username.trim(),
        password,
      });
      Alert.alert('Registration Success', response.message);
      onBackToLogin();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to register now.';
      Alert.alert('Registration Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text variant="2xl" weight="bold" color="text.primary" align="center">
          Register
        </Text>
        <Text variant="sm" color="text.secondary" align="center" style={styles.subtitle}>
          Create a new account
        </Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@example.com"
          error={emailError}
        />

        <Input
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="your_username"
          error={usernameError}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="At least 8 characters"
          error={passwordError}
        />

        <Input
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Re-enter password"
          error={confirmPasswordError}
        />

        <View style={styles.actions}>
          <Button
            label="Register"
            onPress={handleRegister}
            loading={submitting}
            fullWidth
          />
          <Button
            label="Back to Login"
            onPress={onBackToLogin}
            variant="outline"
            fullWidth
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    backgroundColor: colors.background.default,
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: radius.lg,
    padding: spacing[5],
    gap: spacing[2],
  },
  subtitle: {
    marginBottom: spacing[3],
  },
  actions: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
});
