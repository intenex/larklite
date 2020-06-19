import AsyncStorage from '@react-native-community/async-storage';

const MEMORY_KEY_PREFIX = '@MemoryStorage:';
let dataMemory = {};

export default class AmplifyAuthStorage {
  static syncPromise = null;
  static setItem(key, value) {
    AsyncStorage.setItem(MEMORY_KEY_PREFIX + key, value, () => {});
    dataMemory[key] = value;
    return dataMemory[key];
  }

  static getItem(key) {
    return Object.prototype.hasOwnProperty.call(dataMemory, key)
      ? dataMemory[key]
      : undefined;
  }

  static removeItem(key) {
    AsyncStorage.removeItem(MEMORY_KEY_PREFIX + key);
    return delete dataMemory[key];
  }

  static clear() {
    dataMemory = {};
    return dataMemory;
  }

  static sync() {
    if (!this.syncPromise) {
      this.syncPromise = new Promise((res, rej) => {
        AsyncStorage.getAllKeys((errKeys, keys) => {
          if (errKeys) {
            rej(errKeys);
          }
          const memoryKeys = keys.filter(key =>
            key.startsWith(MEMORY_KEY_PREFIX),
          );
          AsyncStorage.multiGet(memoryKeys, (err, stores) => {
            if (err) {
              rej(err);
            }
            stores.map((result, index, store) => {
              const key = store[index][0];
              const value = store[index][1];
              const memoryKey = key.replace(MEMORY_KEY_PREFIX, '');
              dataMemory[memoryKey] = value;
            });
            res();
          });
        });
      });
    }
    return this.syncPromise;
  }
}