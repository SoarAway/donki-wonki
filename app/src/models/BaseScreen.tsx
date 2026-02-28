import React from 'react';
import {
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface BaseScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
  keyboardBehavior?: KeyboardAvoidingViewProps['behavior'];
}

export const BaseScreen: React.FC<BaseScreenProps> = ({
  children,
  backgroundColor,
  style,
  keyboardAvoiding = false,
  keyboardBehavior,
}) => {
  const content = <View style={styles.content}>{children}</View>;

  return (
    <View style={[styles.root, backgroundColor ? { backgroundColor } : null, style]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={keyboardBehavior ?? (Platform.OS === 'ios' ? 'padding' : 'height')}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
