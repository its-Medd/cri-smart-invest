// Components/LogoTPME.jsx
// Logo SVG fidèle à l'image : carrés rouges dispersés + 1 carré vert

 function LogoTPME({ width = 44, height = 44 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Groupe principal — carrés rouges ── */}

      {/* Ligne gauche dispersée (petits) */}
      <rect x="2"  y="28" width="5"  height="5"  fill="#C1121F" opacity="0.5"/>
      <rect x="4"  y="20" width="4"  height="4"  fill="#C1121F" opacity="0.4"/>
      <rect x="8"  y="34" width="4"  height="4"  fill="#C1121F" opacity="0.5"/>
      <rect x="10" y="24" width="6"  height="6"  fill="#C1121F" opacity="0.6"/>
      <rect x="10" y="14" width="5"  height="5"  fill="#C1121F" opacity="0.45"/>

      {/* Carrés moyens centre-gauche */}
      <rect x="18" y="18" width="9"  height="9"  fill="#C1121F" opacity="0.75"/>
      <rect x="18" y="30" width="8"  height="8"  fill="#C1121F" opacity="0.7"/>
      <rect x="16" y="40" width="7"  height="7"  fill="#C1121F" opacity="0.6"/>

      {/* Carré vert central (accent) */}
      <rect x="29" y="22" width="10" height="10" fill="#1A7A4A"/>

      {/* Carrés rouges centre */}
      <rect x="29" y="34" width="11" height="11" fill="#C1121F" opacity="0.85"/>
      <rect x="28" y="10" width="8"  height="8"  fill="#C1121F" opacity="0.65"/>

      {/* Grands carrés droite */}
      <rect x="42" y="16" width="14" height="14" fill="#C1121F" opacity="0.9"/>
      <rect x="42" y="33" width="18" height="18" fill="#C1121F"/>

      {/* Carré moyen droite */}
      <rect x="58" y="16" width="10" height="10" fill="#C1121F" opacity="0.7"/>
      <rect x="30" y="46" width="8"  height="8"  fill="#C1121F" opacity="0.6"/>
    </svg>
  );
}

export default LogoTPME;