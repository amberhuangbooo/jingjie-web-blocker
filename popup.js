const enabledInput = document.querySelector("#enabled");
const currentDomainElement = document.querySelector("#current-domain");
const copyButton = document.querySelector("#copy-current");
const optionsButton = document.querySelector("#open-options");
const statusElement = document.querySelector("#status");

let currentDomain = null;

function normalizeHostname(hostname) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

async function initialize() {
  const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
  enabledInput.checked = enabledRulesets.includes("generated_blocklist");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    const url = new URL(tab.url);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsupported");
    currentDomain = normalizeHostname(url.hostname);
    currentDomainElement.textContent = currentDomain;
  } catch {
    currentDomainElement.textContent = "此页面不能屏蔽";
    copyButton.disabled = true;
  }
}

enabledInput.addEventListener("change", async () => {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enabledInput.checked ? ["generated_blocklist"] : [],
    disableRulesetIds: enabledInput.checked ? [] : ["generated_blocklist"]
  });
  statusElement.textContent = enabledInput.checked ? "屏蔽已开启" : "屏蔽已暂停";
});

copyButton.addEventListener("click", async () => {
  if (!currentDomain) return;
  await navigator.clipboard.writeText(currentDomain);
  statusElement.textContent = "已复制；请粘贴到 blocklist.txt 后重新生成。";
});

optionsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());

initialize().catch(() => {
  statusElement.textContent = "读取页面信息失败";
});
