import React from 'react';

const PageHeader = ({ title, subtitle, icon }) => {
  return (
    <div className="page-header text-center mb-30">
      <div className="logo-animation mb-4">
        <i className={`ph ${icon || 'ph-squares-four'} text-primary`} style={{ fontSize: '3rem' }}></i>
      </div>
      <h4 className='mb-8'>{title}</h4>
      {subtitle && (
        <p className='mb-0 text-neutral-500'>
          {subtitle}
        </p>
      )}

      <style jsx>{`
        .logo-animation {
          animation: float 3s ease-in-out infinite;
        }

        .logo-animation i {
          display: inline-block;
          padding: 1rem;
          border-radius: 50%;
          background: rgba(13, 110, 253, 0.1);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        .page-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .page-header h4 {
          font-size: 2rem;
          font-weight: 600;
          color: #2c3345;
        }

        .page-header p {
          font-size: 1.1rem;
          max-width: 500px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
};

export default PageHeader; 