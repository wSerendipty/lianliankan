import React from 'react';
import styled from 'styled-components';
import { levels } from '../config/levels';
import { User } from '../types';

const LevelSelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
  color: white;
  position: relative;
  padding-top: 80px; // 为顶部按钮留出空间
`;

const NavigationHeader = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: rgba(26, 54, 93, 0.95);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1000;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 1.8rem;
  margin: 0;
  text-align: center;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  flex: 1;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const BackButton = styled.button`
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 1rem;
  }
`;

const LevelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  padding: 20px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
    padding: 10px;
  }
`;

const LevelCard = styled.div<{ $isCompleted: boolean; $isLocked: boolean }>`
  position: relative;
  background: ${props => props.$isCompleted ? 'rgba(72, 187, 120, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.$isCompleted ? 'rgba(72, 187, 120, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: ${props => props.$isLocked ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.$isLocked ? 0.5 : 1};
  filter: ${props => props.$isLocked ? 'grayscale(1)' : 'none'};
  backdrop-filter: blur(10px);

  &:hover {
    transform: ${props => props.$isLocked ? 'none' : 'translateY(-5px)'};
    box-shadow: ${props => props.$isLocked ? 'none' : '0 5px 15px rgba(0, 0, 0, 0.3)'};
  }

  &::before {
    content: ${props => props.$isLocked ? "'🔒'" : 'none'};
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    z-index: 1;
  }
`;

const LevelNumber = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 5px;
`;

const LevelName = styled.div`
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LevelInfo = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
`;

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 15px;
  width: 100%;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const CompletionBadge = styled.div<{ $isCompleted: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  background: ${props => props.$isCompleted ? 'rgba(72, 187, 120, 0.8)' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
`;

interface LevelSelectProps {
  user: User;
  onLevelSelect: (levelId: number) => void;
  onBack: () => void;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ user, onLevelSelect, onBack }) => {
  const handleLevelClick = (levelId: number) => {
    if (levelId <= user.maxLevel) {
      onLevelSelect(levelId);
    }
  };

  return (
    <LevelSelectContainer>
      <NavigationHeader>
        <BackButton onClick={onBack}>
          <span>🎮</span>
          返回游戏
        </BackButton>
        <Title>选择关卡</Title>
        <div style={{ width: '100px' }} /> {/* 为了保持标题居中 */}
      </NavigationHeader>

      <LevelsGrid>
        {levels.map((level, index) => {
          const levelId = index + 1;
          const isCompleted = levelId < user.maxLevel;
          const isLocked = levelId > user.maxLevel;
          const highScore = user.highScores[levelId] || 0;

          return (
            <LevelCard
              key={levelId}
              $isCompleted={isCompleted}
              $isLocked={isLocked}
              onClick={() => handleLevelClick(levelId)}
            >
              <CompletionBadge $isCompleted={isCompleted}>
                {isCompleted ? '已完成' : '未完成'}
              </CompletionBadge>
              <LevelNumber>第 {levelId} 关</LevelNumber>
              <LevelName>{level.name}</LevelName>
              <LevelInfo>
                {level.width}x{level.height} 网格
              </LevelInfo>
              <StatsContainer>
                <StatItem>
                  <span>时间限制</span>
                  <span>{Math.floor(level.timeLimit / 60)}分{level.timeLimit % 60}秒</span>
                </StatItem>
                <StatItem>
                  <span>基础分数</span>
                  <span>{level.baseScore}</span>
                </StatItem>
                {highScore > 0 && (
                  <StatItem>
                    <span>最高分</span>
                    <span>{highScore}</span>
                  </StatItem>
                )}
              </StatsContainer>
            </LevelCard>
          );
        })}
      </LevelsGrid>
    </LevelSelectContainer>
  );
};

export default LevelSelect; 