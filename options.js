const domainsInput = document.querySelector("#domains");
const copyButton = document.querySelector("#copy");
const statusElement = document.querySelector("#status");

async function loadDomains() {
  const response = await fetch(chrome.runtime.getURL("generated/blocklist.json"));
  if (!response.ok) throw new Error("读取失败");
  const blockedDomains = await response.json();
  domainsInput.value = blockedDomains.join("\n");
  statusElement.textContent = `共 ${blockedDomains.length} 个域名。`;
}

copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(domainsInput.value);
  statusElement.textContent = "已复制全部域名。";
});

loadDomains().catch(() => {
  statusElement.textContent = "读取黑名单失败。";
});
