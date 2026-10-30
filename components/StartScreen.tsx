import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onStart: () => void;
  hasTiltSensor: boolean;
  durationSeconds: number;
}

const StartScreen: React.FC<Props> = ({ onStart, hasTiltSensor, durationSeconds }) => {
  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <LinearGradient colors={['#e91e63', '#d81b60']} style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">How to play</Text>

        <View style={styles.row}>
          <Ionicons name="phone-portrait-outline" size={26} color="#fff" style={styles.icon} />
          <Text style={styles.text}>
            {hasTiltSensor
              ? 'Hold your phone comfortably, tap Start, then tilt it to roll the red ball.'
              : 'This device has no tilt sensor, so use touch controls.'}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="hand-left-outline" size={26} color="#fff" style={styles.icon} />
          <Text style={styles.text}>Or drag your finger on the maze to steer the ball.</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="flag-outline" size={26} color="#fff" style={styles.icon} />
          <Text style={styles.text}>Reach the yellow GOAL to clear the maze and score 100 points.</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="timer-outline" size={26} color="#fff" style={styles.icon} />
          <Text style={styles.text}>Clear as many mazes as you can in {durationSeconds} seconds.</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={onStart}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Start game"
        >
          <Ionicons name="play" size={24} color="#e91e63" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 26,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  button: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 25,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#e91e63',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default StartScreen;
