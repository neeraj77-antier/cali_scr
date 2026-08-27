export interface ParsedCurl {
  url: string;
  submissionId: string;
  headers: Record<string, string>;
  authorization: string;
  cookie: string;
  bodyData: any;
}

export function parseCurlCommand(curlText: string): ParsedCurl {
  const result: ParsedCurl = {
    url: "",
    submissionId: "",
    headers: {},
    authorization: "",
    cookie: "",
    bodyData: null,
  };

  if (!curlText || typeof curlText !== "string") return result;

  // Normalize bash continuation backslashes at end of lines
  const normalized = curlText.replace(/\\\s*\r?\n/g, " ");

  // Extract URL
  const urlMatch = normalized.match(/curl\s+(?:--location\s+)?['"]?([^'"]\S+)['"]?/i) || 
                   normalized.match(/https?:\/\/[^\s'"]+/i);
  if (urlMatch) {
    result.url = urlMatch[1] || urlMatch[0];
    
    // Extract submissionId from URL path like /submissions/{id}/probe
    const subMatch = result.url.match(/\/submissions\/([^\/]+)\/probe/i);
    if (subMatch) {
      result.submissionId = subMatch[1];
    }
  }

  // Extract Headers
  const headerRegex = /(?:--header|-H)\s+['"]([^'"]+)['"]/gi;
  let match: RegExpExecArray | null;

  while ((match = headerRegex.exec(normalized)) !== null) {
    const fullHeader = match[1];
    const colonIndex = fullHeader.indexOf(":");
    if (colonIndex !== -1) {
      const key = fullHeader.substring(0, colonIndex).trim();
      const value = fullHeader.substring(colonIndex + 1).trim();
      result.headers[key] = value;

      const lowerKey = key.toLowerCase();
      if (lowerKey === "authorization") {
        result.authorization = value;
      } else if (lowerKey === "cookie") {
        result.cookie = value;
      }
    }
  }

  // Robust JSON Body Extraction (--data, --data-raw, --data-binary, -d)
  const dataPosMatch = normalized.match(/(?:--data|--data-raw|--data-binary|-d)\s+/i);
  if (dataPosMatch && dataPosMatch.index !== undefined) {
    const searchStartIndex = dataPosMatch.index + dataPosMatch[0].length;
    const jsonStart = normalized.indexOf("{", searchStartIndex);
    const jsonEnd = normalized.lastIndexOf("}");

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      let rawJson = normalized.substring(jsonStart, jsonEnd + 1);

      // Clean bash escape sequences: '\'' -> '
      rawJson = rawJson.replace(/'\\''/g, "'");

      try {
        result.bodyData = JSON.parse(rawJson);
      } catch (e) {
        // Fallback if raw newlines or escaped slashes exist
        try {
          const sanitized = rawJson.replace(/\r?\n/g, "\\n");
          result.bodyData = JSON.parse(sanitized);
        } catch {
          result.bodyData = rawJson;
        }
      }
    }
  }

  // Detect if parsed URL was a Next.js /api/proxy wrapper call and unwrap the actual target payload
  if (result.url.includes("/api/proxy") && result.bodyData && typeof result.bodyData === "object") {
    const proxyPayload = result.bodyData;
    if (proxyPayload.targetUrl) {
      result.url = proxyPayload.targetUrl;
      const subMatch = result.url.match(/\/submissions\/([^\/]+)\/probe/i);
      if (subMatch) {
        result.submissionId = subMatch[1];
      }
    }
    if (proxyPayload.headers && typeof proxyPayload.headers === "object") {
      result.headers = { ...result.headers, ...proxyPayload.headers };
      if (proxyPayload.headers.authorization || proxyPayload.headers.Authorization) {
        result.authorization = proxyPayload.headers.authorization || proxyPayload.headers.Authorization;
      }
      if (proxyPayload.headers.Cookie || proxyPayload.headers.cookie) {
        result.cookie = proxyPayload.headers.Cookie || proxyPayload.headers.cookie;
      }
    }
    if (proxyPayload.body) {
      result.bodyData = proxyPayload.body;
    }
  }

  return result;
}
