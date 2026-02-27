import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';

const RouteIcon = require('../../assets/Route_Black.png');
const HomeIcon = require('../../assets/Home_Black.png');
const ChatIcon = require('../../assets/Chat_Conversation_Circle.png');

interface NavBarProps {
    activeTab?: 'Route' | 'Home' | 'Community';
    onTabPress?: (tab: 'Route' | 'Home' | 'Community') => void;
}

export const NavBar: React.FC<NavBarProps> = ({ activeTab = 'Home', onTabPress }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.tabContainer}
                onPress={() => onTabPress?.('Route')}
            >
                <View style={[styles.tab, activeTab === 'Route' && styles.activeTab]}>
                    <Image
                        source={RouteIcon}
                        style={[styles.icon, { tintColor: activeTab === 'Route' ? '#FFFFFF' : '#000000' }]}
                    />
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabContainer}
                onPress={() => onTabPress?.('Home')}
            >
                <View style={[styles.tab, activeTab === 'Home' && styles.activeTab]}>
                    <Image
                        source={HomeIcon}
                        style={[styles.icon, { tintColor: activeTab === 'Home' ? '#FFFFFF' : '#000000' }]}
                    />
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabContainer}
                onPress={() => onTabPress?.('Community')}
            >
                <View style={[styles.tab, activeTab === 'Community' && styles.activeTab]}>
                    <Image
                        source={ChatIcon}
                        style={[styles.icon, { tintColor: activeTab === 'Community' ? '#FFFFFF' : '#000000' }]}
                    />
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 100,
        height: 70,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        marginHorizontal: 20,
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        boxShadow: '0px 4px 10px 1px rgba(0, 0, 0, 0.20)',
    },
    tabContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    tab: {
        width: '85%',
        height: '75%',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#2B308B',
        width: '100%',
        height: '90%',
        borderRadius: 50,
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
    },
    icon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
});