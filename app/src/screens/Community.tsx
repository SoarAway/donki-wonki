import React, {useCallback, useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import { Button } from '../components/atoms/Button';
import { NavBar } from '../components/molecules/NavBar';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, radius, spacing, typography } from '../components/config';
import { ReportCard } from '../components/molecules/ReportCard';
import DislikeIcon from '../assets/Dislike.svg';
import DislikeFilledIcon from '../assets/Dislike_Filled.svg';
import LikeIcon from '../assets/Like.svg';
import LikeFilledIcon from '../assets/Like_Filled.svg';
import {getTopReports} from '../services/api/apiEndpoints';

interface Post {
    id: string;
    username?: string;
    content: string;
    timestamp: string;
    liked: boolean;
    disliked: boolean;
}

export default function Community({ navigation }: any) {
    const [posts, setPosts] = useState<Post[]>([]);

    const pickString = (source: Record<string, unknown>, keys: string[]): string | null => {
      for (const key of keys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim().length > 0) {
          return value.trim();
        }
      }
      return null;
    };

    const formatTimestamp = (raw: string | null): string => {
      if (!raw) {
        return 'Just now';
      }

      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) {
        return raw;
      }

      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
      if (diffMinutes < 60) {
        return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
      }

      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      }

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const loadTopReports = useCallback(async () => {
      try {
        const response = await getTopReports();
        const records = Array.isArray(response.reports) ? response.reports : [];
        const mappedPosts = records.map((record, index) => {
          const report = record as Record<string, unknown>;
          const line = pickString(report, ['line', 'line_name']) ?? 'Unknown Line';
          const station = pickString(report, ['station', 'station_name']) ?? 'Unknown Station';
          const incidentType =
            pickString(report, ['incident_type', 'incidentType', 'type']) ?? 'Incident';
          const description = pickString(report, ['description', 'content']) ?? 'No details available';
          const username = pickString(report, ['username', 'reporter', 'user']) ?? '@community';
          const timestamp = formatTimestamp(
            pickString(report, ['created_at', 'timestamp', 'reported_at', 'datetime']),
          );
          const reportId = pickString(report, ['report_id', 'id']) ?? `top-report-${index + 1}`;

          return {
            id: reportId,
            username: username.startsWith('@') ? username : `@${username}`,
            content: `${line} - ${station}\n${incidentType}: ${description}`,
            timestamp,
            liked: false,
            disliked: false,
          } satisfies Post;
        });
        setPosts(mappedPosts);
      } catch {
        Alert.alert('Error', 'Unable to load top community reports right now.');
        setPosts([]);
      }
    }, []);

    useEffect(() => {
      loadTopReports();
      const unsubscribe = navigation.addListener('focus', loadTopReports);
      return unsubscribe;
    }, [navigation, loadTopReports]);

    const toggleLike = (id: string) => {
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post.id !== id) {
              return post;
            }

            const liked = !post.liked;
            return {
              ...post,
              liked,
              disliked: liked ? false : post.disliked,
            };
          }),
        );
    };

    const toggleDislike = (id: string) => {
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post.id !== id) {
              return post;
            }

            const disliked = !post.disliked;
            return {
              ...post,
              disliked,
              liked: disliked ? false : post.liked,
            };
          }),
        );
    };

    return (
        <BaseScreen style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Community Reports</Text>
                <Button
                    title="+ Add Report"
                    onPress={() => navigation.navigate('Reporting')}
                    style={styles.reportButton}
                    textStyle={styles.reportButtonText}
                />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {posts.length === 0 ? (
                  <Text style={styles.emptyState}>No top reports available yet.</Text>
                ) : (
                  posts.map((post) => (
                      <ReportCard
                          key={post.id}
                          post={post}
                          onLike={toggleLike}
                          onDislike={toggleDislike}
                          icons={{ LikeFilledIcon, LikeIcon, DislikeFilledIcon, DislikeIcon }}
                      />
                  ))
                )}
            </ScrollView>
            <NavBar
                activeTab="Community"
                onTabPress={(tab) => {
                    if (tab === 'Home') {
                        navigation.navigate('Home');
                    } else if (tab === 'Route') {
                        navigation.navigate('RouteManagement');
                    } else if (tab === 'Community') {
                        navigation.navigate('Community');
                    }
                }}
            />
        </BaseScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorTokens.background_default,
    },
    header: {
        paddingHorizontal: spacing[8],
        paddingTop: spacing[24] - spacing[2],
        paddingBottom: spacing[6] + spacing[1],
        gap: spacing[4],
    },
    title: {
        fontSize: typography.sizes['4xl'] - 4,
        fontWeight: typography.weights.bold,
        color: colorTokens.text_primary,
        letterSpacing: typography.letterSpacing.tight,
    },
    scrollView: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: spacing[8],
        paddingBottom: spacing[24] + spacing[6],
    },
    emptyState: {
      marginHorizontal: spacing[4],
      marginTop: spacing[6],
      textAlign: 'center',
      color: colorTokens.text_muted,
      fontSize: typography.sizes.sm,
    },
    reportButton: {
        backgroundColor: colorTokens.surface_muted,
        borderRadius: radius.full,
    },
    reportButtonText: {
        color: colorTokens.secondary_accent,
    },
});
