import React from "react";
import { useState } from 'react'
import { motion } from 'framer-motion'
import { getMatrixPosition, getVisualPosition } from "./helpers";
import { TILE_COUNT, GRID_SIZE, BOARD_SIZE } from "./constants"

function Tile(props) {
  const { tile, index, width, height, handleTileClick, imgUrl, handleSwipe } = props;
  const { row, col } = getMatrixPosition(index);
  const visualPos = getVisualPosition(row, col, width, height);
  const tileStyle = {
    width: `calc(${BOARD_SIZE}px / ${GRID_SIZE})`,
    height: `calc(${BOARD_SIZE}px / ${GRID_SIZE})`,
    backgroundImage: `url(${imgUrl})`,
    backgroundSize: `${BOARD_SIZE}px`,
    backgroundPosition: `${-(BOARD_SIZE / GRID_SIZE) * (tile % GRID_SIZE)}px ${-(BOARD_SIZE / GRID_SIZE) * (Math.floor(tile / GRID_SIZE))}px`,
    // backgroundPosition: `${(100 / GRID_SIZE) * ((tile % GRID_SIZE))}% ${(100 / TILE_COUNT * GRID_SIZE) * (1 + Math.floor(tile / GRID_SIZE))}%`,
    border: 'dashed 1px #999',
    touchAction: 'none',
  };

  const [touchPosition, setTouchPosition] = useState(null)
  const handleTouchStart = (e) => {
    setTouchPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }
  const handleTouchMove = (e) => {
    const touchDown = touchPosition

    if(touchDown === null) {
      return
    }

    const diffX = e.touches[0].clientX - touchDown.x
    const diffY = e.touches[0].clientY - touchDown.y

    if (diffX > 5) {
      handleSwipe('x+', index)
    }
    if (diffX < -5) {
      handleSwipe('x-', index)
    }
    if (diffY > 5) {
      handleSwipe('y+', index)
    }
    if (diffY < -5) {
      handleSwipe('y-', index)
    }

    setTouchPosition(null)
  }

  return <motion.li
           initial={{ x: visualPos.x, y: visualPos.y}}
           animate={{ x: visualPos.x, y: visualPos.y}}
           transition={{ ease: 'backOut' }}
           style={{
             ...tileStyle,
           }}
           className="tile"
           onTouchStart={handleTouchStart}
           onTouchMove={handleTouchMove}
         >
           {!imgUrl && `${tile + 1}`}
         </motion.li>
}

export default Tile;
