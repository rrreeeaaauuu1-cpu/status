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

import { FIRE_FRAMES, FIRE_W, FIRE_H } from "./fireframes.js";

export const REF_W = 1024;
export const REF_H = 512;

export const STYLE = {
  fontFamily: "OverlapKR",       // 아래 @font-face 에 심는 이름 (폰트 파일 그대로 사용)
  textColor: "#fc0303",          // 일반 글자색
  // 킬/부상 텍스트 공통 디자인: 어두운 채움 + 얇은 빨간 외곽선 + 빠르게 깜빡이는 빨간 글로우
  glowFill: "#370001",
  glowStroke: "#fc0303",
  glowStrokeW: 1,
  glowColor: "#fc0303",
  glowBlur: 3,                   // 글로우 번짐
  glowFlickerDur: 0.11,          // 글로우 깜빡임 속도(초)
  killGlowBlur: 7,               // 킬 카운트 글로우(더 강하게)
  // 킬 카운트(도서관 전용, 최상단) 애니메이션
  killFont: 41,                  // 20% 크게
  killTiltDeg: 12,               // 좌우 기울기 각도
  killTiltDur: 1.3,             // 좌우 기울기 한 주기(초)
  killTiltEase: "0.85 0 1 1",   // 시작 아주 느리게(강한 ease-in)
  killTrembleDur: 0.09,         // 떨림 속도(초, 작을수록 빠름)
  killTremble: 3,               // 떨림 크기(px)
  // 도서관 전체 빨간 노이즈 지직(간헐적)
  glitchColor: [0.988, 0.012, 0.012], // #fc0303
  glitchFreq: 0.9,              // 노이즈 촘촘함
  glitchCycle: 9,               // 빨간 노이즈 패턴 한 바퀴(초)
  fireNoiseColor: [1, 1, 1],    // 화염 상태 흰 노이즈 색
  fireNoiseCycle: 3.5,          // 흰 노이즈 주기(빨간 것보다 훨씬 빠르게)
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
  // 부상/봉합 박스 (계단식 겹침 + 글리치)
  dmgFill: "#7d1f22",
  dmgFillOpacity: 0.5,
  dmgStroke: "#d10d0e",
  dmgTextColor: "#d10d0e",
  dmgBoxW: 193,                  // 크기 15% ↑
  dmgBoxH: 62,                   // 크기 15% ↑
  dmgFont: 18,
  dmgTextTop: 18,                // 글자를 박스 위쪽에(겹쳐도 이전 글자 보이게)
  dmgStackDx: -12,              // 계단 이동(가로). 부호로 방향
  dmgStackDy: 30,               // 계단 이동(세로) — 이전 박스 글자 위로 남게
  overlapProb: 0.6,             // 겹칠 확률(나머지는 랜덤)
  dmgGlitch: 3,                 // 글리치 흔들림(px)
  dmgGlitchDur: 0.28,           // 글리치 속도(초)
  // 봉합 박스 (부상과 같은 디자인, 색상 테마 #fffea1)
  sutFill: "#6d6a1e",
  sutStroke: "#fffea1",
  sutTextColor: "#fffea1",
  // 불 (fire=none 이 아니면 텍스트 영역마다 흰 불 애니메이션 재생)
  fireOpacity: 1,                // 1 = 불투명
  fireCover: 1.35,             // 각 영역을 덮는 배율(원본 여백 감안)
  fireDur: 1.6,                 // 플립북 한 바퀴(초) — 크면 느리게
  fireYBias: 0.12,             // 세로 위치 보정(+면 아래로)
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
  power:   { x: 133,  y: 410, font: 40, maxW: 170, anchor: "start", color: "#d10d0e" }, // 실루엣 안 출력%

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

  // 불을 하나씩 얹을 영역들(텍스트가 표시되는 자리). {x,y,w,h}
  fireSpots: [
    { x: 372, y: 12,  w: 164, h: 158 },  // FACTION
    { x: 540, y: 14,  w: 345, h: 172 },  // INVENTORY
    { x: 300, y: 185, w: 250, h: 95 },   // 날짜/TIME/LOCATION
    { x: 335, y: 325, w: 130, h: 100 },  // NEST
    { x: 812, y: 200, w: 145, h: 78 },   // Turn
    { x: 512, y: 272, w: 483, h: 218 },  // RELATIONSHIP
    { x: 40,  y: 355, w: 200, h: 140 },  // 출력%(실루엣)
  ],
};

// 부상 박스가 "가급적 피할" UI 영역(빈 곳 우선 — 랜덤 시작점에만 적용)
const AVOID_ZONES = [
  { x: 0,   y: 150, w: 300, h: 362 }, // 캐릭터 실루엣
  { x: 390, y: 20,  w: 140, h: 130 }, // FACTION
  { x: 535, y: 25,  w: 395, h: 165 }, // INVENTORY
  { x: 300, y: 185, w: 410, h: 95 },  // 날짜/TIME/LOCATION
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

// 킬/부상 텍스트: 채움(어두움) + 얇은 빨간 외곽선 + 빠르게 깜빡이는 빨간 글로우
// (txglow 필터는 defs 에 정의됨)
function glowText(t, x, y, font, { anchor = "middle", maxW, filter = "txglow" } = {}) {
  const f = maxW ? fitFont(t, font, maxW) : font;
  const common =
    `x="${r(x)}" y="${r(y)}" font-family="${STYLE.fontFamily}" font-size="${r(f)}" font-weight="700" ` +
    `text-anchor="${anchor}" dominant-baseline="central"`;
  const e = esc(t);
  return (
    // 글로우(빨간 번짐) — 빠르게 깜빡임
    `<text ${common} fill="${STYLE.glowColor}" filter="url(#${filter})">` +
    `<animate attributeName="opacity" values="1;0.2;0.9;0.35;1;0.15" dur="${STYLE.glowFlickerDur}s" repeatCount="indefinite" calcMode="discrete"/>${e}</text>` +
    // 본 글자 — 어두운 채움 + 얇은 빨간 외곽선
    `<text ${common} fill="${STYLE.glowFill}" stroke="${STYLE.glowStroke}" stroke-width="${STYLE.glowStrokeW}" paint-order="stroke">${e}</text>`
  );
}

// 흰 불 프레임 애니메이션: 텍스트 영역마다 하나씩, 크기 맞춰 배치. 13장 크로스페이드(부드럽게).
function buildFire(W, H, preview) {
  const N = FIRE_FRAMES.length;
  const dur = STYLE.fireDur;
  const kt = [];
  for (let k = 0; k <= N; k++) kt.push((k / N).toFixed(4));
  const keyTimes = kt.join(";");
  const valuesFor = (i) => {
    const v = [];
    for (let k = 0; k <= N; k++) v.push((k % N === i) ? "1" : "0");
    return v.join(";");
  };

  // 프레임 이미지 defs (base64 는 한 번만 정의, <use> 로 재사용)
  let defs = "<defs>";
  for (let i = 0; i < N; i++) defs += `<image id="ff${i}" href="${FIRE_FRAMES[i]}" width="${FIRE_W}" height="${FIRE_H}"/>`;
  defs += "</defs>";

  const spots = COORDS.fireSpots;
  let out = defs + `<g opacity="${STYLE.fireOpacity}">`;
  spots.forEach((sPot, idx) => {
    const scale = Math.max(sPot.w / FIRE_W, sPot.h / FIRE_H) * STYLE.fireCover;
    const cw = FIRE_W * scale, ch = FIRE_H * scale;
    const xLeft = sPot.x + sPot.w / 2 - cw / 2;
    const yTop = sPot.y + sPot.h / 2 - ch / 2 + sPot.h * STYLE.fireYBias;
    let uses = "";
    if (preview) {
      uses = `<use href="#ff${(idx * 2) % N}" opacity="1"/>`;
    } else {
      const phase = ((idx * 0.618 * dur) % dur).toFixed(2); // 영역마다 위상 어긋나게
      for (let i = 0; i < N; i++) {
        uses += `<use href="#ff${i}" opacity="0">` +
          `<animate attributeName="opacity" values="${valuesFor(i)}" keyTimes="${keyTimes}" ` +
          `dur="${dur}s" begin="-${phase}s" repeatCount="indefinite" calcMode="discrete"/></use>`;
      }
    }
    out += `<g transform="translate(${r(xLeft)},${r(yTop)}) scale(${r(scale)})">${uses}</g>`;
  });
  return out + `</g>`;
}

// 화면 전체 노이즈 지직(간헐적). 매 요청마다 다른 불규칙 패턴(연속/대기 섞임). 색/주기 파라미터화.
function buildGlitch(W, H, { color, cycle, filterId, seedDur = 0.12, gapP = 0.06, contP = 0.5 }) {
  const slots = 54;
  const kt = [], vals = [];
  let on = false;
  for (let i = 0; i < slots; i++) {
    kt.push((i / slots).toFixed(4));
    on = Math.random() < (on ? contP : gapP); // 켜져있으면 이어질 확률↑, 아니면 대기
    vals.push(on ? (0.4 + Math.random() * 0.4).toFixed(2) : "0");
  }
  kt.push("1"); vals.push(vals[0]);            // 루프 연결
  const seed = [];
  for (let k = 0; k < 8; k++) seed.push(1 + Math.floor(Math.random() * 90));
  const [cr, cg, cb] = color;
  return (
    `<defs><filter id="${filterId}" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${STYLE.glitchFreq}" numOctaves="2" seed="5" stitchTiles="stitch" result="n">` +
    `<animate attributeName="seed" values="${seed.join(";")}" dur="${seedDur}s" repeatCount="indefinite" calcMode="discrete"/></feTurbulence>` +
    `<feColorMatrix in="n" type="matrix" values="0 0 0 0 ${cr} 0 0 0 0 ${cg} 0 0 0 0 ${cb} 4 0 0 0 -2"/>` +
    `</filter></defs>` +
    `<rect width="${W}" height="${H}" filter="url(#${filterId})" opacity="0">` +
    `<animate attributeName="opacity" values="${vals.join(";")}" keyTimes="${kt.join(";")}" dur="${cycle}s" repeatCount="indefinite" calcMode="discrete"/></rect>`
  );
}

/* ---------- SVG 생성 ---------- */
/**
 * params: { d,t,l,f,tn,nest,power, inv, rel, dmg, sut, fire, library, kill }
 * assets: { overlayDataUri, fontDataUri, fontFormat, killFontDataUri, killFontFormat }
 */
export function buildSvg(params, assets) {
  const W = REF_W, H = REF_H;
  const cx = W / 2, cy = H / 2;
  const g = STYLE.gridSize;
  const lib = !!params.library;                       // 도서관(LIBR) 모드 (엠블럼 이미지만 다름)
  const txt = STYLE.textColor;

  const parts = [];

  // defs
  parts.push(`<defs>`);
  parts.push(
    `<style>@font-face{font-family:'${STYLE.fontFamily}';src:url('${assets.fontDataUri}') format('${assets.fontFormat || "opentype"}');}</style>`
  );
  // 글로우 필터(빨간 번짐): 부상=txglow, 킬=txglowKill(더 강함)
  parts.push(`<filter id="txglow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="${STYLE.glowBlur}"/></filter>`);
  parts.push(`<filter id="txglowKill" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="${STYLE.killGlowBlur}"/></filter>`);
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

  // 1) 비네트 배경 (OVERLAP·LIBR 공통)
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
      `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#000000"/>` +
      `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="url(#boxgrad)" opacity="${of}">` +
      `<animate attributeName="opacity" values="${of};${r(of * 0.46)};${r(of * 0.88)};${r(of * 0.56)};${of}" dur="${STYLE.boxFlickerDur}s" repeatCount="indefinite"/>` +
      `</rect>` +
      `<g transform="rotate(${STYLE.boxGridTilt} ${bcx} ${bcy})">` +
      `<rect x="${b.x - 90}" y="${b.y - 90}" width="${b.w + 180}" height="${b.h + 180}" fill="url(#boxgrid)">` +
      `<animateTransform attributeName="transform" type="translate" from="0 0" to="-${bg2} 0" dur="${STYLE.boxScrollDur}s" repeatCount="indefinite"/>` +
      `</rect></g></g>`
    );
  }

  // 4) UI 오버레이 (OVERLAP=NEST 엠블럼 / LIBR=LIBR 엠블럼, 나머지 디자인 동일)
  if (assets.overlayDataUri) {
    parts.push(`<image href="${assets.overlayDataUri}" x="0" y="0" width="${W}" height="${H}"/>`);
  }

  // 5) 텍스트 값들 (색은 모드에 따라 txt, power 는 자체 색 유지)
  const single = (val, c) => {
    if (!val) return;
    parts.push(textEl(val, c.x, c.y, c.font, { anchor: c.anchor, maxW: c.maxW, color: c.color || txt }));
  };
  single((params.f || "").trim(), COORDS.faction);
  single((params.d || "").trim(), COORDS.date);
  single((params.t || "").trim(), COORDS.time);
  single((params.l || "").trim(), COORDS.location);
  single((params.tn || "").trim(), COORDS.turn);
  single(lib ? "" : (params.nest || "").trim(), COORDS.nest); // LIBR 모드는 이미지에 LIBR 새겨져 있어 텍스트 생략
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
      parts.push(textEl(it, c.cols[col], c.rowY[row], c.font, { maxW: c.maxW, anchor: "start", color: txt }));
    });
  };
  gridText(params.inv, COORDS.inventory);
  gridText(params.rel, COORDS.relationship);

  // 6) 부상/봉합 박스 (계단식 겹침 + 글리치, 위치 고정 시드)
  // "none"(대소문자 무관)은 박스 미표시
  const cleanList = (s) => splitList(s).filter((t) => t.toLowerCase() !== "none");
  const boxItems = [
    ...cleanList(params.dmg).map((t) => ({ text: t, fill: STYLE.dmgFill, stroke: STYLE.dmgStroke, tc: STYLE.dmgTextColor, glitch: true })),
    ...cleanList(params.sut).map((t) => ({ text: t, fill: STYLE.sutFill, stroke: STYLE.sutStroke, tc: STYLE.sutTextColor, glitch: false })),
  ];
  if (boxItems.length) {
    // 고정 시드 → 항목이 늘어도 기존 박스는 같은 자리를 지킴
    const rng = mulberry32(hashSeed("overlapbox"));
    const bw = STYLE.dmgBoxW, bh = STYLE.dmgBoxH;
    const placed = [];
    boxItems.forEach((item, i) => {
      const overlap = placed.length > 0 && rng() < STYLE.overlapProb;
      let best;
      if (overlap) {
        // 계단식: 직전 박스에서 아래로만 이동(이전 박스 글자는 위에 남음)
        const base = placed[placed.length - 1];
        best = {
          x: clamp(base.x + STYLE.dmgStackDx + (rng() * 2 - 1) * 3, 6, W - bw - 6),
          y: clamp(base.y + STYLE.dmgStackDy + (rng() * 2 - 1) * 3, 6, H - bh - 6),
          w: bw, h: bh,
        };
      } else {
        // 랜덤: UI + 기존 박스 모두 피해서 (겹친 박스 위에 새 박스 안 생김)
        best = null;
        for (let tries = 0; tries < 55; tries++) {
          const rect = {
            x: clamp(rng() * (W - bw), 6, W - bw - 6),
            y: clamp(rng() * (H - bh), 6, H - bh - 6),
            w: bw, h: bh,
          };
          const bad = AVOID_ZONES.some((z) => intersects(rect, z)) || placed.some((p) => intersects(rect, p));
          if (!bad) { best = rect; break; }
          if (tries > 45 && !best) best = rect;
        }
        if (!best) best = { x: clamp(rng() * (W - bw), 6, W - bw - 6), y: clamp(rng() * (H - bh), 6, H - bh - 6), w: bw, h: bh };
      }
      placed.push(best);

      const begin = (i * 0.28).toFixed(2);
      const gb = (i * 0.05).toFixed(2);
      const gx = STYLE.dmgGlitch, gd = STYLE.dmgGlitchDur;
      const fade = params._preview ? "" : `<animate attributeName="opacity" from="0" to="1" dur="0.35s" begin="${begin}s" fill="freeze"/>`;
      const startOp = params._preview ? "1" : "0";
      // 부상박스(glitch:true) 글리치 복원. 봉합박스는 애니메이션 없음.
      const glitch = item.glitch
        ? `<animateTransform attributeName="transform" type="translate" values="0 0;${gx} 0;-${gx} 1;1 -1;0 0;-2 1;${gx} 0;0 0" dur="${gd}s" begin="${gb}s" repeatCount="indefinite" calcMode="discrete"/>` +
          `<animate attributeName="opacity" values="1;0.68;1;0.85;1;0.72;1" dur="${gd}s" begin="${gb}s" repeatCount="indefinite" calcMode="discrete"/>`
        : "";
      parts.push(
        `<g opacity="${startOp}">` + fade +
        `<g>` + glitch +
        `<rect x="${r(best.x)}" y="${r(best.y)}" width="${bw}" height="${bh}" fill="${item.fill}" fill-opacity="${STYLE.dmgFillOpacity}" stroke="${item.stroke}" stroke-opacity="0.75" stroke-width="2"/>` +
        (item.glitch // 부상=글로우 디자인, 봉합=기존 색
          ? glowText(item.text, best.x + bw / 2, best.y + STYLE.dmgTextTop, STYLE.dmgFont, { anchor: "middle", maxW: bw - 16 })
          : textEl(item.text, best.x + bw / 2, best.y + STYLE.dmgTextTop, STYLE.dmgFont, { color: item.tc, anchor: "middle", maxW: bw - 16 })) +
        `</g></g>`
      );
    });
  }

  const fireOn = params.fire && String(params.fire).toLowerCase() !== "none";

  // 7) 킬 카운트 (도서관 전용) — 불 바로 뒤(불보다 먼저 그림). 랜덤 위치, 떨림+좌우 기울임, 강한 글로우.
  const killV = (params.kill == null ? "" : String(params.kill)).trim();
  if (lib && killV && killV.toLowerCase() !== "none") {
    const px = r(130 + Math.random() * (W - 260));   // 출력할 때마다 랜덤
    const py = r(70 + Math.random() * (H - 140));
    const A = STYLE.killTiltDeg, tr = STYLE.killTremble, ke = STYLE.killTiltEase;
    const tilt = `<animateTransform attributeName="transform" type="rotate" additive="sum" values="${-A} 0 0;${A} 0 0;${-A} 0 0" dur="${STYLE.killTiltDur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="${ke};${ke}"/>`;
    const tremble = `<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;${tr} ${-tr};${-tr} ${tr};${tr} 0;0 ${tr};${-tr} 0;0 0" dur="${STYLE.killTrembleDur}s" repeatCount="indefinite" calcMode="discrete"/>`;
    parts.push(
      `<g transform="translate(${px},${py})">` + tilt + tremble +
      glowText("KILL " + killV, 0, 0, STYLE.killFont, { anchor: "middle", filter: "txglowKill" }) +
      `</g>`
    );
  }

  // 8) 불 (킬 위를 덮음)
  if (fireOn) parts.push(buildFire(W, H, params._preview));

  // 9) 도서관 빨간 노이즈(간헐적)
  if (lib) parts.push(buildGlitch(W, H, { color: STYLE.glitchColor, cycle: STYLE.glitchCycle, filterId: "rednoise" }));

  // 10) 화염 상태 흰 노이즈(같은 방식, 훨씬 빠르게, 최상단)
  if (fireOn) parts.push(buildGlitch(W, H, { color: STYLE.fireNoiseColor, cycle: STYLE.fireNoiseCycle, filterId: "whitenoise", seedDur: 0.05, gapP: 0.22, contP: 0.55 }));

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
