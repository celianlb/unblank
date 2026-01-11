"use client";

import { Bebas_Neue, Inter } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// ========== SVG ILLUSTRATIONS ==========

// Lignes diagonales jaunes en haut à droite
const DiagonalLines = () => (
  <svg
    width="220"
    height="240"
    viewBox="0 0 220 240"
    fill="none"
    className="absolute top-2 right-8 z-30"
  >
    <line x1="0" y1="0" x2="220" y2="240" stroke="#F5DA0E" strokeWidth="12" strokeLinecap="round" />
    <line x1="50" y1="0" x2="220" y2="180" stroke="#F5DA0E" strokeWidth="12" strokeLinecap="round" />
    <line x1="100" y1="0" x2="220" y2="120" stroke="#F5DA0E" strokeWidth="12" strokeLinecap="round" />
    <line x1="150" y1="0" x2="220" y2="60" stroke="#F5DA0E" strokeWidth="12" strokeLinecap="round" />
  </svg>
);

// Ligne zigzag à gauche du titre
const ZigZagLine = () => (
  <svg
    width="140"
    height="55"
    viewBox="0 0 140 55"
    fill="none"
    className="absolute left-4 top-[180px] z-10"
  >
    <path
      d="M0 28 L25 8 L50 28 L75 8 L100 28 L125 8 L140 20"
      stroke="#F5DA0E"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// Casque de chantier outline (entre les deux cards)
const HelmetOutline = () => (
  <svg
    width="160"
    height="140"
    viewBox="0 0 160 140"
    fill="none"
    className="absolute left-[calc(50%-80px)] top-[420px] z-20"
  >
    {/* Dome du casque */}
    <path
      d="M20 90 Q20 40 80 25 Q140 40 140 90"
      stroke="#F5DA0E"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Visière */}
    <path
      d="M8 90 L152 90"
      stroke="#F5DA0E"
      strokeWidth="5"
      strokeLinecap="round"
    />
    {/* Base */}
    <path
      d="M20 90 L20 110 Q20 125 35 125 L125 125 Q140 125 140 110 L140 90"
      stroke="#F5DA0E"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Détail du haut */}
    <ellipse cx="80" cy="50" rx="25" ry="10" stroke="#F5DA0E" strokeWidth="4" fill="none" />
  </svg>
);

// Outils croisés (marteau + clé à molette) - entre card blanche et images
const CrossedTools = () => (
  <svg
    width="100"
    height="100"
    viewBox="0 0 100 100"
    fill="none"
    className="absolute right-[320px] top-[480px] z-20"
  >
    {/* Clé à molette (grise) */}
    <path
      d="M15 85 L60 40"
      stroke="#9CA3AF"
      strokeWidth="10"
      strokeLinecap="round"
    />
    <circle cx="68" cy="32" r="14" stroke="#9CA3AF" strokeWidth="5" fill="none" />
    <path
      d="M80 20 L90 10"
      stroke="#9CA3AF"
      strokeWidth="5"
      strokeLinecap="round"
    />

    {/* Marteau (jaune) */}
    <path
      d="M85 85 L40 40"
      stroke="#F5DA0E"
      strokeWidth="10"
      strokeLinecap="round"
    />
    <rect
      x="20"
      y="12"
      width="35"
      height="16"
      rx="3"
      fill="#F5DA0E"
      transform="rotate(45 37 20)"
    />
  </svg>
);

// Grande courbe connectrice jaune (traverse la page en sinusoïde)
const WavyConnector = () => (
  <svg
    width="100%"
    height="500"
    viewBox="0 0 1920 500"
    fill="none"
    className="absolute left-0 top-[220px] pointer-events-none z-0"
    preserveAspectRatio="none"
  >
    <path
      d="M-50 300
         Q150 200 300 280
         Q450 360 600 240
         Q750 120 900 200
         Q1050 280 1200 160
         Q1350 40 1500 120
         Q1650 200 1800 80
         L1970 40"
      stroke="#F5DA0E"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// Ovale autour de "BTP" - style hand-drawn
const BTOvalCircle = () => (
  <svg
    width="170"
    height="100"
    viewBox="0 0 170 100"
    fill="none"
    className="absolute"
    style={{ top: "-18px", left: "-20px", zIndex: -1 }}
  >
    <ellipse
      cx="85"
      cy="50"
      rx="80"
      ry="42"
      stroke="#F5DA0E"
      strokeWidth="3.5"
      fill="none"
      transform="rotate(-3 85 50)"
    />
  </svg>
);

// Soulignement ondulé pour "PROPOSER"
const UnderlineWavy = () => (
  <svg
    width="340"
    height="30"
    viewBox="0 0 340 30"
    fill="none"
    className="absolute"
    style={{ bottom: "-12px", left: "-15px" }}
  >
    <path
      d="M0 15 Q42 5 85 15 Q128 25 170 15 Q213 5 255 15 Q298 25 340 15"
      stroke="#F5DA0E"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// Icône check cercle
const CheckIcon = ({ color = "#4AA97D" }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <path d="M7 12 L10 15 L17 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Casque en arrière-plan de la card verte
const HelmetBackground = () => (
  <svg
    width="220"
    height="200"
    viewBox="0 0 220 200"
    fill="none"
    className="absolute right-[-20px] bottom-[-30px] opacity-25"
  >
    <path
      d="M30 130 Q30 60 110 45 Q190 60 190 130"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="6"
      fill="none"
    />
    <path
      d="M15 130 L205 130"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <path
      d="M30 130 L30 155 Q30 175 50 175 L170 175 Q190 175 190 155 L190 130"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="6"
      fill="none"
    />
  </svg>
);

// Outils en arrière-plan de la card blanche
const ToolsBackground = () => (
  <svg
    width="140"
    height="140"
    viewBox="0 0 140 140"
    fill="none"
    className="absolute right-4 bottom-4 opacity-30"
  >
    {/* Clé */}
    <path
      d="M20 120 L80 60"
      stroke="#9CA3AF"
      strokeWidth="10"
      strokeLinecap="round"
    />
    <circle cx="90" cy="50" r="18" stroke="#9CA3AF" strokeWidth="5" fill="none" />

    {/* Marteau */}
    <path
      d="M120 120 L60 60"
      stroke="#F5DA0E"
      strokeWidth="10"
      strokeLinecap="round"
    />
    <rect
      x="35"
      y="25"
      width="40"
      height="18"
      rx="3"
      fill="#F5DA0E"
      transform="rotate(45 55 34)"
    />
  </svg>
);

// Forme décorative bas gauche - courbe élégante
const BottomLeftDecoration = () => (
  <svg
    width="500"
    height="300"
    viewBox="0 0 500 300"
    fill="none"
    className="absolute bottom-0 left-0 z-0"
  >
    <path
      d="M0 300 L0 180 Q80 140 160 180 Q240 220 280 140 Q320 60 280 0"
      stroke="#F5DA0E"
      strokeWidth="12"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// Petites lignes décoratives près des images (à droite de l'image rect)
const SmallDiagonals = () => (
  <svg
    width="100"
    height="160"
    viewBox="0 0 100 160"
    fill="none"
    className="absolute right-[-60px] top-[60px] z-40"
  >
    <line x1="0" y1="30" x2="80" y2="130" stroke="#F5DA0E" strokeWidth="10" strokeLinecap="round" />
    <line x1="25" y1="0" x2="100" y2="100" stroke="#F5DA0E" strokeWidth="10" strokeLinecap="round" />
    <line x1="50" y1="60" x2="100" y2="140" stroke="#F5DA0E" strokeWidth="10" strokeLinecap="round" />
  </svg>
);

// Accent rectangle jaune (derrière l'image circulaire)
const YellowAccent = () => (
  <svg
    width="60"
    height="140"
    viewBox="0 0 60 140"
    fill="none"
    className="absolute right-[40px] bottom-[30px] z-0"
  >
    <rect x="10" y="0" width="40" height="140" fill="#F5DA0E" rx="6" />
  </svg>
);

export default function AgoraBTPPage() {
  return (
    <div
      className={`${bebasNeue.variable} ${inter.variable} min-h-screen relative overflow-hidden`}
      style={{ backgroundColor: "#2D69FF" }}
    >
      {/* ========== BACKGROUND DECORATIONS ========== */}
      <DiagonalLines />
      <ZigZagLine />
      <WavyConnector />
      <BottomLeftDecoration />
      <HelmetOutline />
      <CrossedTools />

      {/* ========== NAVBAR ========== */}
      <nav className="relative z-50 flex items-center justify-between px-16 py-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {/* Shield Icon */}
          <svg width="45" height="55" viewBox="0 0 45 55" fill="none">
            <path
              d="M22.5 0 L45 8 L45 32 Q45 50 22.5 55 Q0 50 0 32 L0 8 Z"
              fill="#000000"
            />
            {/* Colonnes */}
            <rect x="8" y="16" width="5" height="30" fill="#F5DA0E" />
            <rect x="20" y="16" width="5" height="30" fill="#F5DA0E" />
            <rect x="32" y="16" width="5" height="30" fill="#F5DA0E" />
            {/* Barre horizontale */}
            <rect x="6" y="12" width="33" height="4" fill="#F5DA0E" />
          </svg>
          <div className="flex flex-col ml-1">
            <span
              className="text-[11px] text-white tracking-[0.25em] font-semibold leading-none"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              AGORA BTP
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-10">
          {["Trouver un chantier", "Trouver un pro", "Tarifs", "Qui sommes-nous ?", "FAQ"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-white text-[15px] font-medium hover:opacity-80 transition-opacity"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <button
            className="px-7 py-2.5 rounded-full text-[14px] font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: "#F5DA0E", color: "#000", fontFamily: "var(--font-inter)" }}
          >
            S&apos;inscrire
          </button>
          <button
            className="px-7 py-2.5 rounded-full text-[14px] font-semibold border-2 border-white text-white hover:bg-white hover:text-[#2D69FF] transition-all"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Se connecter
          </button>
        </div>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section className="relative z-10 px-16 pt-8 pb-20">
        {/* Main Title */}
        <div className="text-center mb-14 max-w-[1100px] mx-auto">
          <h1
            className="text-white leading-[1.05] tracking-[0.02em]"
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(3rem, 6vw, 5.8rem)"
            }}
          >
            LA PLACE CENTRALE DU{" "}
            <span className="relative inline-block" style={{ color: "#F5DA0E" }}>
              BTP
              <BTOvalCircle />
            </span>{" "}
            POUR
            <br />
            TROUVER OU{" "}
            <span className="relative inline-block" style={{ color: "#F5DA0E" }}>
              PROPOSER
              <UnderlineWavy />
            </span>{" "}
            DES CHANTIERS
          </h1>
        </div>

        {/* Cards Container */}
        <div className="flex justify-center items-start gap-6 relative max-w-[1200px] mx-auto">

          {/* ===== LEFT CARD - GREEN ===== */}
          <div
            className="relative rounded-[28px] p-8 w-[500px] min-h-[280px] overflow-hidden shadow-xl"
            style={{ backgroundColor: "#4AA97D" }}
          >
            <HelmetBackground />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-7">
                <h2
                  className="text-white leading-[1.1]"
                  style={{ fontFamily: "var(--font-bebas)", fontSize: "2rem", letterSpacing: "0.02em" }}
                >
                  JE CHERCHE UN
                  <br />
                  SOUS-TRAITANT
                </h2>
                <button
                  className="px-5 py-2 rounded-full text-[13px] font-bold border-[2.5px] transition-all hover:bg-[#F5DA0E] hover:text-black"
                  style={{
                    borderColor: "#F5DA0E",
                    color: "#F5DA0E",
                    fontFamily: "var(--font-bebas)",
                    letterSpacing: "0.08em"
                  }}
                >
                  INSCRIPTION
                </button>
              </div>

              <ul className="space-y-3.5">
                <li className="flex items-start gap-3 text-white" style={{ fontFamily: "var(--font-inter)" }}>
                  <CheckIcon color="#F5DA0E" />
                  <span className="text-[14px] leading-snug">
                    <strong className="font-semibold">Accès gratuit et sans engagement</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3 text-white" style={{ fontFamily: "var(--font-inter)" }}>
                  <CheckIcon color="#F5DA0E" />
                  <span className="text-[14px] leading-snug">
                    <strong className="font-semibold">Recherche rapide :</strong> par métier, localisation et disponibilité
                  </span>
                </li>
                <li className="flex items-start gap-3 text-white" style={{ fontFamily: "var(--font-inter)" }}>
                  <CheckIcon color="#F5DA0E" />
                  <span className="text-[14px] leading-snug">
                    <strong className="font-semibold">Profils complets :</strong> effectif, zones d&apos;intervention, expériences
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* ===== RIGHT CARD - WHITE ===== */}
          <div
            className="relative rounded-[28px] p-8 w-[500px] min-h-[280px] overflow-hidden shadow-xl border-[4px]"
            style={{ backgroundColor: "#FFFFFF", borderColor: "#F5DA0E" }}
          >
            <ToolsBackground />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-7">
                <h2
                  className="leading-[1.1]"
                  style={{ fontFamily: "var(--font-bebas)", fontSize: "2rem", color: "#2D69FF", letterSpacing: "0.02em" }}
                >
                  JE PROPOSE MES
                  <br />
                  SERVICES
                </h2>
                <button
                  className="px-5 py-2 rounded-full text-[13px] font-bold border-[2.5px] transition-all hover:opacity-85"
                  style={{
                    borderColor: "#2D69FF",
                    backgroundColor: "#2D69FF",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-bebas)",
                    letterSpacing: "0.08em"
                  }}
                >
                  INSCRIPTION
                </button>
              </div>

              <ul className="space-y-3.5">
                <li className="flex items-start gap-3" style={{ fontFamily: "var(--font-inter)", color: "#1F2937" }}>
                  <CheckIcon color="#F5DA0E" />
                  <span className="text-[14px] leading-snug">
                    <strong className="font-semibold">Visibilité assurée</strong> auprès des décideurs du BTP
                  </span>
                </li>
                <li className="flex items-start gap-3" style={{ fontFamily: "var(--font-inter)", color: "#1F2937" }}>
                  <CheckIcon color="#F5DA0E" />
                  <span className="text-[14px] leading-snug">
                    <strong className="font-semibold">Profil complet :</strong> effectif, spécialités, références, zones
                  </span>
                </li>
                <li className="flex items-start gap-3" style={{ fontFamily: "var(--font-inter)", color: "#1F2937" }}>
                  <CheckIcon color="#F5DA0E" />
                  <span className="text-[14px] leading-snug">
                    <strong className="font-semibold">Demandes directes</strong> de chantiers adaptés
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* ===== RIGHT SIDE IMAGES (WHITE PLACEHOLDERS) ===== */}

          {/* Top right rectangular image */}
          <div className="absolute right-[-140px] top-[-160px]">
            <div
              className="w-[300px] h-[380px] rounded-[24px] bg-white shadow-2xl"
              style={{ transform: "rotate(4deg)" }}
            />
            <SmallDiagonals />
          </div>

          {/* Bottom right circular image */}
          <div className="absolute right-[-60px] bottom-[-100px]">
            <YellowAccent />
            <div
              className="w-[220px] h-[220px] rounded-full bg-white shadow-2xl relative z-10"
              style={{ border: "6px solid #F5DA0E" }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
