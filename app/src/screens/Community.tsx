import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Button } from '../components/atoms/Button';
import { NavBar } from '../components/molecules/NavBar';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, radius, shadows, spacing, typography } from '../components/config';

interface Post {
    id: string;
    username?: string;
    content: string;
    timestamp: string;
    liked: boolean;
    disliked: boolean;
}

const LikeIcon = require('../assets/Like.png');
const LikeFilledIcon = require('../assets/Like_Filled.png');
const DislikeIcon = require('../assets/Dislike.png');
const DislikeFilledIcon = require('../assets/Dislike_Filled.png');

export default function Community({ navigation }: any) {
    const [posts] = useState<Post[]>([
        {
            id: '1',
            username: '@xxhannnn',
            content: 'LRT Kelana Jaya Breakdown. Already wait for 40 minutes!',
            timestamp: '4 mins ago',
            liked: false,
            disliked: false,
        },
        {
            id: '2',
            username: '@xxhannnn',
            content: 'LRT Kelana Jaya Breakdown. Already wait for 40 minutes!',
            timestamp: '4 mins ago',
            liked: false,
            disliked: false,
        },
        {
            id: '3',
            username: '@xxhannnn',
            content: 'LRT Kelana Jaya Breakdown. Already wait for 40 minutes!',
            timestamp: '4 mins ago',
            liked: false,
            disliked: false,
        },
    ]);

    const [, setPostsState] = useState(posts); // Used to trigger re-renders for likes

    const toggleLike = (id: string) => {
        const post = posts.find(p => p.id === id);
        if (post) {
            const newLiked = !post.liked;
            post.liked = newLiked;
            if (newLiked) post.disliked = false;
            setPostsState([...posts]);
        }
    };

    const toggleDislike = (id: string) => {
        const post = posts.find(p => p.id === id);
        if (post) {
            const newDisliked = !post.disliked;
            post.disliked = newDisliked;
            if (newDisliked) post.liked = false;
            setPostsState([...posts]);
        }
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
                {posts.map((post) => (
                    <View key={post.id} style={styles.card}>
                        {post.username ? (
                            <Text style={styles.username}>{post.username}</Text>
                        ) : null}
                        <Text style={styles.content}>{post.content}</Text>

                        <View style={styles.footer}>
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => toggleLike(post.id)} style={styles.actionButton}>
                                    <Image
                                        source={post.liked ? LikeFilledIcon : LikeIcon}
                                        style={styles.icon}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => toggleDislike(post.id)} style={styles.actionButton}>
                                    <Image
                                        source={post.disliked ? DislikeFilledIcon : DislikeIcon}
                                        style={styles.icon}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.timestamp}>{post.timestamp}</Text>
                        </View>
                    </View>
                ))}
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
    card: {
        backgroundColor: colorTokens.surface_soft,
        borderRadius: radius.lg + 2,
        padding: spacing[4] + 2,
        marginBottom: spacing[4] - 2,
        borderWidth: 0.5,
        borderColor: colorTokens.border_subtle,
        ...shadows.sm,
    },
    username: {
        fontSize: typography.sizes.xs + 1,
        color: colorTokens.text_muted,
        fontStyle: 'italic',
        marginBottom: spacing[2],
    },
    content: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colorTokens.text_primary,
        lineHeight: typography.lineHeights.lg - 3,
        marginBottom: spacing[4] - 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        marginRight: spacing[4] + 2,
    },
    icon: {
        width: 22,
        height: 22,
        resizeMode: 'contain',
    },
    timestamp: {
        fontSize: typography.sizes.xs - 1,
        color: colorTokens.text_subtle,
        fontStyle: 'italic',
    },
    reportButton: {
        backgroundColor: colorTokens.surface_muted,
        borderRadius: radius.full,
    },
    reportButtonText: {
        color: colorTokens.secondary_accent,
    },
});
