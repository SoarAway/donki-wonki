import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { autocompleteLocation } from '../../services/api/apiEndpoints';

interface AutocompleteSuggestion {
    place_id: string;
    description: string;
}

interface AutocompleteInputProps {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    onSelect: (value: string) => void;
    onSelectSuggestion?: (suggestion: AutocompleteSuggestion) => void;
    containerStyle?: any;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    onSelect,
    onSelectSuggestion,
    containerStyle
}) => {
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (value.length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            // Only fetch if showSuggestions is true (meaning user is interacting)
            // AND we don't have a suggestion matches exactly (optional optimization)
            if (showSuggestions) {
                setIsLoading(true);
                try {
                    const response = await autocompleteLocation(value);
                    const uniqueSuggestions = response.suggestions.reduce<AutocompleteSuggestion[]>((acc, item) => {
                        if (!acc.some(existing => existing.place_id === item.place_id)) {
                            acc.push({ place_id: item.place_id, description: item.description });
                        }
                        return acc;
                    }, []);
                    setSuggestions(uniqueSuggestions);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                    setSuggestions([]);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(timeoutId);
    }, [value, showSuggestions]);

    const handleTextChange = (text: string) => {
        onChangeText(text);
        setShowSuggestions(true);
    };

    const handleSelect = (item: AutocompleteSuggestion) => {
        onSelect(item.description);
        if (onSelectSuggestion) {
            onSelectSuggestion(item);
        }
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                        placeholderTextColor="#999"
                        value={value}
                        onChangeText={handleTextChange}
                        onFocus={() => {
                            if (value.length >= 2) {
                                setShowSuggestions(true);
                            }
                        }}
                />
                {isLoading ? (
                    <ActivityIndicator size="small" color="#1256A7" style={styles.loader} />
                ) : (
                    <TouchableOpacity
                        style={styles.arrowContainer}
                        onPress={() => {
                            if (value.length >= 2) {
                                setShowSuggestions(!showSuggestions);
                            }
                        }}
                    >
                        <Text style={styles.arrow}>{showSuggestions ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <ScrollView
                        keyboardShouldPersistTaps="always"
                        nestedScrollEnabled={true}
                    >
                        {suggestions.map(item => (
                            <TouchableOpacity
                                key={item.place_id}
                                style={styles.suggestionItem}
                                onPress={() => handleSelect(item)}
                            >
                                <Text style={styles.suggestionText} numberOfLines={2}>
                                    {item.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
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
        zIndex: 1,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 8,
        color: '#000000',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: '#F0F1F6',
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 12,
        color: '#000000',
        paddingHorizontal: 16,
        width: 350,
        height: 44,
    },
    loader: {
        marginRight: 10,
    },
    arrowContainer: {
        padding: 12,
    },
    arrow: {
        fontSize: 12,
        color: '#1256A7',
    },
    suggestionsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginTop: 5,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        zIndex: 10000,
        maxHeight: 200,
        overflow: 'hidden',
    },
    suggestionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    suggestionText: {
        fontSize: 14,
        color: '#333333',
    },
});
