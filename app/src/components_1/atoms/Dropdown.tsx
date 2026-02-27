import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface DropdownProps {
    label: string;
    placeholder: string;
    options: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({ label, placeholder, options, selectedValue, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (item: string) => {
        onSelect(item);
        setIsOpen(false);
    };

    return (
        <View style={[styles.container, isOpen && { zIndex: 5000 }]}>
            <Text style={styles.label}>{label}</Text>
            <View style={{ zIndex: isOpen ? 6000 : 0 }}>
                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setIsOpen(!isOpen)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.selectedText, !selectedValue && styles.placeholder]}>
                        {selectedValue || placeholder}
                    </Text>
                    {/* Blue filled triangle arrow */}
                    <View style={styles.arrowContainer}>
                        <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
                    </View>
                </TouchableOpacity>

                {isOpen && (
                    <View style={styles.dropdownListContainer}>
                        <ScrollView
                            style={styles.scrollView}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="always"
                            showsVerticalScrollIndicator={true}
                        >
                            {options.map((item, index) => (
                                <TouchableOpacity
                                    key={`${item}-${index}`}
                                    style={[
                                        styles.optionItem,
                                        selectedValue === item && styles.selectedOptionItem
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selectedValue === item && styles.selectedOptionText
                                    ]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 18,
        width: '100%',
        position: 'relative',
    },
    label: {
        fontSize: 15,
        fontWeight: '400',
        marginBottom: 8,
        color: '#0D0D0D',
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 12,
        width: '100%',
        height: 44,
        backgroundColor: '#F0F1F6',
    },
    selectedText: {
        fontSize: 14,
        color: '#0D0D0D',
        flex: 1,
    },
    placeholder: {
        color: '#AAAAAA',
        fontStyle: 'italic',
    },
    arrowContainer: {
        padding: 8,
    },
    arrow: {
        fontSize: 12,
        color: '#1256A7',
    },
    arrowUp: {},
    dropdownListContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        backgroundColor: '#EDEDF0',
        borderRadius: 14,
        zIndex: 10000,
        overflow: 'hidden',
        paddingVertical: 6,
        // Elevation for Android
        elevation: 8,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    scrollView: {
        maxHeight: 200,
    },
    optionItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginHorizontal: 6,
        borderRadius: 10,
        marginVertical: 1,
        backgroundColor: 'transparent',
    },
    selectedOptionItem: {
        backgroundColor: '#D8DDEE',
    },
    optionText: {
        fontSize: 15,
        color: '#555',
        fontWeight: '400',
    },
    selectedOptionText: {
        color: '#2B308B',
        fontWeight: '500',
    },
});
