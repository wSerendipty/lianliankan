import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Tile, GameState, User } from '../types';
import { levels } from '../config/levels';
import AudioManager from '../utils/AudioManager';
import { generateBoard, canConnect } from '../utils/gameUtils';
import { updateUserProgress, getCurrentSession, logout, getUsers } from '../utils/userUtils';
import Auth from './Auth';

const GameContainer = styled.div<{ $isAuth?: boolean }>`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
  color: white;
  position: relative;
  padding: 20px;
`;

const LeftPanel = styled.div`
  width: 260px;
  margin-right: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const UserCard = styled.div`
  background: rgba(30, 41, 59, 0.7);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 0;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
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

const LogoutButton = styled.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.3s ease;
  font-size: 1rem;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
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
`;

const GameBoard = styled.div<{ width: number; height: number }>`
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
`;

const RightPanel = styled.div`
  width: 260px;
  margin-left: 20px;
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

  h2 {
    margin-bottom: 20px;
    color: #2d3748;
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
}>`
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  font-size: 28px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => {
    if (props.$isMatched) return 'transparent';
    if (props.$isInvalid) return 'rgba(239, 68, 68, 0.9)';
    if (props.$isSelected || props.$isHint) return 'rgba(72, 187, 120, 0.2)';
    return 'rgba(255, 255, 255, 0.9)';
  }};
  box-shadow: ${props => {
    if (props.$isMatched) return 'none';
    if (props.$isInvalid) return '0 4px 6px rgba(239, 68, 68, 0.2)';
    if (props.$isSelected) return '0 4px 6px rgba(72, 187, 120, 0.3)';
    if (props.$isHint) return '0 4px 6px rgba(72, 187, 120, 0.2)';
    return '0 4px 6px rgba(0, 0, 0, 0.1)';
  }};
  border: ${props => {
    if (props.$isMatched) return 'none';
    if (props.$isSelected) return '2px solid rgba(72, 187, 120, 0.8)';
    if (props.$isHint) return '2px solid rgba(72, 187, 120, 0.4)';
    return '1px solid rgba(0, 0, 0, 0.1)';
  }};
  opacity: ${props => props.$isMatched ? 0 : 1};
  transform: ${props => (props.$isSelected || props.$isInvalid) ? 'scale(0.95)' : 'scale(1)'};
  animation: ${props => props.$isHint ? css`${glowPulse} 1.8s ease-in-out infinite` : 'none'};
  
  &:hover {
    transform: ${props => props.$isMatched ? 'none' : (props.$isSelected || props.$isInvalid) ? 'scale(0.95)' : 'scale(1.05)'};
    box-shadow: ${props => {
      if (props.$isMatched) return 'none';
      if (props.$isInvalid) return '0 6px 8px rgba(239, 68, 68, 0.3)';
      if (props.$isSelected || props.$isHint) return '0 6px 8px rgba(72, 187, 120, 0.3)';
      return '0 6px 8px rgba(0, 0, 0, 0.2)';
    }};
  }

  &:active {
    transform: scale(0.95);
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

  const audioManager = AudioManager.getInstance();

  const initializeLevel = useCallback((levelId: number) => {
    const level = levels[levelId - 1];
    setBoard(generateBoard(level.width, level.height, level.tileTypes));
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

  const handleTileClick = async (tile: Tile) => {
    updateInteractionTime();
    
    if (tile.isMatched || gameState.isPaused || gameState.isGameOver) return;

    const newBoard = [...board];
    const clickedTile = newBoard.find(t => t.id === tile.id)!;
    const currentLevel = levels[gameState.currentLevel - 1];

    setInvalidTile(null);

    if (selectedTile === null) {
      clickedTile.isSelected = true;
      setSelectedTile(clickedTile);
      try {
        await audioManager.playSound('select');
      } catch (error) {
        console.error('Failed to play select sound:', error);
      }
    } else if (selectedTile.id === clickedTile.id) {
      clickedTile.isSelected = false;
      setSelectedTile(null);
    } else {
      if (selectedTile.type === clickedTile.type) {
        const path = canConnect(selectedTile, clickedTile, newBoard, currentLevel.width, currentLevel.height);
        if (path) {
          clickedTile.isSelected = true;
          selectedTile.isMatched = true;
          clickedTile.isMatched = true;
          selectedTile.isSelected = false;
          clickedTile.isSelected = false;
          setSelectedTile(null);

          try {
            await audioManager.playSound('match');
          } catch (error) {
            console.error('Failed to play match sound:', error);
          }
          
          const timeBonus = Math.floor(gameState.timeLeft / 10);
          const points = currentLevel.baseScore + timeBonus;
          
          const newScore = gameState.score + points;
          setGameState(prev => ({
            ...prev,
            score: newScore,
          }));

          if (user) {
            updateUserProgress(user.username, gameState.currentLevel, newScore);
          }

          if (newBoard.every(t => t.isMatched)) {
            try {
              await audioManager.playSound('levelComplete');
            } catch (error) {
              console.error('Failed to play level complete sound:', error);
            }
            if (gameState.currentLevel < levels.length) {
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
              try {
                await audioManager.playSound('gameOver');
              } catch (error) {
                console.error('Failed to play game over sound:', error);
              }
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
          setInvalidTile(clickedTile);
          setTimeout(() => {
            setInvalidTile(null);
            newBoard.forEach(t => t.isSelected = false);
            setSelectedTile(null);
            setBoard([...newBoard]);
          }, 500);
        }
      } else {
        setInvalidTile(clickedTile);
        setTimeout(() => {
          setInvalidTile(null);
          newBoard.forEach(t => t.isSelected = false);
          setSelectedTile(null);
          setBoard([...newBoard]);
        }, 500);
      }
    }

    setBoard(newBoard);
  };

  const getEmoji = (type: number) => {
    const emojis = ['🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🌿', '🌴', '🌼', '🍁', '🍂', '🍃', '🌾', '🌵', '🌲'];
    return emojis[type - 1];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentLevel = levels[gameState.currentLevel - 1];

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

  if (!gameStarted) {
    return (
      <GameContainer $isAuth>
        <Auth onAuthSuccess={handleAuthSuccess} />
      </GameContainer>
    );
  }

  return (
    <GameContainer>
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
              <LogoutButton onClick={handleLogout}>
                退出登录
              </LogoutButton>
            </UserCard>
            <GameStats>
              <StatItem>
                <span>关卡</span>
                <span>{currentLevel.name}</span>
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
          className="game-board"
        >
          {board.map(tile => (
            <TileButton
              key={tile.id}
              $isSelected={tile.isSelected}
              $isMatched={tile.isMatched}
              $isInvalid={invalidTile?.id === tile.id}
              $isHint={hintTiles[0]?.id === tile.id || hintTiles[1]?.id === tile.id}
              onClick={() => handleTileClick(tile)}
            >
              {getEmoji(tile.type)}
            </TileButton>
          ))}
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
            游戏规则
            <span>▼</span>
          </h3>
          <div className={`rules-content ${isRulesExpanded ? 'expanded' : ''}`}>
            <ul>
              <li>点击两个相同的图案进行配对</li>
              <li>配对的图案必须能够通过不超过两个转角的路径连接</li>
              <li>连接路径上不能有其他未消除的图案阻挡</li>
              <li>成功配对后图案会消失</li>
              <li>消除所有图案即可通关</li>
              <li>5秒未操作会自动提示可配对的图案</li>
              <li>剩余时间越多，获得的分数越高</li>
              <li>时间耗尽或无法继续配对则游戏结束</li>
            </ul>
          </div>
        </GameRules>
      </RightPanel>

      {(gameState.isGameOver || gameState.timeLeft <= 0) && (
        <>
          <Overlay />
          <Modal>
            <h2>{board.every(t => t.isMatched) ? '恭喜通关！' : '游戏结束'}</h2>
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
            </ButtonGroup>
          </Modal>
        </>
      )}
    </GameContainer>
  );
};

export default LianLianKan; 