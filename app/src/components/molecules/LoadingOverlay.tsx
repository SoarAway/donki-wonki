import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Box } from '../atoms/Box';
import { Text } from '../atoms/Text';
import { Spinner } from '../atoms/Spinner';
import {colorTokens, spacing} from '../config';

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * Full-screen loading overlay used during API and startup operations.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <Box
          padding={6}
          backgroundColor="background_default"
          borderRadius="lg"
          align="center"
          gap={spacing[4]}>
          <Spinner size="large" color={colorTokens.primary_accent} />
          <Text variant="base" weight="medium" color="text.primary">
            {message}
          </Text>
        </Box>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
