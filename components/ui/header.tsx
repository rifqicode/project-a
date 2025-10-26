import { StyleSheet, Text, View } from "react-native";

export function Header({
    title,
    subtitle,
}: {
    title: string;
    subtitle?: string;
}) {
    return (
        <View style={{ width: '100%' }}>
            <Text style={style.title}>{title}</Text>
            <Text style={style.subtitle}>{subtitle}</Text>
        </View>
    )
}

const style = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 16,
        color: 'gray',
    }
});