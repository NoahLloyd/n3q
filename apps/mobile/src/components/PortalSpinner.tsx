import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";

const AnimatedView = Animated.View;

interface PortalSpinnerProps {
  size?: number;
}

/**
 * Pixel-art portal spinner.
 * Three concentric square rings rotating at different speeds
 * with a pulsing amber glow in the center.
 */
export function PortalSpinner({ size = 32 }: PortalSpinnerProps) {
  const outerRotation = useSharedValue(0);
  const middleRotation = useSharedValue(0);
  const innerRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Outer ring — slow clockwise
    outerRotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
    // Middle ring — medium counter-clockwise
    middleRotation.value = withRepeat(
      withTiming(-360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
    // Inner ring — fast clockwise
    innerRotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(outerRotation);
      cancelAnimation(middleRotation);
      cancelAnimation(innerRotation);
      cancelAnimation(glowOpacity);
    };
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${outerRotation.value}deg` }],
  }));

  const middleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${middleRotation.value}deg` }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${innerRotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const outerSize = size;
  const middleSize = size * 0.65;
  const innerSize = size * 0.35;
  const pixelW = Math.max(1.5, size * 0.06);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Center glow */}
      <AnimatedView style={[styles.glow, { width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 }, glowStyle]} />

      {/* Outer ring */}
      <AnimatedView style={[styles.ring, { width: outerSize, height: outerSize }, outerStyle]}>
        <Svg width={outerSize} height={outerSize}>
          <Rect x={pixelW / 2} y={pixelW / 2} width={outerSize - pixelW} height={outerSize - pixelW}
            stroke="rgba(245,166,35,0.35)" strokeWidth={pixelW} fill="none" />
        </Svg>
      </AnimatedView>

      {/* Middle ring */}
      <AnimatedView style={[styles.ring, { width: middleSize, height: middleSize }, middleStyle]}>
        <Svg width={middleSize} height={middleSize}>
          <Rect x={pixelW / 2} y={pixelW / 2} width={middleSize - pixelW} height={middleSize - pixelW}
            stroke="rgba(245,166,35,0.55)" strokeWidth={pixelW} fill="none" />
        </Svg>
      </AnimatedView>

      {/* Inner ring */}
      <AnimatedView style={[styles.ring, { width: innerSize, height: innerSize }, innerStyle]}>
        <Svg width={innerSize} height={innerSize}>
          <Rect x={pixelW / 2} y={pixelW / 2} width={innerSize - pixelW} height={innerSize - pixelW}
            stroke="rgba(245,166,35,0.8)" strokeWidth={pixelW} fill="none" />
        </Svg>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
  },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(245,166,35,0.15)",
    shadowColor: "#f5a623",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
});
