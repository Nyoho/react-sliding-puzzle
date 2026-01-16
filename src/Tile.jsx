import React from "react";
import { motion } from 'framer-motion'
import { getMatrixPosition, getVisualPosition } from "./helpers";
import { GRID_SIZE, BOARD_SIZE } from "./constants"

function getDragOffset(index, dragInfo, width, height) {
  if (!dragInfo?.action || dragInfo.progress <= 0) return { x: 0, y: 0 };

  const perm = dragInfo.action.perm;
  const permIdx = perm.indexOf(index);
  if (permIdx === -1) return { x: 0, y: 0 };

  const dest = [...perm.slice(1), perm[0]];
  const { row: srcRow, col: srcCol } = getMatrixPosition(index);
  const { row: destRow, col: destCol } = getMatrixPosition(dest[permIdx]);

  return {
    x: (destCol - srcCol) * width * dragInfo.progress,
    y: (destRow - srcRow) * height * dragInfo.progress,
  };
}

function Tile(props) {
  const { tile, index, width, height, imgUrl, dragInfo, displayMode, onDragStart, onDragMove, onDragEnd } = props;
  const { row, col } = getMatrixPosition(index);
  const visualPos = getVisualPosition(row, col, width, height);

  const tileStyle = {
    width: `calc(${BOARD_SIZE}px / ${GRID_SIZE})`,
    height: `calc(${BOARD_SIZE}px / ${GRID_SIZE})`,
    ...(displayMode !== 2 && {
      backgroundImage: `url(${imgUrl})`,
      backgroundSize: `${BOARD_SIZE}px`,
      backgroundPosition: `${-(BOARD_SIZE / GRID_SIZE) * (tile % GRID_SIZE)}px ${-(BOARD_SIZE / GRID_SIZE) * (Math.floor(tile / GRID_SIZE))}px`,
    }),
    border: '1px solid rgba(0, 0, 0, 0.12)',
    touchAction: 'none',
    cursor: 'grab',
  };

  const offset = getDragOffset(index, dragInfo, width, height);
  const animX = visualPos.x + offset.x;
  const animY = visualPos.y + offset.y;
  const isDragging = dragInfo !== null;

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onDragStart(index, e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    onDragMove(index, e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    onDragEnd(index);
  };

  return (
    <motion.li
      initial={{ x: visualPos.x, y: visualPos.y }}
      animate={{ x: animX, y: animY }}
      transition={isDragging ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 35 }}
      style={tileStyle}
      className="tile"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {displayMode === 1 && <span className="tile-number">{tile + 1}</span>}
      {displayMode === 2 && <span className="tile-number-large">{tile + 1}</span>}
    </motion.li>
  );
}

export default Tile;
