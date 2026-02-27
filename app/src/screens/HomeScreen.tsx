import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '../components/atoms/Button';
import Logo from '../assets/Logo.svg';
import { NavBar } from '../components/molecules/NavBar';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, radius, spacing, typography } from '../components/config';

const LOGO_SIZE = spacing[20] + spacing[2];

interface HomeScreenProps {
  apiStatus: string;
  permissionStatus: string;
  tokenPreview: string;
  lastForegroundMessage: string;
  onGoToRoutes: () => void;
  onGoToCommunity: () => void;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  apiStatus,
  permissionStatus,
  tokenPreview,
  lastForegroundMessage,
  onGoToRoutes,
  onGoToCommunity,
  onLogout,
}) => {
  const disruptions = [
    {
      id: '1',
      title: 'Disruption in Kelana Jaya Line',
      message: 'Leave 30 minutes earlier to reach destination on time',
      timestamp: '4 mins ago',
    },
  ];

  const upcomingRoutes = [
    {
      id: '1',
      name: 'Work',
      path: 'LRT Bandar Puteri - LRT SS15',
      schedule: 'Monday 7:00a.m.',
    },
    {
      id: '2',
      name: 'Home',
      path: 'LRT SS15 - LRT Bandar Puteri',
      schedule: 'Monday 5:00p.m.',
    },
  ];

  return (
    <BaseScreen style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome!!</Text>
          <TouchableOpacity onPress={onLogout} activeOpacity={0.8} style={styles.logo}>
            <Logo width={LOGO_SIZE} height={LOGO_SIZE} />
          </TouchableOpacity>
        </View>

        {disruptions.map(alert => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertTitleRow}>
              <Text style={styles.alertIcon}>🚫</Text>
              <Text style={styles.alertTitle}>{alert.title}</Text>
            </View>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Upcoming Route</Text>

        {upcomingRoutes.map(route => (
          <View key={route.id} style={styles.routeCard}>
            <Text style={styles.routeName}>{route.name}</Text>
            <Text style={styles.routePath}>{route.path}</Text>
            <Text style={styles.routeSchedule}>{route.schedule}</Text>
          </View>
        ))}

        <View style={styles.actions}>
          <Button title="Manage Routes" onPress={onGoToRoutes} />
          <Button title="Open Community" onPress={onGoToCommunity} />
          <Button title="Logout" onPress={onLogout} />
        </View>

      </ScrollView>

      <NavBar
        activeTab="Home"
        onTabPress={tab => {
          if (tab === 'Route') {
            onGoToRoutes();
          } else if (tab === 'Community') {
            onGoToCommunity();
          }
        }}
      />
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorTokens.background_default,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: spacing[8],
    paddingTop: spacing[24],
    paddingBottom: spacing[24] + spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6] + spacing[1],
  },
  welcomeText: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colorTokens.text_primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  alertCard: {
    backgroundColor: colorTokens.error_background,
    borderRadius: radius.lg + 2,
    padding: spacing[4],
    marginBottom: spacing[6] + spacing[1],
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1] + 2,
  },
  alertIcon: {
    fontSize: typography.sizes.lg,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colorTokens.text_primary,
    flexShrink: 1,
  },
  alertMessage: {
    fontSize: typography.sizes.xs + 1,
    color: colorTokens.text_secondary,
    marginBottom: spacing[2],
    lineHeight: typography.lineHeights.sm - 2,
  },
  alertTimestamp: {
    fontSize: typography.sizes.xs,
    color: colorTokens.error_text,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: typography.sizes['2xl'] - 2,
    fontWeight: typography.weights.bold,
    color: colorTokens.text_primary,
    marginBottom: spacing[4],
    letterSpacing: typography.letterSpacing.tight,
  },
  routeCard: {
    backgroundColor: colorTokens.surface_muted,
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  routeName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colorTokens.text_primary,
    marginBottom: spacing[1],
  },
  routePath: {
    fontSize: typography.sizes.sm,
    color: colorTokens.text_secondary,
    marginBottom: spacing[1] + 2,
  },
  routeSchedule: {
    fontSize: typography.sizes.sm,
    color: colorTokens.link,
    fontStyle: 'italic',
  },
  statusCard: {
    backgroundColor: colorTokens.surface_soft,
    borderRadius: radius.lg + 2,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  statusText: {
    fontSize: typography.sizes.xs + 1,
    color: colorTokens.text_strong,
    marginBottom: spacing[1] + 2,
  },
  actions: {
    gap: spacing[2] + 2,
    marginBottom: spacing[2],
  },
});
