import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAuthToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem('userToken');
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

export const getUserData = async (): Promise<any | null> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

export const clearAuthData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove(['userToken', 'userData']);
    } catch (error) {
        console.error('Error clearing auth data:', error);
    }
};

export const isAuthenticated = async (): Promise<boolean> => {
    const token = await getAuthToken();
    return token !== null;
};