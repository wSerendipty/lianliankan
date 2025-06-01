import { Tile, Position, Path } from '../types';

const isValidBoard = (board: Tile[], width: number, height: number): boolean => {
  // 检查每个未匹配的方块是否都有至少一个可以连接的对应方块
  const unmatched = board.filter(tile => !tile.isMatched);
  const checked = new Set<number>();

  for (let i = 0; i < unmatched.length; i++) {
    const tile1 = unmatched[i];
    if (checked.has(tile1.id)) continue;

    let hasMatch = false;
    for (let j = i + 1; j < unmatched.length; j++) {
      const tile2 = unmatched[j];
      if (tile1.type === tile2.type) {
        const path = canConnect(tile1, tile2, board, width, height);
        if (path) {
          hasMatch = true;
          checked.add(tile1.id);
          checked.add(tile2.id);
          break;
        }
      }
    }
    
    if (!hasMatch) {
      return false;
    }
  }
  
  return checked.size === unmatched.length;
};

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// 添加一个辅助函数来检查相邻的相同类型方块
const checkAdjacentSameType = (
  tiles: Tile[],
  x: number,
  y: number,
  type: number,
  width: number,
  height: number
): boolean => {
  // 检查周围8个方向
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  let sameTypeCount = 0;
  for (const [dx, dy] of directions) {
    const newX = x + dx;
    const newY = y + dy;
    
    // 检查边界
    if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
      const adjacentTile = tiles.find(t => t.x === newX && t.y === newY);
      if (adjacentTile && adjacentTile.type === type) {
        sameTypeCount++;
      }
    }
  }

  // 如果周围有2个或以上相同类型的方块，返回true表示不适合放置
  return sameTypeCount >= 2;
};

export const generateBoard = (width: number, height: number, tileTypes: number, shape?: boolean[][]): Tile[] => {
  const validShape = Array(height).fill(0).map(() => Array(width).fill(true));
  if (shape) {
    for (let y = 0; y < Math.min(shape.length, height); y++) {
      for (let x = 0; x < Math.min(shape[y].length, width); x++) {
        validShape[y][x] = shape[y][x];
      }
    }
  }

  // 收集所有有效位置
  const validPositions: Position[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (validShape[y][x]) {
        validPositions.push({ x, y });
      }
    }
  }

  if (validPositions.length % 2 !== 0) {
    validPositions.pop();
  }

  if (validPositions.length < 2) {
    console.error('Not enough valid positions for a game');
    return [];
  }

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;
    
    // 创建所有可能的配对
    let availableTypes = Array(Math.floor(validPositions.length / 2))
      .fill(0)
      .map((_, index) => (index % tileTypes) + 1)
      .flatMap(type => [type, type]); // 每个类型创建两个
    
    availableTypes = shuffleArray(availableTypes);
    
    const tiles: Tile[] = [];
    const positionsToUse = [...validPositions];
    let success = true;

    // 尝试放置每个方块
    for (let i = 0; i < validPositions.length; i++) {
      let placed = false;
      const type = availableTypes[i];
      
      // 尝试在不同位置放置方块
      for (let j = 0; j < positionsToUse.length; j++) {
        const pos = positionsToUse[j];
        
        // 检查这个位置是否适合放置（避免相同类型方块聚集）
        if (!checkAdjacentSameType(tiles, pos.x, pos.y, type, width, height)) {
          tiles.push({
            id: i,
            type,
            x: pos.x,
            y: pos.y,
            isSelected: false,
            isMatched: false,
          });
          
          // 移除已使用的位置
          positionsToUse.splice(j, 1);
          placed = true;
          break;
        }
      }

      // 如果无法找到合适的位置，标记此次尝试失败
      if (!placed) {
        success = false;
        break;
      }
    }

    // 验证游戏板
    if (success && isValidBoard(tiles, width, height)) {
      // 最后再次打乱相同类型的方块顺序
      const finalTiles: Tile[] = [];
      const tilesByType = new Map<number, Tile[]>();
      
      // 按类型分组
      tiles.forEach(tile => {
        if (!tilesByType.has(tile.type)) {
          tilesByType.set(tile.type, []);
        }
        tilesByType.get(tile.type)!.push(tile);
      });

      // 对每种类型的方块单独打乱
      tilesByType.forEach(typeTiles => {
        const shuffled = shuffleArray(typeTiles);
        finalTiles.push(...shuffled);
      });

      console.log(`Generated valid board in ${attempts} attempts`);
      return finalTiles;
    }
  }

  // 如果无法生成理想的布局，使用简单布局
  console.warn('Failed to generate optimal board, falling back to simple layout');
  return generateSimpleBoard(width, height, tileTypes, validShape);
};

const generateSimpleBoard = (width: number, height: number, tileTypes: number, shape: boolean[][]): Tile[] => {
  const validPositions: Position[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (shape[y][x]) {
        validPositions.push({ x, y });
      }
    }
  }

  if (validPositions.length % 2 !== 0) {
    validPositions.pop();
  }

  if (validPositions.length < 2) {
    return [];
  }

  // 创建所有配对并打乱
  const pairs = Math.floor(validPositions.length / 2);
  const types = Array(pairs)
    .fill(0)
    .map((_, index) => (index % tileTypes) + 1)
    .flatMap(type => [type, type]);
  
  const shuffledTypes = shuffleArray(types);
  const shuffledPositions = shuffleArray(validPositions);

  // 创建方块，确保相同类型的方块不会太靠近
  const tiles: Tile[] = [];
  for (let i = 0; i < shuffledPositions.length; i++) {
    const pos = shuffledPositions[i];
    tiles.push({
      id: i,
      type: shuffledTypes[i],
      x: pos.x,
      y: pos.y,
      isSelected: false,
      isMatched: false,
    });
  }

  // 最后一次打乱，但保持一定距离
  return shuffleArray(tiles).map((tile, index) => ({
    ...tile,
    id: index,
  }));
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