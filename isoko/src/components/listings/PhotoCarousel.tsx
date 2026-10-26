import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '@/theme';

function Dot({ active }: { active: boolean }) {
  const style = useAnimatedStyle(() => ({
    width: withSpring(active ? 22 : 7, { damping: 16 }),
    opacity: withSpring(active ? 1 : 0.6),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

/** Swipe through a listing's photos, with animated page dots. */
export function PhotoCarousel({ photos, height, gradient }: { photos: string[]; height: number; gradient: readonly [string, string] }) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);

  if (!photos.length) {
    return (
      <LinearGradient colors={gradient} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="image-outline" size={56} color="rgba(255,255,255,0.8)" />
      </LinearGradient>
    );
  }

  return (
    <View style={{ width, height }}>
      <FlatList
        data={photos}
        keyExtractor={(u, i) => `${i}-${u}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width, height }} contentFit="cover" transition={250} />
        )}
      />
      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((u, i) => (
            <Dot key={`${i}-${u}`} active={i === page} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { height: 7, borderRadius: 4, backgroundColor: colors.white },
});
