import React from 'react';

// Palette de couleurs de fond (assez foncées pour rester lisibles avec du texte blanc).
const COLORS = [
    '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a',
    '#059669', '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5',
    '#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48', '#be123c',
];

// Extrait jusqu'à 2 initiales depuis un nom (ou un email en repli).
export const getInitials = (name = '', email = '') => {
    const source = (name || email || '?').trim();
    const parts = source.split(/[\s.@_-]+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Couleur déterministe : même initiales -> même couleur.
const colorFromString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash |= 0; // 32-bit
    }
    return COLORS[Math.abs(hash) % COLORS.length];
};

const SIZES = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
};

const Avatar = ({ name, email, size = 'md', className = '' }) => {
    const initials = getInitials(name, email);
    const bg = colorFromString(initials);

    return (
        <span
            className={`inline-flex items-center justify-center rounded-full font-black text-white uppercase select-none shrink-0 ${SIZES[size] || SIZES.md} ${className}`}
            style={{ backgroundColor: bg }}
            title={name || email}
        >
            {initials}
        </span>
    );
};

export default Avatar;
