import React, { useState } from 'react';
import {
  View, StyleSheet, TextInput, Button
} from 'react-native';
import { Auth } from 'aws-amplify';

const initialFormState = { name: '', email: '', username: '', phone_number: '', password: '' }

const SignUp = ({navigation}) => {
    const [formState, setFormState] = useState(initialFormState);

    function setInput(key, value) {
        setFormState({ ...formState, [key]: value });
    }

    async function signUp() {
        const { username, name, password, email, phone_number } = formState;
        try {
            const user = await Auth.signUp({
                username,
                password,
                attributes: {
                    name, 
                    email,
                    phone_number
                }
            });
            console.log({ user });
        } catch (error) {
            console.log('error signing up:', error);
        }
    }

    return (
        <View style={styles.container}>
            <TextInput
            onChangeText={val => setInput('username', val)}
            style={styles.input}
            value={formState.username} 
            placeholder="Username"
            />
            <TextInput
            onChangeText={val => setInput('password', val)}
            style={styles.input}
            value={formState.password} 
            placeholder="Password"
            />
            <TextInput
            onChangeText={val => setInput('email', val)}
            style={styles.input}
            value={formState.email}
            placeholder="Email"
            />
            <TextInput
            onChangeText={val => setInput('name', val)}
            style={styles.input}
            value={formState.name}
            placeholder="Name"
            />
            <TextInput
            onChangeText={val => setInput('phone_number', val)}
            style={styles.input}
            value={formState.phone_number}
            placeholder="Phone Number"
            />
            <Button title="Signup" onPress={signUp} />
            <Button
                title="Sign In"
                onPress={() => navigation.navigate('Signin')}
            />
            <Button
                title="Go to the Todo page"
                onPress={() => navigation.navigate('Todo')}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    todo: {  marginBottom: 15 },
    input: { height: 50, backgroundColor: '#ddd', marginBottom: 10, padding: 8 },
    todoName: { fontSize: 18 }
});
  
export default SignUp;