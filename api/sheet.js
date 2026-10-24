/**
 * 브라우저 → 이 함수 → 구글 앱스 스크립트.
 * 앱스 스크립트 주소는 환경변수 APPS_SCRIPT_URL 에만 둡니다.
 * 비밀번호는 요청 본문에 실려 가고, 맞는지 검사는 앱스 스크립트가 합니다.
 */

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "POST만 지원합니다." });
    return;
  }

  const url = String(process.env.APPS_SCRIPT_URL || "").trim();
  if (!url) {
    res.status(503).json({
      ok: false,
      error: "APPS_SCRIPT_URL 환경변수가 없습니다. Vercel 프로젝트 설정에 앱스 스크립트 웹 앱 주소를 넣어 주세요."
    });
    return;
  }

  const payload = req.body && typeof req.body === "object" ? req.body : {};
  try {
    const text = await postAppsScript(url, JSON.stringify(payload));
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).send(asJsonText(text));
  } catch (err) {
    console.error("sheet proxy failed");
    res.status(502).json({ ok: false, error: "구글 시트에 연결하지 못했습니다." });
  }
};

async function postAppsScript(url, body) {
  const first = await fetch(url, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body
  });
  if (first.status >= 300 && first.status < 400) {
    const location = first.headers.get("location");
    await drain_(first);
    if (!location) throw new Error("redirect without location");
    // 앱스 스크립트는 302 주소에 결과를 담아 두고, 그 주소는 GET으로 읽어야 합니다.
    const nextUrl = new URL(location, url).toString();
    const second = await fetch(nextUrl, { method: "GET", redirect: "follow" });
    return second.text();
  }
  return first.text();
}

function asJsonText(text) {
  const trimmed = String(text || "").replace(/^\uFEFF/, "").trim();
  try {
    const data = JSON.parse(trimmed);
    if (data && typeof data === "object") return JSON.stringify(data);
  } catch (_) {
    // 아래 안내 문구로 바꿉니다.
  }
  return JSON.stringify({ ok: false, error: explainNonJson_(trimmed) });
}

function explainNonJson_(text) {
  if (/accounts\.google\.com|ServiceLogin|로그인이 필요/.test(text)) {
    return "구글 로그인 페이지가 돌아왔습니다. 앱스 스크립트 배포의 액세스 권한을 '모든 사용자'로 두고 새 배포를 다시 만들어 주세요.";
  }
  if (/authorization|권한이 필요|승인/.test(text)) {
    return "스크립트 권한 승인 페이지가 돌아왔습니다. 앱스 스크립트에서 배포 → 새 배포를 다시 실행하고, 권한 허용까지 완료해 주세요.";
  }
  return "구글 시트 응답을 읽지 못했습니다. Vercel의 APPS_SCRIPT_URL 이 /exec 로 끝나는 웹 앱 주소인지 확인해 주세요.";
}

async function drain_(response) {
  try {
    await response.arrayBuffer();
  } catch (_) {
    // 본문이 없어도 다음 요청은 진행합니다.
  }
}
