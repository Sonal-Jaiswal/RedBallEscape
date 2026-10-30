import type { Maze } from './mazeGenerator';

export interface Point {
  x: number;
  y: number;
}

const wallSets = new WeakMap<Maze, Set<string>>();

// Wall lookups happen on every sensor tick, so each maze's walls are indexed once.
function wallSet(maze: Maze): Set<string> {
  let walls = wallSets.get(maze);
  if (!walls) {
    walls = new Set(maze.walls.map(wall => `${wall.row}-${wall.col}`));
    wallSets.set(maze, walls);
  }
  return walls;
}

const isWall = (maze: Maze, row: number, col: number) => wallSet(maze).has(`${row}-${col}`);

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
  return !isWall(maze, row, col);
}

// The goal is always the bottom-right cell.
export function isGoalCell(maze: Maze, cellSize: number, x: number, y: number): boolean {
  const { row, col } = cellAt(cellSize, x, y);
  return row === maze.size - 1 && col === maze.size - 1;
}

// True when a ball of the given radius centred at (x, y) fits inside the maze
// without overlapping any wall cell. Coordinates are in cell units.
export function canOccupy(maze: Maze, x: number, y: number, radius: number): boolean {
  if (x - radius < 0 || y - radius < 0 || x + radius > maze.size || y + radius > maze.size) {
    return false;
  }
  for (let row = Math.floor(y - radius); row <= Math.floor(y + radius); row++) {
    for (let col = Math.floor(x - radius); col <= Math.floor(x + radius); col++) {
      if (!isWall(maze, row, col)) continue;
      // Distance from the ball's centre to the closest point of the wall square.
      const dx = x - Math.max(col, Math.min(x, col + 1));
      const dy = y - Math.max(row, Math.min(y, row + 1));
      if (dx * dx + dy * dy < radius * radius) return false;
    }
  }
  return true;
}

// Moves the ball by (dx, dy) cell units in steps no longer than half its radius,
// so fast tilts cannot tunnel through a wall. Each axis is resolved on its own,
// letting the ball slide along a wall instead of sticking to it.
export function moveBall(maze: Maze, from: Point, dx: number, dy: number, radius: number): Point {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (radius / 2)));
  let { x, y } = from;
  for (let i = 0; i < steps; i++) {
    if (canOccupy(maze, x + dx / steps, y, radius)) x += dx / steps;
    if (canOccupy(maze, x, y + dy / steps, radius)) y += dy / steps;
  }
  return { x, y };
}
