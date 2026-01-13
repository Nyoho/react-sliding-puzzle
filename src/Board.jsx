import React, { useState } from "react";
import Tile from "./Tile";
import { TILE_COUNT, GRID_SIZE, BOARD_SIZE } from "./constants"
import { canSwap, shuffle_with_actions, swap, act, isSolved } from "./helpers"

const actions = [
  {name: "a ↪️️", perm: [4,5,1,0], height: 0},
  {name: "a ↩️", perm: [0,1,5,4], height: 0},
  {name: "b ↪️️️", perm: [9,10,6,5], height: 50},
  {name: "b ↩️", perm: [5,6,10,9], height: 50},
  {name: "c ↪️️️", perm: [6,7,3,2], height: 0},
  {name: "c ↩️", perm: [2,3,7,6], height: 0},
]

function Board() {
  const imgUrl = 'image2.jpg';
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

  const handleSwipe = (direction, index) => {
    const swipeData = [
      [0, 'x-', 0],
      [0, 'x+', 1],
      [0, 'y-', 1],
      [0, 'y+', 0],
      [1, 'x-', 0],
      [1, 'x+', 1],
      [1, 'y-', 0],
      [1, 'y+', 1],
      [2, 'x-', 4],
      [2, 'x+', 5],
      [2, 'y-', 5],
      [2, 'y+', 4],
      [3, 'x-', 4],
      [3, 'x+', 5],
      [3, 'y-', 4],
      [3, 'y+', 5],
      [4, 'x-', 1],
      [4, 'x+', 0],
      [4, 'y-', 1],
      [4, 'y+', 0],
      [7, 'x-', 5],
      [7, 'x+', 4],
      [7, 'y-', 4],
      [7, 'y+', 5],
      [9, 'x-', 3],
      [9, 'x+', 2],
      [9, 'y-', 3],
      [9, 'y+', 2],
      [10, 'x-', 3],
      [10, 'x+', 2],
      [10, 'y-', 2],
      [10, 'y+', 3],
    ];

    const found = swipeData.find(e => e[0] == index && e[1] == direction)

    if (found) {
      const action = actions[found[2]]
      actTiles(action)
    }
  }
  
  const pieceWidth = Math.round(BOARD_SIZE / GRID_SIZE);
  const pieceHeight = Math.round(BOARD_SIZE / GRID_SIZE);
  const style = {
    width: BOARD_SIZE,
    height: BOARD_SIZE / GRID_SIZE * (TILE_COUNT / GRID_SIZE),
  };
  const hasWon = isSolved(tiles)

  return (
    <div className="game-area">
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
            handleSwipe={handleSwipe}
          />
        ))}
      </ul>
      <div className="win-message">
        {hasWon && isStarted && '🎉🎉解けﾀ━━━(ﾟ∀ﾟ)━━━!!🎉🎉'}
      </div>
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
        <button className="start-btn" onClick={isStarted ? handleShuffleClick : handleStartClick}>
          {isStarted ? 'Restart' : 'Start'}
        </button>
      </div>
    </div>
  );
}

export default Board;
