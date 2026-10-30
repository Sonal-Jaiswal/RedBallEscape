import { generateMaze, Maze } from '../utils/mazeGenerator';
import { isOpenCell, isGoalCell } from '../utils/mazePhysics';

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
