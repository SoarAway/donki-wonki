import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';

interface TagDropdownProps {
    label: string;
    placeholder?: string;
    options: string[];
    selectedValues: string[];
    onSelect: (values: string[]) => void;
}

export const TagDropdown: React.FC<TagDropdownProps> = ({
    label,
    placeholder = 'Select options',
    options,
    selectedValues,
    onSelect,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (item: string) => {
        if (selectedValues.includes(item)) {
            onSelect(selectedValues.filter((v) => v !== item));
        } else {
            onSelect([...selectedValues, item]);
        }
    };

    const removeTag = (item: string) => {
        onSelect(selectedValues.filter((v) => v !== item));
    };

    return (
        <View style={[styles.container, isOpen && { zIndex: 5000 }]}>
            <Text style={styles.label}>{label}</Text>

            {/* The tag box / trigger */}
            <TouchableOpacity
                style={styles.tagBox}
                onPress={() => setIsOpen(!isOpen)}
                activeOpacity={0.8}
            >
                <View style={styles.tagsRow}>
                    {selectedValues.length === 0 ? (
                        <Text style={styles.placeholder}>{placeholder}</Text>
                    ) : (
                        selectedValues.map((val) => (
                            <View key={val} style={styles.tag}>
                                <Text style={styles.tagText}>{val}</Text>
                                <TouchableOpacity
                                    onPress={() => removeTag(val)}
                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                >
                                    <Text style={styles.tagClose}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>
                <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
                </View>
            </TouchableOpacity>

            {/* Dropdown list */}
            {isOpen && (
                <View style={styles.dropdownList}>
                    <ScrollView
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="always"
                        showsVerticalScrollIndicator={true}
                        style={styles.scrollView}
                    >
                        {options.map((item, index) => {
                            const selected = selectedValues.includes(item);
                            return (
                                <TouchableOpacity
                                    key={`${item}-${index}`}
                                    style={[styles.optionItem, selected && styles.selectedOptionItem]}
                                    onPress={() => toggleOption(item)}
                                >
                                    <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        width: '100%',
        position: 'relative',
        zIndex: 10,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 8,
    },
    tagBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F1F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        width: 350,
        height: 44,
    },
    tagsRow: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    placeholder: {
        fontSize: 12,
        color: '#999999',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D8DDEE',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 4,
    },
    tagText: {
        fontSize: 13,
        color: '#2B308B',
        fontWeight: '500',
    },
    tagClose: {
        fontSize: 16,
        color: '#2B308B',
        fontWeight: '600',
        lineHeight: 18,
    },
    arrowContainer: {
        padding: 5,
    },
    arrow: {
        fontSize: 12,
        color: '#1256A7',
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        backgroundColor: '#F5F6FA',
        borderRadius: 14,
        zIndex: 10000,
        overflow: 'hidden',
        paddingVertical: 6,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },
    scrollView: {
        maxHeight: 220,
    },
    optionItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 6,
        borderRadius: 10,
        marginVertical: 1,
    },
    selectedOptionItem: {
        backgroundColor: '#E0E4F5',
    },
    optionText: {
        fontSize: 15,
        color: '#444',
        fontWeight: '400',
    },
    selectedOptionText: {
        color: '#2B308B',
        fontWeight: '600',
    },
});