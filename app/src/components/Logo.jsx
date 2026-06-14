import { useTheme } from 'styled-components';

export default function Logo({ size = 32, color, standColor }) {
  const theme = useTheme();
  const headColor  = color      ?? theme.accent;
  const poleColor  = standColor ?? theme.textMuted;
  const w = size * (36 / 52);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={w}
      height={size}
      viewBox="0 0 36 52"
      aria-label="My Tight Five"
    >
      <defs>
        <clipPath id="mtf-head">
          <ellipse cx="18" cy="7" rx="6" ry="7"/>
        </clipPath>
      </defs>

      {/* Stand */}
      <rect x="17.25" y="15" width="1.5" height="28" rx="0.75" fill={poleColor}/>
      <path d="M7 44 Q18 49 29 44" stroke={poleColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="7"  cy="44" rx="3.5" ry="2" fill={poleColor}/>
      <ellipse cx="29" cy="44" rx="3.5" ry="2" fill={poleColor}/>
      <ellipse cx="18" cy="49" rx="3.5" ry="2" fill={poleColor}/>

      {/* Capsule */}
      <ellipse cx="18" cy="7" rx="6" ry="7" fill={headColor}/>
      <ellipse cx="18" cy="6" rx="4.5" ry="5"   fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.9" clipPath="url(#mtf-head)"/>
      <ellipse cx="18" cy="6" rx="2.8" ry="3.1" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.9" clipPath="url(#mtf-head)"/>
      <ellipse cx="18" cy="6" rx="1.2" ry="1.4" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.9" clipPath="url(#mtf-head)"/>
      <circle cx="18" cy="6" r="0.5" fill="rgba(0,0,0,0.22)"/>

      {/* Collar */}
      <rect x="13.5" y="13" width="9" height="2" rx="1" fill={headColor}/>
    </svg>
  );
}
