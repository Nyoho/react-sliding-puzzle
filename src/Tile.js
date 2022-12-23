import React from "react";
import { Motion, spring } from "react-motion";
import { getMatrixPosition, getVisualPosition } from "./helpers";
import { TILE_COUNT, GRID_SIZE, BOARD_SIZE } from "./constants"

function Tile(props) {
  const { tile, index, width, height, handleTileClick, imgUrl } = props;
  const { row, col } = getMatrixPosition(index);
  const visualPos = getVisualPosition(row, col, width, height);
  const tileStyle = {
    width: `calc(${BOARD_SIZE}px / ${GRID_SIZE})`,
    height: `calc(${BOARD_SIZE}px / ${GRID_SIZE})`,
    translateX: visualPos.x,
    translateY: visualPos.y,
    backgroundImage: `url(${imgUrl})`,
    backgroundSize: `${BOARD_SIZE}px`,
    backgroundPosition: `${-(BOARD_SIZE / GRID_SIZE) * (tile % GRID_SIZE)}px ${-(BOARD_SIZE / GRID_SIZE) * (Math.floor(tile / GRID_SIZE))}px`,
    // backgroundPosition: `${(100 / GRID_SIZE) * ((tile % GRID_SIZE))}% ${(100 / TILE_COUNT * GRID_SIZE) * (1 + Math.floor(tile / GRID_SIZE))}%`,
    border: 'dashed 1px #999',
  };
  const motionStyle = {
    translateX: spring(visualPos.x),
    translateY: spring(visualPos.y)
  }

  return (
    <Motion style={motionStyle}>
      {({ translateX, translateY }) => (
        <li
          style={{
            ...tileStyle,
            transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
          }}
          className="tile"
        >
          {!imgUrl && `${tile + 1}`}
        </li>
      )}
    </Motion>
  );
}

export default Tile;
