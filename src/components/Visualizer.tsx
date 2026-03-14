import React, { useRef, useEffect } from 'react';

export type VisualizerMode = 'bars' | 'circular' | 'particles';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  mode: VisualizerMode;
  isPlaying: boolean;
}

interface Particle {
  x: number;
  y: number;
  velocity: { x: number; y: number };
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, mode, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    // We only need the frequency data (not time domain) for these visualizations
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;

      analyser.getByteFrequencyData(dataArray);

      // Clear the canvas with a slight trail effect (0.2 alpha)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      if (mode === 'bars') {
        drawBars(ctx, dataArray, bufferLength, width, height);
      } else if (mode === 'circular') {
        drawCircular(ctx, dataArray, bufferLength, width, height);
      } else if (mode === 'particles') {
        drawParticles(ctx, dataArray, bufferLength, width, height, particlesRef.current);
      }
    };

    if (isPlaying) {
      draw();
    } else {
      // If paused or stopped, just keep it black but we can slowly fade out
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, mode, isPlaying]);

  // Handle Canvas Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
         canvas.width = entry.contentRect.width;
         canvas.height = entry.contentRect.height;
      }
    });

    resizeObserver.observe(canvas.parentElement!);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

// --- Drawing functions ---

function drawBars(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number, width: number, height: number) {
  const barWidth = (width / bufferLength) * 2.5;
  let barHeight;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    barHeight = dataArray[i];

    // Neon colors: Purple -> Pink -> Blue gradient based on array position
    const r = barHeight + (25 * (i / bufferLength));
    const g = 100 * (i / bufferLength);
    const b = 250;

    const fillStyle = `rgb(${r},${g},${b})`;
    
    ctx.fillStyle = fillStyle;
    ctx.shadowBlur = 10;
    ctx.shadowColor = fillStyle;
    
    // Draw bar from bottom
    ctx.fillRect(x, height - barHeight * 1.5, barWidth, barHeight * 1.5);

    x += barWidth + 1;
    ctx.shadowBlur = 0; // Reset
  }
}

function drawCircular(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number, width: number, height: number) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) * 0.4;
  
  // Use a subset of the buffer for the circle to avoid too many fine lines
  const numBars = 120; 
  const step = Math.floor(bufferLength / numBars);

  for (let i = 0; i < numBars; i++) {
    const value = dataArray[i * step];
    const percent = value / 255;
    const barHeight = percent * radius * 1.5;
    const rads = (Math.PI * 2 * i) / numBars;
    
    const x = centerX + Math.cos(rads) * radius;
    const y = centerY + Math.sin(rads) * radius;
    const xEnd = centerX + Math.cos(rads) * (radius + barHeight);
    const yEnd = centerY + Math.sin(rads) * (radius + barHeight);

    // Neon colors
    const r = value;
    const g = 100 + (155 * (i / numBars));
    const b = 255;
    
    const strokeStyle = `rgb(${r},${g},${b})`;

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = strokeStyle;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
    
    ctx.shadowBlur = 0; // Reset
  }

  // Draw a glow in the center based on bass
  const bassAvg = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * (0.8 + (bassAvg / 255) * 0.3), 0, 2 * Math.PI);
  
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, `rgba(139, 92, 246, ${bassAvg / 255})`);
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawParticles(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number, width: number, height: number, particles: Particle[]) {
  const bassAvg = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  const trebleAvg = dataArray.slice(bufferLength - 50, bufferLength).reduce((a, b) => a + b, 0) / 50;
  
  // Generate particles based on bass beats
  if (bassAvg > 210 && Math.random() > 0.4) {
    const numToGenerate = Math.floor((bassAvg / 255) * 8);
    for(let i = 0; i < numToGenerate; i++) {
        // Random HSL colors in the blue/purple/pink spectrum
        const hue = Math.random() * 60 + 260; // 260 to 320
        particles.push({
            x: width / 2,
            y: height / 2,
            velocity: {
                x: (Math.random() - 0.5) * 15,
                y: (Math.random() - 0.5) * 15
            },
            radius: Math.random() * 6 + 2,
            color: `hsl(${hue}, 100%, 65%)`,
            life: 0,
            maxLife: Math.random() * 30 + 40
        });
    }
  }

  // Optional: add some floating particles across the screen based on treble
  if (trebleAvg > 50 && Math.random() > 0.8) {
     particles.push({
        x: Math.random() * width,
        y: height,
        velocity: {
            x: (Math.random() - 0.5) * 2,
            y: -Math.random() * 5 - 2
        },
        radius: Math.random() * 3 + 1,
        color: `hsl(190, 100%, 70%)`, // Cyan
        life: 0,
        maxLife: 100
     });
  }

  // Draw and update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    
    // Add glow
    ctx.shadowBlur = p.radius * 2;
    ctx.shadowColor = p.color;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Update
    p.x += p.velocity.x;
    p.y += p.velocity.y;
    p.life++;
    
    // Shrink slowly
    p.radius = Math.max(0.1, p.radius * 0.96);
    
    if (p.life > p.maxLife || p.radius < 0.2) {
      particles.splice(i, 1);
    }
  }
}
