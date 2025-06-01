import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Tile, GameState, User, Level, SpecialRule } from '../types';
import { levels, GameMode } from '../config/levels';
import AudioManager from '../utils/AudioManager';
import { generateBoard, canConnect } from '../utils/gameUtils';
import { updateUserProgress, getCurrentSession, logout, getUsers } from '../utils/userUtils';
import Auth from './Auth';
import LevelSelect from './LevelSelect';

const GameContainer = styled.div<{ $isAuth?: boolean }>`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
  color: white;
  position: relative;
  padding: 20px;
  box-sizing: border-box;
  max-width: 100vw;
  overflow-x: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 10px;
    gap: 10px;
  }
`;

const LeftPanel = styled.div`
  width: 260px;
  margin-right: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    width: 100%;
    margin-right: 0;
    gap: 10px;
  }
`;

const UserCard = styled.div`
  background: rgba(30, 41, 59, 0.7);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UserInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }

  span:first-child {
    color: rgba(255, 255, 255, 0.7);
  }

  span:last-child {
    font-size: 1.1rem;
    font-weight: 500;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 5px;
`;

const LevelSelectButton = styled.button`
  width: 100%;
  background: #3182ce;
  border: none;
  color: white;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: #2c5282;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const LogoutButton = styled.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const GameStats = styled.div`
  background: rgba(30, 41, 59, 0.7);
  border-radius: 12px;
  padding: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }

  span:first-child {
    color: rgba(255, 255, 255, 0.7);
  }

  span:last-child {
    font-size: 1.2rem;
    font-weight: 500;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    margin: 10px 0;
    padding: 5px;
  }
`;

const GameTitle = styled.h1`
  color: #ffffff;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin: 0;
  padding: 15px;
  text-align: center;
  background: rgba(30, 41, 59, 0.7);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    font-size: 1.8rem;
    padding: 10px;
  }
`;

const GameBoard = styled.div<{ width: number; height: number; $rotation?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.width}, 60px);
  grid-template-rows: repeat(${props => props.height}, 60px);
  gap: 4px;
  background: rgba(30, 41, 59, 0.7);
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  transform: ${props => props.$rotation ? `rotate(${props.$rotation}deg)` : 'none'};
  transition: transform 0.5s ease;

  @media (max-width: 768px) {
    grid-template-columns: repeat(${props => props.width}, minmax(30px, 1fr));
    grid-template-rows: repeat(${props => props.height}, minmax(30px, 1fr));
    gap: 2px;
    padding: 8px;
    width: calc(100vw - 20px);
    max-width: 100vw;
    overflow-x: auto;
    justify-content: center;
    margin: 0 auto;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(${props => props.width}, minmax(25px, 1fr));
    grid-template-rows: repeat(${props => props.height}, minmax(25px, 1fr));
    gap: 1px;
    padding: 4px;
  }
`;

const RightPanel = styled.div`
  width: 260px;
  margin-left: 20px;

  @media (max-width: 768px) {
    width: 100%;
    margin-left: 0;
    order: -1;
  }
`;

const SoundControls = styled.div`
  background: rgba(30, 41, 59, 0.7);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const VolumeControl = styled.div`
  margin-top: 15px;

  label {
    display: block;
    margin-bottom: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1rem;
  }

  input[type="range"] {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      background: #fff;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }
    }

    &::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: #fff;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }
    }
  }
`;

const GameRules = styled.div<{ $isExpanded: boolean }>`
  background: rgba(30, 41, 59, 0.7);
  border-radius: 12px;
  padding: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;

  h3 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    font-size: 1.2rem;
    color: white;
    user-select: none;

    span {
      transition: transform 0.2s ease;
      transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0)'};
    }
  }

  .rules-content {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.2s ease-out;
    margin-top: 0;
    transform: translateY(-10px);

    &.expanded {
      opacity: 1;
      max-height: 500px;
      margin-top: 15px;
      transform: translateY(0);
    }
  }

  ul {
    margin: 0;
    padding-left: 20px;
    
    li {
      margin: 6px 0;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.95rem;
    }
  }

  &:hover {
    background: rgba(30, 41, 59, 0.8);
  }
`;

const GameHeader = styled.div<{ $hasScroll: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: ${props => props.$hasScroll ? '0' : '20px'};
  width: ${props => props.$hasScroll ? '300px' : '100%'};
  max-width: ${props => props.$hasScroll ? '300px' : '800px'};
  z-index: 100;

  ${props => props.$hasScroll && `
    position: fixed;
    top: 180px;
    left: 20px;
  `}
`;

const GameInfo = styled.div<{ $hasScroll: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  background: rgba(26, 54, 93, 0.95);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 10px 20px rgba(0, 0, 0, 0.1);

  ${props => props.$hasScroll && `
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
      pointer-events: none;
    }
  `}
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }

  span:first-child {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  span:last-child {
    font-size: 1.2rem;
    font-weight: bold;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  font-size: 1.1rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 10px;

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 1rem;
    margin: 0;
    width: 100%;
  }

  &:hover {
    background: #45a049;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  color: #333;
  text-align: center;
  z-index: 1000;
  width: 90%;
  max-width: 400px;

  @media (max-width: 768px) {
    padding: 20px;
    width: 85%;
  }

  h2 {
    margin-bottom: 20px;
    color: #2d3748;
    font-size: 1.5rem;
  }

  p {
    margin-bottom: 20px;
    font-size: 1.1rem;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const Timer = styled.div<{ $isWarning: boolean }>`
  color: ${props => props.$isWarning ? '#ff3b30' : 'white'};
  font-size: 1.2rem;
  font-weight: ${props => props.$isWarning ? '600' : 'normal'};
`;

const HighestLevel = styled.div`
  position: fixed;
  top: 20px;
  right: 50%;
  transform: translateX(50%);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  color: white;
  font-size: 1.1rem;
  z-index: 1000;
`;

const glowAnimation = keyframes`
  0% {
    filter: drop-shadow(0 0 2px rgba(10, 132, 255, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(10, 132, 255, 0.8));
  }
  100% {
    filter: drop-shadow(0 0 2px rgba(10, 132, 255, 0.5));
  }
`;

const glowPulse = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(72, 187, 120, 0.2);
    border: 2px solid rgba(72, 187, 120, 0.3);
  }
  50% {
    box-shadow: 0 0 12px rgba(72, 187, 120, 0.4);
    border: 2px solid rgba(72, 187, 120, 0.5);
  }
  100% {
    box-shadow: 0 0 5px rgba(72, 187, 120, 0.2);
    border: 2px solid rgba(72, 187, 120, 0.3);
  }
`;

const TileButton = styled.button<{
  $isSelected: boolean;
  $isMatched: boolean;
  $isInvalid?: boolean;
  $isHint?: boolean;
  $isDisabled?: boolean;
  $isFrozen?: boolean;
  $isFading?: boolean;
  $rotation?: number;
}>`
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  font-size: 28px;
  cursor: ${props => (props.$isDisabled || props.$isFrozen) ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  background-color: ${props => {
    if (props.$isDisabled) return 'transparent';
    if (props.$isMatched) return 'transparent';
    if (props.$isInvalid) return 'rgba(239, 68, 68, 0.9)';
    if (props.$isFrozen) return 'rgba(147, 197, 253, 0.9)';
    if (props.$isSelected) return 'rgba(72, 187, 120, 0.9)';
    if (props.$isHint) return 'rgba(72, 187, 120, 0.2)';
    return 'rgba(255, 255, 255, 0.9)';
  }};
  opacity: ${props => {
    if (props.$isDisabled || props.$isMatched) return 0;
    if (props.$isFading) return 0.5;
    return 1;
  }};
  transform: ${props => {
    let transform = props.$isSelected || props.$isInvalid ? 'scale(0.95)' : 'scale(1)';
    if (props.$rotation) {
      transform += ` rotate(${props.$rotation}deg)`;
    }
    return transform;
  }};
  pointer-events: ${props => (props.$isDisabled || props.$isMatched || props.$isFrozen) ? 'none' : 'auto'};
  box-shadow: ${props => {
    if (props.$isDisabled || props.$isMatched) return 'none';
    if (props.$isInvalid) return '0 4px 6px rgba(239, 68, 68, 0.2)';
    if (props.$isSelected) return '0 4px 6px rgba(72, 187, 120, 0.3)';
    if (props.$isHint) return '0 4px 6px rgba(72, 187, 120, 0.2)';
    return '0 4px 6px rgba(0, 0, 0, 0.1)';
  }};
  border: ${props => {
    if (props.$isDisabled || props.$isMatched) return 'none';
    if (props.$isInvalid) return '2px solid rgba(239, 68, 68, 0.8)';
    if (props.$isSelected) return '2px solid rgba(72, 187, 120, 0.9)';
    if (props.$isHint) return '2px solid rgba(72, 187, 120, 0.4)';
    return '1px solid rgba(0, 0, 0, 0.1)';
  }};
  aspect-ratio: 1;
  min-width: 0;
  min-height: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    font-size: 20px;
    border-radius: 4px;
  }

  @media (max-width: 480px) {
    font-size: 16px;
    border-radius: 3px;
  }

  &:hover {
    transform: ${props => {
      if (props.$isDisabled || props.$isMatched) return 'none';
      return (props.$isSelected || props.$isInvalid) ? 'scale(0.95)' : 'scale(1.05)';
    }};
    box-shadow: ${props => {
      if (props.$isDisabled || props.$isMatched) return 'none';
      if (props.$isInvalid) return '0 6px 8px rgba(239, 68, 68, 0.3)';
      if (props.$isSelected) return '0 6px 8px rgba(72, 187, 120, 0.4)';
      if (props.$isHint) return '0 6px 8px rgba(72, 187, 120, 0.3)';
      return '0 6px 8px rgba(0, 0, 0, 0.2)';
    }};
  }

  &:active {
    transform: ${props => props.$isDisabled ? 'none' : 'scale(0.95)'};
  }
`;

const RulesContainer = styled.div<{ $isExpanded: boolean }>`
  background: rgba(26, 54, 93, 0.95);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 10px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;

  h3 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    font-size: 1.2rem;
    color: white;
  }

  .rules-content {
    max-height: ${props => props.$isExpanded ? '500px' : '0'};
    overflow: hidden;
    transition: max-height 0.3s ease;
    margin-top: ${props => props.$isExpanded ? '15px' : '0'};
  }

  ul {
    margin: 0;
    padding-left: 20px;
    
    li {
      margin: 8px 0;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  &:hover {
    background: rgba(26, 54, 93, 0.98);
  }
`;

const RulesSection = styled.div`
  width: 300px;
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 100;
`;

// 在组件内部添加一个辅助函数来处理形状
const getBoardLayout = (level: Level): boolean[][] => {
  const defaultLayout = Array(level.height).fill(0).map(() => Array(level.width).fill(true));
  
  if (!level.shape) {
    return defaultLayout;
  }

  if (typeof level.shape === 'function') {
    try {
      return level.shape(level.width, level.height);
    } catch (error) {
      console.error('Error generating board shape:', error);
      return defaultLayout;
    }
  }

  return level.shape;
};

const getRules = (level: Level): { title: string; rules: string[] } => {
  const baseRules = [
    "点击两个相同的图案进行配对",
    "配对的图案必须能够通过不超过两个转角的路径连接",
    "连接路径上不能有其他未消除的图案阻挡",
    "成功配对后图案会消失",
    "消除所有图案即可通关",
    "5秒未操作会自动提示可配对的图案",
  ];

  const modeRules: { [key in GameMode]: string[] } = {
    [GameMode.CLASSIC]: [
      "经典模式 - 基础连连看玩法",
      "剩余时间越多，获得的分数越高",
    ],
    [GameMode.TIME_RUSH]: [
      "⚡ 限时冲刺模式",
      "时间流失速度加快",
      "成功配对可以获得更多分数",
      "注意把握时间，争分夺秒！",
    ],
    [GameMode.MOVING]: [
      "🔄 移动方块模式",
      "方块会随机改变位置",
      "需要在方块移动时抓住时机配对",
      "成功配对获得额外时间奖励",
    ],
    [GameMode.ROTATING]: [
      "🌀 旋转乾坤模式",
      "游戏板会定期旋转",
      "方块位置会随着旋转改变",
      "考验空间思维能力",
    ],
    [GameMode.FADING]: [
      "👻 渐隐迷局模式",
      "方块会随机变透明",
      "需要记住方块位置和类型",
      "训练记忆力和观察力",
    ],
    [GameMode.FROZEN]: [
      "❄️ 冰封绝阵模式",
      "部分方块会被冰冻",
      "冰冻方块无法选择",
      "等待冰冻解除后再操作",
    ],
  };

  const specialRuleDescriptions: { [key in SpecialRule]: string } = {
    timerDecrease: "⏰ 时间流失加速",
    movingTiles: "🔄 方块位置随机移动",
    rotatingBoard: "🌀 游戏板定期旋转",
    fadingTiles: "👻 方块随机渐隐",
    frozenTiles: "❄️ 方块随机冰冻",
  };

  const rules = [...baseRules];
  
  // 添加模式特定规则
  rules.push(...modeRules[level.mode]);

  // 添加额外特殊规则说明
  if (level.specialRules.length > 0) {
    rules.push("🌟 特殊规则：");
    level.specialRules.forEach(rule => {
      if (rule !== level.mode.toLowerCase()) { // 避免重复显示与模式相同的规则
        rules.push(specialRuleDescriptions[rule]);
      }
    });
  }

  // 根据关卡形状添加提示
  if (level.shape && typeof level.shape !== 'function') {
    rules.push("💫 特殊形状关卡，注意观察可用区域！");
  }

  let title = "游戏规则";
  switch (level.mode) {
    case GameMode.TIME_RUSH:
      title = "⚡ 限时冲刺规则";
      break;
    case GameMode.MOVING:
      title = "🔄 移动迷踪规则";
      break;
    case GameMode.ROTATING:
      title = "🌀 旋转乾坤规则";
      break;
    case GameMode.FADING:
      title = "👻 渐隐迷局规则";
      break;
    case GameMode.FROZEN:
      title = "❄️ 冰封绝阵规则";
      break;
  }

  return { title, rules };
};

const LianLianKan: React.FC = () => {
  const [board, setBoard] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    score: 0,
    highScores: {},
    timeLeft: levels[0].timeLimit,
    isGameOver: false,
    isPaused: false,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [gameStarted, setGameStarted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [highestLevel, setHighestLevel] = useState(1);
  const [invalidTile, setInvalidTile] = useState<Tile | null>(null);
  const [hintTiles, setHintTiles] = useState<[Tile | null, Tile | null]>([null, null]);
  const [isRulesExpanded, setIsRulesExpanded] = useState(true);
  const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now());
  const [hasScroll, setHasScroll] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [boardRotation, setBoardRotation] = useState(0);
  const [movingInterval, setMovingInterval] = useState<NodeJS.Timeout | null>(null);

  const audioManager = AudioManager.getInstance();

  const initializeLevel = useCallback((levelId: number) => {
    const level = levels[levelId - 1];
    const boardLayout = getBoardLayout(level);
    setBoard(generateBoard(level.width, level.height, level.tileTypes, boardLayout));
    setSelectedTile(null);
    setGameState(prev => ({
      ...prev,
      timeLeft: level.timeLimit,
      isGameOver: false,
      isPaused: false,
    }));
  }, []);

  useEffect(() => {
    if (!gameState.isPaused && !gameState.isGameOver && gameState.timeLeft > 0) {
      const timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
          isGameOver: prev.timeLeft <= 1,
        }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState.isPaused, gameState.isGameOver, gameState.timeLeft]);

  useEffect(() => {
    if (!gameState.isGameOver) {
      initializeLevel(gameState.currentLevel);
    }
  }, [gameState.currentLevel, gameState.isGameOver, initializeLevel]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      audioManager.startBackgroundMusic();
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      audioManager.stopBackgroundMusic();
    };
  }, []);

  useEffect(() => {
    if (gameState.isPaused) {
      audioManager.pauseBackgroundMusic();
    } else {
      audioManager.resumeBackgroundMusic();
    }
  }, [gameState.isPaused]);

  const handleMuteToggle = () => {
    const newMuted = audioManager.toggleMute();
    setIsMuted(newMuted);
  };

  const handleBgmVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setBgmVolume(volume);
    audioManager.setBackgroundMusicVolume(volume);
  };

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setSfxVolume(volume);
    audioManager.setSoundVolume(volume);
  };

  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setUser(session);
      setGameState(prev => ({
        ...prev,
        currentLevel: session.maxLevel,
        highScores: session.highScores,
      }));
      setGameStarted(true);
    }
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setGameState(prev => ({
      ...prev,
      currentLevel: authenticatedUser.maxLevel,
      highScores: authenticatedUser.highScores,
    }));
    setGameStarted(true);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setGameStarted(false);
    setGameState({
      currentLevel: 1,
      score: 0,
      highScores: {},
      timeLeft: levels[0].timeLimit,
      isGameOver: false,
      isPaused: false,
    });
  };

  useEffect(() => {
    const users = Object.values(getUsers());
    const maxLevel = Math.max(...users.map(user => user.maxLevel), 1);
    setHighestLevel(maxLevel);
  }, [gameState.currentLevel]);

  const updateInteractionTime = useCallback(() => {
    setLastInteractionTime(Date.now());
    setHintTiles([null, null]);
  }, []);

  const findMatchingPair = useCallback(() => {
    const currentLevel = levels[gameState.currentLevel - 1];
    
    for (let i = 0; i < board.length; i++) {
      const tile1 = board[i];
      if (tile1.isMatched) continue;
      
      for (let j = i + 1; j < board.length; j++) {
        const tile2 = board[j];
        if (tile2.isMatched || tile1.type !== tile2.type) continue;
        
        const path = canConnect(tile1, tile2, board, currentLevel.width, currentLevel.height);
        if (path) {
          return [tile1, tile2];
        }
      }
    }
    return [null, null];
  }, [board, gameState.currentLevel]);

  useEffect(() => {
    if (gameState.isPaused || gameState.isGameOver) return;

    const checkInactivity = () => {
      const now = Date.now();
      if (now - lastInteractionTime >= 5000) {
        const [tile1, tile2] = findMatchingPair();
        if (tile1 && tile2) {
          setHintTiles([tile1, tile2]);
        }
      }
    };

    const timer = setInterval(checkInactivity, 1000);
    return () => clearInterval(timer);
  }, [lastInteractionTime, findMatchingPair, gameState.isPaused, gameState.isGameOver]);

  // 处理旋转效果
  useEffect(() => {
    const currentLevel = levels[gameState.currentLevel - 1];
    let rotateInterval: NodeJS.Timeout | null = null;
    
    if (!gameState.isPaused && !gameState.isGameOver && currentLevel.specialRules.includes('rotatingBoard')) {
      rotateInterval = setInterval(() => {
        setBoardRotation(prev => (prev + 90) % 360);
      }, 10000); // 每10秒旋转90度
    }
    
    return () => {
      if (rotateInterval) {
        clearInterval(rotateInterval);
      }
    };
  }, [gameState.currentLevel, gameState.isPaused, gameState.isGameOver]);

  // 处理移动效果
  useEffect(() => {
    const currentLevel = levels[gameState.currentLevel - 1];
    let moveInterval: NodeJS.Timeout | null = null;
    
    if (!gameState.isPaused && !gameState.isGameOver && currentLevel.specialRules.includes('movingTiles')) {
      moveInterval = setInterval(() => {
        setBoard(prev => {
          const unmatchedTiles = prev.filter(t => !t.isMatched);
          if (unmatchedTiles.length === 0) return prev;

          return prev.map(tile => {
            if (tile.isMatched) return tile;
            
            const shouldMove = Math.random() < 0.2; // 降低移动概率到20%
            if (!shouldMove) return tile;
            
            const dx = Math.floor(Math.random() * 3) - 1;
            const dy = Math.floor(Math.random() * 3) - 1;
            
            const newX = Math.max(0, Math.min(currentLevel.width - 1, tile.x + dx));
            const newY = Math.max(0, Math.min(currentLevel.height - 1, tile.y + dy));
            
            return { ...tile, x: newX, y: newY, isMoving: true };
          });
        });
      }, 3000); // 增加间隔到3秒
    }
    
    return () => {
      if (moveInterval) {
        clearInterval(moveInterval);
      }
    };
  }, [gameState.currentLevel, gameState.isPaused, gameState.isGameOver]);

  // 处理时间减少效果
  useEffect(() => {
    const currentLevel = levels[gameState.currentLevel - 1];
    let timerInterval: NodeJS.Timeout | null = null;
    
    if (!gameState.isPaused && !gameState.isGameOver && currentLevel.specialRules.includes('timerDecrease')) {
      timerInterval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: Math.max(0, prev.timeLeft - 1),
        }));
      }, 750); // 降低时间减少频率
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [gameState.currentLevel, gameState.isPaused, gameState.isGameOver]);

  // 处理渐隐效果
  useEffect(() => {
    const currentLevel = levels[gameState.currentLevel - 1];
    let fadeInterval: NodeJS.Timeout | null = null;
    
    if (!gameState.isPaused && !gameState.isGameOver && currentLevel.specialRules.includes('fadingTiles')) {
      fadeInterval = setInterval(() => {
        setBoard(prev => {
          const unmatchedTiles = prev.filter(t => !t.isMatched);
          if (unmatchedTiles.length === 0) return prev;

          return prev.map(tile => ({
            ...tile,
            isFading: !tile.isMatched && Math.random() < 0.2, // 降低渐隐概率到20%
          }));
        });
      }, 4000); // 增加间隔到4秒
    }
    
    return () => {
      if (fadeInterval) {
        clearInterval(fadeInterval);
      }
    };
  }, [gameState.currentLevel, gameState.isPaused, gameState.isGameOver]);

  // 处理冰冻效果
  useEffect(() => {
    const currentLevel = levels[gameState.currentLevel - 1];
    let freezeInterval: NodeJS.Timeout | null = null;
    
    if (!gameState.isPaused && !gameState.isGameOver && currentLevel.specialRules.includes('frozenTiles')) {
      freezeInterval = setInterval(() => {
        setBoard(prev => {
          const unmatchedTiles = prev.filter(t => !t.isMatched);
          if (unmatchedTiles.length === 0) return prev;

          return prev.map(tile => ({
            ...tile,
            isFrozen: !tile.isMatched && Math.random() < 0.15, // 降低冰冻概率到15%
          }));
        });
      }, 5000); // 增加间隔到5秒
    }
    
    return () => {
      if (freezeInterval) {
        clearInterval(freezeInterval);
      }
    };
  }, [gameState.currentLevel, gameState.isPaused, gameState.isGameOver]);

  const handleTileClick = useCallback(async (tile: Tile) => {
    updateInteractionTime();
    
    if (
      tile.isMatched || 
      gameState.isPaused || 
      gameState.isGameOver || 
      tile.isFrozen || 
      tile.isFading
    ) return;

    const currentLevel = levels[gameState.currentLevel - 1];

    // 清除无效状态
    if (invalidTile) {
      setInvalidTile(null);
    }

    // 处理第一次点击
    if (selectedTile === null) {
      setBoard(prev => prev.map(t => 
        t.id === tile.id ? { ...t, isSelected: true } : t
      ));
      setSelectedTile(tile);
      return;
    }

    // 处理点击相同的方块
    if (selectedTile.id === tile.id) {
      setBoard(prev => prev.map(t => 
        t.id === tile.id ? { ...t, isSelected: false } : t
      ));
      setSelectedTile(null);
      return;
    }

    // 处理第二次点击
    if (selectedTile.type === tile.type) {
      const path = canConnect(selectedTile, tile, board, currentLevel.width, currentLevel.height);
      if (path) {
        // 更新方块状态
        setBoard(prev => prev.map(t => {
          if (t.id === selectedTile.id || t.id === tile.id) {
            return { ...t, isMatched: true, isSelected: false };
          }
          return t;
        }));
        setSelectedTile(null);

        // 播放匹配成功音效
        audioManager.playSound('match').catch(console.error);
        
        // 更新分数
        const timeBonus = Math.floor(gameState.timeLeft / 10);
        const points = currentLevel.baseScore + timeBonus;
        const newScore = gameState.score + points;
        
        setGameState(prev => ({
          ...prev,
          score: newScore,
        }));

        // 更新用户进度
        if (user) {
          updateUserProgress(user.username, gameState.currentLevel, newScore);
        }

        // 检查是否完成关卡
        const isLevelComplete = board.every(t => 
          (t.id === selectedTile.id || t.id === tile.id) ? true : t.isMatched
        );

        if (isLevelComplete) {
          audioManager.playSound('levelComplete').catch(console.error);
          
          if (gameState.currentLevel < levels.length) {
            // 延迟进入下一关
            setTimeout(() => {
              if (user) {
                updateUserProgress(user.username, gameState.currentLevel + 1, newScore);
              }
              setGameState(prev => ({
                ...prev,
                currentLevel: prev.currentLevel + 1,
                highScores: {
                  ...prev.highScores,
                  [prev.currentLevel]: Math.max(prev.score, prev.highScores[prev.currentLevel] || 0),
                },
              }));
            }, 1000);
          } else {
            // 完成所有关卡
            audioManager.playSound('gameOver').catch(console.error);
            setGameState(prev => ({
              ...prev,
              isGameOver: true,
              highScores: {
                ...prev.highScores,
                [prev.currentLevel]: Math.max(prev.score, prev.highScores[prev.currentLevel] || 0),
              },
            }));
          }
        }
      } else {
        // 无法连接的情况
        setInvalidTile(tile);
        // 播放匹配失败音效
        audioManager.playSound('mismatch').catch(console.error);
        setTimeout(() => {
          setBoard(prev => prev.map(t => ({ ...t, isSelected: false })));
          setSelectedTile(null);
          setInvalidTile(null);
        }, 500);
      }
    } else {
      // 类型不匹配的情况
      setInvalidTile(tile);
      // 播放匹配失败音效
      audioManager.playSound('mismatch').catch(console.error);
      setTimeout(() => {
        setBoard(prev => prev.map(t => ({ ...t, isSelected: false })));
        setSelectedTile(null);
        setInvalidTile(null);
      }, 500);
    }
  }, [board, selectedTile, invalidTile, gameState, user, audioManager, updateInteractionTime]);

  const getEmoji = (type: number) => {
    const emojiCategories = [
      // 植物类
      ['🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🌿', '🌴', '🌼', '🍁', '🌵', '🌾', '🌳', '🌲', '🎋'],
      // 水果类
      ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🥝', '🍍', '🥭', '🍑', '🍈'],
      // 动物类
      ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐙'],
      // 食物类
      ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥨', '🥯', '🥖', '🥐', '🍞', '🥪', '🌮', '🌯', '🫔'],
      // 甜点类
      ['🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🧁', '🥧', '🍰', '🍫', '🍬', '🍭', '🍮', '🍯', '🍡'],
      // 饮品类
      ['☕️', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍷', '🥂', '🥃', '🍸', '🍹', '🧉', '🥛'],
    ];

    const currentLevel = levels[gameState.currentLevel - 1];
    // 根据关卡选择emoji类别
    const categoryIndex = Math.floor((currentLevel.id - 1) / 5) % emojiCategories.length;
    const category = emojiCategories[categoryIndex];
    return category[(type - 1) % category.length];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentLevel = levels[gameState.currentLevel - 1];
  const { title: rulesTitle, rules: currentRules } = getRules(currentLevel);
  const boardLayout = getBoardLayout(currentLevel);

  // 创建一个二维数组来存储每个位置的方块
  const tileGrid = Array(currentLevel.height).fill(0).map(() => 
    Array(currentLevel.width).fill(null)
  );

  // 将方块放入对应的位置
  board.forEach(tile => {
    if (tile.y >= 0 && tile.y < currentLevel.height && 
        tile.x >= 0 && tile.x < currentLevel.width) {
      tileGrid[tile.y][tile.x] = tile;
    }
  });

  useEffect(() => {
    const checkScroll = () => {
      if (gameContainerRef.current) {
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        setHasScroll(documentHeight > windowHeight);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [currentLevel.width, currentLevel.height]);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const handleLevelSelect = (levelId: number) => {
    setGameState(prev => ({
      ...prev,
      currentLevel: levelId,
      score: 0,
      timeLeft: levels[levelId - 1].timeLimit,
      isGameOver: false,
      isPaused: false,
    }));
    setShowLevelSelect(false);
  };

  if (!gameStarted) {
    return (
      <GameContainer $isAuth>
        <Auth onAuthSuccess={handleAuthSuccess} />
      </GameContainer>
    );
  }

  if (showLevelSelect) {
    return (
      <LevelSelect
        user={user!}
        onLevelSelect={handleLevelSelect}
        onBack={() => setShowLevelSelect(false)}
      />
    );
  }

  return (
    <GameContainer ref={gameContainerRef}>
      <LeftPanel>
        <GameTitle>连连看</GameTitle>
        {user && (
          <>
            <UserCard>
              <UserInfoItem>
                <span>用户名</span>
                <span>{user.username}</span>
              </UserInfoItem>
              <UserInfoItem>
                <span>最高关卡</span>
                <span>{user.maxLevel}</span>
              </UserInfoItem>
              <ButtonContainer>
                <LevelSelectButton onClick={() => setShowLevelSelect(true)}>
                  <span>🎮</span> 选择关卡
                </LevelSelectButton>
                <LogoutButton onClick={handleLogout}>
                  <span>🚪</span> 退出登录
                </LogoutButton>
              </ButtonContainer>
            </UserCard>
            <GameStats>
              <StatItem>
                <span>关卡</span>
                <span>第{gameState.currentLevel}关 - {currentLevel.name}</span>
              </StatItem>
              <StatItem>
                <span>分数</span>
                <span>{gameState.score}</span>
              </StatItem>
              <StatItem>
                <span>最高分</span>
                <span>{gameState.highScores[gameState.currentLevel] || 0}</span>
              </StatItem>
              <StatItem>
                <span>剩余时间</span>
                <Timer $isWarning={gameState.timeLeft <= 30}>
                  {formatTime(gameState.timeLeft)}
                </Timer>
              </StatItem>
            </GameStats>
          </>
        )}
      </LeftPanel>

      <MainContent>
        <GameBoard 
          width={currentLevel.width} 
          height={currentLevel.height}
          $rotation={boardRotation}
          className="game-board"
        >
          {boardLayout.map((row, y) =>
            row.map((isValid, x) => {
              const tile = tileGrid[y][x];
              const isValidPosition = isValid && tile;
              return (
                <TileButton
                  key={`${x}-${y}`}
                  $isSelected={tile?.isSelected || false}
                  $isMatched={tile?.isMatched || false}
                  $isInvalid={invalidTile?.id === tile?.id}
                  $isHint={hintTiles[0]?.id === tile?.id || hintTiles[1]?.id === tile?.id}
                  $isDisabled={!isValidPosition}
                  $isFrozen={tile?.isFrozen}
                  $isFading={tile?.isFading}
                  $rotation={tile?.rotation}
                  onClick={() => tile && !tile.isMatched && handleTileClick(tile)}
                >
                  {isValidPosition && !tile.isMatched ? getEmoji(tile.type) : ''}
                </TileButton>
              );
            })
          )}
        </GameBoard>
      </MainContent>

      <RightPanel>
        <SoundControls>
          <VolumeControl>
            <label>背景音乐音量</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={bgmVolume}
              onChange={handleBgmVolumeChange}
            />
          </VolumeControl>
          <VolumeControl>
            <label>音效音量</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={sfxVolume}
              onChange={handleSfxVolumeChange}
            />
          </VolumeControl>
        </SoundControls>

        <GameRules 
          onClick={() => setIsRulesExpanded(!isRulesExpanded)}
          $isExpanded={isRulesExpanded}
        >
          <h3>
            {rulesTitle}
            <span>▼</span>
          </h3>
          <div className={`rules-content ${isRulesExpanded ? 'expanded' : ''}`}>
            <ul>
              {currentRules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </div>
        </GameRules>
      </RightPanel>

      {(gameState.isGameOver || gameState.timeLeft <= 0) && (
        <>
          <Overlay />
          <Modal>
            <h2>{board.every(t => t.isMatched) ? `恭喜通过第${gameState.currentLevel}关！` : '游戏结束'}</h2>
            <p>最终得分: {gameState.score}</p>
            <ButtonGroup>
              <Button onClick={() => {
                setGameState({
                  currentLevel: 1,
                  score: 0,
                  highScores: gameState.highScores,
                  timeLeft: levels[0].timeLimit,
                  isGameOver: false,
                  isPaused: false,
                });
                initializeLevel(1);
              }}>
                重新开始
              </Button>
              <LevelSelectButton onClick={() => setShowLevelSelect(true)}>
                选择关卡
              </LevelSelectButton>
            </ButtonGroup>
          </Modal>
        </>
      )}
    </GameContainer>
  );
};

export default LianLianKan; 