import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Button } from '../components/atoms/Button';
import { BaseScreen } from '../models/BaseScreen';

interface Post {
    id: string;
    username: string;
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
        {
            id: '4',
            username: '@xxhannnn',
            content: 'LRT Kelana Jaya Breakdown. Already wait for 40 minutes!',
            timestamp: '10 mins ago',
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
                <Text style={styles.title}>Community</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContainer}
            >
                {posts.map((post) => (
                    <View key={post.id} style={styles.card}>
                        <Text style={styles.username}>{post.username}</Text>
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

            <View style={styles.bottomContainer}>
                <Button
                    label="Report"
                    onPress={() => navigation.navigate('Reporting')}
                    style={styles.reportButton}
                />
            </View>
        </BaseScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4FB',
    },
    header: {
        paddingHorizontal: 25,
        paddingTop: 90,
        paddingBottom: 30,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: -1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: '#1256A7',
        shadowColor: '#1256A7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    username: {
        fontSize: 13,
        color: '#333333',
        fontStyle: 'italic',
        marginBottom: 8,
        opacity: 0.8,
    },
    content: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        lineHeight: 24,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        marginRight: 18,
    },
    icon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    timestamp: {
        fontSize: 11,
        color: '#999999',
        fontStyle: 'italic',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 30,
        paddingBottom: 40,
    },
    reportButton: {
        backgroundColor: '#1256A7',
        borderRadius: 14,
        height: 65,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
});
