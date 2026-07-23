import { Globe, Laptop, Smartphone } from "lucide-react"

// Simple parser for user agent
export function parseUserAgent(ua: string | null | undefined) {
  if (!ua) return "Unknown Device"
  const isMobile = /mobile/i.test(ua)
  const isMac = /mac os/i.test(ua)
  const isWindows = /windows/i.test(ua)
  const isLinux = /linux/i.test(ua)

  const browserMatch =
    ua.match(/(firefox|chrome|safari|opera|edge|msie|trident(?=\/))\/?\s*(\d+)/i) || []
  let browser = browserMatch[1] || ""
  if (browser.toLowerCase() === "trident") browser = "IE"
  if (ua.match(/Edg/i)) browser = "Edge"

  const os = isMac
    ? "macOS"
    : isWindows
      ? "Windows"
      : isLinux
        ? "Linux"
        : isMobile
          ? "Mobile"
          : "Unknown OS"
  browser = browser ? browser.charAt(0).toUpperCase() + browser.slice(1) : "Unknown Browser"

  return `${os} • ${browser}`
}

export function getIcon(ua: string | null | undefined) {
  if (!ua) return <Globe className="h-4 w-4" />
  if (/mobile/i.test(ua)) return <Smartphone className="h-4 w-4" />
  return <Laptop className="h-4 w-4" />
}
