/**
 * MADNESS: UNDERDOG - 상태창 PNG 생성기 (Cloudflare Pages Function)
 * ------------------------------------------------------------------
 * 배경 이미지(bg.png) 위에 쿼리 파라미터로 받은 텍스트를 그린 SVG 를
 * 만든 뒤, resvg-wasm 으로 PNG 로 변환해 반환합니다.
 * (SVG 를 막는 플랫폼에서도 뜨는 진짜 이미지)
 *
 * 필요한 파일 (레포 루트):
 *   font.otf         한글 폰트(도현체)
 *   bg.png           노멀 배경 (A)
 *   bg_thruster.png  비개현성 추진기 소유 (B)
 *   bg_halo.png      헤일로 소유 (C)
 *   bg_both.png      둘 다 소유 (D)
 *
 * 파라미터:
 *   status, state, faction, damage(.구분), inventory(.구분)
 *   thruster=1  → 비개현성 추진기 소유 (배경 B/D)
 *   halo=1      → 헤일로 소유 (배경 C/D)
 *   power=73    → 노멀이 아닐 때 실루엣 안에 "출력 73%" 표시
 *
 * 사용 예:
 *   ![](https://<프로젝트>.pages.dev/api/status?status=전투 중&state=중상&faction=에덴 본부&thruster=1&power=87&damage=좌측 전완 결손&inventory=구형 리볼버)
 *
 * 위치/디자인 조정은 lib/render.js 의 COORDS / STYLE 을 수정하세요.
 */

import { Resvg, initWasm } from "../../lib/resvg.mjs";
import resvgWasm from "../../lib/resvg.wasm";
import { buildSvg, imageMeta, toBase64 } from "../../lib/render.js";

const FONT_PATH = "/font.otf";
const FONT_FAMILY = "Do Hyeon"; // font.otf 의 실제 패밀리명 (배달의민족 도현체)

// 소유 조합별 배경 파일
const BG_NORMAL = "/bg.png";
const BG_THRUSTER = "/bg_thruster.png";
const BG_HALO = "/bg_halo.png";
const BG_BOTH = "/bg_both.png";

// isolate 재사용 시 중복 초기화/디코딩 방지
let wasmReady = null;
const BG_CACHE = new Map(); // path -> { dataUri, w, h }
let FONT_CACHE = null;      // Uint8Array

function truthy(v) {
  if (!v) return false;
  v = String(v).toLowerCase();
  return v === "1" || v === "true" || v === "y" || v === "yes" || v === "on" || v === "o";
}

function isImage(b) {
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const jpg = b[0] === 0xff && b[1] === 0xd8;
  return png || jpg;
}

async function loadBg(path, request, env) {
  if (BG_CACHE.has(path)) return BG_CACHE.get(path);
  const bytes = new Uint8Array(await fetchAsset(path, request, env));
  // 파일이 없으면 Cloudflare 가 HTML(도구 페이지)을 돌려주므로, 이미지인지 확인
  if (!isImage(bytes)) {
    throw new Error("배경 파일이 없거나 이미지가 아닙니다: " + path + " (레포에 이 이름으로 업로드했는지 확인하세요)");
  }
  const { w, h, mime } = imageMeta(bytes);
  const entry = { dataUri: `data:${mime};base64,${toBase64(bytes)}`, w, h };
  BG_CACHE.set(path, entry);
  return entry;
}

function ensureWasm() {
  if (!wasmReady) wasmReady = initWasm(resvgWasm);
  return wasmReady;
}

async function fetchAsset(path, request, env) {
  const url = new URL(path, request.url).toString();
  const resp =
    env && env.ASSETS && env.ASSETS.fetch
      ? await env.ASSETS.fetch(new Request(url))
      : await fetch(url);
  if (!resp || !resp.ok) throw new Error(path + " HTTP " + (resp ? resp.status : "no response"));
  return await resp.arrayBuffer();
}

export async function onRequest(context) {
  const { request, env } = context;
  const q = new URL(request.url).searchParams;

  try {
    await ensureWasm();

    // 소유 조합 → 배경 선택
    const t = truthy(q.get("thruster"));
    const h = truthy(q.get("halo"));
    let bgPath = BG_NORMAL;
    if (t && h) bgPath = BG_BOTH;
    else if (t) bgPath = BG_THRUSTER;
    else if (h) bgPath = BG_HALO;
    const isNormal = !t && !h;

    const bg = await loadBg(bgPath, request, env);
    if (!FONT_CACHE) {
      FONT_CACHE = new Uint8Array(await fetchAsset(FONT_PATH, request, env));
    }

    // 출력% (노멀 배경이 아니고 값이 있을 때만)
    const powerRaw = (q.get("power") || "").replace(/%/g, "").trim();
    const powerText = !isNormal && powerRaw ? `${powerRaw}%` : "";

    const svg = buildSvg(
      {
        status: q.get("status") || "",
        state: q.get("state") || "",
        faction: q.get("faction") || "",
        damage: q.get("damage") || "",
        inventory: q.get("inventory") || "",
        power: powerText,
      },
      bg
    );

    const resvg = new Resvg(svg, {
      fitTo: { mode: "original" },
      font: {
        fontBuffers: [FONT_CACHE],
        loadSystemFonts: false,
        defaultFontFamily: FONT_FAMILY,
      },
    });
    const png = resvg.render().asPng();

    return new Response(png, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=600",
        "access-control-allow-origin": "*",
      },
    });
  } catch (e) {
    return new Response("status image error: " + (e && e.message ? e.message : String(e)), {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
