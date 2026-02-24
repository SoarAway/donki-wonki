import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'donkiwonki:userId';

export const saveUserId = async (userId: string): Promise<void> => {
  await AsyncStorage.setItem(USER_ID_KEY, userId);
};

export const getUserId = async (): Promise<string | null> => {
  return AsyncStorage.getItem(USER_ID_KEY);
};

export const clearUserId = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_ID_KEY);
};
