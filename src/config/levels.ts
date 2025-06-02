import { Level, SpecialRule } from '../types';

// 定义不同的游戏模式
export enum GameMode {
  CLASSIC = 'classic',      // 经典模式
  TIME_RUSH = 'timeRush',   // 限时挑战
  MOVING = 'moving',        // 移动方块
  ROTATING = 'rotating',    // 旋转方块
  FADING = 'fading',       // 渐隐方块
  FROZEN = 'frozen',       // 冰冻方块
}

// 定义不同的形状模板
const shapes = {
  // 基础形状
  rectangle: (width: number, height: number): boolean[][] =>
    Array(height).fill(0).map(() => Array(width).fill(true)),

  // 心形
  heart: [
    [false, true, true, false, true, true, false],
    [true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true],
    [false, true, true, true, true, true, false],
    [false, false, true, true, true, false, false],
    [false, false, false, true, false, false, false],
  ],

  // 星形
  star: [
    [false, false, false, true, false, false, false],
    [false, false, true, true, true, false, false],
    [true, true, true, true, true, true, true],
    [false, true, true, true, true, true, false],
    [false, false, true, true, true, false, false],
    [false, true, false, false, false, true, false],
  ],

  // 蝴蝶形
  butterfly: [
    [true, false, true, true, true, false, true],
    [true, true, true, true, true, true, true],
    [false, true, true, true, true, true, false],
    [false, false, true, true, true, false, false],
    [false, true, true, false, true, true, false],
    [true, true, false, false, false, true, true],
  ],

  // 城堡形
  castle: [
    [true, false, true, false, true, false, true],
    [true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true],
    [true, false, true, true, true, false, true],
  ],

  // 钻石形
  diamond: [
    [false, false, false, true, false, false, false],
    [false, false, true, true, true, false, false],
    [false, true, true, true, true, true, false],
    [true, true, true, true, true, true, true],
    [false, true, true, true, true, true, false],
    [false, false, true, true, true, false, false],
    [false, false, false, true, false, false, false],
  ],
};

// 生成99个关卡
export const levels: Level[] = Array(99).fill(null).map((_, index) => {
  const level = index + 1;
  const difficulty = Math.floor(level / 10) + 1; // 每10关增加一个难度等级

  // 基础配置
  let config: Level = {
    id: level,
    name: `关卡 ${level}`,
    width: 7,
    height: 6,
    timeLimit: Math.max(180, 300 - difficulty * 15), // 减少时间限制，最低180秒
    baseScore: 3000 + (difficulty * 500) + (level * 20), // 大幅提高基础分数，并与关卡数相关
    tileTypes: Math.min(10 + Math.floor(difficulty / 2), 18), // 增加方块类型，最多18种
    mode: GameMode.CLASSIC,
    specialRules: [],
  };

  // 根据关卡设置不同的游戏模式和特殊规则
  if (level % 5 === 0) { // 每5关使用特殊形状
    const shapeKeys = Object.keys(shapes);
    const shapeIndex = Math.floor(level / 5) % shapeKeys.length;
    const shapeName = shapeKeys[shapeIndex];
    config.shape = shapes[shapeName === 'rectangle' ? 'rectangle' : shapeName as keyof typeof shapes];
  }

  // 设置游戏模式 - 新的模式分配逻辑
  const modeDistribution = [
    GameMode.CLASSIC,    // 1-10关：经典模式为主
    GameMode.TIME_RUSH,  // 11-20关：开始出现限时冲刺
    GameMode.MOVING,     // 21-30关：加入移动方块
    GameMode.ROTATING,   // 31-40关：加入旋转玩法
    GameMode.FADING,     // 41-50关：加入渐隐玩法
    GameMode.FROZEN      // 51-99关：加入冰冻玩法
  ];

  // 确定当前关卡可用的模式池
  const availableModes = modeDistribution.slice(0, Math.floor((level - 1) / 10) + 1);
  
  // 根据关卡号选择模式
  if (level <= 10) {
    // 前10关保持经典模式
    config.mode = GameMode.CLASSIC;
  } else {
    // 之后的关卡从可用模式池中选择
    const modeIndex = Math.floor(Math.pow(level, 2.5)) % availableModes.length;
    config.mode = availableModes[modeIndex];
  }

  // 添加特殊规则
  if (level > 15) { // 提前引入特殊规则
    // 根据模式添加对应的特殊规则
    switch (config.mode) {
      case GameMode.TIME_RUSH:
        config.specialRules.push('timerDecrease');
        break;
      case GameMode.MOVING:
        config.specialRules.push('movingTiles');
        break;
      case GameMode.ROTATING:
        config.specialRules.push('rotatingBoard');
        break;
      case GameMode.FADING:
        config.specialRules.push('fadingTiles');
        break;
      case GameMode.FROZEN:
        config.specialRules.push('frozenTiles');
        break;
    }

    // 额外的规则组合
    if (level % 8 === 0) { // 每8关添加额外规则，增加规则出现频率
      const extraRules: SpecialRule[] = ['timerDecrease', 'movingTiles', 'rotatingBoard', 'fadingTiles', 'frozenTiles'];
      const currentRules = new Set(config.specialRules);
      
      // 随机选择一个未使用的规则添加
      const availableRules = extraRules.filter(rule => !currentRules.has(rule));
      if (availableRules.length > 0) {
        const randomRule = availableRules[Math.floor(level % availableRules.length)];
        config.specialRules.push(randomRule);
      }
    }
  }

  // 调整难度相关参数
  if (difficulty > 4) { // 提前增加网格大小
    config.width = 8;
    config.height = 7;
  }
  if (difficulty > 7) {
    config.width = 9;
    config.height = 8;
  }
  if (difficulty > 9) { // 添加更大的网格
    config.width = 10;
    config.height = 9;
  }

  // 根据模式调整时间和分数
  switch (config.mode) {
    case GameMode.TIME_RUSH:
      config.timeLimit = Math.max(90, config.timeLimit - 90); // 进一步减少时间限制
      config.baseScore *= 1.8; // 增加基础分数倍率
      break;
    case GameMode.MOVING:
      config.timeLimit += 20; // 减少时间补偿
      config.baseScore *= 1.5;
      break;
    case GameMode.ROTATING:
      config.timeLimit += 30; // 减少时间补偿
      config.baseScore *= 1.6;
      break;
    case GameMode.FADING:
      config.timeLimit += 15; // 减少时间补偿
      config.baseScore *= 1.4;
      break;
    case GameMode.FROZEN:
      config.timeLimit += 25; // 减少时间补偿
      config.baseScore *= 1.55;
      break;
  }

  // 设置关卡名称
  config.name = getModeName(config.mode, level);

  return config;
});

// 获取模式名称
function getModeName(mode: GameMode, level: number): string {
  const baseNames = {
    [GameMode.CLASSIC]: "经典挑战",
    [GameMode.TIME_RUSH]: "限时冲刺",
    [GameMode.MOVING]: "移动迷踪",
    [GameMode.ROTATING]: "旋转乾坤",
    [GameMode.FADING]: "渐隐迷局",
    [GameMode.FROZEN]: "冰封绝阵"
  };

  const specialShapes = {
    heart: "心形",
    star: "星形",
    butterfly: "蝴蝶",
    castle: "城堡",
    diamond: "钻石"
  };

  let name = baseNames[mode];
  if (level % 5 === 0) {
    const shapeIndex = Math.floor(level / 5) % Object.keys(specialShapes).length;
    const shapeName = Object.values(specialShapes)[shapeIndex];
    name += ` - ${shapeName}`;
  }

  return name;
} 