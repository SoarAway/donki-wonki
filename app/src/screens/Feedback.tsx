import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Dropdown } from '../components/atoms/Dropdown';
import { BackButton } from '../components/atoms/BackButton';

export default function Feedback() {
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackButton onPress={() => console.log('Back pressed')} />
                <Text style={styles.title}>Feedback Page</Text>
            </View>


            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
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
            </KeyboardAvoidingView>

            <View style={styles.bottomContainer}>
                <Button
                    title="Submit"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                />
            </View>
        </SafeAreaView>
    );
}




const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 100,
        paddingBottom: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000000',
        marginLeft: 5,
    },


    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 120,
    },

    formContainer: {
        width: '100%',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        fontStyle: 'italic',
        paddingHorizontal: 15,
        paddingTop: 15,
    },

    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 60,
        backgroundColor: 'transparent',
    },
    submitButton: {
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});


