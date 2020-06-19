import 'react-native-gesture-handler'; // must be at the very top interesting
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Amplify, { Auth } from 'aws-amplify';

import SignUp from './SignUp';
import SignIn from './SignIn';
import Todo from './Todo';
import AmplifyAuthStorage from './AmplifyAuthStorage';

import config from './aws-exports';
Amplify.configure(config);
Amplify.configure({storage: AmplifyAuthStorage});

// const instructions = Platform.select({
//   ios: `Press Cmd+R to reload,\nCmd+D or shake for dev menu`,
//   android: `Double tap R on your keyboard to reload,\nShake or press menu button for dev menu`,
// });

const Stack = createStackNavigator();

const App = () => {
  async function confirmSignUp() {
    try {
      await Auth.confirmSignUp(username, code);
    } catch (error) {
        console.log('error confirming sign up', error);
    }
  }

  async function resendConfirmationCode() {
    try {
        await Auth.resendSignUp(username);
        console.log('code resent succesfully');
    } catch (err) {
        console.log('error resending code: ', err);
    }
  }

  async function signOut() {
    try {
        await Auth.signOut();
    } catch (error) {
        console.log('error signing out: ', error);
    }
  }

  async function globalSignOut() {
    try {
        await Auth.signOut({ global: true });
    } catch (error) {
        console.log('error signing out: ', error);
    }
  }

  return ( // 
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Signup"
          component={SignUp}
          options={{title: 'Sign Up!'}}
        />
        <Stack.Screen
          name="Signin"
          component={SignIn}
          options={{title: 'Sign In!'}}
        />
        <Stack.Screen
          name="Todo"
          component={Todo}
          options={{title: 'Todos'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App;