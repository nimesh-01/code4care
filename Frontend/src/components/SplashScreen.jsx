import React, { useState, useEffect } from 'react';
import { FaHandHoldingHeart } from 'react-icons/fa';

const SplashScreen = ({ onFinish }) => {
  const [stage, setStage] = useState('initial'); // initial, animate-in, hold, exit

  useEffect(() => {
    // Sequence of animations
    const timers = [];

    // 1. Start animation immediately after mount
    timers.push(setTimeout(() => setStage('animate-in'), 100));

    // 2. Start exit phase (Reduced from 3000ms to 2000ms)
    timers.push(setTimeout(() => setStage('exit'), 2000));

    // 3. Complete and unmount (Reduced from 4000ms to 2800ms)
    timers.push(setTimeout(() => {
      onFinish();
    }, 2800));

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-cream-50 to-white dark:from-gray-900 dark:to-gray-800 transition-opacity duration-700 ${
        stage === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Icon Container */}
        <div 
          className={`transform transition-all duration-700 ease-out mb-6 ${
            stage === 'initial' 
              ? 'scale-0 opacity-0 translate-y-10' 
              : 'scale-100 opacity-100 translate-y-0'
          }`}
        >
          <div className="relative">
            {/* Background glow/pulse */}
            <div className={`absolute inset-0 bg-coral-200 dark:bg-coral-900/30 rounded-full blur-xl opacity-50 ${
              stage === 'animate-in' ? 'animate-pulse' : ''
            }`}></div>
            
            {/* Main Icon */}
            <FaHandHoldingHeart className="text-8xl text-coral-500 dark:text-coral-400 relative z-10 drop-shadow-sm" />
          </div>
        </div>

        {/* Text Animation */}
        <div className="overflow-hidden">
          <h1 
            className={`text-4xl md:text-5xl font-bold text-gray-800 dark:text-white tracking-wide transition-all duration-700 delay-200 ease-out transform ${
              stage === 'initial' 
                ? 'translate-y-full opacity-0' 
                : 'translate-y-0 opacity-100'
            }`}
          >
            <span className="text-coral-500 dark:text-coral-400">Soul</span>
            <span className="text-teal-600 dark:text-teal-400">Connect</span>
          </h1>
        </div>

        {/* Tagline Animation */}
        <p 
          className={`mt-4 text-gray-500 dark:text-gray-400 text-sm tracking-widest uppercase transition-all duration-700 delay-400 ease-out transform ${
            stage === 'initial' 
              ? 'translate-y-4 opacity-0' 
              : 'translate-y-0 opacity-100'
          }`}
        >
          Bringing Hearts Together
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
