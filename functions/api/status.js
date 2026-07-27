/**
 * OVERLAP - 상태창 애니메이션 SVG 생성기 (Cloudflare Pages Function)
 * ------------------------------------------------------------------
 * 배경 격자(애니)+박스 점멸+UI 오버레이+텍스트+부상박스를 그린 SVG를 반환.
 * PNG 변환 없이 SVG 를 그대로 반환합니다 (크랙이 애니메이션 SVG 재생 확인됨).
 *
 * 필요한 파일 (레포 루트):
 *   font.otf         한글 폰트(도현체) — SVG 안에 base64 로 내장됨
 *   bg.png           기본 UI 오버레이 (A, 투명 PNG)
 *   bg_thruster.png  추진기 (B)
 *   bg_halo.png      헤일로 (C)
 *   bg_both.png      둘 다 (D)
 *
 * 파라미터:
 *   s   = n(기본)/t(추진기)/h(헤일로)/b(둘다)  → 오버레이 선택
 *   d   = 날짜(년.월.일)
 *   t   = 시간
 *   l   = 위치
 *   f   = 소속(FACTION)
 *   tn  = 턴수(숫자)
 *   nest= NEST 텍스트
 *   power = 출력 %(추진기/헤일로일 때 실루엣 안에 "NN%")
 *   inv = 인벤토리 (.구분, 최대 12 → 2열 6줄)
 *   rel = 인연/관계 (.구분, 최대 12 → 2열 6줄)
 *   dmg = 부상 (.구분, 랜덤 반투명 박스)
 *
 * 사용 예:
 *   ![](https://<프로젝트>.pages.dev/api/status?d=2026.05.06&t=22:47&l=림보토미아 지하&s=h&tn=3&f=NEST&inv=권총.단검&dmg=좌완 골절.늑골 파손)
 */

import { buildSvg, imageMeta, toBase64 } from "../../lib/render.js";

const FONT_PATH = "/font.otf";
const OVERLAY = { n: "/bg.png", t: "/bg_thruster.png", h: "/bg_halo.png", b: "/bg_both.png" };

// isolate 재사용 캐시
const ASSET_CACHE = new Map(); // path -> dataUri
let FONT_CACHE = null;

async function fetchAsset(path, request, env) {
  const url = new URL(path, request.url).toString();
  const resp =
    env && env.ASSETS && env.ASSETS.fetch ? await env.ASSETS.fetch(new Request(url)) : await fetch(url);
  if (!resp || !resp.ok) throw new Error(path + " HTTP " + (resp ? resp.status : "no response"));
  return new Uint8Array(await resp.arrayBuffer());
}

function isImage(b) {
  return (b[0] === 0x89 && b[1] === 0x50) || (b[0] === 0xff && b[1] === 0xd8);
}

async function loadOverlay(path, request, env) {
  if (ASSET_CACHE.has(path)) return ASSET_CACHE.get(path);
  const bytes = await fetchAsset(path, request, env);
  if (!isImage(bytes)) throw new Error("오버레이 이미지가 없거나 이미지가 아닙니다: " + path);
  const { mime } = imageMeta(bytes);
  const uri = `data:${mime};base64,${toBase64(bytes)}`;
  ASSET_CACHE.set(path, uri);
  return uri;
}

async function loadFont(request, env) {
  if (FONT_CACHE) return FONT_CACHE;
  const bytes = await fetchAsset(FONT_PATH, request, env);
  FONT_CACHE = `data:font/otf;base64,${toBase64(bytes)}`;
  return FONT_CACHE;
}

export async function onRequest(context) {
  const { request, env } = context;
  const q = new URL(request.url).searchParams;

  try {
    const s = (q.get("s") || "n").toLowerCase();
    const overlayPath = OVERLAY[s] || OVERLAY.n;
    const isNormal = !(s === "t" || s === "h" || s === "b");

    const [overlayDataUri, fontDataUri] = await Promise.all([
      loadOverlay(overlayPath, request, env),
      loadFont(request, env),
    ]);

    const powerRaw = (q.get("power") || "").replace(/%/g, "").trim();
    const power = !isNormal && powerRaw ? `${powerRaw}%` : "";

    const svg = buildSvg(
      {
        d: q.get("d") || "",
        t: q.get("t") || "",
        l: q.get("l") || "",
        f: q.get("f") || "",
        tn: q.get("tn") || "",
        nest: q.get("nest") || "",
        power,
        inv: q.get("inv") || "",
        rel: q.get("rel") || "",
        dmg: q.get("dmg") || "",
      },
      { overlayDataUri, fontDataUri }
    );

    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=300",
        "access-control-allow-origin": "*",
      },
    });
  } catch (e) {
    return new Response("status error: " + (e && e.message ? e.message : String(e)), {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
