class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private bgMusic: HTMLAudioElement;
  private bgMusicSource: MediaElementAudioSourceNode | null = null;
  private bgMusicGain: GainNode | null = null;
  private sounds: Record<string, HTMLAudioElement>;
  private soundsGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private loadPromises: Promise<boolean>[] = [];
  private bgMusicVolume: number = 0.5;
  private soundEffectsVolume: number = 0.5;

  private constructor() {
    this.bgMusic = new Audio();
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.bgMusicVolume;
    this.bgMusic.src = `${import.meta.env.BASE_URL}sounds/background-music.mp3`;

    this.sounds = {} as Record<string, HTMLAudioElement>;
    
    // 预加载音效
    this.loadSoundEffect('match', 'match.mp3');
    this.loadSoundEffect('mismatch', 'mismatch.mp3');
    this.loadSoundEffect('levelComplete', 'level-complete.mp3');
    this.loadSoundEffect('gameOver', 'game-over.mp3');

    this.loadPromises.push(
      new Promise<boolean>((resolve, reject) => {
        this.bgMusic.addEventListener('canplaythrough', () => {
          console.log('Background music loaded successfully');
          resolve(true);
        }, { once: true });
        this.bgMusic.addEventListener('error', (e) => {
          const error = this.bgMusic.error;
          console.error('Background music loading error:', {
            code: error?.code,
            message: error?.message,
            src: this.bgMusic.src,
            networkState: this.bgMusic.networkState,
            readyState: this.bgMusic.readyState
          });
          reject(error);
        }, { once: true });
      })
    );

    // 预加载所有音频
    Object.values(this.sounds).forEach(sound => {
      sound.load();
    });
    this.bgMusic.load();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async initializeAudioContext() {
    if (this.isInitialized) return;

    try {
      // 等待所有音频文件加载完成
      const loadResults = await Promise.all(this.loadPromises);
      
      // 检查加载结果
      const failedSounds = loadResults.filter(result => !result).length;
      if (failedSounds > 0) {
        console.warn(`${failedSounds} sound(s) failed to load`);
      }

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建音量控制节点
      this.bgMusicGain = this.audioContext.createGain();
      this.soundsGain = this.audioContext.createGain();
      
      try {
        // 连接背景音乐
        if (this.audioContext && this.bgMusicGain) {
          this.bgMusicSource = this.audioContext.createMediaElementSource(this.bgMusic);
          this.bgMusicSource.connect(this.bgMusicGain);
          this.bgMusicGain.connect(this.audioContext.destination);
          
          // 设置初始音量
          this.bgMusicGain.gain.value = this.bgMusicVolume;
          this.soundsGain.gain.value = this.soundEffectsVolume;

          // 连接音效
          Object.values(this.sounds).forEach(sound => {
            if (this.audioContext && this.soundsGain && sound.readyState >= 2) {
              const source = this.audioContext.createMediaElementSource(sound);
              source.connect(this.soundsGain);
            }
          });
          this.soundsGain.connect(this.audioContext.destination);
        }
      } catch (error) {
        console.warn('Failed to connect audio nodes:', error);
        // 即使连接失败，也标记为已初始化，这样音频仍然可以播放
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      // 不抛出错误，让游戏继续运行
      this.isInitialized = true; // 防止重复尝试初始化
    }
  }

  public async startBackgroundMusic() {
    try {
      if (!this.isInitialized) {
        await this.initializeAudioContext();
      }

      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (!this.isMuted) {
        await this.bgMusic.play();
      }
    } catch (error) {
      console.error('Background music start failed:', error);
    }
  }

  public async playSound(name: keyof typeof this.sounds) {
    try {
      if (!this.isInitialized) {
        await this.initializeAudioContext();
      }

      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (!this.isMuted) {
        const sound = this.sounds[name];
        if (sound.readyState >= 2) {
          sound.currentTime = 0;
          await sound.play();
        } else {
          console.warn(`Sound ${name} not ready to play`);
        }
      }
    } catch (error) {
      console.error('Sound play failed:', error);
      throw error;
    }
  }

  public stopBackgroundMusic() {
    this.bgMusic.pause();
    this.bgMusic.currentTime = 0;
  }

  public pauseBackgroundMusic() {
    this.bgMusic.pause();
  }

  public async resumeBackgroundMusic() {
    if (this.isMuted) return;
    try {
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }
      await this.bgMusic.play();
    } catch (error) {
      console.warn('Resume background music failed:', error);
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgMusicGain && this.soundsGain) {
      const volume = this.isMuted ? 0 : 0.5;
      const sfxVolume = this.isMuted ? 0 : 0.5;
      this.bgMusicGain.gain.value = volume;
      this.soundsGain.gain.value = sfxVolume;
    }
    return this.isMuted;
  }

  public setBackgroundMusicVolume(volume: number) {
    if (this.bgMusicGain) {
      this.bgMusicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public setSoundVolume(volume: number) {
    if (this.soundsGain) {
      this.soundsGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  private loadSoundEffect(name: string, filename: string) {
    const audio = new Audio();
    audio.volume = this.soundEffectsVolume;
    const src = `${import.meta.env.BASE_URL}sounds/${filename}`;
    
    // 添加事件监听器
    audio.addEventListener('loadstart', () => {
      console.log(`Sound ${name} started loading from ${src}`);
    }, { once: true });
    
    audio.addEventListener('loadedmetadata', () => {
      console.log(`Sound ${name} metadata loaded:`, {
        duration: audio.duration
      });
    }, { once: true });
    
    const loadPromise = new Promise<boolean>((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => {
        console.log(`Sound ${name} loaded successfully from ${src}`, {
          duration: audio.duration,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        resolve(true);
      }, { once: true });
      
      audio.addEventListener('error', (e) => {
        const error = audio.error;
        console.error(`Sound ${name} loading error:`, {
          code: error?.code,
          message: error?.message,
          src: src,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        reject(error);
      }, { once: true });
    });

    // 设置音频源并开始加载
    audio.src = src;
    this.sounds[name] = audio;
    this.loadPromises.push(loadPromise);
  }
}

export default AudioManager; 