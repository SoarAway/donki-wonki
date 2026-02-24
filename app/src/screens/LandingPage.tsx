import React from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Text } from '../components/atoms/Text';
import { colors, radius, spacing } from '../components/config';
import { BaseScreen } from '../models/BaseScreen';

export interface LandingPageProps {
  onFinish: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onFinish }) => {
  const containerOpacity = React.useRef(new Animated.Value(0)).current;
  const titleTranslate = React.useRef(new Animated.Value(18)).current;
  const titleOpacity = React.useRef(new Animated.Value(0)).current;
  const subtitleOpacity = React.useRef(new Animated.Value(0)).current;
  const logoScale = React.useRef(new Animated.Value(0.84)).current;
  const orbOffset = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.94,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    const orbDrift = Animated.loop(
      Animated.sequence([
        Animated.timing(orbOffset, {
          toValue: 14,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbOffset, {
          toValue: -10,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslate, {
            toValue: 0,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(460),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    pulse.start();
    orbDrift.start();

    const timer = setTimeout(onFinish, 2600);

    return () => {
      clearTimeout(timer);
      pulse.stop();
      orbDrift.stop();
    };
  }, [
    containerOpacity,
    logoScale,
    onFinish,
    orbOffset,
    subtitleOpacity,
    titleOpacity,
    titleTranslate,
  ]);

  return (
    <BaseScreen>
      <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
        <Animated.View
          style={[
            styles.orbPrimary,
            { transform: [{ translateY: orbOffset }] },
          ]}
        />
        <Animated.View
          style={[
            styles.orbSecondary,
            { transform: [{ translateY: Animated.multiply(orbOffset, -1) }] },
          ]}
        />
        <Animated.View style={[styles.logoShell, { transform: [{ scale: logoScale }] }]}>
          <Text variant="2xl" weight="bold" color="neutral.0" align="center">
            DW
          </Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.titleWrap,
            { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] },
          ]}>
          <Text variant="3xl" weight="bold" color="text.primary" align="center">
            Donki-Wonki
          </Text>
        </Animated.View>
        <Animated.View style={[styles.subtitleWrap, { opacity: subtitleOpacity }]}>
          <Text variant="sm" color="text.secondary" align="center">
            Smarter rail alerts before your commute begins
          </Text>
        </Animated.View>
      </Animated.View>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing[6],
  },
  orbPrimary: {
    position: 'absolute',
    width: spacing[24] * 2,
    height: spacing[24] * 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary[100],
    top: spacing[6],
    left: -spacing[6],
  },
  orbSecondary: {
    position: 'absolute',
    width: spacing[20] * 2,
    height: spacing[20] * 2,
    borderRadius: radius.full,
    backgroundColor: colors.secondary[100],
    bottom: spacing[8],
    right: -spacing[8],
  },
  logoShell: {
    width: spacing[16] * 2,
    height: spacing[16] * 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  titleWrap: {
    marginBottom: spacing[2],
  },
  subtitleWrap: {
    maxWidth: spacing[24] * 3,
  },
});
