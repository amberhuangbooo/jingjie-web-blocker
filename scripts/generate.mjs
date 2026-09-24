import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import net from "node:net";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const generatedDirectory = path.join(projectDirectory, "generated");
const blocklistPath = path.join(projectDirectory, "blocklist.txt");
const profilePath = path.join(projectDirectory, "清净网页屏蔽器-iPhone.mobileconfig");

const PROFILE_UUID = "D3668DD9-1D24-4A40-9E29-D404DC71F3C1";
const PAYLOAD_UUID = "E6BB74CF-F4C5-435C-A97D-02A031370A51";
const CONTENT_FILTER_UUID = "E7E45B82-EF47-407A-B130-408A34CD28F3";

function normalizeDomain(value) {
  let candidate = value.trim().toLowerCase();
  if (!candidate || candidate.startsWith("#") || candidate.startsWith("!")) return null;

  candidate = candidate.replace(/^\|\|/, "").replace(/\^.*$/, "");

  try {
    if (!candidate.includes("://")) candidate = `https://${candidate}`;
    const hostname = new URL(candidate).hostname.replace(/^www\./, "");

    if (
      !hostname ||
      hostname === "localhost" ||
      !hostname.includes(".") ||
      net.isIP(hostname) ||
      /[^a-z0-9.-]/i.test(hostname) ||
      hostname.startsWith(".") ||
      hostname.endsWith(".") ||
      hostname.includes("..")
    ) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createMobileConfig(domains) {
  const denyListURLs = domains
    .flatMap((domain) => [`http://${domain}/`, `https://${domain}/`])
    .map((url) => `                    <string>${escapeXml(url)}</string>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>AutoFilterEnabled</key>
            <false/>
            <key>ContentFilterUUID</key>
            <string>${CONTENT_FILTER_UUID}</string>
            <key>DenyListURLs</key>
            <array>
${denyListURLs}
            </array>
            <key>FilterType</key>
            <string>BuiltIn</string>
            <key>PayloadDescription</key>
            <string>根据本地 blocklist.txt 屏蔽指定网站，不启用系统自动内容过滤</string>
            <key>PayloadDisplayName</key>
            <string>清净网页屏蔽器</string>
            <key>PayloadIdentifier</key>
            <string>local.clean-web-blocker.filter</string>
            <key>PayloadType</key>
            <string>com.apple.webcontent-filter</string>
            <key>PayloadUUID</key>
            <string>${PAYLOAD_UUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>在 iPhone 的 Safari 和受系统网页过滤支持的浏览器中屏蔽指定网站</string>
    <key>PayloadDisplayName</key>
    <string>清净网页屏蔽器</string>
    <key>PayloadIdentifier</key>
    <string>local.clean-web-blocker.profile</string>
    <key>PayloadOrganization</key>
    <string>个人本地配置</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${PROFILE_UUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
`;
}

const source = await readFile(blocklistPath, "utf8");
const sourceLines = source.split(/\r?\n/);
const invalidLines = [];
const domains = [];

for (const line of sourceLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) continue;
  const domain = normalizeDomain(trimmed);
  if (domain) domains.push(domain);
  else invalidLines.push(trimmed);
}

const uniqueDomains = [...new Set(domains)].sort();

if (invalidLines.length) {
  throw new Error(`blocklist.txt 包含无效内容：\n- ${invalidLines.join("\n- ")}`);
}

if (uniqueDomains.length * 2 > 500) {
  throw new Error("iPhone 描述文件最多允许 500 个 URL；当前域名超过 250 个。请缩减名单。");
}

const chromeRules = uniqueDomains.map((domain, index) => ({
  id: index + 1,
  priority: 1,
  action: { type: "block" },
  condition: {
    urlFilter: `||${domain}^`,
    resourceTypes: ["main_frame"]
  }
}));

await mkdir(generatedDirectory, { recursive: true });
await Promise.all([
  writeFile(
    path.join(generatedDirectory, "blocklist.json"),
    `${JSON.stringify(uniqueDomains, null, 2)}\n`,
    "utf8"
  ),
  writeFile(
    path.join(generatedDirectory, "chrome-rules.json"),
    `${JSON.stringify(chromeRules, null, 2)}\n`,
    "utf8"
  ),
  writeFile(profilePath, createMobileConfig(uniqueDomains), "utf8")
]);

console.log(`已生成 ${uniqueDomains.length} 个屏蔽域名：`);
console.log("- Chrome：generated/chrome-rules.json");
console.log("- iPhone：清净网页屏蔽器-iPhone.mobileconfig");
