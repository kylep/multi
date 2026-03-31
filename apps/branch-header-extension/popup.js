const slugInput = document.getElementById("slug");
const statusEl = document.getElementById("status");

chrome.storage.local.get("branchSlug", ({ branchSlug }) => {
  if (branchSlug) {
    slugInput.value = branchSlug;
    statusEl.textContent = "Active: " + branchSlug;
  }
});

function showStatus(text) {
  statusEl.textContent = text;
}

document.getElementById("save").addEventListener("click", () => {
  const slug = slugInput.value.trim();
  if (!slug) {
    chrome.runtime.sendMessage({ action: "clearBranch" }, () => {
      showStatus("Cleared");
    });
  } else {
    chrome.runtime.sendMessage({ action: "setBranch", slug }, () => {
      showStatus("Active: " + slug);
    });
  }
});

document.getElementById("clear").addEventListener("click", () => {
  slugInput.value = "";
  chrome.runtime.sendMessage({ action: "clearBranch" }, () => {
    showStatus("Cleared");
  });
});
