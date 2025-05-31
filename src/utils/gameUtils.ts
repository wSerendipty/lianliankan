import { Tile, Position, Path } from '../types';

const isValidBoard = (board: Tile[], width: number, height: number): boolean => {
  const unmatched = board.filter(tile => !tile.isMatched);
  
  for (let i = 0; i < unmatched.length; i++) {
    for (let j = i + 1; j < unmatched.length; j++) {
      const tile1 = unmatched[i];
      const tile2 = unmatched[j];
      
      if (tile1.type === tile2.type) {
        const path = canConnect(tile1, tile2, board, width, height);
        if (path) {
          return true;
        }
      }
    }
  }
  
  return false;
};

export const generateBoard = (width: number, height: number, tileTypes: number): Tile[] => {
  let tiles: Tile[] = [];
  let isValid = false;
  
  while (!isValid) {
    tiles = [];
    const pairs = (width * height) / 2;
    
    // 生成配对的图块
    for (let i = 0; i < pairs; i++) {
      const type = (i % tileTypes) + 1;
      for (let j = 0; j < 2; j++) {
        tiles.push({
          id: i * 2 + j,
          type,
          x: 0,
          y: 0,
          isSelected: false,
          isMatched: false,
        });
      }
    }

    // 随机打乱图块位置
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // 设置图块坐标
    tiles = tiles.map((tile, index) => ({
      ...tile,
      x: index % width,
      y: Math.floor(index / width),
    }));

    // 检查是否有可匹配的图块
    isValid = isValidBoard(tiles, width, height);
  }

  return tiles;
};

const hasDirectPath = (start: Tile, end: Tile, board: Tile[]): boolean => {
  if (start.x === end.x) {
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    for (let y = minY + 1; y < maxY; y++) {
      if (board.some(t => !t.isMatched && t.x === start.x && t.y === y)) {
        return false;
      }
    }
    return true;
  }

  if (start.y === end.y) {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    for (let x = minX + 1; x < maxX; x++) {
      if (board.some(t => !t.isMatched && t.x === x && t.y === start.y)) {
        return false;
      }
    }
    return true;
  }

  return false;
};

const findOneCornerPath = (start: Tile, end: Tile, board: Tile[]): Path | null => {
  // 检查两个可能的拐角
  const corners = [
    { x: start.x, y: end.y },   // 水平后垂直
    { x: end.x, y: start.y }    // 垂直后水平
  ];

  for (const corner of corners) {
    // 检查拐角位置是否被占用
    if (!board.some(t => !t.isMatched && t.x === corner.x && t.y === corner.y)) {
      // 创建虚拟的拐角点进行路径检查
      const cornerTile = { ...corner, isMatched: false } as Tile;
      
      // 检查从起点到拐角，以及从拐角到终点的路径
      if (hasDirectPath(start, cornerTile, board) && hasDirectPath(cornerTile, end, board)) {
        return {
          start: { x: start.x, y: start.y },
          end: { x: end.x, y: end.y },
          corners: [corner]
        };
      }
    }
  }

  return null;
};

const findTwoCornerPath = (start: Tile, end: Tile, board: Tile[], maxWidth: number, maxHeight: number): Path | null => {
  // 检查水平方向的两个拐角路径
  for (let x = -1; x <= maxWidth; x++) {
    if (x === start.x || x === end.x) continue;

    const corner1 = { x, y: start.y };
    const corner2 = { x, y: end.y };

    // 检查两个拐角位置是否都没有被占用
    if (!board.some(t => !t.isMatched && t.x === x && t.y === start.y) &&
        !board.some(t => !t.isMatched && t.x === x && t.y === end.y)) {
      // 创建虚拟的拐角点
      const cornerTile1 = { ...corner1, isMatched: false } as Tile;
      const cornerTile2 = { ...corner2, isMatched: false } as Tile;

      // 检查三段路径是否都通畅
      if (hasDirectPath(start, cornerTile1, board) &&
          hasDirectPath(cornerTile1, cornerTile2, board) &&
          hasDirectPath(cornerTile2, end, board)) {
        return {
          start: { x: start.x, y: start.y },
          end: { x: end.x, y: end.y },
          corners: [corner1, corner2]
        };
      }
    }
  }

  // 检查垂直方向的两个拐角路径
  for (let y = -1; y <= maxHeight; y++) {
    if (y === start.y || y === end.y) continue;

    const corner1 = { x: start.x, y };
    const corner2 = { x: end.x, y };

    // 检查两个拐角位置是否都没有被占用
    if (!board.some(t => !t.isMatched && t.x === start.x && t.y === y) &&
        !board.some(t => !t.isMatched && t.x === end.x && t.y === y)) {
      // 创建虚拟的拐角点
      const cornerTile1 = { ...corner1, isMatched: false } as Tile;
      const cornerTile2 = { ...corner2, isMatched: false } as Tile;

      // 检查三段路径是否都通畅
      if (hasDirectPath(start, cornerTile1, board) &&
          hasDirectPath(cornerTile1, cornerTile2, board) &&
          hasDirectPath(cornerTile2, end, board)) {
        return {
          start: { x: start.x, y: start.y },
          end: { x: end.x, y: end.y },
          corners: [corner1, corner2]
        };
      }
    }
  }

  return null;
};

export const canConnect = (start: Tile, end: Tile, board: Tile[], maxWidth: number, maxHeight: number): Path | null => {
  // 检查直接路径
  if ((start.x === end.x || start.y === end.y) && hasDirectPath(start, end, board)) {
    return {
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
      corners: []
    };
  }

  // 检查一个拐角的路径
  const oneCornerPath = findOneCornerPath(start, end, board);
  if (oneCornerPath) return oneCornerPath;

  // 检查两个拐角的路径
  const twoCornerPath = findTwoCornerPath(start, end, board, maxWidth, maxHeight);
  if (twoCornerPath) return twoCornerPath;

  return null;
}; 