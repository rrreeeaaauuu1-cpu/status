/**
 * MADNESS: UNDERDOG - 상태창 PNG 생성기 (Cloudflare Pages Function)
 * ------------------------------------------------------------------
 * 배경 이미지(bg.png) 위에 쿼리 파라미터로 받은 텍스트를 그린 SVG 를
 * 만든 뒤, resvg-wasm 으로 PNG 로 변환해 반환합니다.
 * (SVG 를 막는 플랫폼에서도 뜨는 진짜 이미지)
 *
 * 필요한 파일: 레포 루트에 bg.png(배경) 와 font.otf(한글 폰트) 를 두세요.
 *
 * 사용 예:
 *   ![](https://<프로젝트>.pages.dev/api/status?status=전투 중&state=중상&damage=좌측 전완 결손.늑골 3개 파손&inventory=구형 리볼버.붕대)
 *
 * 위치/디자인 조정은 lib/render.js 의 COORDS / STYLE 을 수정하세요.
 */

import { Resvg, initWasm } from "../../lib/resvg.mjs";
import resvgWasm from "../../lib/resvg.wasm";
import { buildSvg, imageMeta, toBase64 } from "../../lib/render.js";

const BG_PATH = "/bg.png";
const FONT_PATH = "/font.otf";
const FONT_FAMILY = "Do Hyeon"; // font.otf 의 실제 패밀리명 (배달의민족 도현체)

// isolate 재사용 시 중복 초기화/디코딩 방지
let wasmReady = null;
let BG_CACHE = null;   // { dataUri, w, h }
let FONT_CACHE = null; // Uint8Array

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

    if (!BG_CACHE) {
      const bytes = new Uint8Array(await fetchAsset(BG_PATH, request, env));
      const { w, h, mime } = imageMeta(bytes);
      BG_CACHE = { dataUri: `data:${mime};base64,${toBase64(bytes)}`, w, h };
    }
    if (!FONT_CACHE) {
      FONT_CACHE = new Uint8Array(await fetchAsset(FONT_PATH, request, env));
    }

    const svg = buildSvg(
      {
        status: q.get("status") || "",
        state: q.get("state") || "",
        damage: q.get("damage") || "",
        inventory: q.get("inventory") || "",
      },
      BG_CACHE
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
