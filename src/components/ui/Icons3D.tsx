import React from "react";

export interface Icon3DProps {
  className?: string;
  size?: number;
}

// 1. 3D Rocket - High-contrast Volumetric Rocket with Fiery Blast & Glossy Fuselage
export function Icon3DRocket({ className = "", size = 32 }: Icon3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-md select-none ${className}`}
    >
      <defs>
        <linearGradient id="rocketBodyGrad" x1="20" y1="12" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="0.3" stopColor="#3B82F6" />
          <stop offset="0.7" stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id="rocketNoseGrad" x1="42" y1="8" x2="56" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF4B4B" />
          <stop offset="0.6" stopColor="#E11D48" />
          <stop offset="1" stopColor="#9F1239" />
        </linearGradient>
        <linearGradient id="rocketFinLeftGrad" x1="12" y1="32" x2="24" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB7185" />
          <stop offset="1" stopColor="#BE123C" />
        </linearGradient>
        <linearGradient id="rocketFinRightGrad" x1="32" y1="44" x2="48" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB7185" />
          <stop offset="1" stopColor="#BE123C" />
        </linearGradient>
        <linearGradient id="rocketExhaustFlame1" x1="20" y1="42" x2="6" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="0.3" stopColor="#F59E0B" />
          <stop offset="0.7" stopColor="#EF4444" />
          <stop offset="1" stopColor="#7F1D1D" />
        </linearGradient>
        <linearGradient id="rocketExhaustFlame2" x1="22" y1="44" x2="10" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#FDE047" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="rocketPortholeRim" x1="30" y1="22" x2="42" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E2E8F0" />
          <stop offset="1" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="rocketPortholeGlass" x1="32" y1="24" x2="40" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
        <radialGradient id="rocketStarSparkle" cx="50%" cy="50%" r="50%">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.4" stopColor="#BAE6FD" />
          <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Main Fire Blast Exhaust */}
      <path
        d="M24 40L10 52C8 54 6 59 8 60C10 61 14 59 16 57L28 45C26 43 24 41 24 40Z"
        fill="url(#rocketExhaustFlame1)"
      />
      <path
        d="M23 42L14 50C13 51 11 55 12 56C13 57 16 55 17 54L26 46C25 44 24 43 23 42Z"
        fill="url(#rocketExhaustFlame2)"
      />
      <circle cx="11" cy="57" r="3.5" fill="#FEF08A" opacity="0.9" />
      <circle cx="18" cy="59" r="2" fill="#F97316" opacity="0.8" />

      {/* Left 3D Fin */}
      <path
        d="M18 28L8 38C6.5 39.5 7 43 10 45L20 46L23 37L18 28Z"
        fill="url(#rocketFinLeftGrad)"
        stroke="#9F1239"
        strokeWidth="1"
      />
      {/* Left Fin Highlight Bevel */}
      <path d="M18 28L10 37L13 43L21 44L18 28Z" fill="#FDA4AF" opacity="0.4" />

      {/* Right 3D Fin */}
      <path
        d="M37 18L47 8C48.5 6.5 52 7 54 10L55 20L46 23L37 18Z"
        fill="url(#rocketFinRightGrad)"
        stroke="#9F1239"
        strokeWidth="1"
      />
      {/* Right Fin Highlight Bevel */}
      <path d="M37 18L46 10L52 13L53 21L37 18Z" fill="#FDA4AF" opacity="0.4" />

      {/* Main Fuselage Body */}
      <path
        d="M52 12C46 6 32 10 22 20C15 27 13 38 20 44C26 51 37 49 44 42C54 32 58 18 52 12Z"
        fill="url(#rocketBodyGrad)"
        stroke="#1E3A8A"
        strokeWidth="1.2"
      />

      {/* Specular Highlight Strip along fuselage */}
      <path
        d="M50 14C45 9 34 13 25 21C21 25 18 31 19 35C20 33 24 25 30 20C38 14 47 12 50 14Z"
        fill="#FFFFFF"
        opacity="0.45"
      />

      {/* Nose Cone */}
      <path
        d="M52 12C49 9 42 11 36 15C42 17 47 22 49 28C53 22 55 15 52 12Z"
        fill="url(#rocketNoseGrad)"
      />
      <path
        d="M52 12C50 10 45 11 41 14C44 15 47 18 49 22C52 18 54 14 52 12Z"
        fill="#FECDD3"
        opacity="0.5"
      />

      {/* 3D Glass Porthole */}
      <circle cx="35" cy="29" r="7" fill="url(#rocketPortholeRim)" stroke="#475569" strokeWidth="1" />
      <circle cx="35" cy="29" r="5" fill="url(#rocketPortholeGlass)" />
      <ellipse cx="33.5" cy="27.5" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.9" />

      {/* Sparkle Flares */}
      <path d="M57 6L58.5 9.5L62 11L58.5 12.5L57 16L55.5 12.5L52 11L55.5 9.5L57 6Z" fill="#FDE047" />
    </svg>
  );
}

// 2. 3D Lightning - Glossy Golden Crystal Bolt with Faceted Bevels
export function Icon3DLightning({ className = "", size = 32 }: Icon3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-md select-none ${className}`}
    >
      <defs>
        <linearGradient id="boltFront" x1="36" y1="4" x2="16" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFBEB" />
          <stop offset="0.2" stopColor="#FDE047" />
          <stop offset="0.6" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="boltBevel" x1="40" y1="4" x2="24" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.4" stopColor="#FEF08A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="boltShadow" x1="30" y1="10" x2="10" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B45309" />
          <stop offset="1" stopColor="#78350F" />
        </linearGradient>
      </defs>

      {/* 3D Drop Extrusion */}
      <path
        d="M37 6L16 34H31L22 60L50 28H34L37 6Z"
        fill="url(#boltShadow)"
        transform="translate(2, 2)"
        opacity="0.5"
      />

      {/* Main Bolt Body */}
      <path
        d="M36 4L16 33H31L23 58L49 28H33L36 4Z"
        fill="url(#boltFront)"
        stroke="#B45309"
        strokeWidth="1.2"
      />

      {/* Top/Left Chamfer Bevel Highlight */}
      <path
        d="M36 4L16 33H22L36 7L36 4Z"
        fill="url(#boltBevel)"
        opacity="0.8"
      />
      <path
        d="M31 33L23 58L27 50L35 33H31Z"
        fill="url(#boltBevel)"
        opacity="0.8"
      />

      {/* Specular Glint */}
      <circle cx="34" cy="9" r="2.5" fill="#FFFFFF" />
      <path d="M52 14L53.5 17.5L57 19L53.5 20.5L52 24L50.5 20.5L47 19L50.5 17.5L52 14Z" fill="#FDE047" />
    </svg>
  );
}

// 3. 3D Flame - Volumetric 4-Layer Fire with Glossy Highlights
export function Icon3DFlame({ className = "", size = 32 }: Icon3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-md select-none ${className}`}
    >
      <defs>
        <radialGradient id="flameOuterGrad" cx="32" cy="40" r="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F43F5E" />
          <stop offset="0.5" stopColor="#E11D48" />
          <stop offset="1" stopColor="#881337" />
        </radialGradient>
        <radialGradient id="flameMidGrad" cx="32" cy="42" r="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#F97316" />
          <stop offset="1" stopColor="#EA580C" />
        </radialGradient>
        <radialGradient id="flameCoreGrad" cx="32" cy="46" r="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.4" stopColor="#FEF08A" />
          <stop offset="1" stopColor="#FBBF24" />
        </radialGradient>
      </defs>

      {/* Outer 3D Shell */}
      <path
        d="M32 6C32 6 46 20 46 36C46 48 39.5 58 32 58C24.5 58 18 48 18 36C18 24 26 16 32 6Z"
        fill="url(#flameOuterGrad)"
        stroke="#9F1239"
        strokeWidth="1"
      />

      {/* Outer Specular Sheen */}
      <path
        d="M32 9C27 18 21 26 21 36C21 44 24 50 28 54C24 50 23 42 24 35C25 28 29 20 32 9Z"
        fill="#FDA4AF"
        opacity="0.4"
      />

      {/* Mid Flame Layer */}
      <path
        d="M32 20C32 20 41 30 41 41C41 49 37 56 32 56C27 56 23 49 23 41C23 32 28 26 32 20Z"
        fill="url(#flameMidGrad)"
      />

      {/* Inner White-Hot Core */}
      <path
        d="M32 34C32 34 37 40 37 46C37 51 34.5 54 32 54C29.5 54 27 51 27 46C27 40 30 36 32 34Z"
        fill="url(#flameCoreGrad)"
      />
    </svg>
  );
}

// 4. 3D Shield - Emerald & Gold Security Crest with 3D Embossed Checkmark
export function Icon3DShield({ className = "", size = 32 }: Icon3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-md select-none ${className}`}
    >
      <defs>
        <linearGradient id="shieldPlate" x1="32" y1="8" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="0.4" stopColor="#10B981" />
          <stop offset="0.9" stopColor="#059669" />
          <stop offset="1" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id="shieldGoldRim" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="0.3" stopColor="#F59E0B" />
          <stop offset="0.7" stopColor="#B45309" />
          <stop offset="1" stopColor="#78350F" />
        </linearGradient>
      </defs>

      {/* Golden Metallic Rim */}
      <path
        d="M32 7L52 15V32C52 44 43 54 32 58C21 54 12 44 12 32V15L32 7Z"
        fill="url(#shieldGoldRim)"
        stroke="#78350F"
        strokeWidth="1.5"
      />

      {/* Inner Emerald Facet Plate */}
      <path
        d="M32 11L48 18V32C48 42 40.5 50.5 32 54C23.5 50.5 16 42 16 32V18L32 11Z"
        fill="url(#shieldPlate)"
      />

      {/* Left Glass Specular Bevel */}
      <path
        d="M32 13L18 19V32C18 40.5 24 48 32 51.5V13Z"
        fill="#FFFFFF"
        opacity="0.22"
      />

      {/* 3D Checkmark with Drop Shadow */}
      <path
        d="M23 32L29 38L42 24"
        stroke="#064E3B"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
        transform="translate(1, 2)"
      />
      <path
        d="M23 32L29 38L42 24"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 5. 3D Cursor - Isometric Glass Arrow with Radar Ripple Waves
export function Icon3DCursor({ className = "", size = 32 }: Icon3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-md select-none ${className}`}
    >
      <defs>
        <linearGradient id="cursorBodyGrad" x1="16" y1="12" x2="44" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A5B4FC" />
          <stop offset="0.3" stopColor="#6366F1" />
          <stop offset="0.8" stopColor="#4338CA" />
          <stop offset="1" stopColor="#312E81" />
        </linearGradient>
        <linearGradient id="cursorRimGrad" x1="16" y1="12" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0E7FF" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>

      {/* Radar Ripple Waves */}
      <circle cx="22" cy="18" r="10" stroke="#818CF8" strokeWidth="1.5" opacity="0.5" strokeDasharray="3 3" />
      <circle cx="22" cy="18" r="16" stroke="#818CF8" strokeWidth="1.2" opacity="0.3" />

      {/* 3D Cursor Shadow */}
      <path
        d="M22 14V46L30 37L39 52L46 48L37 33L48 30L22 14Z"
        fill="#1E1B4B"
        opacity="0.35"
        transform="translate(2.5, 3)"
      />

      {/* Main 3D Arrow */}
      <path
        d="M22 14V46L30 37L39 52L46 48L37 33L48 30L22 14Z"
        fill="url(#cursorBodyGrad)"
        stroke="url(#cursorRimGrad)"
        strokeWidth="2"
      />

      {/* Specular Highlight Strip */}
      <path
        d="M24 18V41L29 35L24 18Z"
        fill="#FFFFFF"
        opacity="0.45"
      />
    </svg>
  );
}

// 6. 3D Server - Isometric Blade Rack with Status LEDs
export function Icon3DServer({ className = "", size = 32 }: Icon3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-md select-none ${className}`}
    >
      <defs>
        <linearGradient id="serverBay1" x1="10" y1="10" x2="54" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="0.6" stopColor="#0284C7" />
          <stop offset="1" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="serverBay2" x1="10" y1="34" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284C7" />
          <stop offset="0.6" stopColor="#0369A1" />
          <stop offset="1" stopColor="#075985" />
        </linearGradient>
      </defs>

      {/* Unit 1 */}
      <rect x="10" y="12" width="44" height="17" rx="5" fill="url(#serverBay1)" stroke="#0C4A6E" strokeWidth="1.5" />
      <rect x="11" y="13" width="42" height="3" rx="1.5" fill="#BAE6FD" opacity="0.6" />
      <circle cx="18" cy="20.5" r="3" fill="#34D399" />
      <circle cx="26" cy="20.5" r="3" fill="#FEF08A" />
      <rect x="36" y="17.5" width="12" height="6" rx="2.5" fill="#FFFFFF" opacity="0.7" />

      {/* Unit 2 */}
      <rect x="10" y="35" width="44" height="17" rx="5" fill="url(#serverBay2)" stroke="#0C4A6E" strokeWidth="1.5" />
      <rect x="11" y="36" width="42" height="3" rx="1.5" fill="#BAE6FD" opacity="0.5" />
      <circle cx="18" cy="43.5" r="3" fill="#34D399" />
      <circle cx="26" cy="43.5" r="3" fill="#38BDF8" />
      <rect x="36" y="40.5" width="12" height="6" rx="2.5" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}

// 7. 3D Lock - Sapphire & Chrome Padlock with Volumetric Shackle
export function Icon3DLock({ className = "", size = 32 }: Icon3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-md select-none ${className}`}
    >
      <defs>
        <linearGradient id="lockShackleGrad" x1="22" y1="8" x2="42" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E2E8F0" />
          <stop offset="0.5" stopColor="#94A3B8" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="lockBodyGrad" x1="14" y1="26" x2="50" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="0.4" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>

      {/* Shackle */}
      <path
        d="M22 28V18C22 12.5 26.5 8 32 8C37.5 8 42 12.5 42 18V28"
        stroke="url(#lockShackleGrad)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Lock Body */}
      <rect x="14" y="26" width="36" height="30" rx="8" fill="url(#lockBodyGrad)" stroke="#1E3A8A" strokeWidth="1.5" />
      
      {/* Specular Highlight Bar */}
      <path d="M17 29H47C49 29 50 30 50 32C50 32 40 33 32 33C24 33 14 32 14 32C14 30 15 29 17 29Z" fill="#BFDBFE" opacity="0.6" />

      {/* Keyhole */}
      <circle cx="32" cy="39" r="3.5" fill="#FFFFFF" />
      <path d="M30.5 39L29.5 48H34.5L33.5 39H30.5Z" fill="#FFFFFF" />
    </svg>
  );
}

// 8. 3D Users - Glossy Purple Avatar Spheres
export function Icon3DUsers({ className = "", size = 32 }: Icon3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-md select-none ${className}`}
    >
      <defs>
        <radialGradient id="avatarCenter" cx="32" cy="18" r="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E9D5FF" />
          <stop offset="0.4" stopColor="#A855F7" />
          <stop offset="1" stopColor="#6B21A8" />
        </radialGradient>
        <radialGradient id="avatarSideL" cx="18" cy="24" r="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3E8FF" />
          <stop offset="0.5" stopColor="#C084FC" />
          <stop offset="1" stopColor="#7E22CE" />
        </radialGradient>
        <radialGradient id="avatarSideR" cx="46" cy="24" r="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3E8FF" />
          <stop offset="0.5" stopColor="#C084FC" />
          <stop offset="1" stopColor="#7E22CE" />
        </radialGradient>
        <linearGradient id="userBodyCenter" x1="32" y1="36" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A855F7" />
          <stop offset="1" stopColor="#581C87" />
        </linearGradient>
      </defs>

      {/* Left Avatar */}
      <circle cx="18" cy="24" r="7" fill="url(#avatarSideL)" opacity="0.85" />
      <path d="M8 48C8 40 13 36 18 36C22 36 26 39 27 44" fill="#A855F7" opacity="0.7" />

      {/* Right Avatar */}
      <circle cx="46" cy="24" r="7" fill="url(#avatarSideR)" opacity="0.85" />
      <path d="M56 48C56 40 51 36 46 36C42 36 38 39 37 44" fill="#A855F7" opacity="0.7" />

      {/* Center Main Avatar */}
      <circle cx="32" cy="18" r="9" fill="url(#avatarCenter)" stroke="#581C87" strokeWidth="1" />
      <ellipse cx="30" cy="15" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.6" />
      <path d="M18 52C18 42 24 37 32 37C40 37 46 42 46 52H18Z" fill="url(#userBodyCenter)" stroke="#581C87" strokeWidth="1" />
    </svg>
  );
}

// 9. 3D Chart - Growth Bar Chart with Glowing Green Trend Arrow
export function Icon3DChart({ className = "", size = 32 }: Icon3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-md select-none ${className}`}
    >
      <defs>
        <linearGradient id="bar1Grad" x1="14" y1="34" x2="22" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="bar2Grad" x1="26" y1="22" x2="34" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id="bar3Grad" x1="38" y1="12" x2="46" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="trendArrow" x1="12" y1="32" x2="54" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Base Grid Platform */}
      <rect x="8" y="52" width="48" height="5" rx="2.5" fill="#334155" opacity="0.6" />

      {/* Bar 1 */}
      <rect x="14" y="34" width="8" height="18" rx="2" fill="url(#bar1Grad)" />
      <rect x="14" y="34" width="8" height="2" rx="1" fill="#BAE6FD" />

      {/* Bar 2 */}
      <rect x="26" y="24" width="8" height="28" rx="2" fill="url(#bar2Grad)" />
      <rect x="26" y="24" width="8" height="2" rx="1" fill="#C7D2FE" />

      {/* Bar 3 */}
      <rect x="38" y="14" width="8" height="38" rx="2" fill="url(#bar3Grad)" />
      <rect x="38" y="14" width="8" height="2" rx="1" fill="#A7F3D0" />

      {/* Trend Arrow */}
      <path
        d="M12 36L26 22L36 28L52 10"
        stroke="url(#trendArrow)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M44 10H52V18" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 10. 3D Sparkles - Multi-Crystal 4-Point Star Glints
export function Icon3DSparkles({ className = "", size = 32 }: Icon3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-md select-none ${className}`}
    >
      <defs>
        <radialGradient id="sparkleGrad1" cx="50%" cy="50%" r="50%">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.4" stopColor="#FDE047" />
          <stop offset="0.9" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </radialGradient>
        <radialGradient id="sparkleGrad2" cx="50%" cy="50%" r="50%">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.4" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </radialGradient>
      </defs>

      {/* Big Star */}
      <path
        d="M32 6L36.5 22.5L53 27L36.5 31.5L32 48L27.5 31.5L11 27L27.5 22.5L32 6Z"
        fill="url(#sparkleGrad1)"
        stroke="#B45309"
        strokeWidth="0.8"
      />
      <circle cx="32" cy="27" r="3" fill="#FFFFFF" />

      {/* Small Star Top-Right */}
      <path
        d="M48 38L50.5 45.5L58 48L50.5 50.5L48 58L45.5 50.5L38 48L45.5 45.5L48 38Z"
        fill="url(#sparkleGrad2)"
      />

      {/* Micro Star Bottom-Left */}
      <circle cx="16" cy="46" r="2.5" fill="#FDE047" />
    </svg>
  );
}
