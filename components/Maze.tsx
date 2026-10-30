import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Maze } from '../utils/mazeGenerator';

interface MazeProps {
  maze: Maze;
  mazeSize: number;
}

const MazeComponent: React.FC<MazeProps> = ({ maze, mazeSize }) => {
  const cellSize = mazeSize / maze.size;

  // The floor is drawn once and only walls are placed on it: per-cell floor tiles at
  // fractional sizes overlapped and left hairlines between rows.
  return (
    <View style={[styles.container, { width: mazeSize, height: mazeSize }]}>
      <LinearGradient
        colors={['#2c3e50', '#34495e']}
        style={styles.background}
      />
      <View style={[styles.background, styles.path]} />
      {maze.walls.map(({ row, col }) => (
        <View
          key={`${row}-${col}`}
          style={[
            styles.wall,
            {
              left: col * cellSize,
              top: row * cellSize,
              width: cellSize,
              height: cellSize,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  wall: {
    position: 'absolute',
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: '#111',
    borderRadius: 4,
  },
  path: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

// Memoized: the grid only changes per level, not on every ball movement.
export default React.memo(MazeComponent);
