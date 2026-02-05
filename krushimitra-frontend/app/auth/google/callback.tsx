import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

export default function GoogleCallback() {
    const router = useRouter();

    useEffect(() => {
        // For web, this might be needed to close the popup or handle the redirect
        if (WebBrowser.maybeCompleteAuthSession()) {
            // If maybeCompleteAuthSession returns true, the popup was closed
        } else {
            // If we are here, it might be the main window redirect
            // We can just signify that we are done or redirect back to login if something went wrong
            // But usually expo-auth-session handles this mostly.
            // This page exists so the redirectUri has a valid destination.
        }
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.text}>Completing Sign in...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
});
