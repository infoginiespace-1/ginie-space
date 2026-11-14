#!/usr/bin/env node

/**
 * GinieSpace Automated Search Engine Indexing Engine
 * Supports:
 *  1. IndexNow Protocol (Bing, Yandex, Seznam, Naver - Instant Crawl)
 *  2. Google Indexing API (Direct URL Notification to Googlebot)
 *  3. Google Search Console Webmasters API (Sitemap submission)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const HOST = "app.ginie.space";
const BASE_URL = `https://${HOST}`;
const INDEXNOW_KEY = "e7b8c21a4f90432db51a92ce34678df1";
const KEY_LOCATION = `${BASE_URL}/${INDEXNOW_KEY}.txt`;

// Default core URLs if sitemap is unreachable
const DEFAULT_URLS = [
  `${BASE_URL}`,
  `${BASE_URL}/signup`,
  `${BASE_URL}/login`,
  `${BASE_URL}/terms`,
  `${BASE_URL}/privacy`,
  `${BASE_URL}/refund`,
];

// Helper: Make HTTP request (Promise-based)
function request(urlStr, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const payloadStr = data ? (typeof data === "string" ? data : JSON.stringify(data)) : null;
    const headers = { ...options.headers };
    if (payloadStr) {
      headers["Content-Length"] = Buffer.byteLength(payloadStr);
    }

    const opts = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers,
      timeout: 15000,
    };

    const req = https.request(opts, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body,
        });
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout: ${urlStr}`));
    });

    if (data) {
      req.write(typeof data === "string" ? data : JSON.stringify(data));
    }
    req.end();
  });
}

// 1. Fetch URLs from live sitemap.xml
async function fetchSitemapUrls() {
  try {
    const sitemapUrl = `${BASE_URL}/sitemap.xml`;
    console.log(`🔍 Fetching live sitemap: ${sitemapUrl}...`);
    const res = await request(sitemapUrl);
    if (res.statusCode === 200 && res.body) {
      const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
      const urls = [];
      let match;
      while ((match = locRegex.exec(res.body)) !== null) {
        urls.push(match[1]);
      }
      if (urls.length > 0) {
        console.log(`✅ Discovered ${urls.length} live URLs from sitemap.xml`);
        return urls;
      }
    }
  } catch (err) {
    console.warn(`⚠️ Could not fetch live sitemap (${err.message}), using fallback URLs.`);
  }
  return DEFAULT_URLS;
}

// 2. Submit to IndexNow (Bing, Yandex, etc.)
async function submitIndexNow(urls) {
  console.log("\n==========================================");
  console.log("⚡ SUBMITTING TO INDEXNOW (Bing / Yandex)");
  console.log("==========================================");

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  const endpoints = [
    { name: "IndexNow Global", url: "https://api.indexnow.org/indexnow" },
    { name: "Bing IndexNow", url: "https://www.bing.com/indexnow" },
  ];

  for (const ep of endpoints) {
    try {
      console.log(`🚀 Sending ${urls.length} URLs to ${ep.name}...`);
      const res = await request(
        ep.url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
        payload
      );

      if (res.statusCode === 200 || res.statusCode === 202) {
        console.log(`   ✅ ${ep.name}: Success (HTTP ${res.statusCode}) - Search engines notified!`);
      } else {
        console.warn(`   ⚠️ ${ep.name}: Response HTTP ${res.statusCode} (${res.body || "No body"})`);
      }
    } catch (err) {
      console.error(`   ❌ ${ep.name} Failed: ${err.message}`);
    }
  }
}

// 3. Google Indexing API & Search Console
function getGoogleKey() {
  const possiblePaths = [
    path.join(process.cwd(), "google-indexing-key.json"),
    path.join(process.cwd(), "service-account.json"),
    path.join(__dirname, "google-indexing-key.json"),
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf8");
        const json = JSON.parse(raw);
        if (json.client_email && json.private_key) {
          return { keyFile: p, json };
        }
      } catch {}
    }
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const json = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      if (json.client_email && json.private_key) {
        return { keyFile: "ENV:GOOGLE_SERVICE_ACCOUNT_KEY", json };
      }
    } catch {}
  }

  return null;
}

// Base64Url encode helper
function base64Url(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// Exchange Google Service Account JWT for OAuth Access Token
async function getGoogleAccessToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/indexing https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedClaim = base64Url(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signatureInput);
  signer.end();
  const signature = signer.sign(creds.private_key);
  const jwt = `${signatureInput}.${base64Url(signature)}`;

  const bodyData = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  }).toString();

  const tokenRes = await request(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(bodyData),
      },
    },
    bodyData
  );

  if (tokenRes.statusCode === 200) {
    const data = JSON.parse(tokenRes.body);
    return data.access_token;
  } else {
    throw new Error(`Google OAuth error (${tokenRes.statusCode}): ${tokenRes.body}`);
  }
}

async function submitGoogleIndexing(urls, credsInfo) {
  console.log("\n==========================================");
  console.log("🌐 SUBMITTING TO GOOGLE INDEXING API");
  console.log(`Using key: ${credsInfo.keyFile} (${credsInfo.json.client_email})`);
  console.log("==========================================");

  let token;
  try {
    token = await getGoogleAccessToken(credsInfo.json);
    console.log("🔑 Google OAuth access token acquired!");
  } catch (err) {
    console.error(`❌ Failed to acquire Google access token: ${err.message}`);
    return;
  }

  for (const url of urls) {
    try {
      const res = await request(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
        {
          url,
          type: "URL_UPDATED",
        }
      );

      if (res.statusCode === 200) {
        console.log(`   ✅ Google Indexing: ${url} (Notified successfully)`);
      } else {
        console.warn(`   ⚠️ Google Indexing: ${url} HTTP ${res.statusCode}: ${res.body}`);
      }
    } catch (err) {
      console.error(`   ❌ Google Indexing error for ${url}: ${err.message}`);
    }
  }

  // Submit sitemap to Google Search Console Webmasters API
  try {
    const siteUrlEncoded = encodeURIComponent(BASE_URL + "/");
    const sitemapUrlEncoded = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
    const scUrl = `https://www.googleapis.com/webmasters/v3/sites/${siteUrlEncoded}/sitemaps/${sitemapUrlEncoded}`;
    console.log(`\n📌 Submitting sitemap to Google Search Console API...`);
    const scRes = await request(scUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (scRes.statusCode === 200 || scRes.statusCode === 204) {
      console.log(`   ✅ Google Search Console: Sitemap successfully registered!`);
    } else {
      console.log(`   ℹ️ Search Console response (HTTP ${scRes.statusCode}): ${scRes.body || "OK"}`);
    }
  } catch (scErr) {
    console.warn(`   ⚠️ Search Console sitemap submission notice: ${scErr.message}`);
  }
}

// Main execution
async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║     GINIESPACE AUTOMATED INSTANT INDEXING CLI        ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  const customUrls = process.argv.slice(2).filter((arg) => arg.startsWith("http"));
  let urlsToSubmit = [];

  if (customUrls.length > 0) {
    urlsToSubmit = customUrls;
    console.log(`🎯 Custom URLs targeted (${urlsToSubmit.length}):\n${urlsToSubmit.map((u) => `   - ${u}`).join("\n")}`);
  } else {
    urlsToSubmit = await fetchSitemapUrls();
  }

  // 1. Always submit to IndexNow
  await submitIndexNow(urlsToSubmit);

  // 2. Check for Google Service Account Key
  const googleCreds = getGoogleKey();
  if (googleCreds) {
    await submitGoogleIndexing(urlsToSubmit, googleCreds);
  } else {
    console.log("\n==========================================");
    console.log("ℹ️ GOOGLE INDEXING API NOTICE");
    console.log("==========================================");
    console.log("Google Indexing API requires a Service Account Key.");
    console.log("To enable 100% automated CLI submission to Google:");
    console.log(" 1. Create a Service Account in Google Cloud Console with Indexing API enabled.");
    console.log(" 2. Download JSON key and save it as: google-indexing-key.json in project root.");
    console.log(" 3. Add the service account email as an Owner in Google Search Console.");
    console.log("When that file is present, running this command submits directly to Google!\n");
  }

  console.log("\n🎉 Indexing execution complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
