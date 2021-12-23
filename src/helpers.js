import { TILE_COUNT, GRID_SIZE } from "./constants"

// Credits to https://codepen.io/unindented/pen/QNWdRQ
export function isSolvable(tiles) {
  let product = 1;
  for (let i = 1, l = TILE_COUNT - 1; i <= l; i++) {
    for (let j = i + 1, m = l + 1; j <= m; j++) {
      product *= (tiles[i - 1] - tiles[j - 1]) / (i - j);
    }
  }
  return Math.round(product) === 1;
}

export function isSolved(tiles) {
  for (let i = 0, l = tiles.length; i < l; i++) {
    if (tiles[i] !== i) {
      return false;
    }
  }
  return true;
}

// Get the linear index from a row/col pair.
export function getIndex(row, col) {
  return parseInt(row, 10) * GRID_SIZE + parseInt(col, 10);
}

// Get the row/col pair from a linear index.
export function getMatrixPosition(index) {
  return {
    row: Math.floor(index / GRID_SIZE),
    col: index % GRID_SIZE,
  };
}

export function getVisualPosition(row, col, width, height) {
  return {
    x: col * width,
    y: row * height,
  };
}

export function shuffle(tiles) {
  const shuffledTiles = [
    ...tiles
      .filter((t) => t !== tiles.length - 1)
      .sort(() => Math.random() - 0.5),
    tiles.length - 1,
  ];
  return isSolvable(shuffledTiles) && !isSolved(shuffledTiles)
    ? shuffledTiles
    : shuffle(shuffledTiles);
}

export function shuffle_with_actions(tiles, actions) {
  let shuffledTiles = tiles;
  const n = actions.length;

  for (let i=0; i < 100; i++) {
    shuffledTiles = act(shuffledTiles, actions[Math.floor(Math.random() * n)])
  }
  
  return isSolvable(shuffledTiles) && !isSolved(shuffledTiles)
    ? shuffledTiles
    : shuffle_with_actions(shuffledTiles, actions);
}

export function canSwap(srcIndex, destIndex) {
  const { row: srcRow, col: srcCol } = getMatrixPosition(srcIndex);
  const { row: destRow, col: destCol } = getMatrixPosition(destIndex);
  return Math.abs(srcRow - destRow) + Math.abs(srcCol - destCol) === 1;
}

export function swap(tiles, src, dest) {
  const tilesResult = [...tiles];
  [tilesResult[src], tilesResult[dest]] = [tilesResult[dest], tilesResult[src]];
  return tilesResult;
}

export function act(tiles, action) {
  const tilesResult = [...tiles];
  const perm = action.perm;
  const dest = [...perm.slice(1,perm.length),perm[0]];

  for (let i=0; i < perm.length; i++) {
    tilesResult[dest[i]] = tiles[perm[i]]
  }
  // [tilesResult[src], tilesResult[dest]] = [tilesResult[dest], tilesResult[src]];
  return tilesResult;
}

export function updateURLParameter(url, param, paramVal) {
  var newAdditionalURL = "";
  var tempArray = url.split("?");
  var baseURL = tempArray[0];
  var additionalURL = tempArray[1];
  var temp = "";
  if (additionalURL) {
    tempArray = additionalURL.split("&");
    for (var i = 0; i < tempArray.length; i++) {
      if (tempArray[i].split("=")[0] !== param) {
        newAdditionalURL += temp + tempArray[i];
        temp = "&";
      }
    }
  }

  var rows_txt = temp + "" + param + "=" + paramVal;
  return baseURL + "?" + newAdditionalURL + rows_txt;
}
