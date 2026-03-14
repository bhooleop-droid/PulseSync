import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioVisualizerProps {
  fftSize?: number;
}

export const useAudioVisualizer = ({ fftSize = 1024 }: UseAudioVisualizerProps = {}) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [source, setSource] = useState<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  const [isMicrophone, setIsMicrophone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContext || !analyser) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = fftSize;
      setAudioContext(ctx);
      setAnalyser(analyserNode);
      return { ctx, analyserNode };
    }
    return { ctx: audioContext, analyserNode: analyser };
  }, [audioContext, analyser, fftSize]);

  const disconnectCurrentSource = useCallback(() => {
    if (source) {
      source.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [source]);

  const connectAudioElement = useCallback((audioElement: HTMLAudioElement) => {
    const { ctx, analyserNode } = initAudioContext();
    
    disconnectCurrentSource();

    // Create new source from audio element
    let newSource: MediaElementAudioSourceNode;
    try {
        // Note: createMediaElementSource can only be called once per element
        newSource = ctx.createMediaElementSource(audioElement);
    } catch (e) {
        // If it was already created for this element, we shouldn't fail fatally,
        // but it's tricky to reuse without keeping references.
        // Assuming fresh elements or properly handled elsewhere.
        console.warn("Media element might already have a source node.", e);
        return;
    }

    newSource.connect(analyserNode);
    analyserNode.connect(ctx.destination);
    
    setSource(newSource);
    setIsMicrophone(false);
    audioRef.current = audioElement;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [initAudioContext, disconnectCurrentSource]);

  const connectMicrophone = useCallback(async () => {
    const { ctx, analyserNode } = initAudioContext();
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      disconnectCurrentSource();
      streamRef.current = stream;

      const newSource = ctx.createMediaStreamSource(stream);
      newSource.connect(analyserNode);
      // Do NOT connect to ctx.destination to avoid feedback loops!
      
      setSource(newSource);
      setIsMicrophone(true);
      setIsPlaying(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  }, [initAudioContext, disconnectCurrentSource]);

  const stopMicrophone = useCallback(() => {
    disconnectCurrentSource();
    setIsMicrophone(false);
    setIsPlaying(false);
  }, [disconnectCurrentSource]);

  useEffect(() => {
    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioContext]);

  return {
    analyser,
    connectAudioElement,
    connectMicrophone,
    stopMicrophone,
    isMicrophone,
    isPlaying,
    audioContext
  };
};
