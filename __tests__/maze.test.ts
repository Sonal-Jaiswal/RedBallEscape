import { generateMaze, Maze } from '../utils/mazeGenerator';
import { isOpenCell, isGoalCell, canOccupy, moveBall } from '../utils/mazePhysics';

function goalIsReachable(maze: Maze): boolean {
  const walls = new Set(maze.walls.map(w => `${w.row}-${w.col}`));
  const seen = new Set<string>(['0-0']);
  const queue: [number, number][] = [[0, 0]];
  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    if (row === maze.size - 1 && col === maze.size - 1) return true;
    for (const [r, c] of [[row + 1, col], [row - 1, col], [row, col + 1], [row, col - 1]]) {
      const key = `${r}-${c}`;
      if (r < 0 || c < 0 || r >= maze.size || c >= maze.size || walls.has(key) || seen.has(key)) continue;
      seen.add(key);
      queue.push([r, c]);
    }
  }
  return false;
}

describe('generateMaze', () => {
  it('grows from 5x5 by one cell every three levels, capped at 15', () => {
    expect(generateMaze(1).size).toBe(5);
    expect(generateMaze(3).size).toBe(6);
    expect(generateMaze(30).size).toBe(15);
    expect(generateMaze(500).size).toBe(15);
  });

  it('never walls off the start or goal and always leaves a path', () => {
    for (let level = 1; level <= 60; level++) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const maze = generateMaze(level);
        const last = maze.size - 1;
        expect(maze.walls).not.toContainEqual({ row: 0, col: 0 });
        expect(maze.walls).not.toContainEqual({ row: last, col: last });
        expect(goalIsReachable(maze)).toBe(true);
      }
    }
  });
});

describe('maze physics', () => {
  const maze: Maze = { size: 3, walls: [{ row: 1, col: 1 }] };
  const cellSize = 100;

  it('treats wall cells and out-of-bounds points as blocked', () => {
    expect(isOpenCell(maze, cellSize, 50, 50)).toBe(true);
    expect(isOpenCell(maze, cellSize, 150, 150)).toBe(false);
    expect(isOpenCell(maze, cellSize, -1, 50)).toBe(false);
    expect(isOpenCell(maze, cellSize, 50, 300)).toBe(false);
  });

  it('detects the bottom-right goal cell only', () => {
    expect(isGoalCell(maze, cellSize, 250, 250)).toBe(true);
    expect(isGoalCell(maze, cellSize, 250, 150)).toBe(false);
    expect(isGoalCell(maze, cellSize, 50, 50)).toBe(false);
  });
});

describe('ball movement', () => {
  // Wall in the centre of a 3x3 maze; positions are in cell units.
  const maze: Maze = { size: 3, walls: [{ row: 1, col: 1 }] };
  const radius = 0.3;

  it('keeps the whole ball, not just its centre, out of walls and inside the board', () => {
    expect(canOccupy(maze, 0.5, 0.5, radius)).toBe(true);
    expect(canOccupy(maze, 0.8, 1.5, radius)).toBe(false); // edge overlaps the wall at x = 1
    expect(canOccupy(maze, 0.2, 0.5, radius)).toBe(false); // edge pokes out of the board
    expect(canOccupy(maze, 0.75, 0.75, radius)).toBe(true); // diagonal to the wall's corner, not touching
  });

  it('stops at a wall instead of tunnelling through on a large step', () => {
    const end = moveBall(maze, { x: 0.5, y: 1.5 }, 2, 0, radius);
    expect(end.x).toBeLessThanOrEqual(1 - radius);
    expect(end.y).toBe(1.5);
  });

  it('slides along a wall when pushed diagonally into it', () => {
    // Start directly above the wall, pushing down and to the right.
    const end = moveBall(maze, { x: 1.5, y: 0.5 }, 0.5, 0.5, radius);
    expect(end.y).toBeLessThanOrEqual(1 - radius + 1e-9); // blocked by the wall below
    expect(end.x).toBeCloseTo(2); // still moved sideways the full distance
  });

  it('reaches the goal along an open corridor', () => {
    let position = { x: 0.5, y: 0.5 };
    position = moveBall(maze, position, 2, 0, radius);
    position = moveBall(maze, position, 0, 2, radius);
    expect(isGoalCell(maze, 1, position.x, position.y)).toBe(true);
  });
});
