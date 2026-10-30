import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, AppState } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Maze from './components/Maze';
import Ball from './components/Ball';
import GameOver from './components/GameOver';
import { generateMaze, Maze as MazeType } from './utils/mazeGenerator';
import { isOpenCell, isGoalCell } from './utils/mazePhysics';
import soundManager from './utils/soundManager';

const { width, height } = Dimensions.get('window');
const MAZE_SIZE = Math.min(width, height) * 0.85;
const GAME_DURATION_SECONDS = 60;
const POINTS_PER_MAZE = 100;
const TILT_SPEED = 15;
const HIGH_SCORE_KEY = 'highScore';

const startPosition = (maze: MazeType) => {
  const cellSize = MAZE_SIZE / maze.size;
  return { x: cellSize / 2, y: cellSize / 2 };
};

export default function App() {
  const [level, setLevel] = useState(1);
  const [maze, setMaze] = useState<MazeType>(() => generateMaze(1));
  const cellSize = MAZE_SIZE / maze.size;

  const [position, setPosition] = useState(() => startPosition(maze));
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // The accelerometer callback reads the latest game state from this ref so the
  // native subscription is created once instead of on every ball movement.
  const gameRef = useRef({ maze, level, position, isPlaying: !gameOver && isAppActive });
  gameRef.current = { maze, level, position, isPlaying: !gameOver && isAppActive };

  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY)
      .then(saved => {
        const parsed = Number.parseInt(saved ?? '', 10);
        if (Number.isFinite(parsed)) {
          setHighScore(prev => Math.max(prev, parsed));
        }
      })
      .catch(error => console.warn('Error loading high score:', error));
  }, []);

  useEffect(() => {
    if (score <= highScore) return;
    setHighScore(score);
    AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString())
      .catch(error => console.warn('Error saving high score:', error));
  }, [score, highScore]);

  useEffect(() => {
    const setupSounds = async () => {
      await soundManager.loadSounds();
      soundManager.startBackgroundMusic();
    };
    setupSounds();

    return () => {
      soundManager.unloadSounds();
    };
  }, []);

  // Pause the clock, controls and music while the app is in the background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      setIsAppActive(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isAppActive) {
      soundManager.resumeBackgroundMusic();
    } else {
      soundManager.pauseBackgroundMusic();
    }
  }, [isAppActive]);

  useEffect(() => {
    if (gameOver || !isAppActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, isAppActive]);

  useEffect(() => {
    if (timeLeft === 0 && !gameOver) {
      setGameOver(true);
      soundManager.playSound('gameOver');
    }
  }, [timeLeft, gameOver]);

  useEffect(() => {
    const subscription = Accelerometer.addListener(({ x, y }) => {
      const current = gameRef.current;
      if (!current.isPlaying) return;

      const currentCellSize = MAZE_SIZE / current.maze.size;
      const margin = currentCellSize / 2;
      const newX = Math.max(margin, Math.min(MAZE_SIZE - margin, current.position.x - x * TILT_SPEED));
      const newY = Math.max(margin, Math.min(MAZE_SIZE - margin, current.position.y + y * TILT_SPEED));

      if (!isOpenCell(current.maze, currentCellSize, newX, newY)) return;

      if (isGoalCell(current.maze, currentCellSize, newX, newY)) {
        const nextLevel = current.level + 1;
        const nextMaze = generateMaze(nextLevel);
        const nextPosition = startPosition(nextMaze);
        gameRef.current = { ...current, maze: nextMaze, level: nextLevel, position: nextPosition };
        setScore(prev => prev + POINTS_PER_MAZE);
        soundManager.playSound('victory');
        setMaze(nextMaze);
        setLevel(nextLevel);
        setPosition(nextPosition);
        return;
      }

      const nextPosition = { x: newX, y: newY };
      gameRef.current = { ...current, position: nextPosition };
      setPosition(nextPosition);
    });

    return () => subscription.remove();
  }, []);

  const toggleMute = () => {
    setIsMuted(soundManager.toggleMute());
  };

  const restartGame = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const newMaze = generateMaze(1);
    setMaze(newMaze);
    setLevel(1);
    setTimeLeft(GAME_DURATION_SECONDS);
    setScore(0);
    setGameOver(false);
    setPosition(startPosition(newMaze));
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.gameTitle} accessibilityRole="header">Red Ball Escape</Text>

      <TouchableOpacity
        style={styles.muteButton}
        onPress={toggleMute}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isMuted ? 'Unmute sound' : 'Mute sound'}
      >
        <Ionicons
          name={isMuted ? 'volume-mute' : 'volume-high'}
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      <Animated.View style={[styles.gameContainer, { opacity: fadeAnim }]}>
        {/* Ball and goal are positioned in maze coordinates, so they share the maze's box. */}
        <View style={{ width: MAZE_SIZE, height: MAZE_SIZE }}>
          <Maze maze={maze} />
          <LinearGradient
            colors={['#ffd700', '#ffa500']}
            style={[
              styles.goal,
              {
                width: cellSize,
                height: cellSize,
                left: cellSize * (maze.size - 1),
                top: cellSize * (maze.size - 1),
              }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.goalText} numberOfLines={1} adjustsFontSizeToFit>GOAL</Text>
          </LinearGradient>
          <Ball x={position.x} y={position.y} />
        </View>
      </Animated.View>

      <View style={styles.bottomContainer}>
        <View style={styles.hudContainer}>
          <View style={styles.hudItem} accessible accessibilityLabel={`Level ${level}`}>
            <Text style={styles.hudLabel}>Level</Text>
            <Text style={styles.hudValue}>{level}</Text>
          </View>
          <View style={styles.hudItem} accessible accessibilityLabel={`${timeLeft} seconds left`}>
            <Text style={styles.hudLabel}>Time</Text>
            <Text style={[styles.hudValue, timeLeft <= 10 && styles.timeWarning]}>
              {timeLeft}s
            </Text>
          </View>
          <View style={styles.hudItem} accessible accessibilityLabel={`Score ${score}`}>
            <Text style={styles.hudLabel}>Score</Text>
            <Text style={styles.hudValue}>{score}</Text>
          </View>
        </View>
        <View style={styles.highScoreContainer} accessible accessibilityLabel={`High score ${highScore}`}>
          <Text style={styles.highScoreLabel}>High Score</Text>
          <Text style={styles.highScoreValue}>{highScore}</Text>
        </View>
      </View>

      {gameOver && <GameOver onRestart={restartGame} score={score} highScore={highScore} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    alignSelf: 'center',
  },
  muteButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  gameContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  hudContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  hudItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 10,
    minWidth: 80,
  },
  hudLabel: {
    color: '#b0b0b0',
    fontSize: 14,
    marginBottom: 4,
  },
  hudValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeWarning: {
    color: '#ff4444',
  },
  highScoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  highScoreLabel: {
    color: '#b0b0b0',
    fontSize: 14,
    marginBottom: 4,
  },
  highScoreValue: {
    color: '#ffd700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  goal: {
    position: 'absolute',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  goalText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
