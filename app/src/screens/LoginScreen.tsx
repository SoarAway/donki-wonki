import React from 'react';
import {Alert, StyleSheet, View} from 'react-native';

import {Button, Input, Text} from '../components/atoms';
import {colors, radius, spacing} from '../components/config';
import {registerUser} from '../services/api/apiEndpoints';

export interface LoginScreenProps {
  onBack: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({onBack}) => {
  const [email, setEmail] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const [emailError, setEmailError] = React.useState('');
  const [usernameError, setUsernameError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');

  const validateForm = () => {
    let valid = true;

    if (!email.trim() || !email.includes('@')) {
      setEmailError('Enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!username.trim()) {
      setUsernameError('Username is required.');
      valid = false;
    } else {
      setUsernameError('');
    }

    if (!password.trim() || password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await registerUser({
        email: email.trim(),
        username: username.trim(),
        password,
      });
      Alert.alert('Success', response.message);
      onBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit user info.';
      Alert.alert('Request Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text variant="2xl" weight="bold" color="text.primary" align="center">
          Login
        </Text>
        <Text variant="sm" color="text.secondary" align="center" style={styles.subtitle}>
          Enter your info to send to the server
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

        <View style={styles.actions}>
          <Button
            label="Back"
            onPress={onBack}
            variant="outline"
            fullWidth
          />
          <Button
            label="Send To Server"
            onPress={handleSubmit}
            loading={submitting}
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
