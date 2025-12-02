import React, { useState } from 'react';
import { getGameImageUrl } from '../../data';

const GameImage = ({ 
  game, 
  size = 48, 
  type = 'header', 
  borderRadius = 12,
  showFallback = true,
  style = {}
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const imageUrl = getGameImageUrl(game, type);
  const hasImage = imageUrl && !imageError;
  
  // Calculate aspect ratio based on type
  const getAspectRatio = () => {
    switch (type) {
      case 'header': return 460 / 215; // ~2.14
      case 'capsule': return 231 / 87; // ~2.65
      case 'library': return 600 / 900; // ~0.67 (portrait)
      default: return 1;
    }
  };

  const aspectRatio = getAspectRatio();
  const isPortrait = type === 'library';
  
  // Calculate dimensions
  const width = isPortrait ? size : size * aspectRatio;
  const height = isPortrait ? size / aspectRatio : size;

  // Fallback emoji display
  const FallbackEmoji = () => (
    <div style={{
      width: size,
      height: size,
      borderRadius,
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(30, 20, 60, 0.8))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.5,
      border: '1px solid rgba(139, 92, 246, 0.2)',
      flexShrink: 0,
      ...style
    }}>
      🎮
    </div>
  );

  if (!hasImage && showFallback) {
    return <FallbackEmoji />;
  }

  if (!hasImage) {
    return null;
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius,
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
      background: 'rgba(30, 20, 60, 0.8)',
      ...style
    }}>
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(30, 20, 60, 0.8))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            borderTopColor: '#a855f7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
      
      <img
        src={imageUrl}
        alt={game.name}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Variant for wide header display (like in detail pages)
export const GameHeaderImage = ({ game, height = 80, style = {} }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const imageUrl = getGameImageUrl(game, 'header');
  
  if (!imageUrl || imageError) {
    return (
      <div style={{
        width: height * 2.14,
        height,
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(30, 20, 60, 0.8))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: height * 0.5,
        border: '1px solid rgba(139, 92, 246, 0.2)',
        ...style
      }}>
        🎮
      </div>
    );
  }

  return (
    <div style={{
      width: height * 2.14,
      height,
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
      background: 'rgba(30, 20, 60, 0.8)',
      border: '2px solid rgba(139, 92, 246, 0.3)',
      ...style
    }}>
      <img
        src={imageUrl}
        alt={game.name}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
};

export default GameImage;
