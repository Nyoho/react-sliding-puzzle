import React, { useState, useRef, useEffect, useCallback } from "react";
import Tile from "./Tile";
import { TILE_COUNT, GRID_SIZE, BOARD_SIZE } from "./constants"
import { canSwap, shuffle_with_actions, swap, act, isSolved, getMatrixPosition, getVisualPosition } from "./helpers"

const CONFETTI_COLORS = ['#FFD93D', '#FF6B6B', '#6BCB77', '#845EC2', '#FF9671', '#00C9A7', '#FFC75F', '#F9F871'];

const CELEBRATE_FULL_DURATION = 3000;

function CelebrationOverlay({ onPlayAgain }) {
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinimized(true), CELEBRATE_FULL_DURATION);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`celebration-overlay${minimized ? ' minimized' : ''}`}>
      {!minimized && (
        <>
          <div className="celebration-starburst" />
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                '--i': i,
                '--color': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                left: `${(i * 2.5) % 100}%`,
              }}
            />
          ))}
        </>
      )}
      <div className="celebration-content">
        {!minimized && (
          <>
            <div className="celebration-emoji">🎉</div>
            <div className="celebration-title">CLEAR!</div>
            <div className="celebration-subtitle">パズルクリア!</div>
          </>
        )}
        {minimized && <span className="celebration-badge-label">🎉 CLEAR!</span>}
        <button className="celebration-btn" onClick={onPlayAgain}>
          もう一度あそぶ
        </button>
      </div>
    </div>
  );
}

const actions = [
  {name: "a ↪️️", perm: [4,5,1,0], height: 0},
  {name: "a ↩️", perm: [0,1,5,4], height: 0},
  {name: "b ↪️️️", perm: [9,10,6,5], height: 50},
  {name: "b ↩️", perm: [5,6,10,9], height: 50},
  {name: "c ↪️️️", perm: [6,7,3,2], height: 0},
  {name: "c ↩️", perm: [2,3,7,6], height: 0},
]

const swipeData = [
  [0, 'x-', 0], [0, 'x+', 1], [0, 'y-', 1], [0, 'y+', 0],
  [1, 'x-', 0], [1, 'x+', 1], [1, 'y-', 0], [1, 'y+', 1],
  [2, 'x-', 4], [2, 'x+', 5], [2, 'y-', 5], [2, 'y+', 4],
  [3, 'x-', 4], [3, 'x+', 5], [3, 'y-', 4], [3, 'y+', 5],
  [4, 'x-', 1], [4, 'x+', 0], [4, 'y-', 1], [4, 'y+', 0],
  [7, 'x-', 5], [7, 'x+', 4], [7, 'y-', 4], [7, 'y+', 5],
  [9, 'x-', 3], [9, 'x+', 2], [9, 'y-', 3], [9, 'y+', 2],
  [10, 'x-', 3], [10, 'x+', 2], [10, 'y-', 2], [10, 'y+', 3],
  [5, 'y-', 0], [5, 'x-', 1], [5, 'y+', 2], [5, 'x+', 3],
  [6, 'x-', 2], [6, 'y+', 3], [6, 'y-', 5], [6, 'x+', 4],
];

const LOCK_MS = 160;
const SPRING_STIFFNESS = 280;
const SPRING_DAMPING = 24;
const SNAP_VELOCITY_THRESHOLD = 0.5;
const SNAP_DISTANCE_THRESHOLD = 0.5;

function getTileTarget(tiles, tileValue, pieceWidth, pieceHeight) {
  const idx = tiles.indexOf(tileValue);
  const { row, col } = getMatrixPosition(idx);
  return getVisualPosition(row, col, pieceWidth, pieceHeight);
}

function getDragOffset(index, dragInfo, width, height) {
  if (!dragInfo?.action || dragInfo.progress <= 0) return null;

  const perm = dragInfo.action.perm;
  const permIdx = perm.indexOf(index);
  if (permIdx === -1) return null;

  const dest = [...perm.slice(1), perm[0]];
  const { row: srcRow, col: srcCol } = getMatrixPosition(index);
  const { row: destRow, col: destCol } = getMatrixPosition(dest[permIdx]);

  return {
    x: (destCol - srcCol) * width * dragInfo.progress,
    y: (destRow - srcRow) * height * dragInfo.progress,
  };
}

function Board() {
  const imgUrl = 'image2.jpg';
  const [tiles, setTiles] = useState([...Array(TILE_COUNT).keys()]);
  const [isStarted, setIsStarted] = useState(false);
  const [displayMode, setDisplayMode] = useState(0);
  const [dragInfo, setDragInfo] = useState(null);
  const dragInfoRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const animTimerRef = useRef(null);

  const tileRefsMap = useRef({});
  const springState = useRef({});
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const tilesRef = useRef(tiles);

  const pieceWidth = Math.round(BOARD_SIZE / GRID_SIZE);
  const pieceHeight = Math.round(BOARD_SIZE / GRID_SIZE);

  tilesRef.current = tiles;

  const tileRefCallback = useCallback((tileValue, el) => {
    if (el) {
      tileRefsMap.current[tileValue] = el;
    } else {
      delete tileRefsMap.current[tileValue];
    }
  }, []);

  const initSpringState = useCallback((tilesArr) => {
    const state = {};
    for (let tileValue = 0; tileValue < TILE_COUNT; tileValue++) {
      const target = getTileTarget(tilesArr, tileValue, pieceWidth, pieceHeight);
      state[tileValue] = {
        x: target.x, y: target.y,
        vx: 0, vy: 0,
        targetX: target.x, targetY: target.y,
      };
    }
    springState.current = state;
  }, [pieceWidth, pieceHeight]);

  const updateTargets = useCallback((tilesArr) => {
    for (let tileValue = 0; tileValue < TILE_COUNT; tileValue++) {
      const target = getTileTarget(tilesArr, tileValue, pieceWidth, pieceHeight);
      const s = springState.current[tileValue];
      if (s) {
        s.targetX = target.x;
        s.targetY = target.y;
      }
    }
  }, [pieceWidth, pieceHeight]);

  const applyTransform = useCallback((tileValue) => {
    const el = tileRefsMap.current[tileValue];
    const s = springState.current[tileValue];
    if (el && s) {
      el.style.transform = `translate(${s.x}px, ${s.y}px)`;
    }
  }, []);

  const startRAF = useCallback(() => {
    if (rafRef.current != null) return;
    lastTimeRef.current = null;

    const step = (now) => {
      const last = lastTimeRef.current;
      lastTimeRef.current = now;
      if (last === null) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.032);
      let allSettled = true;
      const currentDrag = dragInfoRef.current;

      for (let tileValue = 0; tileValue < TILE_COUNT; tileValue++) {
        const s = springState.current[tileValue];
        if (!s) continue;

        // Skip tiles being dragged
        if (currentDrag?.action) {
          const perm = currentDrag.action.perm;
          const idx = tilesRef.current.indexOf(tileValue);
          if (perm.includes(idx)) continue;
        }

        const dx = s.targetX - s.x;
        const dy = s.targetY - s.y;

        if (Math.abs(dx) < SNAP_DISTANCE_THRESHOLD && Math.abs(dy) < SNAP_DISTANCE_THRESHOLD &&
            Math.abs(s.vx) < SNAP_VELOCITY_THRESHOLD && Math.abs(s.vy) < SNAP_VELOCITY_THRESHOLD) {
          s.x = s.targetX;
          s.y = s.targetY;
          s.vx = 0;
          s.vy = 0;
          applyTransform(tileValue);
          continue;
        }

        allSettled = false;
        const ax = SPRING_STIFFNESS * dx - SPRING_DAMPING * s.vx;
        const ay = SPRING_STIFFNESS * dy - SPRING_DAMPING * s.vy;
        s.vx += ax * dt;
        s.vy += ay * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        applyTransform(tileValue);
      }

      if (allSettled) {
        rafRef.current = null;
        lastTimeRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }, [applyTransform]);

  // Initialize spring state on mount
  useEffect(() => {
    initSpringState(tiles);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDragInfo = (value) => {
    dragInfoRef.current = value;
    setDragInfo(value);
  };

  const commitAction = useCallback((action) => {
    isAnimatingRef.current = true;
    clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
    }, LOCK_MS);

    setTiles(prevTiles => {
      const newTiles = act(prevTiles, action);
      updateTargets(newTiles);
      startRAF();
      return newTiles;
    });
  }, [updateTargets, startRAF]);

  const resetTiles = useCallback((newTiles) => {
    // Keep current visual positions, update targets to new positions
    for (let tileValue = 0; tileValue < TILE_COUNT; tileValue++) {
      const s = springState.current[tileValue];
      if (s) {
        const target = getTileTarget(newTiles, tileValue, pieceWidth, pieceHeight);
        s.targetX = target.x;
        s.targetY = target.y;
        s.vx = 0;
        s.vy = 0;
      }
    }
    setTiles(newTiles);
    startRAF();
  }, [pieceWidth, pieceHeight, startRAF]);

  const shuffleTiles = useCallback(() => {
    const shuffledTiles = shuffle_with_actions([...Array(TILE_COUNT).keys()], actions);
    resetTiles(shuffledTiles);
  }, [resetTiles]);

  const swapTiles = (tileIndex) => {
    if (canSwap(tileIndex, tiles.indexOf(tiles.length - 1))) {
      const swappedTiles = swap(tiles, tileIndex, tiles.indexOf(tiles.length - 1))
      setTiles(swappedTiles)
    }
  }

  const handleActButtonClick = (actionID) => {
    if (isAnimatingRef.current) return;
    commitAction(actions[actionID]);
  }

  const handleTileClick = (index) => {
    swapTiles(index)
  }

  const handleShuffleClick = () => {
    shuffleTiles()
  }

  const handleStartClick = () => {
    shuffleTiles()
    setIsStarted(true)
  }

  const handleDragStart = (tileIndex, clientX, clientY) => {
    if (isAnimatingRef.current) return;
    if (dragInfoRef.current !== null) return;
    updateDragInfo({ tileIndex, startX: clientX, startY: clientY, action: null, direction: null, progress: 0 });
  };

  const handleDragMove = useCallback((tileIndex, clientX, clientY) => {
    const current = dragInfoRef.current;
    if (!current || current.tileIndex !== tileIndex) return;

    const dx = clientX - current.startX;
    const dy = clientY - current.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < 3 && absDy < 3) return;

    const direction = absDx > absDy ? (dx > 0 ? 'x+' : 'x-') : (dy > 0 ? 'y+' : 'y-');
    const found = swipeData.find(e => e[0] === tileIndex && e[1] === direction);

    if (!found) {
      if (current.action) updateDragInfo({ ...current, action: null, progress: 0 });
      return;
    }

    const action = actions[found[2]];
    const rawDelta = Math.max(absDx, absDy);
    const progress = Math.min(1, rawDelta / pieceWidth);

    updateDragInfo({ ...current, action, direction, progress });

    // Directly update DOM for drag preview tiles
    const currentTiles = tilesRef.current;
    const perm = action.perm;
    const dest = [...perm.slice(1), perm[0]];
    for (let i = 0; i < perm.length; i++) {
      const tileValue = currentTiles[perm[i]];
      const s = springState.current[tileValue];
      if (!s) continue;
      // Snap to grid position during drag
      const { row: srcRow, col: srcCol } = getMatrixPosition(perm[i]);
      const { row: destRow, col: destCol } = getMatrixPosition(dest[i]);
      const ox = (destCol - srcCol) * pieceWidth * progress;
      const oy = (destRow - srcRow) * pieceHeight * progress;
      const basePos = getVisualPosition(srcRow, srcCol, pieceWidth, pieceHeight);
      const el = tileRefsMap.current[tileValue];
      if (el) {
        el.style.transform = `translate(${basePos.x + ox}px, ${basePos.y + oy}px)`;
        el.style.zIndex = 10 + i;
      }
    }
  }, [pieceWidth, pieceHeight]);

  const handleDragEnd = useCallback((tileIndex) => {
    const current = dragInfoRef.current;
    if (!current) return;

    // Reset z-index for dragged tiles
    if (current.action) {
      const currentTiles = tilesRef.current;
      const perm = current.action.perm;
      for (let i = 0; i < perm.length; i++) {
        const tileValue = currentTiles[perm[i]];
        const el = tileRefsMap.current[tileValue];
        if (el) el.style.zIndex = '';
      }
    }

    updateDragInfo(null);
    if (current.tileIndex === tileIndex && current.progress >= 0.5 && current.action) {
      // Snap dragged tiles to their current visual position in spring state before committing
      const currentTiles = tilesRef.current;
      const perm = current.action.perm;
      const dest = [...perm.slice(1), perm[0]];
      for (let i = 0; i < perm.length; i++) {
        const tileValue = currentTiles[perm[i]];
        const s = springState.current[tileValue];
        if (!s) continue;
        const { row: srcRow, col: srcCol } = getMatrixPosition(perm[i]);
        const { row: destRow, col: destCol } = getMatrixPosition(dest[i]);
        const basePos = getVisualPosition(srcRow, srcCol, pieceWidth, pieceHeight);
        s.x = basePos.x + (destCol - srcCol) * pieceWidth * current.progress;
        s.y = basePos.y + (destRow - srcRow) * pieceHeight * current.progress;
        s.vx = 0;
        s.vy = 0;
      }
      commitAction(current.action);
    } else if (current.action) {
      // Drag cancelled: snap back with spring
      const currentTiles = tilesRef.current;
      const perm = current.action.perm;
      const dest = [...perm.slice(1), perm[0]];
      for (let i = 0; i < perm.length; i++) {
        const tileValue = currentTiles[perm[i]];
        const s = springState.current[tileValue];
        if (!s) continue;
        const { row: srcRow, col: srcCol } = getMatrixPosition(perm[i]);
        const { row: destRow, col: destCol } = getMatrixPosition(dest[i]);
        const basePos = getVisualPosition(srcRow, srcCol, pieceWidth, pieceHeight);
        s.x = basePos.x + (destCol - srcCol) * pieceWidth * current.progress;
        s.y = basePos.y + (destRow - srcRow) * pieceHeight * current.progress;
        s.vx = 0;
        s.vy = 0;
      }
      startRAF();
    }
  }, [pieceWidth, pieceHeight, commitAction, startRAF]);

  const style = {
    width: BOARD_SIZE,
    height: BOARD_SIZE / GRID_SIZE * (TILE_COUNT / GRID_SIZE),
  };
  const hasWon = isSolved(tiles)
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (hasWon && isStarted) {
      const timer = setTimeout(() => setShowCelebration(true), 400);
      return () => clearTimeout(timer);
    }
  }, [hasWon, isStarted]);

  const handlePlayAgain = useCallback(() => {
    setShowCelebration(false);
    shuffleTiles();
  }, [shuffleTiles]);

  return (
    <div className="game-area">
      <ul
        style={style}
        className="board"
        onPointerUp={(e) => {
          if (dragInfoRef.current) handleDragEnd(dragInfoRef.current.tileIndex);
        }}
      >
        {tiles.map((tile, index) => (
          <Tile
            key={tile}
            index={index}
            imgUrl={imgUrl}
            tile={tile}
            width={pieceWidth}
            height={pieceHeight}
            handleTileClick={handleTileClick}
            displayMode={displayMode}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            tileRefCallback={tileRefCallback}
          />
        ))}
      </ul>
      {showCelebration && <CelebrationOverlay onPlayAgain={handlePlayAgain} />}
      <div className="controls">
        <div className="controller">
          <div className="btn-group btn-group-a">
            <button className="action-btn" onClick={() => handleActButtonClick(0)}>a↺</button>
            <button className="action-btn" onClick={() => handleActButtonClick(1)}>a↻</button>
          </div>
          <div className="btn-group btn-group-b">
            <button className="action-btn" onClick={() => handleActButtonClick(2)}>b↺</button>
            <button className="action-btn" onClick={() => handleActButtonClick(3)}>b↻</button>
          </div>
          <div className="btn-group btn-group-c">
            <button className="action-btn" onClick={() => handleActButtonClick(4)}>c↺</button>
            <button className="action-btn" onClick={() => handleActButtonClick(5)}>c↻</button>
          </div>
        </div>
        <div className="bottom-controls">
          <div className="mode-toggle">
            <button
              className={`mode-btn${displayMode === 0 ? ' active' : ''}`}
              onClick={() => setDisplayMode(0)}
            >絵のみ</button>
            <button
              className={`mode-btn${displayMode === 1 ? ' active' : ''}`}
              onClick={() => setDisplayMode(1)}
            >番号表示</button>
            <button
              className={`mode-btn${displayMode === 2 ? ' active' : ''}`}
              onClick={() => setDisplayMode(2)}
            >番号のみ</button>
          </div>
          <button className="start-btn" onClick={isStarted ? handleShuffleClick : handleStartClick}>
            {isStarted ? 'Restart' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Board;
