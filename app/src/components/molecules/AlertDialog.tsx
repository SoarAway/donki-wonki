import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import {colorTokens, radius, spacing} from '../config';

export interface AlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

/**
 * Modal dialog for presenting blocking error or status messages.
 */
export const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  title,
  message,
  onClose,
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        <View style={styles.backdrop} />
        <View style={styles.dialog}>
          <Text variant="xl" weight="bold" color="text.primary" align="center">
            {title}
          </Text>
          <Text variant="base" color="text.secondary" align="center" style={styles.message}>
            {message}
          </Text>
          <View style={styles.actions}>
            <Button label="OK" onPress={onClose} fullWidth />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colorTokens.primary_accent,
    opacity: 0.45,
  },
  dialog: {
    width: '100%',
    maxWidth: spacing[24] * 3,
    backgroundColor: colorTokens.background_default,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[3],
  },
  message: {
    marginTop: spacing[1],
  },
  actions: {
    marginTop: spacing[2],
  },
});
