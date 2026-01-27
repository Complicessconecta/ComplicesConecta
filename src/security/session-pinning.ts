/**
 * Session Pinning & Browser Fingerprinting
 * Implementa validaciones de fingerprint para prevenir secuestro de sesión
 */

export interface BrowserFingerprint {
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelDepth: number;
  };
  timezone: string;
  timezoneOffset: number;
  sessionStorage: boolean;
  localStorage: boolean;
  indexedDb: boolean;
  openDatabase: boolean;
  cpuClass: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  canvas: string;
  webgl: string;
  fonts: string[];
  audio: string;
  plugins: string[];
  vendor: string;
  javaEnabled: boolean;
  touchSupport: boolean;
  adBlock: boolean;
  hasLiedLanguages: boolean;
  hasLiedResolution: boolean;
  hasLiedOs: boolean;
  hasLiedBrowser: boolean;
}

export interface SessionPinningData {
  fingerprint: BrowserFingerprint;
  timestamp: number;
  sessionId: string;
  isValid: boolean;
}

/**
 * Genera fingerprint del navegador
 */
export class BrowserFingerprintGenerator {
  /**
   * Genera fingerprint completo del navegador
   */
  static async generateFingerprint(): Promise<BrowserFingerprint> {
    const fingerprint: BrowserFingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: [...navigator.languages],
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      sessionStorage: this.checkSessionStorage(),
      localStorage: this.checkLocalStorage(),
      indexedDb: this.checkIndexedDB(),
      openDatabase: this.checkOpenDatabase(),
      cpuClass: (navigator as any).cpuClass || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      deviceMemory: (navigator as any).deviceMemory || 0,
      canvas: await this.getCanvasFingerprint(),
      webgl: await this.getWebGLFingerprint(),
      fonts: await this.getFontFingerprint(),
      audio: await this.getAudioFingerprint(),
      plugins: this.getPluginFingerprint(),
      vendor: navigator.vendor,
      javaEnabled: (navigator as any).javaEnabled() || false,
      touchSupport: this.checkTouchSupport(),
      adBlock: this.checkAdBlock(),
      hasLiedLanguages: this.hasLiedLanguages(),
      hasLiedResolution: this.hasLiedResolution(),
      hasLiedOs: this.hasLiedOs(),
      hasLiedBrowser: this.hasLiedBrowser(),
    };

    return fingerprint;
  }

  /**
   * Verifica si el fingerprint ha cambiado significativamente
   */
  static hasFingerprintChanged(
    current: BrowserFingerprint,
    stored: BrowserFingerprint,
    threshold: number = 0.8
  ): boolean {
    const similarity = this.calculateSimilarity(current, stored);
    return similarity < threshold;
  }

  /**
   * Calcula similitud entre dos fingerprints
   */
  private static calculateSimilarity(
    fp1: BrowserFingerprint,
    fp2: BrowserFingerprint
  ): number {
    let matches = 0;
    let total = 0;

    // Comparar propiedades clave
    const keyProperties: (keyof BrowserFingerprint)[] = [
      'userAgent', 'language', 'platform', 'cookieEnabled',
      'screen', 'timezone', 'sessionStorage', 'localStorage',
      'indexedDb', 'hardwareConcurrency', 'deviceMemory',
      'canvas', 'webgl', 'vendor', 'touchSupport'
    ];

    keyProperties.forEach(prop => {
      total++;
      if (JSON.stringify(fp1[prop]) === JSON.stringify(fp2[prop])) {
        matches++;
      }
    });

    return matches / total;
  }

  /**
   * Obtiene fingerprint de canvas
   */
  private static async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      // Texto para fingerprint
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('BrowserFingerprint 🔒', 2, 2);

      // Dibujo geométrico
      ctx.beginPath();
      ctx.arc(50, 50, 20, 0, Math.PI * 2);
      ctx.stroke();

      return canvas.toDataURL().slice(-50); // Solo últimos 50 chars
    } catch (error) {
      return 'canvas-error';
    }
  }

  /**
   * Obtiene fingerprint de WebGL
   */
  private static async getWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';

      const webglContext = gl as WebGLRenderingContext;
      const debugInfo = webglContext.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        return `${vendor}|${renderer}`;
      }

      return 'webgl-no-debug';
    } catch (error) {
      return 'webgl-error';
    }
  }

  /**
   * Obtiene fingerprint de fuentes
   */
  private static async getFontFingerprint(): Promise<string[]> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];

      const testFonts = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
        'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black',
        'Impact', 'Lucida Console', 'Tahoma', 'Lucida Sans Unicode', 'MS Sans Serif',
        'MS Serif', 'Helvetica', 'Geneva', 'Monaco', 'Charcoal', 'New York',
        'Palatino', 'Chicago', 'Zapf Dingbats', 'Bookman Old Style'
      ];

      const availableFonts: string[] = [];
      const baseWidth = ctx.measureText('mmmmmmmmmmlli').width;

      testFonts.forEach(font => {
        ctx.font = `72px '${font}'`;
        const width = ctx.measureText('mmmmmmmmmmlli').width;
        if (width !== baseWidth) {
          availableFonts.push(font);
        }
      });

      return availableFonts;
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene fingerprint de audio
   */
  private static async getAudioFingerprint(): Promise<string> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(0);
      setTimeout(() => oscillator.stop(0), 100);

      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          const samples = event.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < samples.length; i++) {
            sum += Math.abs(samples[i]);
          }
          resolve(sum.toString().slice(0, 16));
          audioContext.close();
        };
      });
    } catch (error) {
      return 'no-audio';
    }
  }

  /**
   * Obtiene fingerprint de plugins
   */
  private static getPluginFingerprint(): string[] {
    try {
      const plugins = [];
      for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
      }
      return plugins;
    } catch (error) {
      return [];
    }
  }

  /**
   * Verifica capacidades del navegador
   */
  private static checkSessionStorage(): boolean {
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      return true;
    } catch (error) {
      return false;
    }
  }

  private static checkLocalStorage(): boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (error) {
      return false;
    }
  }

  private static checkIndexedDB(): boolean {
    return 'indexedDB' in window;
  }

  private static checkOpenDatabase(): boolean {
    return 'openDatabase' in window;
  }

  private static checkTouchSupport(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private static checkAdBlock(): boolean {
    try {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad';
      testAd.style.cssText = 'position: absolute; top: -10px; left: -10px; height: 1px; width: 1px; visibility: hidden;';
      document.body.appendChild(testAd);
      const isBlocked = testAd.offsetHeight === 0;
      document.body.removeChild(testAd);
      return isBlocked;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detecta si el usuario ha mentido sobre su idioma
   */
  private static hasLiedLanguages(): boolean {
    try {
      const language = navigator.language;
      const languages = navigator.languages;
      return !languages.includes(language);
    } catch (error) {
      return false;
    }
  }

  /**
   * Detecta si el usuario ha mentido sobre su resolución
   */
  private static hasLiedResolution(): boolean {
    try {
      const width = screen.width;
      const availWidth = screen.availWidth;
      return width !== availWidth;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detecta si el usuario ha mentido sobre su OS
   */
  private static hasLiedOs(): boolean {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      const platform = navigator.platform.toLowerCase();
      
      if (userAgent.includes('win') && !platform.includes('win')) return true;
      if (userAgent.includes('mac') && !platform.includes('mac')) return true;
      if (userAgent.includes('linux') && !platform.includes('linux')) return true;
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detecta si el usuario ha mentido sobre su navegador
   */
  private static hasLiedBrowser(): boolean {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (userAgent.includes('chrome') && !window.chrome) return true;
      if (userAgent.includes('firefox') && typeof (window as any).InstallTrigger === 'undefined') return true;
      if (userAgent.includes('safari') && !window.safari) return true;
      
      return false;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Gestor de Session Pinning
 */
export class SessionPinningManager {
  private static readonly STORAGE_KEY = 'cc_session_pinning';
  private static readonly VALIDITY_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Inicializa el session pinning
   */
  static async initialize(): Promise<void> {
    const currentFingerprint = await BrowserFingerprintGenerator.generateFingerprint();
    const storedData = this.getStoredPinningData();

    if (!storedData) {
      // Primera vez, guardar fingerprint
      this.savePinningData(currentFingerprint);
      return;
    }

    // Verificar si el fingerprint ha cambiado
    if (BrowserFingerprintGenerator.hasFingerprintChanged(currentFingerprint, storedData.fingerprint)) {
      console.warn('🚨 Browser fingerprint changed - possible session hijacking');
      this.invalidateSession();
      return;
    }

    // Verificar validez temporal
    if (Date.now() - storedData.timestamp > this.VALIDITY_DURATION) {
      console.warn('⏰ Session pinning expired');
      this.invalidateSession();
      return;
    }

    // Actualizar timestamp
    storedData.timestamp = Date.now();
    this.savePinningData(currentFingerprint);
  }

  /**
   * Obtiene datos de pinning almacenados
   */
  private static getStoredPinningData(): SessionPinningData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Guarda datos de pinning
   */
  private static savePinningData(fingerprint: BrowserFingerprint): void {
    try {
      const data: SessionPinningData = {
        fingerprint,
        timestamp: Date.now(),
        sessionId: this.generateSessionId(),
        isValid: true,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving session pinning data:', error);
    }
  }

  /**
   * Genera ID de sesión único
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Invalida la sesión actual
   */
  private static invalidateSession(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      
      // Disparar evento de sesión inválida
      window.dispatchEvent(new CustomEvent('session-invalid', {
        detail: { reason: 'fingerprint-mismatch' }
      }));
    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }

  /**
   * Verifica si la sesión es válida
   */
  static async validateSession(): Promise<boolean> {
    try {
      const currentFingerprint = await BrowserFingerprintGenerator.generateFingerprint();
      const storedData = this.getStoredPinningData();

      if (!storedData || !storedData.isValid) {
        return false;
      }

      if (BrowserFingerprintGenerator.hasFingerprintChanged(currentFingerprint, storedData.fingerprint)) {
        return false;
      }

      if (Date.now() - storedData.timestamp > this.VALIDITY_DURATION) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  /**
   * Limpia datos de session pinning
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing session pinning:', error);
    }
  }
}
