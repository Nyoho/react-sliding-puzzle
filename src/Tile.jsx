import React, { useCallback } from "react";
import { getMatrixPosition, getVisualPosition } from "./helpers";
import { GRID_SIZE, BOARD_SIZE } from "./constants"

function Tile(props) {
  const { tile, index, width, height, imgUrl, displayMode, onDragStart, onDragMove, onDragEnd, tileRefCallback } = props;
  const { row, col } = getMatrixPosition(index);
  const visualPos = getVisualPosition(row, col, width, height);

  const ref = useCallback((el) => {
    if (tileRefCallback) tileRefCallback(tile, el);
  }, [tile, tileRefCallback]);

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
    transform: `translate(${visualPos.x}px, ${visualPos.y}px)`,
    willChange: 'transform',
  };

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
    <li
      ref={ref}
      style={tileStyle}
      className="tile"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {displayMode === 1 && <span className="tile-number">{tile + 1}</span>}
      {displayMode === 2 && <span className="tile-number-large">{tile + 1}</span>}
    </li>
  );
}

export default Tile;
