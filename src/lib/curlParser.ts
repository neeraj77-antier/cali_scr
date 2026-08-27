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

  // Normalize newlines and continuation backslashes
  const normalized = curlText.replace(/\\\s*\n/g, " ");

  // Extract URL (e.g., curl --location 'URL' or curl 'URL')
  const urlMatch = normalized.match(/curl\s+(?:--location\s+)?['"]?([^'"]\S+)['"]?/i) || 
                   normalized.match(/https?:\/\/[^\s'"]+/i);
  if (urlMatch) {
    result.url = urlMatch[1] || urlMatch[0];
    
    // Try to extract submissionId from URL like /submissions/{id}/probe/answer
    const subMatch = result.url.match(/\/submissions\/([^\/]+)\/probe/i);
    if (subMatch) {
      result.submissionId = subMatch[1];
    }
  }

  // Extract Headers
  // Pattern matches: --header 'key: value' or -H "key: value"
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

  // Extract Body Data (--data, --data-raw, -d)
  const dataMatch = normalized.match(/(?:--data|--data-raw|-d)\s+['"]([\s\S]*?)['"](?=\s+--|\s*$)/i) ||
                    normalized.match(/(?:--data|--data-raw|-d)\s+'([\s\S]*)'/i);
  if (dataMatch) {
    const rawBody = dataMatch[1];
    try {
      result.bodyData = JSON.parse(rawBody);
    } catch {
      result.bodyData = rawBody;
    }
  }

  return result;
}
