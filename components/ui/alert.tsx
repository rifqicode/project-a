import { StyleSheet, Text, View } from "react-native";

interface AlertProps {
    message: string;
    type: 'error' | 'warning' | 'info' | 'success';
}

export function Alert({ message, type }: AlertProps) {
    let backgroundColor;
    let borderColor;
    switch (type) {
        case 'error':
            backgroundColor = '#ffdddd';
            borderColor = '#d8000c';
            break;
        case 'warning':
            backgroundColor = '#fff4e5';
            borderColor = '#9f6000';
            break;
        case 'info':
            backgroundColor = '#e7f3fe';
            borderColor = '#00529b';
            break;
        case 'success':
            backgroundColor = '#ddffdd';
            borderColor = '#4caf50';
            break;
        default:
            backgroundColor = '#ffffff';
            borderColor = '#ffffff';
    }

    return (
        <View style={[styles.alertContainer, { backgroundColor, borderColor }]}>
            <Text style={styles.alertText}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    alertContainer: {
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        marginVertical: 10,
    },
    alertText: {
        fontWeight: 'bold',
    },
});