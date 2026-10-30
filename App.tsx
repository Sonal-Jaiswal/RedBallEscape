import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, AppState, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accelerometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Maze from './components/Maze';
import Ball from './components/Ball';
import GameOver from './components/GameOver';
import { generateMaze, Maze as MazeType } from './utils/mazeGenerator';
import { isGoalCell, stepBall, BallState } from './utils/mazePhysics';
import soundManager from './utils/soundManager';

const GAME_DURATION_SECONDS = 60;
const POINTS_PER_MAZE = 100;
const HIGH_SCORE_KEY = 'highScore';
const SENSOR_INTERVAL_MS = 16;
// How much of each new sensor reading is blended into the tilt (low-pass filter against hand tremor).
const TILT_SMOOTHING = 0.25;
// Ball radius in cell units; a diameter of 0.6 cells leaves room to pass through any open cell.
const BALL_RADIUS = 0.3;

// The ball's position is kept in cell units: (0.5, 0.5) is the centre of the top-left cell.
const START_BALL: BallState = { x: 0.5, y: 0.5, vx: 0, vy: 0 };

export default function App() {
  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
  );
}

function Game() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Leave room for the title and HUD above and below the board (matters in landscape on tablets).
  const availableHeight = height - insets.top - insets.bottom - 280;
  const mazeSize = Math.max(200, Math.min(width * 0.85, availableHeight));

  const [level, setLevel] = useState(1);
  const [maze, setMaze] = useState<MazeType>(() => generateMaze(1));
  const cellSize = mazeSize / maze.size;

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // The ball moves every frame, so its state lives in refs and an Animated value
  // instead of React state; only level changes re-render the screen.
  const ballRef = useRef<BallState>(START_BALL);
  const ballPosition = useRef(new Animated.ValueXY({ x: START_BALL.x, y: START_BALL.y })).current;

  // The frame loop reads the latest game state from this ref so it is started once.
  const gameRef = useRef({ maze, level, isPlaying: !gameOver && isAppActive });
  gameRef.current = { maze, level, isPlaying: !gameOver && isAppActive };

  const resetBall = () => {
    ballRef.current = START_BALL;
    ballPosition.setValue({ x: START_BALL.x, y: START_BALL.y });
  };

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
      setIsMuted(soundManager.muted);
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
    // The sensor only updates the smoothed tilt; the ball itself is stepped once per
    // screen frame so its motion stays even when sensor events arrive irregularly.
    const tilt = { x: 0, y: 0 };
    Accelerometer.setUpdateInterval(SENSOR_INTERVAL_MS);
    const subscription = Accelerometer.addListener(({ x, y }) => {
      tilt.x += (-x - tilt.x) * TILT_SMOOTHING;
      tilt.y += (y - tilt.y) * TILT_SMOOTHING;
    });

    let frame = 0;
    let lastTime: number | null = null;
    const tick = (time: number) => {
      // Clamp the time step so a stalled frame or a resume from background can't fling the ball.
      const seconds = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 1 / 30);
      lastTime = time;

      const current = gameRef.current;
      if (current.isPlaying && seconds > 0) {
        const next = stepBall(current.maze, ballRef.current, tilt.x, tilt.y, seconds, BALL_RADIUS);

        if (isGoalCell(current.maze, 1, next.x, next.y)) {
          const nextLevel = current.level + 1;
          const nextMaze = generateMaze(nextLevel);
          gameRef.current = { ...current, maze: nextMaze, level: nextLevel };
          resetBall();
          setScore(prev => prev + POINTS_PER_MAZE);
          soundManager.playSound('victory');
          setMaze(nextMaze);
          setLevel(nextLevel);
        } else {
          ballRef.current = next;
          ballPosition.setValue({ x: next.x, y: next.y });
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      subscription.remove();
      cancelAnimationFrame(frame);
    };
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
    resetBall();
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.gameTitle} accessibilityRole="header">Red Ball Escape</Text>

      <TouchableOpacity
        style={[styles.muteButton, { top: insets.top + 8, right: insets.right + 12 }]}
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
        <View style={{ width: mazeSize, height: mazeSize }}>
          <Maze maze={maze} mazeSize={mazeSize} />
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
          <Ball position={ballPosition} cellSize={cellSize} size={BALL_RADIUS * 2 * cellSize} />
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
