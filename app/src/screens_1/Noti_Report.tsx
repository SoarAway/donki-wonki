import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Dropdown } from '../components/atoms/Dropdown';
import { BackButton } from '../components/atoms/BackButton';

export default function Noti_Report() {
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
                <Text style={styles.title}>Reporting</Text>
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
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Submit"
                                onPress={handleSubmit}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}




const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFCFD',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 100,
        paddingBottom: 5,
    },
    title: {
        fontSize: 27,
        fontWeight: 'bold',
        color: '#000000',
        marginLeft: 5,
    },


    scrollContainer: {
        flexGrow: 1,
        padding: 32,
        paddingBottom: 40,
    },

    formContainer: {
        width: '100%',
        flex: 1,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        fontStyle: 'italic',
        paddingHorizontal: 15,
        paddingTop: 15,
    },

    buttonContainer: {
        marginTop: 'auto',
        paddingBottom: 20,
    },
});


