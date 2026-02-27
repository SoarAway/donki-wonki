import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

import ChatIcon from '../../assets/Chat_Conversation_Circle.svg';
import HomeIcon from '../../assets/Home_Black.svg';
import RouteIcon from '../../assets/Route_Black.svg';

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
                    <RouteIcon
                        width={30}
                        height={30}
                        stroke={activeTab === 'Route' ? '#FFFFFF' : '#000000'}
                    />
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabContainer}
                onPress={() => onTabPress?.('Home')}
            >
                <View style={[styles.tab, activeTab === 'Home' && styles.activeTab]}>
                    <HomeIcon
                        width={30}
                        height={30}
                        stroke={activeTab === 'Home' ? '#FFFFFF' : '#000000'}
                    />
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabContainer}
                onPress={() => onTabPress?.('Community')}
            >
                <View style={[styles.tab, activeTab === 'Community' && styles.activeTab]}>
                    <ChatIcon
                        width={30}
                        height={29}
                        stroke={activeTab === 'Community' ? '#FFFFFF' : '#000000'}
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
});
