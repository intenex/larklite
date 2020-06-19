import React, { useState } from 'react';
import {
  View, StyleSheet, TextInput, Button
} from 'react-native';
import { Auth, Logger } from 'aws-amplify';

const initialFormState = { username: '', password: '' }

const logger = new Logger('foo', 'DEBUG');

const SignIn = ({navigation}) => {
    const [formState, setFormState] = useState(initialFormState);

    function setInput(key, value) {
        setFormState({ ...formState, [key]: value });
    }

    async function signIn() {
        const { username, password } = formState;
        try {
            const user = await Auth.signIn(username.toLowerCase(), password.toLowerCase());
            console.log({ user });
            try {
                console.log(await Auth.currentSession());
            }
            catch(e) {
                logger.error('error occurred trying to fetch current session', e);
            }
            // try { 
            //     console.log(await Auth.userSession());
            // }
            // catch(e) {
            //     logger.error('error occurred trying to fetch user session', e);
            // }
            // console.log(await Auth.currentAuthenticatedUser());
            // console.log(await Auth.currentUserInfo());
            // console.log(await Auth.currentCredentials());
        } catch (error) {
            console.log('error signing in', error);
        }
    }

    return (
        <View style={styles.container}>
            <TextInput
            onChangeText={val => setInput('username', val)}
            style={styles.input}
            value={formState.username} 
            placeholder="Username (Email)"
            />
            <TextInput
            onChangeText={val => setInput('password', val)}
            style={styles.input}
            value={formState.password} 
            placeholder="Password"
            />
            <Button title="Sign In" onPress={signIn} />
            <Button 
                title="Sign in with Facebook"
                onPress={() => Auth.federatedSignIn({provider: 'Facebook'})}
            />
            <Button
                title="Sign Up"
                onPress={() => navigation.navigate('Signup')}
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
  
export default SignIn;