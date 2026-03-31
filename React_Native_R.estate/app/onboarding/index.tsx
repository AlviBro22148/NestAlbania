import OnboardingSlide from '@/components/OnboardingSlide';
import { onboardingSlides } from '@/constants/onboarding';
import { onboardingStorage } from '@/lib/storage';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OnboardingScreen = () => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.value = event.nativeEvent.contentOffset.x;
    },
    []
  );

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      completeOnboarding();
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex, isLastSlide]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, []);

  const handleDotPress = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    onboardingStorage.setOnboardingComplete();
    router.replace('/auth/sign-in');
  }, []);

  // Animated styles for the button
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(1, { damping: 15, stiffness: 150 }),
        },
      ],
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Skip Button (top-right) */}
      {!isLastSlide && (
        <View className="absolute top-14 right-6 z-10">
          <TouchableOpacity
            onPress={handleSkip}
            className="px-4 py-2"
            activeOpacity={0.7}
          >
            <Text className="text-base font-rubik-medium text-gray-500">
              {t('onboarding.skip')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <OnboardingSlide slide={item} index={index} scrollX={scrollX} />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom Section */}
      <View className="px-6 pb-8">
        {/* Pagination Dots */}
        <View className="flex-row justify-center items-center mb-8">
          {onboardingSlides.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              currentIndex={currentIndex}
              onPress={() => handleDotPress(index)}
            />
          ))}
        </View>

        {/* Next / Get Started Button */}
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity
            onPress={handleNext}
            className="bg-primary-300 py-4 rounded-full items-center justify-center"
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-rubik-bold">
              {isLastSlide
                ? t('onboarding.getStartedButton')
                : t('onboarding.next')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

// Pagination Dot Component
interface PaginationDotProps {
  index: number;
  currentIndex: number;
  onPress: () => void;
}

const PaginationDot: React.FC<PaginationDotProps> = ({
  index,
  currentIndex,
  onPress,
}) => {
  const isActive = index === currentIndex;

  const dotAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isActive ? 24 : 8, { duration: 200 }),
      backgroundColor: withTiming(isActive ? '#0061FF' : '#D1D5DB', {
        duration: 200,
      }),
    };
  });

  return (
    <Pressable onPress={onPress} className="mx-1">
      <Animated.View
        style={dotAnimatedStyle}
        className="h-2 rounded-full"
      />
    </Pressable>
  );
};

export default OnboardingScreen;
