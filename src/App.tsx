import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Mic, MicOff, Play, Pause, Activity, Circle, Sparkles, Volume2 } from 'lucide-react';
import { useAudioVisualizer } from './hooks/useAudioVisualizer';
import { Visualizer, type VisualizerMode } from './components/Visualizer';

function App() {
  const { 
    analyser, 
    connectAudioElement, 
    connectMicrophone, 
    stopMicrophone,
    isMicrophone, 
    isPlaying 
  } = useAudioVisualizer({ fftSize: 2048 });

  const [mode, setMode] = useState<VisualizerMode>('bars');
  const [fileName, setFileName] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isMicrophone) {
      stopMicrophone();
    }

    const url = URL.createObjectURL(file);
    if (audioRef.current) {
       // Need to pause before changing source
      if(isPlaying) {
         audioRef.current.pause();
      }
      audioRef.current.src = url;
      setFileName(file.name);
      
      // We must wait for audio element to be ready
      audioRef.current.oncanplay = () => {
         connectAudioElement(audioRef.current!);
         audioRef.current?.play().catch(e => console.error("Play prevented", e));
      };
    }
  };

  const toggleMicrophone = async () => {
    if (isMicrophone) {
      stopMicrophone();
      setFileName(null);
    } else {
       await connectMicrophone();
       setFileName("Live Microphone Input");
    }
  };

  const togglePlayPause = () => {
    if (isMicrophone) return; // Can't pause live mic
    if (audioRef.current && fileName) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  // UI Components mapping
  const modes: { id: VisualizerMode; icon: React.ReactNode; label: string }[] = [
    { id: 'bars', icon: <Activity size={18} />, label: 'Neon Bars' },
    { id: 'circular', icon: <Circle size={18} />, label: 'Radial' },
    { id: 'particles', icon: <Sparkles size={18} />, label: 'Particles' }
  ];

  return (
    <div className="relative w-full h-screen bg-zinc-950 overflow-hidden text-white font-sans">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-zinc-950 to-blue-900/20 z-0 pointer-events-none" />

      {/* Main Canvas Area */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Visualizer analyser={analyser} mode={mode} isPlaying={isPlaying} />
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} crossOrigin="anonymous" className="hidden" />

      {/* Glassmorphism Control Panel */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-4xl px-4"
      >
        <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)] bg-white/5">
          
          {/* File & Mic Controls */}
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept="audio/*"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <Upload size={18} className="text-purple-400" />
              <span className="text-sm font-medium">Upload Audio</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: isMicrophone ? "0 0 15px rgba(239,68,68,0.5)" : "0 0 15px rgba(139,92,246,0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMicrophone}
              className={`p-3 rounded-full border transition-all duration-300 cursor-pointer ${isMicrophone ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
            >
              {isMicrophone ? <MicOff size={20} /> : <Mic size={20} />}
            </motion.button>
          </div>

          {/* Center Playback Info */}
          <div className="flex flex-col items-center flex-1 max-w-[250px]">
            <AnimatePresence mode="popLayout">
              {fileName ? (
                <motion.div 
                  key="filename"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-sm font-medium text-purple-200 truncate w-full text-center mb-3"
                  title={fileName}
                >
                  {fileName}
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  className="text-sm text-zinc-500 mb-3"
                >
                  Select a source to begin
                </motion.div>
              )}
            </AnimatePresence>
            
            {!isMicrophone && fileName && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePlayPause}
                className="w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
              </motion.button>
            )}

            {isMicrophone && (
               <div className="flex items-center gap-2 text-red-400 text-sm font-semibold animate-pulse h-12">
                 <div className="w-2 h-2 rounded-full bg-red-500" />
                 LIVE
               </div>
            )}
          </div>

          {/* Visualizer Modes */}
          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`relative px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${mode === m.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {mode === m.id && (
                  <motion.div 
                    layoutId="activeMode" 
                    className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span className={mode === m.id ? 'text-purple-400' : ''}>{m.icon}</span>
                  <span className="hidden sm:inline">{m.label}</span>
                </span>
              </button>
            ))}
          </div>

        </div>
      </motion.div>

      {/* Top Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="absolute top-8 left-8 z-10 flex flex-col gap-1"
      >
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <Volume2 className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            PulseSync
            </h1>
        </div>
        <p className="text-zinc-500 text-sm ml-14">Interactive Web Audio Visualizer</p>
      </motion.div>
    </div>
  );
}

export default App;
