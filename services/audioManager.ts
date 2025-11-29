/**
 * Handles Web Audio API logic:
 * 1. Playing raw PCM chunks from Backend
 * 2. analyzing audio energy for lip-sync
 * 3. Recording microphone and converting to 16k PCM for backend
 */
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private gainNode: GainNode | null = null;
  private prevEnergy: number = 0;

  // Recording
  private mediaStream: MediaStream | null = null;
  private inputContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  
  // Callback for sending audio chunks to WS
  public onAudioData: ((data: ArrayBuffer) => void) | null = null;

  async initialize() {
    if (this.audioContext) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 16000 }); // Match backend if possible, or resample
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 1024; // larger window to smooth low freq speech energy
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    this.nextStartTime = this.audioContext.currentTime;
  }

  // Play a chunk of Base64 PCM 16k Mono
  async playChunk(base64Audio: string) {
    if (!this.audioContext || !this.gainNode) return;

    // Base64 -> ArrayBuffer
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Bytes (Int16 PCM) -> Float32 for Web Audio
    // 16-bit PCM is 2 bytes per sample.
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
        // Normalize to -1.0 to 1.0
        float32Data[i] = int16Data[i] / 32768.0;
    }

    const buffer = this.audioContext.createBuffer(1, float32Data.length, 16000); // Backend sends 16k
    buffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    // Schedule seamlessly
    const currentTime = this.audioContext.currentTime;
    // If we fell behind, reset time to now + tiny buffer
    const startAt = Math.max(currentTime, this.nextStartTime);
    
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;
  }

  // Get current volume energy (0.0 to 1.0) for lip sync
  getVolume(): number {
    if (!this.analyser) return 0;

    // Use time-domain RMS for smoother mouth movement
    const timeDomain = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(timeDomain);

    let sumSquares = 0;
    for (let i = 0; i < timeDomain.length; i++) {
      const v = (timeDomain[i] - 128) / 128; // normalize -1..1
      sumSquares += v * v;
    }
    const rms = Math.sqrt(sumSquares / timeDomain.length);

    // Smooth with simple low-pass filter
    const alpha = 0.25; // lower = smoother
    this.prevEnergy = this.prevEnergy * (1 - alpha) + rms * alpha;

    // Map to 0..1, with a slight gain
    const energy = Math.min(1, this.prevEnergy * 4.5);
    return energy;
  }

  // --- Recording Logic ---

  async startRecording() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use a separate context for input to control sample rate specifically if needed,
      // or reuse main context if it supports input. 
      // Using a dedicated logic for 16k downsampling.
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputContext = new AudioContextClass({ sampleRate: 16000 }); // Browser handles resampling
      
      this.inputSource = this.inputContext.createMediaStreamSource(this.mediaStream);
      
      // Buffer size 4096 = approx 256ms at 16k.
      this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 (-1 to 1) to Int16 PCM bytes
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        if (this.onAudioData) {
            this.onAudioData(pcm16.buffer);
        }
      };

      this.inputSource.connect(this.processor);
      this.processor.connect(this.inputContext.destination); // Required for script processor to run
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  }

  stopRecording() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.processor && this.inputSource) {
      this.inputSource.disconnect();
      this.processor.disconnect();
    }
    if (this.inputContext) {
      this.inputContext.close();
      this.inputContext = null;
    }
  }
}
