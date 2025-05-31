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
  private loadPromises: Promise<void>[] = [];

  private constructor() {
    this.bgMusic = new Audio();
    this.bgMusic.src = '/sounds/background-music.mp3';
    this.bgMusic.loop = true;
    this.loadPromises.push(
      new Promise((resolve, reject) => {
        this.bgMusic.addEventListener('canplaythrough', () => resolve(), { once: true });
        this.bgMusic.addEventListener('error', (e) => {
          console.error('Background music loading error:', this.bgMusic.error);
          reject(this.bgMusic.error);
        }, { once: true });
      })
    );

    // 创建音效对象
    const soundFiles = {
      select: '/sounds/select.mp3',
      match: '/sounds/match.mp3',
      levelComplete: '/sounds/level-complete.mp3',
      gameOver: '/sounds/game-over.mp3'
    };

    this.sounds = {} as Record<string, HTMLAudioElement>;
    
    // 为每个音效创建Audio对象并添加加载Promise
    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio();
      audio.src = path;
      this.sounds[key] = audio;
      
      this.loadPromises.push(
        new Promise((resolve, reject) => {
          audio.addEventListener('canplaythrough', () => resolve(), { once: true });
          audio.addEventListener('error', (e) => {
            console.error(`Sound ${key} loading error:`, audio.error);
            reject(audio.error);
          }, { once: true });
        })
      );
    });

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
      await Promise.all(this.loadPromises);

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建音量控制节点
      this.bgMusicGain = this.audioContext.createGain();
      this.soundsGain = this.audioContext.createGain();
      
      // 连接背景音乐
      if (this.audioContext && this.bgMusicGain) {
        this.bgMusicSource = this.audioContext.createMediaElementSource(this.bgMusic);
        this.bgMusicSource.connect(this.bgMusicGain);
        this.bgMusicGain.connect(this.audioContext.destination);
        
        // 设置初始音量
        this.bgMusicGain.gain.value = 0.5;
        this.soundsGain.gain.value = 0.5;

        // 连接音效
        Object.values(this.sounds).forEach(sound => {
          if (this.audioContext && this.soundsGain) {
            const source = this.audioContext.createMediaElementSource(sound);
            source.connect(this.soundsGain);
          }
        });
        this.soundsGain.connect(this.audioContext.destination);

        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
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

      if (!this.isMuted && this.bgMusic.readyState >= 2) {
        await this.bgMusic.play();
      }
    } catch (error) {
      console.error('Background music play failed:', error);
      throw error;
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
      console.log('Resume background music failed:', error);
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
}

export default AudioManager; 