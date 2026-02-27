import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Button } from '../components/atoms/Button';
import { NavBar } from '../components/molecules/NavBar';

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
        <SafeAreaView style={styles.container}>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFCFD',
    },
    header: {
        paddingHorizontal: 32,
        paddingTop: 90,
        paddingBottom: 30,
        gap: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: -1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 32,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: '#F2F4FF',
        borderRadius: 14,
        padding: 18,
        marginBottom: 14,
        borderWidth: 0.5,
        borderColor: '#D8DAE8',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    username: {
        fontSize: 13,
        color: '#555555',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    content: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        lineHeight: 25,
        marginBottom: 14,
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
        marginRight: 18,
    },
    icon: {
        width: 22,
        height: 22,
        resizeMode: 'contain',
    },
    timestamp: {
        fontSize: 11,
        color: '#AAAAAA',
        fontStyle: 'italic',
    },
    reportButton: {
        backgroundColor: '#F0F1F6',
    },
    reportButtonText: {
        color: '#5A81FA',
    },
});
