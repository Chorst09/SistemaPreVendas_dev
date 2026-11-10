'use client';

import React from 'react';

interface Nav3DIconProps {
  id: string;
  className?: string;
  size?: number;
}

export function Nav3DIcon({ id, className = '', size = 26 }: Nav3DIconProps) {
  // Common 3D visual icons based on menu ID
  switch (id) {
    case 'dashboard':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="db-base" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#0c2d3e" />
            </linearGradient>
            <linearGradient id="db-bar1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="db-bar2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="db-bar3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <radialGradient id="db-glow" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Base 3D Platform */}
          <rect x="2" y="3" width="28" height="26" rx="8" fill="url(#db-base)" />
          <rect x="2" y="3" width="28" height="26" rx="8" fill="url(#db-glow)" />
          <rect x="2.5" y="3.5" width="27" height="25" rx="7.5" stroke="#38bdf8" strokeOpacity="0.4" />
          {/* 3D Pillars */}
          <rect x="6" y="16" width="5" height="9" rx="2" fill="url(#db-bar1)" />
          <rect x="13.5" y="10" width="5" height="15" rx="2" fill="url(#db-bar2)" />
          <rect x="21" y="7" width="5" height="18" rx="2" fill="url(#db-bar3)" />
          {/* Floating line curve */}
          <path d="M8.5 14L16 8.5L23.5 5.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="23.5" cy="5.5" r="2" fill="#ffffff" />
        </svg>
      );

    case 'quotes':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="qt-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#083344" />
            </linearGradient>
            <linearGradient id="qt-coin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          <rect x="4" y="3" width="24" height="26" rx="6" fill="url(#qt-body)" />
          <rect x="4.5" y="3.5" width="23" height="25" rx="5.5" stroke="#38bdf8" strokeOpacity="0.4" />
          {/* Sheet rows */}
          <rect x="8" y="8" width="10" height="2" rx="1" fill="#38bdf8" fillOpacity="0.8" />
          <rect x="8" y="13" width="16" height="2" rx="1" fill="#ffffff" fillOpacity="0.7" />
          <rect x="8" y="18" width="12" height="2" rx="1" fill="#ffffff" fillOpacity="0.5" />
          {/* 3D Coin Badge */}
          <circle cx="22" cy="22" r="6" fill="url(#qt-coin)" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M22 19V25M20 20.5C20 19.7 21 19.5 22 19.5C23.2 19.5 24 20 24 21C24 22.5 20 22 20 23.5C20 24.5 21 24.8 22 24.8C23.5 24.8 24 24.2 24 23.5" stroke="#713f12" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case 'proposals':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="prp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <linearGradient id="prp-badge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <rect x="4" y="3" width="24" height="26" rx="6" fill="url(#prp-bg)" />
          <rect x="4.5" y="3.5" width="23" height="25" rx="5.5" stroke="#6ee7b7" strokeOpacity="0.4" />
          {/* Document Content */}
          <rect x="8" y="8" width="11" height="2.5" rx="1" fill="#ffffff" />
          <rect x="8" y="13.5" width="16" height="2" rx="1" fill="#ffffff" fillOpacity="0.6" />
          <rect x="8" y="18" width="13" height="2" rx="1" fill="#ffffff" fillOpacity="0.6" />
          {/* 3D Wax Seal Badge */}
          <circle cx="21.5" cy="21.5" r="5.5" fill="url(#prp-badge)" stroke="#ffffff" strokeWidth="1" />
          <path d="M19.5 21.5L21 23L23.5 20.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'generated-proposals':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="gp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
          </defs>
          <rect x="3" y="4" width="26" height="24" rx="6" fill="url(#gp-bg)" />
          <rect x="3.5" y="4.5" width="25" height="23" rx="5.5" stroke="#38bdf8" strokeOpacity="0.4" />
          {/* Down Arrow Tube */}
          <path d="M16 9V19M16 19L12 15M16 19L20 15" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="9" y="21" width="14" height="2" rx="1" fill="#ffffff" />
        </svg>
      );

    case 'distributors':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="dist-box" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
          </defs>
          <rect x="4" y="5" width="24" height="22" rx="6" fill="url(#dist-box)" />
          <rect x="4.5" y="5.5" width="23" height="21" rx="5.5" stroke="#fdba74" strokeOpacity="0.4" />
          {/* 3D Cargo Details */}
          <path d="M4 11H28M16 11V27" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />
          <circle cx="12" cy="18" r="1.5" fill="#ffffff" />
          <circle cx="20" cy="18" r="1.5" fill="#ffffff" />
        </svg>
      );

    case 'suppliers':
    case 'suppliers-register':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="sup-base" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#sup-base)" />
          <rect x="4.5" y="4.5" width="23" height="23" rx="5.5" stroke="#c4b5fd" strokeOpacity="0.4" />
          {/* Headquarters Windows */}
          <rect x="8" y="8" width="4" height="4" rx="1" fill="#ffffff" fillOpacity="0.8" />
          <rect x="14" y="8" width="4" height="4" rx="1" fill="#ffffff" fillOpacity="0.8" />
          <rect x="20" y="8" width="4" height="4" rx="1" fill="#ffffff" fillOpacity="0.8" />
          <rect x="8" y="14" width="4" height="4" rx="1" fill="#ffffff" fillOpacity="0.8" />
          <rect x="14" y="14" width="4" height="4" rx="1" fill="#ffffff" fillOpacity="0.8" />
          <rect x="20" y="14" width="4" height="4" rx="1" fill="#ffffff" fillOpacity="0.8" />
          <rect x="13" y="20" width="6" height="8" rx="1" fill="#c4b5fd" />
        </svg>
      );

    case 'ro-management':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="ro-shield" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#083344" />
            </linearGradient>
          </defs>
          <path
            d="M16 3L26 7.5V15C26 21.5 21.7 26.5 16 29C10.3 26.5 6 21.5 6 15V7.5L16 3Z"
            fill="url(#ro-shield)"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          <path d="M12 15.5L15 18.5L20.5 13" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'ro-charts':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="roc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#115e59" />
            </linearGradient>
          </defs>
          <rect x="3" y="4" width="26" height="24" rx="6" fill="url(#roc-bg)" />
          <path d="M8 22L13 16L18 19L24 10" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="10" r="2" fill="#ffffff" />
        </svg>
      );

    case 'training-management':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="trn-cup" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="24" height="24" rx="6" fill="#1e293b" stroke="#facc15" strokeOpacity="0.4" />
          <path d="M11 9H21V15C21 17.8 18.8 20 16 20C13.2 20 11 17.8 11 15V9Z" fill="url(#trn-cup)" />
          <path d="M16 20V24M12 24H20" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
          <path d="M11 11H8C6.9 11 6 11.9 6 13C6 14.1 6.9 15 8 15H11" stroke="#facc15" strokeWidth="1.5" />
          <path d="M21 11H24C25.1 11 26 11.9 26 13C26 14.1 25.1 15 24 15H21" stroke="#facc15" strokeWidth="1.5" />
        </svg>
      );

    case 'pricing':
    case 'calculator-ti-vls':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="calc-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
          </defs>
          <rect x="5" y="3" width="22" height="26" rx="6" fill="url(#calc-body)" />
          <rect x="5.5" y="3.5" width="21" height="25" rx="5.5" stroke="#38bdf8" strokeOpacity="0.5" />
          {/* Screen */}
          <rect x="8" y="7" width="16" height="5" rx="2" fill="#0f172a" />
          <rect x="18" y="8.5" width="4" height="2" rx="0.5" fill="#38bdf8" />
          {/* Buttons */}
          <circle cx="10" cy="16" r="1.5" fill="#38bdf8" />
          <circle cx="16" cy="16" r="1.5" fill="#38bdf8" />
          <circle cx="22" cy="16" r="1.5" fill="#38bdf8" />
          <circle cx="10" cy="21" r="1.5" fill="#ffffff" fillOpacity="0.7" />
          <circle cx="16" cy="21" r="1.5" fill="#ffffff" fillOpacity="0.7" />
          <circle cx="22" cy="21" r="1.5" fill="#f59e0b" />
        </svg>
      );

    case 'calculator-noc':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="noc-globe" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="12" fill="url(#noc-globe)" stroke="#38bdf8" strokeWidth="1.5" />
          <ellipse cx="16" cy="16" rx="12" ry="4.5" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
          <line x1="16" y1="4" x2="16" y2="28" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
          {/* Radar Blip */}
          <circle cx="20" cy="12" r="2" fill="#38bdf8" />
          <circle cx="20" cy="12" r="4" stroke="#38bdf8" strokeOpacity="0.7" strokeWidth="0.8" />
        </svg>
      );

    case 'calculator-servicedesk-advanced':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="sd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#3730a3" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#sd-bg)" />
          {/* Headset 3D */}
          <path d="M10 16C10 12.7 12.7 10 16 10C19.3 10 22 12.7 22 16V19" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <rect x="8" y="15" width="4" height="6" rx="2" fill="#a5b4fc" />
          <rect x="20" y="15" width="4" height="6" rx="2" fill="#a5b4fc" />
          <path d="M22 19C22 21 19 22 17 22" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'calculator-printer':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="prn-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#831843" />
            </linearGradient>
          </defs>
          <rect x="4" y="11" width="24" height="14" rx="4" fill="url(#prn-bg)" />
          {/* Paper tray top */}
          <path d="M9 11V6C9 5 10 4 11 4H21C22 4 23 5 23 6V11" fill="#fbcfe8" />
          {/* Printed paper bottom */}
          <path d="M9 20V27C9 27.5 10 28 11 28H21C22 28 23 27.5 23 27V20" fill="#ffffff" />
          <rect x="12" y="23" width="8" height="1.5" rx="0.5" fill="#38bdf8" />
        </svg>
      );

    case 'bids':
    case 'portal-busca':
    case 'bids-analysis':
    case 'ai-bid-analyzer':
    case 'bids-docs':
    case 'price-records':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="bid-gavel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="50%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="24" height="24" rx="6" fill="#082f49" stroke="#38bdf8" strokeOpacity="0.4" />
          {/* 3D Gavel */}
          <path d="M12 10L17 5L20 8L15 13L12 10Z" fill="url(#bid-gavel)" stroke="#fef08a" strokeWidth="0.8" />
          <path d="M15 12L7 20L9 22L17 14" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="6" y="24" width="20" height="3" rx="1.5" fill="#fef08a" />
        </svg>
      );

    case 'projects':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="prj-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
          </defs>
          <rect x="3" y="4" width="26" height="24" rx="6" fill="url(#prj-bg)" />
          {/* Kanban Columns */}
          <rect x="6" y="8" width="5.5" height="16" rx="2" fill="#ffffff" fillOpacity="0.3" />
          <rect x="13.2" y="8" width="5.5" height="11" rx="2" fill="#38bdf8" />
          <rect x="20.5" y="8" width="5.5" height="14" rx="2" fill="#22d3ee" />
        </svg>
      );

    case 'settings':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <defs>
            <linearGradient id="gear-metal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#gear-metal)" stroke="#38bdf8" strokeOpacity="0.3" />
          <circle cx="16" cy="16" r="6" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 2" />
          <circle cx="16" cy="16" r="3" fill="#38bdf8" />
        </svg>
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-110 ${className}`}
        >
          <rect x="4" y="4" width="24" height="24" rx="6" fill="#082f49" stroke="#38bdf8" strokeOpacity="0.4" />
          <circle cx="16" cy="16" r="4" fill="#38bdf8" />
        </svg>
      );
  }
}
