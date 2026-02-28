import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { colorTokens, radius, shadows, spacing, typography } from '../config';

interface Post {
  id: string;
  username?: string;
  content: string;
  timestamp: string;
  liked: boolean;
  disliked: boolean;
}

interface Icons {
  LikeFilledIcon: React.FC<SvgProps>;
  LikeIcon: React.FC<SvgProps>;
  DislikeFilledIcon: React.FC<SvgProps>;
  DislikeIcon: React.FC<SvgProps>;
}

interface ReportCardProps {
  post: Post;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  icons: Icons;
}

export const ReportCard: React.FC<ReportCardProps> = ({ post, onLike, onDislike, icons }) => {
  const { LikeFilledIcon, LikeIcon, DislikeFilledIcon, DislikeIcon } = icons;
  const LikeComponent = post.liked ? LikeFilledIcon : LikeIcon;
  const DislikeComponent = post.disliked ? DislikeFilledIcon : DislikeIcon;

  return (
    <View style={styles.card}>
      
      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.footer}>
        <View style={styles.actions}>
          <TouchableOpacity 
            onPress={() => onLike(post.id)} 
            style={styles.actionButton}
          >
            <LikeComponent width={22} height={22} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onDislike(post.id)} 
            style={styles.actionButton}
          >
            <DislikeComponent width={22} height={22} />
          </TouchableOpacity>
        </View>
        <Text style={styles.timestamp}>{post.timestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colorTokens.surface_soft,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginVertical: spacing[2],
    marginHorizontal: spacing[4],
    ...shadows.sm,
  },
  username: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    color: colorTokens.text_primary,
    marginBottom: spacing[1] + 2,
    fontStyle: 'italic',
  },
  content: {
    fontSize: typography.sizes.base,
    color: colorTokens.text_secondary,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.base - spacing[1],
    marginBottom: spacing[3],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: colorTokens.border_subtle,
    paddingTop: spacing[2] + 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[4] - 1,
  },
  actionButton: {
    padding: spacing[1],
  },
  timestamp: {
    fontSize: typography.sizes.xs,
    color: colorTokens.text_subtle,
    fontStyle: 'italic',
  },
});
