
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ParallaxScrollView>
      <ThemedView style={styles.container}>
        <Header title="Dashboard" subtitle="Overview of your orders and inventory" />
        
        <View style={styles.cardsContainer}>
          <View style={styles.cardWrapper}>
            <Card>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Total Orders</Text>
                <Text style={styles.cardValue}>1,234</Text>
              </View>
            </Card>
          </View>
          
          <View style={styles.cardWrapper}>
            <Card>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Orders Today</Text>
                <Text style={styles.cardValue}>42</Text>
              </View>
            </Card>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          <View style={styles.cardWrapper}>
            <Card>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Total Revenue</Text>
                <Text style={styles.cardValue}>1,234</Text>
              </View>
            </Card>
          </View>
        </View>

        
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
});
