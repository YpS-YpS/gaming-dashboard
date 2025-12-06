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
  // If size is passed, we treat it as the primary dimension (width for landscape, height for portrait if not specified)
  // BUT for GameCard usage, we want 'size' to be the height, and width to scale.
  // Wait, the previous logic was: width = isPortrait ? size : size * aspectRatio; height = isPortrait ? size / aspectRatio : size;
  // This means 'size' is the HEIGHT for landscape images (header/capsule).

  // If the user passes a large size (e.g. 140), the width becomes 140 * 2.14 = ~300px.
  // This seems correct for a large icon.

  // However, if the container in GameCard constrains it, that might be the issue.
  // Let's check GameCard again. It puts GameImage in a flex container.

  const width = isPortrait ? size : size * aspectRatio;
  const height = isPortrait ? size / aspectRatio : size;

  // Fallback emoji display
  const FallbackEmoji = () => (
    <div
      className="flex items-center justify-center border border-primary/20 flex-shrink-0 bg-gradient-to-br from-primary/30 to-[#1e143c]/80"
      style={{
        width,
        height,
        borderRadius,
        fontSize: size * 0.5,
        ...style
      }}
    >
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
    <div
      className="overflow-hidden relative flex-shrink-0 bg-[#1e143c]/80"
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    >
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-[#1e143c]/80 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      <img
        src={imageUrl}
        alt={game.name}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={`w-full h-full object-cover object-center transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
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
