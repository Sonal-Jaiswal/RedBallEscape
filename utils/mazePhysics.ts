import type { Maze } from './mazeGenerator';

const cellAt = (cellSize: number, x: number, y: number) => ({
  row: Math.floor(y / cellSize),
  col: Math.floor(x / cellSize),
});

// True when the point (in maze pixels) lies inside the maze and not inside a wall cell.
export function isOpenCell(maze: Maze, cellSize: number, x: number, y: number): boolean {
  const { row, col } = cellAt(cellSize, x, y);
  if (row < 0 || row >= maze.size || col < 0 || col >= maze.size) {
    return false;
  }
  return !maze.walls.some(wall => wall.row === row && wall.col === col);
}

// The goal is always the bottom-right cell.
export function isGoalCell(maze: Maze, cellSize: number, x: number, y: number): boolean {
  const { row, col } = cellAt(cellSize, x, y);
  return row === maze.size - 1 && col === maze.size - 1;
}
