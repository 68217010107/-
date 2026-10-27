import React from 'react';

export const ObecEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-20 h-24' }) => (
  <svg
    viewBox="0 0 120 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="ตราสัญลักษณ์สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน"
  >
    {/* Flame top spire */}
    <path
      d="M60 6C54 20 42 30 42 46C42 54 46 61 52 65C49 55 54 44 60 32C66 44 71 55 68 65C74 61 78 54 78 46C78 30 66 20 60 6Z"
      fill="#D97706"
      stroke="#92400E"
      strokeWidth="2"
    />
    <path
      d="M60 18C56 28 50 36 50 47C50 54 55 59 60 62C65 59 70 54 70 47C70 36 64 28 60 18Z"
      fill="#FBBF24"
    />
    {/* Outer ornate lotus halo */}
    <circle cx="60" cy="94" r="38" fill="#FEF3C7" stroke="#92400E" strokeWidth="2.5" />
    <circle cx="60" cy="94" r="31" fill="#15803D" stroke="#B45309" strokeWidth="2" />
    <circle cx="60" cy="94" r="24" fill="#FEF9C3" stroke="#92400E" strokeWidth="1.5" />
    {/* Sema Dhammachakra wheel rays */}
    <line x1="60" y1="70" x2="60" y2="118" stroke="#92400E" strokeWidth="1.8" />
    <line x1="36" y1="94" x2="84" y2="94" stroke="#92400E" strokeWidth="1.8" />
    <line x1="43" y1="77" x2="77" y2="111" stroke="#92400E" strokeWidth="1.5" />
    <line x1="77" y1="77" x2="43" y2="111" stroke="#92400E" strokeWidth="1.5" />
    <circle cx="60" cy="94" r="8" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
    {/* Ribbon pedestal */}
    <path
      d="M24 128C36 136 84 136 96 128L90 140C74 146 46 146 30 140L24 128Z"
      fill="#F59E0B"
      stroke="#92400E"
      strokeWidth="1.8"
    />
  </svg>
);

export const GarudaMemoEmblemSvg: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="ตราครุฑสำหรับบันทึกข้อความราชการ"
  >
    {/* Crown spire */}
    <path d="M60 8L54 24H66L60 8Z" fill="#1E293B" />
    <circle cx="60" cy="30" r="7" fill="#1E293B" />
    {/* Spread wings */}
    <path
      d="M60 38C45 36 26 24 12 16C14 34 22 48 36 56C24 58 16 64 12 72C26 70 38 66 47 60L42 84L52 80L60 66L68 80L78 84L73 60C82 66 94 70 108 72C104 64 96 58 84 56C98 48 106 34 108 16C94 24 75 36 60 38Z"
      fill="#0F172A"
    />
    {/* Wing feather details */}
    <path
      d="M20 28C28 36 38 42 48 45M100 28C92 36 82 42 72 45"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Torso & tail */}
    <path d="M51 44H69L66 72H54L51 44Z" fill="#334155" />
    <path d="M40 88C48 96 72 96 80 88L74 104C65 110 55 110 46 104L40 88Z" fill="#0F172A" />
  </svg>
);

export function createDemoStudentAvatarDataUrl(initials: string, bgHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300" viewBox="0 0 240 300">
    <rect width="240" height="300" fill="${bgHex}"/>
    <circle cx="120" cy="108" r="46" fill="#FDE68A"/>
    <path d="M74 102C74 74 95 56 120 56C145 56 166 74 166 102C152 92 135 88 120 88C105 88 88 92 74 102Z" fill="#1E293B"/>
    <path d="M46 270C52 206 82 178 120 178C158 178 188 206 194 270Z" fill="#FFFFFF"/>
    <path d="M98 178L120 214L142 178" fill="#0F766E"/>
    <rect x="0" y="256" width="240" height="44" fill="#0F172A" fill-opacity="0.72"/>
    <text x="120" y="284" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="600">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createDemoHousePhotoDataUrl(
  mode: 'exterior' | 'interior',
  caption: string,
  gpsLabel: string
): string {
  if (mode === 'exterior') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480">
      <rect width="800" height="480" fill="#E0F2FE"/>
      <rect y="330" width="800" height="150" fill="#DCFCE7"/>
      <circle cx="690" cy="84" r="36" fill="#FDE047"/>
      <path d="M180 215L400 95L620 215H180Z" fill="#9A3412" stroke="#7C2D12" stroke-width="4"/>
      <rect x="225" y="215" width="350" height="165" fill="#FEF3C7" stroke="#D97706" stroke-width="3"/>
      <rect x="365" y="265" width="70" height="115" fill="#78350F"/>
      <rect x="260" y="250" width="72" height="62" fill="#BAE6FD" stroke="#78350F" stroke-width="3"/>
      <rect x="468" y="250" width="72" height="62" fill="#BAE6FD" stroke="#78350F" stroke-width="3"/>
      <circle cx="130" cy="275" r="56" fill="#16A34A"/>
      <rect x="120" y="320" width="20" height="65" fill="#78350F"/>
      <rect x="16" y="420" width="768" height="46" rx="6" fill="#0F172A" fill-opacity="0.78"/>
      <text x="34" y="449" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="600">${caption}</text>
      <text x="766" y="449" text-anchor="end" fill="#99F6E4" font-family="monospace" font-size="14">${gpsLabel}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480">
    <rect width="800" height="480" fill="#F8FAFC"/>
    <polygon points="0,360 140,290 660,290 800,360 800,480 0,480" fill="#E2E8F0"/>
    <line x1="140" y1="0" x2="140" y2="290" stroke="#CBD5E1" stroke-width="3"/>
    <line x1="660" y1="0" x2="660" y2="290" stroke="#CBD5E1" stroke-width="3"/>
    <line x1="140" y1="290" x2="660" y2="290" stroke="#CBD5E1" stroke-width="3"/>
    <rect x="300" y="80" width="200" height="120" fill="#E0F2FE" stroke="#64748B" stroke-width="4"/>
    <line x1="400" y1="80" x2="400" y2="200" stroke="#64748B" stroke-width="3"/>
    <rect x="210" y="255" width="180" height="68" rx="6" fill="#0F766E"/>
    <rect x="440" y="270" width="140" height="14" fill="#92400E"/>
    <rect x="455" y="284" width="12" height="52" fill="#78350F"/>
    <rect x="553" y="284" width="12" height="52" fill="#78350F"/>
    <rect x="16" y="420" width="768" height="46" rx="6" fill="#0F172A" fill-opacity="0.78"/>
    <text x="34" y="449" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="600">${caption}</text>
    <text x="766" y="449" text-anchor="end" fill="#99F6E4" font-family="monospace" font-size="14">${gpsLabel}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
