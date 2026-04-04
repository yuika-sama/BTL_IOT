import { useState } from 'react';

export default function Background({ theme = {} }) {
  const [particles] = useState(() => [
    ...[...Array(15)].map(() => ({
      size: Math.random() * 6 + 4,
      colorType: Math.floor(Math.random() * 3),
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
      offsetX: Math.random() * 100 - 50
    }))
  ]);

  const overlayStops = Array.isArray(theme.gradientStops) && theme.gradientStops.length === 4
    ? theme.gradientStops
    : ['rgba(239,246,255,0.12)', 'rgba(219,234,254,0.12)', 'rgba(224,231,255,0.12)', 'rgba(254,243,199,0.12)'];

  const overlayOrbs = theme.orbColors || {};
  const energy = Math.min(1, Math.max(0, Number(theme.energy || 0)));

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Base Background (kept original) */}
      <div 
        className="absolute inset-0 w-full h-full animate-gradient"
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 50%, #DBEAFE 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 15s ease infinite'
        }}
      />
      
      {/* Base blur orbs (kept original) */}
      <div 
        className="absolute rounded-full animate-float-slow"
        style={{
          width: '384px',
          height: '384px',
          background: 'rgba(96, 165, 250, 0.20)',
          filter: 'blur(50px)',
          left: '-192px',
          top: '-120px',
          animation: 'float-1 20s ease-in-out infinite'
        }}
      />
      
      <div 
        className="absolute rounded-full"
        style={{
          width: '500px',
          height: '500px',
          background: 'rgba(129, 140, 248, 0.20)',
          filter: 'blur(60px)',
          right: '-192px',
          bottom: '-120px',
          animation: 'float-2 25s ease-in-out infinite'
        }}
      />
      
      {/* Base additional orb (kept original) */}
      <div 
        className="absolute rounded-full"
        style={{
          width: '300px',
          height: '300px',
          background: 'rgba(167, 139, 250, 0.15)',
          filter: 'blur(45px)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'float-3 18s ease-in-out infinite'
        }}
      />
      
      {/* Base floating particles (kept original) */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-30"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.colorType === 0 
                ? 'rgba(96, 165, 250, 0.4)'
                : particle.colorType === 1 
                ? 'rgba(129, 140, 248, 0.4)'
                : 'rgba(167, 139, 250, 0.4)',
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animation: `particle-float ${particle.duration}s linear infinite`,
              animationDelay: `${particle.delay}s`,
              '--offset-x': `${particle.offsetX}px`
            }}
          />
        ))}
      </div>
      
      {/* Base geometric shapes (kept original) */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div 
          className="absolute w-32 h-32 border-2 border-blue-400 rounded-lg"
          style={{
            left: '10%',
            top: '20%',
            animation: 'rotate-slow 30s linear infinite'
          }}
        />
        <div 
          className="absolute w-24 h-24 border-2 border-indigo-400 rounded-full"
          style={{
            right: '15%',
            top: '60%',
            animation: 'rotate-reverse 25s linear infinite'
          }}
        />
        <div 
          className="absolute w-20 h-20 border-2 border-purple-400"
          style={{
            left: '70%',
            bottom: '30%',
            animation: 'rotate-slow 20s linear infinite'
          }}
        />
      </div>

      {/* Dynamic Overlay (new layer on top of base background) */}
      <div className="absolute inset-0" style={{ opacity: 0.28 + energy * 0.35 }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(145deg, ${overlayStops[0]} 0%, ${overlayStops[1]} 35%, ${overlayStops[2]} 68%, ${overlayStops[3]} 100%)`,
            backgroundSize: '180% 180%',
            animation: `gradient-shift ${12 - energy * 4}s ease infinite`
          }}
        />

        <div
          className="absolute rounded-full"
          style={{
            width: '320px',
            height: '320px',
            background: overlayOrbs.temperature || 'rgba(249, 115, 22, 0.2)',
            filter: 'blur(55px)',
            left: '-110px',
            top: '-90px',
            animation: `float-1 ${17 - energy * 4}s ease-in-out infinite`
          }}
        />

        <div
          className="absolute rounded-full"
          style={{
            width: '360px',
            height: '360px',
            background: overlayOrbs.humidity || 'rgba(56, 189, 248, 0.18)',
            filter: 'blur(60px)',
            right: '-120px',
            bottom: '-80px',
            animation: `float-2 ${20 - energy * 4}s ease-in-out infinite`
          }}
        />

        <div
          className="absolute rounded-full"
          style={{
            width: '260px',
            height: '260px',
            background: overlayOrbs.light || 'rgba(250, 204, 21, 0.18)',
            filter: 'blur(45px)',
            left: '42%',
            top: '30%',
            animation: `float-3 ${15 - energy * 3}s ease-in-out infinite`
          }}
        />
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes float-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes float-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-40px, 30px) scale(1.15);
          }
          66% {
            transform: translate(20px, -20px) scale(0.95);
          }
        }
        
        @keyframes float-3 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
        
        @keyframes particle-float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) translateX(var(--offset-x));
            opacity: 0;
          }
        }
        
        @keyframes rotate-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes rotate-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}
