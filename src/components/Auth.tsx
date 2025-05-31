import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { registerUser, loginUser } from '../utils/userUtils';
import { User } from '../types';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const GlowContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
  
  &::after {
    content: '';
    position: absolute;
    top: -100px;
    left: -50%;
    width: 200%;
    height: 200px;
    background: radial-gradient(
      circle at center,
      rgba(10, 132, 255, 0.1) 0%,
      rgba(10, 132, 255, 0) 70%
    );
    z-index: -1;
    pointer-events: none;
  }

  @media (max-width: 420px) {
    width: 90%;
  }
`;

const AuthContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  background: rgba(28, 28, 30, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  width: 100%;
  animation: ${fadeIn} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 420px) {
    padding: 2rem 1.5rem;
  }
`;

const Title = styled.h2`
  color: #ffffff;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 500;
  letter-spacing: -0.02em;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.8rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
`;

const Input = styled.input`
  padding: 0.9rem 1rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: #ffffff;
  width: 100%;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  &:last-child {
    border-bottom: none;
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.03);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 0.9rem;
  background: ${props => props.$primary ? '#0A84FF' : 'transparent'};
  color: ${props => props.$primary ? '#ffffff' : '#0A84FF'};
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  margin-top: ${props => props.$primary ? '1.5rem' : '0.5rem'};

  &:hover {
    background: ${props => props.$primary ? '#0091FF' : 'rgba(10, 132, 255, 0.1)'};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ToggleText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: color 0.2s ease;

  span {
    color: #0A84FF;
    margin-left: 0.3rem;
  }

  &:hover span {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  color: #FF453A;
  padding: 0.8rem 1rem;
  background: rgba(255, 69, 58, 0.1);
  border-radius: 12px;
  font-size: 0.9rem;
  margin-top: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
  text-align: center;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 1.5rem 0;
`;

const WelcomeText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin-bottom: 2rem;
  text-align: center;
  line-height: 1.5;
`;

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请填写用户名和密码');
      return;
    }

    if (isLogin) {
      const user = loginUser(username, password);
      if (user) {
        onAuthSuccess(user);
      } else {
        setError('用户名或密码错误');
      }
    } else {
      const success = registerUser(username, password);
      if (success) {
        const user = loginUser(username, password);
        if (user) {
          onAuthSuccess(user);
        }
      } else {
        setError('用户名已存在');
      }
    }
  };

  return (
    <GlowContainer>
      <AuthContainer>
        <Title>{isLogin ? '欢迎回来' : '创建账号'}</Title>
        <WelcomeText>
          {isLogin 
            ? '使用您的账号登录以继续游戏' 
            : '创建一个账号以开始您的游戏之旅'}
        </WelcomeText>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <Input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </InputGroup>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button type="submit" $primary>
            {isLogin ? '登录' : '创建账号'}
          </Button>
          <Divider />
          <ToggleText>
            {isLogin ? '还没有账号？' : '已有账号？'}
            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? '立即注册' : '立即登录'}
            </span>
          </ToggleText>
        </Form>
      </AuthContainer>
    </GlowContainer>
  );
};

export default Auth; 