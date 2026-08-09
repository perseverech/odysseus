import React from "react";
import { StyleSheet } from "react-native";

import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Props = {
  children: React.ReactNode;
};

const MIN_SCALE = 1;
const MAX_SCALE = 20;

export default function MapGestures({
  children,
}: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale =
        savedScale.value * event.scale;

      scale.value = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, nextScale)
      );
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      if (scale.value <= 1.01) {
        scale.value = withTiming(1);

        translateX.value = withTiming(0);
        translateY.value = withTiming(0);

        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .minDistance(3)
    .onUpdate((event) => {
      if (scale.value <= 1.01) {
        return;
      }

      translateX.value =
        savedTranslateX.value +
        event.translationX;

      translateY.value =
        savedTranslateY.value +
        event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value =
        translateX.value;

      savedTranslateY.value =
        translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value < 3) {
        scale.value = withTiming(4);
        savedScale.value = 4;
      } else {
        scale.value = withTiming(1);

        translateX.value = withTiming(0);
        translateY.value = withTiming(0);

        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const gesture = Gesture.Simultaneous(
    pinch,
    pan,
    doubleTap
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value,
      },
      {
        translateY: translateY.value,
      },
      {
        scale: scale.value,
      },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});