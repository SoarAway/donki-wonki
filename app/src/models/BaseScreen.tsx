import React from 'react';
import {
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
  SafeAreaView,
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
    <SafeAreaView style={[styles.safeArea, backgroundColor ? { backgroundColor } : null, style]}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
