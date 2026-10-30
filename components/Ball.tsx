import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BallProps {
  x: number;
  y: number;
  size: number;
}

const Ball: React.FC<BallProps> = ({ x, y, size }) => {
  return (
    <View
      style={[
        styles.ballContainer,
        {
          width: size,
          height: size,
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
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
    </View>
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
