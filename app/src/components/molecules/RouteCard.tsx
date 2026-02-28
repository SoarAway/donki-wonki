import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {colorTokens, radius, shadows, spacing, typography} from '../config';

export interface RouteCardData {
  id: string;
  name: string;
  path: string;
  time: string;
}

interface RouteCardProps {
  route: RouteCardData;
  onPress: (routeId: string) => void;
  onDelete: (routeId: string) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({route, onPress, onDelete}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(route.id)} style={styles.card}>
      <Text style={styles.routeName}>{route.name}</Text>
      <Text style={styles.routePath}>{route.path}</Text>

      <View style={styles.scheduleList}>
        <Text style={styles.scheduleItem}>{route.time}</Text>
      </View>

      <TouchableOpacity onPress={() => onDelete(route.id)} style={styles.editButton}>
        <Text style={styles.editText}>delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colorTokens.surface_soft,
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[4] + 2,
    ...shadows.md,
    position: 'relative',
  },
  routeName: {
    fontSize: typography.sizes['2xl'] - 2,
    fontWeight: typography.weights.bold,
    color: colorTokens.text_primary,
    marginBottom: spacing[1] + 2,
  },
  routePath: {
    fontSize: typography.sizes.sm,
    color: colorTokens.text_secondary,
    marginBottom: spacing[2] + 2,
  },
  scheduleList: {
    marginBottom: spacing[6],
  },
  scheduleItem: {
    fontSize: typography.sizes.sm,
    color: colorTokens.secondary_accent,
    fontStyle: 'italic',
    lineHeight: typography.lineHeights.lg - 6,
  },
  editButton: {
    position: 'absolute',
    right: spacing[4] + 2,
    bottom: spacing[3] + 2,
  },
  editText: {
    fontSize: typography.sizes.sm,
    color: colorTokens.secondary_accent,
    textDecorationLine: 'underline',
    fontStyle: 'italic',
  },
});
