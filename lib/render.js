/**
 * OVERLAP 상태창 - 애니메이션 SVG 빌더
 * ------------------------------------------------------------------
 * 레이어(아래→위):
 *   1) 비네트 배경(중앙 #370000 → 가장자리 검정)
 *   2) 붉은 격자(약간 기울고, 왼쪽으로 천천히 스크롤)
 *   3) 박스(소속/인벤/인연) 안쪽 반투명 격자 + 빠른 점멸
 *   4) UI 오버레이 이미지(A/B/C/D, 투명 PNG)
 *   5) 텍스트 값들
 *   6) 부상 박스(반투명, 계단식 겹침, 순차 등장)
 *
 * 좌표는 전부 1024x512(REF) 기준. 오버레이 PNG는 이 캔버스에 맞춰 그려집니다.
 * 위치/디자인 조정은 아래 COORDS / STYLE 만 수정하세요.
 */

export const REF_W = 1024;
export const REF_H = 512;

export const STYLE = {
  fontFamily: "OverlapKR",       // 아래 @font-face 에 심는 이름 (font.otf 를 그대로 사용)
  textColor: "#fc0303",          // 기본 글자색
  gridColor: "#fc0303",
  gridOpacity: 0.41,             // 배경 격자 투명도
  boxGridOpacity: 0.6,           // 박스 격자 투명도
  gridSize: 23,                  // 배경 격자 (촘촘)
  gridTilt: -5,                  // 배경 격자 기울기(도, 왼쪽)
  bgScrollDur: 4.64,             // 배경 격자 왼쪽 스크롤 한 바퀴(초)  ← 20% 빠르게
  // 박스 안쪽
  boxGradFrom: "#fc0303",        // 좌상단 색
  boxGradTo: "#000000",          // 우하단 색
  boxGradSplit: 0.7,             // 붉은색 비율(0~1). 클수록 붉은 영역이 넓음(붉은70:검정30)
  boxGradOpacity: 0.46,          // 박스 배경 투명도
  boxGridSize: 27,               // 박스 격자 크기(작을수록 촘촘)
  boxGridTilt: 3,                // 박스 격자 기울기(도, 오른쪽)
  boxScrollDur: 4.13,            // 박스 격자 스크롤(초)  ← 20% 빠르게
  boxFlickerDur: 0.045,          // 박스 배경 점멸 속도(초)
  // 부상 박스 (계단식 겹침)
  dmgFill: "#7d1f22",
  dmgFillOpacity: 0.5,
  dmgStroke: "#d10d0e",
  dmgTextColor: "#ffe0e0",
  dmgBoxW: 193,                  // 크기 15% ↑
  dmgBoxH: 62,                   // 크기 15% ↑
  dmgFont: 18,
  dmgStackDx: -20,               // 겹칠 때 계단 이동량(가로). 부호로 방향
  dmgStackDy: 24,                // 겹칠 때 계단 이동량(세로)
};

// 텍스트/박스 좌표 (1024x512)
export const COORDS = {
  // 단일 텍스트: {x, y, font, maxW, anchor}
  faction: { x: 453, y: 82, font: 32, maxW: 150, anchor: "middle" },   // FACTION 박스 안(소속)
  date:    { x: 312, y: 197, font: 19, maxW: 205, anchor: "start" },
  time:    { x: 530, y: 216, font: 31, maxW: 150, anchor: "start" },
  location:{ x: 527, y: 248, font: 21, maxW: 175, anchor: "start" },
  turn:    { x: 900, y: 250, font: 33, maxW: 90,  anchor: "middle" },
  nest:    { x: 400, y: 372, font: 24, maxW: 130, anchor: "middle" },
  power:   { x: 131,  y: 410, font: 40, maxW: 170, anchor: "start", color: "#d10d0e" }, // 실루엣 안 출력%

  // INVENTORY: 4열 x 2줄 (총 8개), 왼→오 채움. RELATIONSHIP: 2열 x 6줄, 위→아래 채움.
  inventory: { cols: [548, 720], rowY: [78, 104, 130, 156], font: 16, maxW: 160, order: "col" },
  relationship: { cols: [548, 762], rowY: [318, 344, 370, 396, 422, 448], font: 16, maxW: 210, order: "col" },

  // 박스 사각형(반투명 점멸 격자 들어갈 영역) : {x,y,w,h}
  // relationship.skew = 왼쪽 변 기울기(px). 클수록 왼쪽 위가 오른쪽으로 더 깎임. 0 이면 직사각형.
  boxes: {
    faction:      { x: 377, y: 12,  w: 157, h: 153 },
    inventory:    { x: 540, y: 24,  w: 345, h: 158 },
    relationship: { x: 521, y: 272, w: 470, h: 216, skew: 19 },
  },
};

// 부상 박스가 "가급적 피할" UI 영역(빈 곳 우선 — 랜덤 시작점에만 적용)
const AVOID_ZONES = [
  { x: 0,   y: 150, w: 300, h: 362 }, // 캐릭터 실루엣
  { x: 390, y: 20,  w: 140, h: 130 }, // FACTION
  { x: 535, y: 25,  w: 395, h: 165 }, // INVENTORY
  { x: 360, y: 170, w: 430, h: 115 },  // 날짜/TIME/LOCATION
  { x: 330, y: 320, w: 150, h: 110 }, // NEST
  { x: 805, y: 200, w: 150, h: 75 },  // Turn
  { x: 505, y: 265, w: 495, h: 230 }, // RELATIONSHIP
];

/* ---------- 유틸 ---------- */
export function splitList(v) {
  if (!v) return [];
  return String(v).split(".").map((s) => s.trim()).filter(Boolean);
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function r(n) { return Math.round(n * 10) / 10; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function estWidth(text, font) {
  let w = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0);
    if (ch === " ") w += font * 0.32;
    else if (c < 0x2e80) w += font * 0.55;
    else w += font * 1.0;
  }
  return w;
}
function fitFont(text, font, maxW, min = 11) {
  let f = font;
  while (estWidth(text, f) > maxW && f > min) f -= 1;
  return f;
}
// 시드 난수 (내용 기반 고정)
function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function intersects(a, b) {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

function textEl(t, x, y, font, { color, anchor = "start", maxW, weight = "400", opacity } = {}) {
  const f = maxW ? fitFont(t, font, maxW) : font;
  const op = opacity != null ? ` opacity="${opacity}"` : "";
  return `<text x="${r(x)}" y="${r(y)}" font-family="${STYLE.fontFamily}" font-size="${r(f)}" font-weight="${weight}" fill="${color || STYLE.textColor}" text-anchor="${anchor}" dominant-baseline="central"${op}>${esc(t)}</text>`;
}

/* ---------- SVG 생성 ---------- */
/**
 * params: { d,t,l,f,tn,nest,power, inv, rel, dmg }
 * assets: { overlayDataUri, fontDataUri }
 */
export function buildSvg(params, assets) {
  const W = REF_W, H = REF_H;
  const cx = W / 2, cy = H / 2;
  const g = STYLE.gridSize;

  const parts = [];

  // defs
  parts.push(`<defs>`);
  parts.push(
    `<style>@font-face{font-family:'${STYLE.fontFamily}';src:url('${assets.fontDataUri}') format('opentype');}</style>`
  );
  parts.push(
    `<radialGradient id="vig" cx="50%" cy="50%" r="72%">` +
    `<stop offset="0%" stop-color="#370000"/>` +
    `<stop offset="100%" stop-color="#000000"/></radialGradient>`
  );
  parts.push(
    `<pattern id="grid" width="${g}" height="${g}" patternUnits="userSpaceOnUse">` +
    `<path d="M${g} 0 L0 0 0 ${g}" fill="none" stroke="${STYLE.gridColor}" stroke-opacity="${STYLE.gridOpacity}" stroke-width="1"/></pattern>`
  );
  const bg2 = STYLE.boxGridSize;
  parts.push(
    `<pattern id="boxgrid" width="${bg2}" height="${bg2}" patternUnits="userSpaceOnUse">` +
    `<path d="M${bg2} 0 L0 0 0 ${bg2}" fill="none" stroke="${STYLE.gridColor}" stroke-opacity="${STYLE.boxGridOpacity}" stroke-width="1"/></pattern>`
  );
  // 박스 그라데이션: 좌상단 붉은색이 boxGradSplit 까지 유지 → 우하단 검정 (붉은 비율↑)
  parts.push(
    `<linearGradient id="boxgrad" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${STYLE.boxGradFrom}"/>` +
    `<stop offset="${STYLE.boxGradSplit}" stop-color="${STYLE.boxGradFrom}"/>` +
    `<stop offset="1" stop-color="${STYLE.boxGradTo}"/></linearGradient>`
  );
  // 박스 클립 (skew 있으면 왼쪽 변이 기운 사각형)
  for (const key of Object.keys(COORDS.boxes)) {
    const b = COORDS.boxes[key];
    const shape = b.skew
      ? `<polygon points="${b.x + b.skew},${b.y} ${b.x + b.w},${b.y} ${b.x + b.w},${b.y + b.h} ${b.x},${b.y + b.h}"/>`
      : `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/>`;
    parts.push(`<clipPath id="clip_${key}">${shape}</clipPath>`);
  }
  parts.push(`</defs>`);

  // 1) 비네트 배경
  parts.push(`<rect width="${W}" height="${H}" fill="#000000"/>`);
  parts.push(`<rect width="${W}" height="${H}" fill="url(#vig)"/>`);

  // 2) 배경 격자 (기울임 + 왼쪽 스크롤)
  parts.push(
    `<g transform="rotate(${STYLE.gridTilt} ${cx} ${cy})">` +
    `<g><rect x="-160" y="-160" width="${W + 320}" height="${H + 320}" fill="url(#grid)"/>` +
    `<animateTransform attributeName="transform" type="translate" from="0 0" to="-${g} 0" dur="${STYLE.bgScrollDur}s" repeatCount="indefinite"/>` +
    `</g></g>`
  );

  // 3) 박스 안쪽: 대각선 그라데이션(점멸) + 격자(스크롤)
  for (const key of Object.keys(COORDS.boxes)) {
    const b = COORDS.boxes[key];
    const bcx = b.x + b.w / 2, bcy = b.y + b.h / 2;
    const of = STYLE.boxGradOpacity;
    parts.push(
      `<g clip-path="url(#clip_${key})">` +
      // 불투명 검정(배경 격자 가림) → 그 위에 박스 색
      `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#000000"/>` +
      // 배경 그라데이션 = 점멸 (속도 그대로, 강도 20% ↓)
      `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="url(#boxgrad)" opacity="${of}">` +
      `<animate attributeName="opacity" values="${of};${r(of * 0.46)};${r(of * 0.88)};${r(of * 0.56)};${of}" dur="${STYLE.boxFlickerDur}s" repeatCount="indefinite"/>` +
      `</rect>` +
      // 격자 = 점멸 없이 스크롤
      `<g transform="rotate(${STYLE.boxGridTilt} ${bcx} ${bcy})">` +
      `<rect x="${b.x - 90}" y="${b.y - 90}" width="${b.w + 180}" height="${b.h + 180}" fill="url(#boxgrid)">` +
      `<animateTransform attributeName="transform" type="translate" from="0 0" to="-${bg2} 0" dur="${STYLE.boxScrollDur}s" repeatCount="indefinite"/>` +
      `</rect></g></g>`
    );
  }

  // 4) UI 오버레이 (A/B/C/D)
  if (assets.overlayDataUri) {
    parts.push(`<image href="${assets.overlayDataUri}" x="0" y="0" width="${W}" height="${H}"/>`);
  }

  // 5) 텍스트 값들
  const single = (val, c) => {
    if (!val) return;
    parts.push(textEl(val, c.x, c.y, c.font, { anchor: c.anchor, maxW: c.maxW, color: c.color }));
  };
  single((params.f || "").trim(), COORDS.faction);
  single((params.d || "").trim(), COORDS.date);
  single((params.t || "").trim(), COORDS.time);
  single((params.l || "").trim(), COORDS.location);
  single((params.tn || "").trim(), COORDS.turn);
  single((params.nest || "").trim(), COORDS.nest);
  single((params.power || "").trim(), COORDS.power);

  // 목록: cols/rowY 격자로 배치. order="row" 면 왼→오 우선, 아니면 위→아래 우선
  const gridText = (listStr, c) => {
    const nCols = c.cols.length, nRows = c.rowY.length;
    const items = splitList(listStr).slice(0, nCols * nRows);
    items.forEach((it, i) => {
      if (!it) return;
      let col, row;
      if (c.order === "row") { col = i % nCols; row = (i / nCols) | 0; }
      else { row = i % nRows; col = (i / nRows) | 0; }
      parts.push(textEl(it, c.cols[col], c.rowY[row], c.font, { maxW: c.maxW, anchor: "start" }));
    });
  };
  gridText(params.inv, COORDS.inventory);
  gridText(params.rel, COORDS.relationship);

  // 6) 부상 박스 (계단식 겹침, 순차 등장)
  const dmg = splitList(params.dmg);
  if (dmg.length) {
    const rng = mulberry32(hashSeed("dmg:" + params.dmg));
    const bw = STYLE.dmgBoxW, bh = STYLE.dmgBoxH;
    const placed = [];
    for (let i = 0; i < dmg.length; i++) {
      const overlap = placed.length > 0 && rng() < 0.7;
      let best = null;
      if (overlap) {
        // 직전 박스에서 일정하게 계단식으로 이동(살짝 지터)
        const base = placed[placed.length - 1];
        const x = clamp(base.x + STYLE.dmgStackDx + (rng() * 2 - 1) * 4, 6, W - bw - 6);
        const y = clamp(base.y + STYLE.dmgStackDy + (rng() * 2 - 1) * 4, 6, H - bh - 6);
        best = { x, y, w: bw, h: bh };
      } else {
        // 새 위치: UI 없는 빈 곳 우선(랜덤)
        for (let tries = 0; tries < 45; tries++) {
          const x = clamp(rng() * (W - bw), 6, W - bw - 6);
          const y = clamp(rng() * (H - bh), 6, H - bh - 6);
          const rect = { x, y, w: bw, h: bh };
          const hitsUI = AVOID_ZONES.some((z) => intersects(rect, z));
          if (!hitsUI || tries > 30) { best = rect; if (!hitsUI) break; }
        }
        if (!best) best = { x: clamp(rng() * (W - bw), 6, W - bw - 6), y: clamp(rng() * (H - bh), 6, H - bh - 6), w: bw, h: bh };
      }
      placed.push(best);

      const begin = (i * 0.28).toFixed(2);
      const anim = params._preview
        ? ""
        : `<animate attributeName="opacity" from="0" to="1" dur="0.35s" begin="${begin}s" fill="freeze"/>`;
      const startOp = params._preview ? "1" : "0";
      parts.push(
        `<g opacity="${startOp}">` +
        anim +
        `<rect x="${r(best.x)}" y="${r(best.y)}" width="${bw}" height="${bh}" fill="${STYLE.dmgFill}" fill-opacity="${STYLE.dmgFillOpacity}" stroke="${STYLE.dmgStroke}" stroke-opacity="0.7" stroke-width="2"/>` +
        textEl(dmg[i], best.x + bw / 2, best.y + bh / 2, STYLE.dmgFont, { color: STYLE.dmgTextColor, anchor: "middle", maxW: bw - 16 }) +
        `</g>`
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`;
}

/* ---------- 이미지 헤더에서 크기/MIME (status.js 재사용) ---------- */
export function imageMeta(b) {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png" };
  if (b[0] === 0xff && b[1] === 0xd8) return { mime: "image/jpeg" };
  return { mime: "image/png" };
}
export function toBase64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(bin);
}
