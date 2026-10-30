import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BallProps {
  // Centre of the ball in cell units, updated every frame without re-rendering.
  position: Animated.ValueXY;
  cellSize: number;
  size: number;
}

const Ball: React.FC<BallProps> = ({ position, cellSize, size }) => {
  const offset = -size / 2;
  return (
    <Animated.View
      style={[
        styles.ballContainer,
        {
          width: size,
          height: size,
          position: 'absolute',
          left: 0,
          top: 0,
          transform: [
            { translateX: Animated.add(Animated.multiply(position.x, cellSize), offset) },
            { translateY: Animated.add(Animated.multiply(position.y, cellSize), offset) },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['#ff6b6b', '#ff4757']}
        style={styles.ball}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.highlight} />
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  ballContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ball: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '30%',
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 999,
  },
});

export default Ball;
