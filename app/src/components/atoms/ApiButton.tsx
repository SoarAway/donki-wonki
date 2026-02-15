import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

interface ApiButtonProps extends TouchableOpacityProps {
  title: string;
  onPressApi: () => Promise<void>;
  loading?: boolean;
}

export const ApiButton: React.FC<ApiButtonProps> = ({
  title,
  onPressApi,
  loading = false,
  style,
  ...props
}) => {
  const handlePress = async () => {
    if (loading) return;
    await onPressApi();
  };

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled, style]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.8}
      {...props}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonDisabled: {
    backgroundColor: '#A0C4FF',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
