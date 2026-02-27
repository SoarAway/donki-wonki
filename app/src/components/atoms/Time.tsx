import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 3; // number of rows shown in the drum

const HOURS_12 = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, '0')
); // '01' … '12'
const MINUTES = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, '0')
); // '00' … '59'
const PERIODS = ['AM', 'PM'];

interface TimeValue {
    hour: string;   // '01'–'12'
    minute: string; // '00'–'59'
    period: string; // 'AM' | 'PM'
}

interface TimePickerProps {
    value: TimeValue;
    onChange: (val: TimeValue) => void;
}

/** Returns the index in the list that is centered once the scroll settles */
function snapIndex(offset: number): number {
    return Math.round(offset / ITEM_HEIGHT);
}

/** A single scrollable drum column */
const DrumColumn: React.FC<{
    items: string[];
    selectedIndex: number;
    onIndexChange: (idx: number) => void;
}> = ({ items, selectedIndex, onIndexChange }) => {
    const scrollRef = useRef<ScrollView>(null);

    // Scroll to initial position on mount
    useEffect(() => {
        const timeout = setTimeout(() => {
            scrollRef.current?.scrollTo({
                y: selectedIndex * ITEM_HEIGHT,
                animated: false,
            });
        }, 50);
        return () => clearTimeout(timeout);
    }, []);

    const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = snapIndex(e.nativeEvent.contentOffset.y);
        const clamped = Math.max(0, Math.min(idx, items.length - 1));
        onIndexChange(clamped);
    };

    const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = snapIndex(e.nativeEvent.contentOffset.y);
        const clamped = Math.max(0, Math.min(idx, items.length - 1));
        // Snap exactly to item
        scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
        onIndexChange(clamped);
    };

    const drumHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
    const padding = ITEM_HEIGHT; // one item of padding top & bottom to center selection

    return (
        <View style={[styles.columnOuter, { height: drumHeight }]}>
            {/* Highlight band */}
            <View style={styles.highlightBand} pointerEvents="none" />

            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleMomentumEnd}
                onScrollEndDrag={handleScrollEnd}
                contentContainerStyle={{ paddingVertical: padding }}
                nestedScrollEnabled
            >
                {items.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                        <View key={item} style={styles.drumItem}>
                            <Text style={[styles.drumText, isSelected && styles.drumTextSelected]}>
                                {item}
                            </Text>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export const Time: React.FC<TimePickerProps> = ({ value, onChange }) => {
    const hourIdx = HOURS_12.indexOf(value.hour) !== -1 ? HOURS_12.indexOf(value.hour) : 0;
    const minIdx = MINUTES.indexOf(value.minute) !== -1 ? MINUTES.indexOf(value.minute) : 0;
    const periodIdx = PERIODS.indexOf(value.period) !== -1 ? PERIODS.indexOf(value.period) : 0;

    return (
        <View>
            <Text style={styles.sectionLabel}>Time:</Text>
            <View style={styles.pickerContainer}>
                {/* Hour */}
                <DrumColumn
                    items={HOURS_12}
                    selectedIndex={hourIdx}
                    onIndexChange={(idx) => onChange({ ...value, hour: HOURS_12[idx] })}
                />

                <Text style={styles.colon}>:</Text>

                {/* Minute */}
                <DrumColumn
                    items={MINUTES}
                    selectedIndex={minIdx}
                    onIndexChange={(idx) => onChange({ ...value, minute: MINUTES[idx] })}
                />

                {/* AM / PM */}
                <DrumColumn
                    items={PERIODS}
                    selectedIndex={periodIdx}
                    onIndexChange={(idx) => onChange({ ...value, period: PERIODS[idx] })}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 8,
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F1F6',
        borderRadius: 16,
        paddingHorizontal: 5,
        overflow: 'hidden',
    },
    columnOuter: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    highlightBand: {
        position: 'absolute',
        top: ITEM_HEIGHT,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        backgroundColor: '#CEDEFF',
        zIndex: 0,
    },
    drumItem: {
        height: ITEM_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    drumText: {
        fontSize: 18,
        color: '#BBBBBB',
        fontWeight: '400',
    },
    drumTextSelected: {
        fontSize: 20,
        color: '#2B308B',
        fontWeight: '700',
    },
    colon: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2B308B',
        paddingHorizontal: 4,
        marginTop: -4,
    },
});