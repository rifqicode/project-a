import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedRef
} from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';


type Props = PropsWithChildren<{}>;

export default function ParallaxScrollView({
  children,
}: Props) {
  const theme = useThemeColor();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor: theme.background, flex: 1 }}
      scrollEventThrottle={16}>
      <Animated.View
        style={{
          ...styles.header,
        }}>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </Animated.View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
