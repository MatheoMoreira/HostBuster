import React from 'react';

// Marque HostBuster : fantôme (clin d'œil "Ghostbuster") avec un éclair en
// creux. Les yeux et l'éclair sont des trous (fill-rule evenodd) : ils laissent
// voir l'arrière-plan. La couleur du fantôme suit `currentColor`.
const Logo = ({ className = '', title = 'HostBuster' }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    role="img"
    aria-label={title}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M50,12 C31,12 17,27 17,46 L17,84 Q17,90 22,87 L27,84 Q30,82 33,85 L37,88 Q40.5,90.5 44,87 L48,84 Q50,82.5 52,84 L56,87 Q59.5,90.5 63,87 L67,84 Q70,82 73,85 L78,87 Q83,90 83,84 L83,46 C83,27 69,12 50,12 Z M44.5,44 a5.5,5.5 0 1,0 -11,0 a5.5,5.5 0 1,0 11,0 Z M66.5,44 a5.5,5.5 0 1,0 -11,0 a5.5,5.5 0 1,0 11,0 Z M54,53 L44,69 L50,69 L47,80 L60,62 L53,62 Z"
    />
  </svg>
);

export default Logo;
