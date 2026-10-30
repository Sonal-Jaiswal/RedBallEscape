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

export interface MoveResult extends Point {
  hitX: boolean;
  hitY: boolean;
}

// Moves the ball by (dx, dy) cell units in steps no longer than a quarter of its
// radius, so fast tilts cannot tunnel through a wall. Each axis is resolved on its
// own, letting the ball slide along a wall instead of sticking to it.
export function moveBall(maze: Maze, from: Point, dx: number, dy: number, radius: number): MoveResult {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (radius / 4)));
  let { x, y } = from;
  let hitX = false;
  let hitY = false;
  for (let i = 0; i < steps; i++) {
    if (!hitX && canOccupy(maze, x + dx / steps, y, radius)) x += dx / steps;
    else hitX = true;
    if (!hitY && canOccupy(maze, x, y + dy / steps, radius)) y += dy / steps;
    else hitY = true;
  }
  return { x, y, hitX, hitY };
}

export interface BallState extends Point {
  vx: number;
  vy: number;
}

// Tuning for how the ball rolls. Distances are in "boards" (one maze width), so the
// ball feels the same on a 5x5 maze as on a 15x15 one.
export const ROLLING = {
  acceleration: 1.6, // boards/s² for each g of tilt
  maxSpeed: 0.55, // boards/s
  friction: 1.4, // per second: speed decays by e^(-friction·t) when the board is level
  bounce: 0.3, // share of speed kept (reversed) after hitting a wall
  deadZone: 0.03, // g of tilt ignored, so a phone lying flat keeps the ball still
};

const applyDeadZone = (tilt: number) =>
  Math.sign(tilt) * Math.max(0, Math.abs(tilt) - ROLLING.deadZone);

// Advances the ball by `seconds`: tilt accelerates it, rolling friction slows it,
// and walls bounce it back softly. Tilt is in g along the board's x (right) and y (down).
export function stepBall(
  maze: Maze,
  ball: BallState,
  tiltX: number,
  tiltY: number,
  seconds: number,
  radius: number,
): BallState {
  const scale = maze.size; // boards → cells
  const damping = Math.exp(-ROLLING.friction * seconds);
  let vx = (ball.vx + applyDeadZone(tiltX) * ROLLING.acceleration * scale * seconds) * damping;
  let vy = (ball.vy + applyDeadZone(tiltY) * ROLLING.acceleration * scale * seconds) * damping;

  const speed = Math.hypot(vx, vy);
  const maxSpeed = ROLLING.maxSpeed * scale;
  if (speed > maxSpeed) {
    vx *= maxSpeed / speed;
    vy *= maxSpeed / speed;
  }

  const moved = moveBall(maze, ball, vx * seconds, vy * seconds, radius);
  if (moved.hitX) vx = -vx * ROLLING.bounce;
  if (moved.hitY) vy = -vy * ROLLING.bounce;
  return { x: moved.x, y: moved.y, vx, vy };
}
