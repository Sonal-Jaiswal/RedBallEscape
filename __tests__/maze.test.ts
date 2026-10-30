import { generateMaze, Maze } from '../utils/mazeGenerator';
import { isOpenCell, isGoalCell, canOccupy, moveBall, stepBall, ROLLING, BallState } from '../utils/mazePhysics';

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

describe('rolling', () => {
  const open: Maze = { size: 5, walls: [] };
  const radius = 0.3;
  const frame = 1 / 60;
  const roll = (maze: Maze, ball: BallState, tiltX: number, tiltY: number, seconds: number) => {
    for (let t = 0; t < seconds; t += frame) ball = stepBall(maze, ball, tiltX, tiltY, frame, radius);
    return ball;
  };
  const start: BallState = { x: 2.5, y: 2.5, vx: 0, vy: 0 };

  it('stays still on a level board, even with sensor noise inside the dead zone', () => {
    const ball = roll(open, start, ROLLING.deadZone / 2, -ROLLING.deadZone / 2, 1);
    expect(ball.x).toBe(2.5);
    expect(ball.y).toBe(2.5);
  });

  it('picks up speed gradually instead of jumping to full speed', () => {
    const afterOneFrame = stepBall(open, start, 0.5, 0, frame, radius);
    const afterHalfSecond = roll(open, start, 0.5, 0, 0.5);
    expect(afterOneFrame.vx).toBeGreaterThan(0);
    expect(afterHalfSecond.vx).toBeGreaterThan(afterOneFrame.vx * 10);
  });

  it('never exceeds the top speed, even at full tilt', () => {
    const ball = roll({ size: 15, walls: [] }, { x: 0.5, y: 7.5, vx: 0, vy: 0 }, 1, 0, 0.5);
    expect(Math.hypot(ball.vx, ball.vy)).toBeLessThanOrEqual(ROLLING.maxSpeed * 15 + 1e-9);
  });

  it('keeps rolling briefly after the board is levelled, then comes to rest', () => {
    const moving = roll(open, start, 0.5, 0, 0.3);
    const coasting = roll(open, moving, 0, 0, 0.2);
    const resting = roll(open, moving, 0, 0, 5);
    expect(coasting.x).toBeGreaterThan(moving.x);
    expect(Math.abs(resting.vx)).toBeLessThan(0.01);
  });

  it('bounces softly off a wall instead of passing through it', () => {
    const walled: Maze = { size: 5, walls: [{ row: 2, col: 3 }] };
    // The ball's right edge is 0.01 cells from the wall and this frame would carry it ~0.03 further.
    const ball = stepBall(walled, { x: 2.69, y: 2.5, vx: 2, vy: 0 }, 0, 0, frame, radius);
    expect(ball.x + radius).toBeLessThanOrEqual(3);
    expect(ball.vx).toBeLessThan(0);
    expect(Math.abs(ball.vx)).toBeLessThan(2 * ROLLING.bounce + 1e-9);
  });
});
