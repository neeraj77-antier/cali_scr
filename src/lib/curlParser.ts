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

  // Normalize continuation backslashes at end of lines
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

  // Extract Body Data (--data, --data-raw, --data-binary, -d)
  const dataRegex = /(?:--data|--data-raw|--data-binary|-d)\s+('([\s\S]*?)'|"([\s\S]*?)")/i;
  const dataMatch = normalized.match(dataRegex);

  if (dataMatch) {
    let rawBody = dataMatch[2] !== undefined ? dataMatch[2] : dataMatch[3];
    if (rawBody) {
      // Unescape bash single quote sequence: '\'' -> '
      rawBody = rawBody.replace(/'\\''/g, "'");

      try {
        result.bodyData = JSON.parse(rawBody);
      } catch (e) {
        // Fallback: try finding first '{' to last '}' if trailing chars exist
        const firstBrace = rawBody.indexOf("{");
        const lastBrace = rawBody.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            result.bodyData = JSON.parse(rawBody.substring(firstBrace, lastBrace + 1));
          } catch {
            result.bodyData = rawBody;
          }
        } else {
          result.bodyData = rawBody;
        }
      }
    }
  }

  return result;
}
