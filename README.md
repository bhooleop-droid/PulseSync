# PulseSync 🎵✨

Live Demo: (https://pulsesyncapp.netlify.app)

PulseSync is an interactive, real-time music visualizer built with React, the Web Audio API, Tailwind CSS, and Framer Motion. It transforms audio frequencies into beautiful, responsive graphics that react to the beat of your music.

## Features

- **Dual Audio Sources**: 
  - Upload any local audio file (`.mp3`, `.wav`, etc.) to watch its visualization.
  - Connect your live microphone to see real-time visualizations of your voice or surrounding environment.
- **Three Unique Visualization Modes**:
  - 📊 **Neon Bars**: Classic vertical frequency bars featuring a dynamic purple-to-pink-to-blue gradient.
  - 🌀 **Radial**: A circular waveform representation with a pulsing glowing core driven by bass frequencies.
  - ✨ **Particles**: An explosive particle system where particles burst outwards relative to bass impacts, and float gracefully based on treble frequencies.
- **Premium UI & Aesthetics**:
  - Completely dark-themed layout built with Tailwind CSS v4.
  - Frosted-glass (glassmorphism) control panels with glowing neon accents.
  - Silky smooth UI transitions and layout animations powered by Framer Motion.
- **Highly Performant**:
  - Built entirely on the HTML5 `<canvas>` element.
  - Uses `requestAnimationFrame` for a highly optimized, jank-free 60+ FPS render cycle.
  - Fully responsive design that adapts to any screen size instantly via `ResizeObserver`.

## Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Core Engine**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (`AnalyserNode`)

## Running Locally

To run PulseSync on your local machine:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bhooleop-droid/PulseSync.git
   cd PulseSync
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## Deployment

This project requires no backend and is configured to be easily deployed as a static site to hosts like Netlify, Vercel, or GitHub Pages.

To build the production bundle:
```bash
npm run build
```

## License

This project is open-source. Feel free to fork, modify, and build upon it!
