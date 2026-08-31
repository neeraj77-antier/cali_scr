export interface ParsedCurl {
  url: string;
  submissionId: string;
  interviewId?: string;
  moduleId?: string;
  headers: Record<string, string>;
  authorization: string;
  cookie: string;
  bodyData: any;
}

export function parseCurlCommand(curlText: string): ParsedCurl {
  const result: ParsedCurl = {
    url: "",
    submissionId: "",
    interviewId: "",
    moduleId: "",
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
    result.url = (urlMatch[1] || urlMatch[0]).replace(/['"]\s*$/, "").trim();

    // Extract submissionId from URL path like /submissions/{id}/probe
    const subMatch = result.url.match(/\/submissions\/([^\/]+)\/probe/i);
    if (subMatch) {
      result.submissionId = subMatch[1];
    }

    // Extract interviewId from URL path like /interviews/{id}/message or /interviews/{id}/complete
    const intMatch = result.url.match(/\/interviews\/([a-f0-9\-]+)/i);
    if (intMatch && intMatch[1] !== "interviews") {
      result.interviewId = intMatch[1];
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

  // Extract cookies from -b / --cookie flag (used by interview cURLs)
  // Must run AFTER header extraction so -H Cookie: can still override if present
  if (!result.cookie) {
    const cookieMatch = normalized.match(/(?:^|\s)(?:-b|--cookie)\s+['"]([^'"]+)['"]/i);
    if (cookieMatch) {
      result.cookie = cookieMatch[1];
      result.headers["Cookie"] = cookieMatch[1];
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
      if (result.bodyData && typeof result.bodyData === "object" && result.bodyData.moduleId) {
        result.moduleId = result.bodyData.moduleId;
      }
    }
  }

  if (!result.moduleId && result.headers["referer"]) {
    const modMatch = result.headers["referer"].match(/\/modules\/([a-f0-9\-]+)/i);
    if (modMatch) {
      result.moduleId = modMatch[1];
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
