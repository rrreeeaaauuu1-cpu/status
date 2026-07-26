/**
 * MADNESS: UNDERDOG 상태창 - SVG 빌더 (순수 로직, 런타임 의존성 없음)
 * status.js 가 이걸 불러 SVG 를 만든 뒤 resvg-wasm 으로 PNG 로 변환합니다.
 *
 * 위치/디자인 조정은 아래 COORDS / STYLE 만 수정하세요.
 * 좌표는 REF_W x REF_H(설계 기준) 픽셀이며 실제 이미지 크기에 맞춰 자동 스케일됩니다.
 */

export const REF_W = 1024;
export const REF_H = 620;

export const STYLE = {
  textColor: "#ffffff",       // 글자색 (박스 없앴으니 밝게)
  outlineColor: "#140a0c",    // 글자 외곽선 색 (가독성용, 비우면 "" )
  outlineRatio: 0,         // 외곽선 두께 = 글자크기 * 이 값 (0 이면 없음)
  // 레포에 넣는 폰트(font.otf)의 실제 패밀리명과 일치시켜야 함
  fontFamily: "Do Hyeon",
  fontWeight: "400",
  padX: 9,                    // 왼쪽 들여쓰기(기존 위치 유지용)
  padY: 5,
  minFont: 15,
};

export const COORDS = {
  status: { x: 174, cy: 154, font: 40, maxW: 235 },
  state:  { x: 590, cy: 154, font: 40, maxW: 200 },
  damage: { x: 322, font: 40, maxW: 240, rows: [277, 327, 377, 427, 477] },
  inventory: { x: 788, font: 40, maxW: 212, rows: [219, 282, 345, 408, 471] },

  // 하단 FACTION(소속) 값 — 라벨 오른쪽
  faction: { x: 448, cy: 549, font: 27, maxW: 300 },

  // 캐릭터 실루엣 안쪽 출력% (노멀 배경 제외하고 표시)
  power: { x: 45, cy: 505, font: 26, maxW: 185, color: "#d10d0e" },
};

export function splitList(v) {
  if (!v) return [];
  return String(v).split(".").map((s) => s.trim()).filter(Boolean);
}

function estWidth(text, font) {
  let w = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (ch === " ") w += font * 0.32;
    else if (code < 0x2e80) w += font * 0.55;
    else w += font * 1.0;
  }
  return w;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function r(n) {
  return Math.round(n * 10) / 10;
}

function highlight(text, refX, refCy, refFont, refMaxW, scaleX, scaleY, color) {
  const s = (scaleX + scaleY) / 2;
  let font = refFont * s;
  const maxW = refMaxW * scaleX;
  const padX = STYLE.padX * s;
  const padY = STYLE.padY * s;
  const minFont = STYLE.minFont * s;

  let tw = estWidth(text, font);
  while (tw + padX * 2 > maxW && font > minFont) {
    font -= 1;
    tw = estWidth(text, font);
  }

  const x = refX * scaleX + padX * s; // 기존 박스 안 텍스트 위치와 동일하게 유지
  const cy = refCy * scaleY;

  const common =
    `font-family="${STYLE.fontFamily}" font-size="${r(font)}" font-weight="${STYLE.fontWeight}" ` +
    `dominant-baseline="central" text-anchor="start"`;

  // 외곽선(가독성) — 있으면 stroke 를 먼저 깔고 그 위에 글자
  const sw = STYLE.outlineColor && STYLE.outlineRatio > 0 ? font * STYLE.outlineRatio : 0;
  const stroke = sw
    ? ` stroke="${STYLE.outlineColor}" stroke-width="${r(sw)}" paint-order="stroke" stroke-linejoin="round"`
    : "";

  const fill = color || STYLE.textColor;
  return `<text x="${r(x)}" y="${r(cy)}" ${common} fill="${fill}"${stroke}>${esc(text)}</text>`;
}

/**
 * params: { status, state, damage, inventory, faction, power }
 *   damage/inventory 는 "." 로 구분된 문자열, power 는 이미 완성된 문자열(예: "출력 73%") 또는 빈 값
 * bg:     { dataUri, w, h }
 */
export function buildSvg(params, bg) {
  const scaleX = bg.w / REF_W;
  const scaleY = bg.h / REF_H;

  const status = (params.status || "").trim();
  const state = (params.state || "").trim();
  const faction = (params.faction || "").trim();
  const power = (params.power || "").trim();
  const damage = splitList(params.damage);
  const inventory = splitList(params.inventory);

  const parts = [];
  if (status) parts.push(highlight(status, COORDS.status.x, COORDS.status.cy, COORDS.status.font, COORDS.status.maxW, scaleX, scaleY));
  if (state) parts.push(highlight(state, COORDS.state.x, COORDS.state.cy, COORDS.state.font, COORDS.state.maxW, scaleX, scaleY));
  if (faction) parts.push(highlight(faction, COORDS.faction.x, COORDS.faction.cy, COORDS.faction.font, COORDS.faction.maxW, scaleX, scaleY));
  if (power) parts.push(highlight(power, COORDS.power.x, COORDS.power.cy, COORDS.power.font, COORDS.power.maxW, scaleX, scaleY, COORDS.power.color));

  damage.slice(0, COORDS.damage.rows.length).forEach((t, i) => {
    if (t) parts.push(highlight(t, COORDS.damage.x, COORDS.damage.rows[i], COORDS.damage.font, COORDS.damage.maxW, scaleX, scaleY));
  });
  inventory.slice(0, COORDS.inventory.rows.length).forEach((t, i) => {
    if (t) parts.push(highlight(t, COORDS.inventory.x, COORDS.inventory.rows[i], COORDS.inventory.font, COORDS.inventory.maxW, scaleX, scaleY));
  });

  return (
`<svg xmlns="http://www.w3.org/2000/svg" width="${bg.w}" height="${bg.h}" viewBox="0 0 ${bg.w} ${bg.h}">` +
`<image href="${bg.dataUri}" x="0" y="0" width="${bg.w}" height="${bg.h}"/>` +
parts.join("") +
`</svg>`
  );
}

// PNG / JPEG 헤더에서 크기와 MIME 추출
export function imageMeta(b) {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    const w = ((b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]) >>> 0;
    const h = ((b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]) >>> 0;
    return { w, h, mime: "image/png" };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const h = (b[i + 5] << 8) | b[i + 6];
        const w = (b[i + 7] << 8) | b[i + 8];
        return { w, h, mime: "image/jpeg" };
      }
      const len = (b[i + 2] << 8) | b[i + 3];
      i += 2 + len;
    }
    return { w: REF_W, h: REF_H, mime: "image/jpeg" };
  }
  return { w: REF_W, h: REF_H, mime: "image/png" };
}

export function toBase64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
