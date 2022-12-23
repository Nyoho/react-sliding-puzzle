import React, { useState } from "react";
import Tile from "./Tile";
import { TILE_COUNT, GRID_SIZE, BOARD_SIZE } from "./constants"
import { canSwap, shuffle_with_actions, swap, act, isSolved } from "./helpers"

const actions = [
  {name: "a ↪️️", perm: [4,5,1,0]},
  {name: "a ↩️", perm: [0,1,5,4]},
  {name: "b ↪️️️", perm: [9,10,6,5]},
  {name: "b ↩️", perm: [5,6,10,9]},
  {name: "c ↪️️️", perm: [6,7,3,2]},
  {name: "c ↩️", perm: [2,3,7,6]},
]

function Board() {
  const imgUrl = 'image2.png';
  const [tiles, setTiles] = useState([...Array(TILE_COUNT).keys()]);
  const [isStarted, setIsStarted] = useState(false);
  console.log('is started:', isStarted)

  const shuffleTiles = () => {
    const shuffledTiles = shuffle_with_actions([...Array(TILE_COUNT).keys()], actions)
    setTiles(shuffledTiles);
  }

  const swapTiles = (tileIndex) => {
    if (canSwap(tileIndex, tiles.indexOf(tiles.length - 1))) {
      const swappedTiles = swap(tiles, tileIndex, tiles.indexOf(tiles.length - 1))
      setTiles(swappedTiles)
    }
  }

  const actTiles = (action) => {
    const actedTiles = act(tiles, action)
    setTiles(actedTiles)
  }

  const handleActButtonClick = (actionID) => {
    const action = actions[actionID]
    console.log(action)
    const actedTiles = act(tiles, action)
    setTiles(actedTiles)
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

  const pieceWidth = Math.round(BOARD_SIZE / GRID_SIZE);
  const pieceHeight = Math.round(BOARD_SIZE / GRID_SIZE);
  const style = {
    width: BOARD_SIZE,
    height: BOARD_SIZE / GRID_SIZE * (TILE_COUNT / GRID_SIZE),
  };
  const hasWon = isSolved(tiles)

  return (
    <>
      <ul style={style} className="board">
        {tiles.map((tile, index) => (
          <Tile
            key={tile}
            index={index}
            imgUrl={imgUrl}
            tile={tile}
            width={pieceWidth}
            height={pieceHeight}
            handleTileClick={handleTileClick}
          />
        ))}
      </ul>
      {hasWon && isStarted ? <>🎉🎉解けﾀ━━━(ﾟ∀ﾟ)━━━!!🎉🎉</> : <>.</>}
      <div className="controller">
        {actions.map(
          (a,i) =>
          <button onClick={() => handleActButtonClick(i)}>{a.name}️</button>
        )}
      </div>
      {!isStarted ?
        (<button onClick={() => handleStartClick()}>Start game</button>) :
        (<button onClick={() => handleShuffleClick()}>Restart game</button>)}
    </>
  );
}

export default Board;
