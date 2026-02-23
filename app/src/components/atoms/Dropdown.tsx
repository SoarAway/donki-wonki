import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';

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
                    <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
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
        marginBottom: 20,
        width: '100%',
        position: 'relative',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#000000',
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 4,
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    selectedText: {
        fontSize: 14,
        color: '#000000',
    },
    placeholder: {
        color: '#999',
        fontStyle: 'italic',
    },
    arrow: {
        fontSize: 12,
        color: '#1256A7',
    },
    dropdownListContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 5,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        zIndex: 10000,
        overflow: 'hidden',
    },
    scrollView: {
        maxHeight: 200,
    },
    optionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    selectedOptionItem: {
        backgroundColor: '#E8F1FA',
    },
    optionText: {
        fontSize: 14,
        color: '#333',
    },
    selectedOptionText: {
        color: '#1256A7',
        fontWeight: '600',
    },
});
