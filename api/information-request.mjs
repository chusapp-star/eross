export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const { VERCEL_ENV, EROSS_WEB_INTAKE_URL: url, EROSS_WEB_INTAKE_TOKEN: token } = process.env;
  if (VERCEL_ENV !== "production" || !url || !token) return res.status(404).end();
  if (req.method !== "POST") return res.status(405).end();
  const origin = req.headers.origin;
  if (origin !== "https://" + req.headers.host || req.headers["sec-fetch-site"] === "cross-site") {
    return res.status(403).end();
  }
  if (!req.headers["content-type"]?.startsWith("application/json")) return res.status(415).end();

  if (req.body?.website) return res.status(400).end();

  try {
    const body = JSON.stringify(req.body);
    if (!body || Buffer.byteLength(body) > 4096) return res.status(413).end();
    const oidc = process.env.VERCEL_OIDC_TOKEN || req.headers["x-vercel-oidc-token"];
    if (typeof oidc !== "string" || !oidc) return res.status(503).end();
    const result = await fetch(url, {
      method: "POST",
      headers: {
        authorization: "Bearer " + token,
        "content-type": "application/json",
        "x-vercel-trusted-oidc-idp-token": oidc,
      },
      body,
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (result.status === 400) return res.status(400).end();
    if (!result.ok || !(await result.json()).received) return res.status(503).end();
    return res.status(200).json({ received: true });
  } catch {
    return res.status(503).end();
  }
}
