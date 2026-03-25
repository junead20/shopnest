// client/src/components/ProductImage.js
import React, { useState } from 'react';

const FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23f8fafc"/><path d="M150 100l50 80H100z" fill="%23cbd5e1"/><circle cx="150" cy="150" r="40" stroke="%2394a3b8" stroke-width="2" fill="none"/><text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="bold" font-size="14" fill="%2364748b">ShopNest Premium</text></svg>`;

const ProductImage = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_SVG);
  const [error, setError] = useState(false);

  const handleError = () => {
    if (!error) {
      setError(true);
      setImgSrc(FALLBACK_SVG);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || 'Product image'}
      onError={handleError}
      className={`${className} transition-opacity duration-300 ${error ? 'opacity-80' : 'opacity-100'}`}
      loading="lazy"
    />
  );
};

export default ProductImage;