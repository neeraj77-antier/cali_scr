import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { targetUrl, headers, method = "POST", body } = await req.json();

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Target URL is required" },
        { status: 400 }
      );
    }

    // Build headers object for fetch
    const cleanHeaders: Record<string, string> = { ...headers };

    // Avoid host header mismatch issues
    delete cleanHeaders["host"];
    delete cleanHeaders["content-length"];

    const response = await fetch(targetUrl, {
      method: method.toUpperCase(),
      headers: cleanHeaders,
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

    const responseTime = Date.now() - startTime;
    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Capture response headers
    const respHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      respHeaders[key] = val;
    });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseTimeMs: responseTime,
      headers: respHeaders,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to execute request",
        responseTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
