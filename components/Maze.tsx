import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Maze } from '../utils/mazeGenerator';

interface MazeProps {
  maze: Maze;
  mazeSize: number;
}

const MazeComponent: React.FC<MazeProps> = ({ maze, mazeSize }) => {
  const cellSize = mazeSize / maze.size;

  const wallSet = useMemo(() => new Set(maze.walls.map(w => `${w.row}-${w.col}`)), [maze]);

  return (
    <View style={[styles.container, { width: mazeSize, height: mazeSize }]}>
      <LinearGradient
        colors={['#2c3e50', '#34495e']}
        style={styles.background}
      />
      {Array.from({ length: maze.size }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: maze.size }, (_, col) => {
            const isWall = wallSet.has(`${row}-${col}`);
            return (
              <View
                key={col}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                  },
                ]}
              >
                {isWall ? (
                  <View style={styles.wall} />
                ) : (
                  <View style={styles.path} />
                )}
              </View>
            );
          })}
        </View>
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
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wall: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: '#111',
    borderRadius: 4,
  },
  path: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

// Memoized: the grid only changes per level, not on every ball movement.
export default React.memo(MazeComponent);
