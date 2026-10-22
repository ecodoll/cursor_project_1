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
    res.status(200).send(text);
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
    if (!location) throw new Error("redirect without location");
    const second = await fetch(location, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body
    });
    return second.text();
  }
  return first.text();
}
