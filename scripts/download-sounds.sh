#!/bin/bash

# 创建目录
mkdir -p public/sounds

# 下载音效文件
# 选择音效 - 清脆的点击声
curl -L "https://pixabay.com/sound-effects/download/pop-39222.mp3?filename=pop-39222.mp3" -o public/sounds/select.mp3

# 匹配音效 - 愉快的配对声
curl -L "https://pixabay.com/sound-effects/download/correct-6033.mp3?filename=correct-6033.mp3" -o public/sounds/match.mp3

# 通关音效 - 胜利音效
curl -L "https://pixabay.com/sound-effects/download/success-1-6297.mp3?filename=success-1-6297.mp3" -o public/sounds/level-complete.mp3

# 游戏结束音效 - 游戏结束音效
curl -L "https://pixabay.com/sound-effects/download/game-over-38511.mp3?filename=game-over-38511.mp3" -o public/sounds/game-over.mp3

# 背景音乐 - 轻松的游戏背景音乐
curl -L "https://pixabay.com/music/download/happy-and-joyful-children-93137.mp3?filename=happy-and-joyful-children-93137.mp3" -o public/sounds/background-music.mp3

# 设置文件权限
chmod 644 public/sounds/*.mp3 