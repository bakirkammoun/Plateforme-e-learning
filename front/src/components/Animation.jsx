import React from 'react';

const Animation = () => {
  return (
    <div className="animation-wrapper">
      <div className="animation-shape shape-1"></div>
      <div className="animation-shape shape-2"></div>

      <style jsx>{`
        .animation-wrapper {
          position: fixed;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: -1;
          overflow: hidden;
          opacity: 0.3;
        }

        .animation-shape {
          position: absolute;
          background: linear-gradient(45deg, #f8f9fa, #e9ecef);
          border-radius: 50%;
        }

        .shape-1 {
          width: 800px;
          height: 800px;
          top: -400px;
          right: -200px;
          animation: float 15s ease-in-out infinite;
        }

        .shape-2 {
          width: 600px;
          height: 600px;
          bottom: -300px;
          left: -100px;
          animation: float 12s ease-in-out infinite;
        }

        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(3deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Animation; 