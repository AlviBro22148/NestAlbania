import { OnboardingSlide as SlideType } from '@/constants/onboarding';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlideProps {
  slide: SlideType;
  index: number;
  scrollX: SharedValue<number>;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  slide,
  index,
  scrollX,
}) => {
  const { t } = useTranslation();

  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  // Animated styles for parallax effect
  const iconAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [100, 0, -100],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  const descriptionAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, -50],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  const tipAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [30, 0, 30],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const isLastSlide = slide.image && !slide.icon;

  return (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="flex-1 items-center justify-center px-8"
    >
      {/* Icon or Image Container */}
      <Animated.View
        style={iconAnimatedStyle}
        className="items-center justify-center mb-12"
      >
        {slide.icon && (
          <View className="w-32 h-32 rounded-full bg-primary-100 items-center justify-center">
            <ExpoImage
              source={slide.icon}
              style={{ width: 64, height: 64 }}
              contentFit="contain"
              tintColor="#0061FF"
            />
          </View>
        )}
        {slide.image && (
          <ExpoImage
            source={slide.image}
            style={{ width: 288, height: 288 }}
            contentFit="contain"
          />
        )}
      </Animated.View>

      {/* Title */}
      <Animated.View style={titleAnimatedStyle} className="mb-4">
        <Text className="text-3xl font-rubik-bold text-black-300 text-center">
          {t(slide.titleKey)}
        </Text>
      </Animated.View>

      {/* Description */}
      <Animated.View style={descriptionAnimatedStyle} className="mb-8">
        <Text className="text-base font-rubik text-gray-500 text-center leading-6">
          {t(slide.descriptionKey)}
        </Text>
      </Animated.View>

      {/* Tip (if available) */}
      {slide.tipKey && (
        <Animated.View
          style={tipAnimatedStyle}
          className="bg-primary-100 rounded-2xl px-6 py-4 mx-4"
        >
          <View className="flex-row items-start">
            <Text className="text-lg mr-3">💡</Text>
            <Text
              className="text-sm font-rubik-medium flex-1"
              style={{ color: '#0061FF' }}
            >
              {t(slide.tipKey)}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default OnboardingSlide;
