import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Dropdown } from '../components/atoms/Dropdown';
import { BackButton } from '../components/atoms/BackButton';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, shadows, spacing, typography } from '../components/config';

interface FeedbackProps {
    navigation?: {
        navigate: (screen: string) => void;
    };
}

export default function Feedback({ navigation }: FeedbackProps) {
    const [problemType, setProblemType] = useState('Select option');
    const [otherProblem, setOtherProblem] = useState('');
    const [description, setDescription] = useState('');

    const problemOptions = [
        "Select option",
        "Notification Alert Wrong",
        "Route Wrong",
        "Recommendation Wrong",
        "LRT Incident Wrong",
        "Others"
    ];

    const handleSubmit = () => {
        console.log('Submit clicked. Problem Type:', problemType);
        if (!problemType || problemType === 'Select option') {
            Alert.alert('Error', 'Please select a type of problem');
            return;
        }

        if (problemType === 'Others' && !otherProblem) {
            Alert.alert('Error', 'Please specify your problem');
            return;
        }

        if (!description || description.trim() === '') {
            Alert.alert('Error', 'Please provide a description of the problem');
            return;
        }

        const finalProblem = problemType === 'Others' ? otherProblem : problemType;
        console.log('Feedback submitted successfully:', { finalProblem, description });
        Alert.alert('Success', 'Successfully Submitted, Thank you');
    };

    return (
        <BaseScreen style={styles.container} keyboardAvoiding>
            <View style={styles.header}>
                <BackButton onPress={() => navigation?.navigate('Home')} />
                <Text style={styles.title}>Feedback Page</Text>
            </View>


            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formContainer}>
                    <Dropdown
                        label="Type of Problem:"
                        placeholder="Select option"
                        options={problemOptions}
                        selectedValue={problemType}
                        onSelect={setProblemType}
                    />

                    {problemType === 'Others' && (
                        <Input
                            label="Others:"
                            placeholder="Type your problem here"
                            value={otherProblem}
                            onChangeText={setOtherProblem}
                        />
                    )}

                    <Input
                        label="Description:"
                        placeholder="Description"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        style={styles.textArea}
                    />
                </View>
            </ScrollView>

            <View style={styles.bottomContainer}>
                <Button
                    title="Submit"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                />
            </View>
        </BaseScreen>
    );
}




const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorTokens.background_default,
    },
    flexContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[5],
        paddingTop: spacing[24],
        paddingBottom: spacing[2] + 2,
    },
    title: {
        fontSize: typography.sizes['4xl'] - 4,
        fontWeight: typography.weights.bold,
        color: colorTokens.text_primary,
        marginLeft: spacing[1] + 1,
    },


    scrollContainer: {
        flexGrow: 1,
        padding: spacing[5],
        paddingBottom: spacing[24] + spacing[6],
    },

    formContainer: {
        width: '100%',
    },
    textArea: {
        height: spacing[20],
        textAlignVertical: 'top',
        fontStyle: 'italic',
        paddingHorizontal: spacing[4] - 1,
        paddingTop: spacing[4] - 1,
    },

    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing[5],
        paddingBottom: spacing[12] + spacing[3],
        backgroundColor: 'transparent',
    },
    submitButton: {
        ...shadows.md,
    },
});


