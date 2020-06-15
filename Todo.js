import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Button
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';

import { createTodo } from './src/graphql/mutations';
import { listTodos } from './src/graphql/queries';

const initialTodoState = { name: '', description: '' };

const Todo = ({navigation}) => {

    const [formState, setFormState] = useState(initialTodoState);
    const [todos, setTodos] = useState([]);

    useEffect(() => {
    fetchTodos();
    }, []);

    function setTodoInput(key, value) {
    setFormState({ ...formState, [key]: value });
    }

    async function fetchTodos() {
        try {
          const todoData = await API.graphql(graphqlOperation(listTodos));
          const todos = todoData.data.listTodos.items;
          setTodos(todos);
        } catch (err) { console.log('error fetching todos'); }
      }
    
    async function addTodo() {
        try {
          const todo = { ...formState };
          setTodos([...todos, todo]);
          setFormState(initialState);
          await API.graphql(graphqlOperation(createTodo, {input: todo}));
        } catch (err) {
          console.log('error creating todo:', err);
        }
    }

    return (
        <View style={styles.container}> 
            <TextInput
                onChangeText={val => setTodoInput('name', val)}
                style={styles.input}
                value={formState.name} 
                placeholder="Name"
            />
            <TextInput
                onChangeText={val => setTodoInput('description', val)}
                style={styles.input}
                value={formState.description}
                placeholder="Description"
            />
            <Button title="Create Todo" onPress={addTodo} />
            <Button
                title="Sign In"
                onPress={() => navigation.navigate('Signin')}
            />

            {
                todos.map((todo, index) => (
                <View key={todo.id ? todo.id : index} style={styles.todo}>
                    <Text style={styles.todoName}>{todo.name}</Text>
                    <Text>{todo.description}</Text>
                </View>
                ))
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    todo: {  marginBottom: 15 },
    input: { height: 50, backgroundColor: '#ddd', marginBottom: 10, padding: 8 },
    todoName: { fontSize: 18 }
});
  
export default Todo;