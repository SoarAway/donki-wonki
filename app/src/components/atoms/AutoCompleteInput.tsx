import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

interface AutocompleteInputProps {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    onSelect: (value: string) => void;
    containerStyle?: any;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    onSelect,
    containerStyle
}) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (value.length < 3) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            // Only fetch if showSuggestions is true (meaning user is interacting)
            // AND we don't have a suggestion matches exactly (optional optimization)
            if (showSuggestions) {
                setIsLoading(true);
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`,
                        {
                            headers: {
                                'User-Agent': 'DonkiWonkiApp/1.0',
                            },
                        }
                    );
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        const results = data.map((item: any) => {
                            const addr = item.address;
                            if (!addr) return item.display_name;

                            // Components represent increasing administrative levels
                            // We want: [Place Name/Road], [Area/City], [State]
                            const main = addr.amenity || addr.building || addr.shop || addr.office || addr.leisure || addr.highway || addr.road || '';
                            const area = addr.suburb || addr.city_district || addr.neighbourhood || addr.city || addr.town || addr.village || '';
                            const state = addr.state || addr.county || '';

                            // Filter out empty parts and join them
                            const simplified = [main, area, state]
                                .filter(part => part.length > 0)
                                .join(', ');

                            return simplified || item.display_name;
                        });
                        // Ensure uniqueness
                        const uniqueResults = Array.from(new Set(results));
                        setSuggestions(uniqueResults);
                    }
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

    const handleSelect = (item: string) => {
        onSelect(item);
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
                        if (value.length >= 3) {
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
                            if (value.length >= 3) {
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
                        {suggestions.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionItem}
                                onPress={() => handleSelect(item)}
                            >
                                <Text style={styles.suggestionText} numberOfLines={2}>
                                    {item}
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
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#000000',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 14,
        color: '#000000',
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
