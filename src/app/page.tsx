"use client";

import React, { useState, useEffect } from "react";
import { parseCurlCommand, ParsedCurl } from "@/lib/curlParser";
import { 
  Play, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  Key, 
  Code, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  Database
} from "lucide-react";

// Default preset answers provided in prompt
const INITIAL_ANSWERS: Record<string, string> = {
  q1: `Severity/priority trace + escalation scenario\n\nExact wording used to justify High (not Critical): "I'm not calling this Critical only because the notes are explicit that the order was NOT actually placed (the button greyed out afterward) — there's no evidence of an actual bad charge or corrupted order record, only a UI/calculation defect and a crash."\n\nExact evidence cited: the raw notes' own phrase — "order was NOT actually placed (button greyed out after)" — quoted directly, not paraphrased, specifically because it's the one fact in the notes that draws the line between "bad UX" and "bad transaction."\n\nI also pre-committed to the escalation trigger in that same sentence: "If either of those facts changes on investigation (e.g., an order does get created before the crash under some timing), this should be re-rated Critical immediately."\n\nIf investigation confirms server-side double-charging of the discount: that's exactly the trigger condition firing — this stops being a client-side rendering defect and becomes a confirmed financial-integrity bug (real orders processed with the wrong discount amount, not just a bad number shown briefly on screen). Rewritten fields:\n\nSeverity: Critical — investigation confirmed the race condition isn't confined to the client; it intermittently double-applies the discount server-side, meaning real orders can be finalized with an incorrect total. This is confirmed financial impact, not a UI/calculation display defect, which is exactly the condition already flagged as the escalation trigger.\n\nPriority: Critical / immediate hotfix — a confirmed revenue-impacting defect triggered by an ordinary user action (double-click) on the highest-traffic checkout path cannot wait for a normal release cycle; it needs an emergency patch or a temporary mitigation (e.g., rate-limiting the endpoint) before the next scheduled deploy.`,

  q3: `Freeze sources + one concrete fix (Web Worker offload)\n\nSpecific lines that would cause a dropped-frame/freeze on a Chromebook at 20k rows:\nconst filtered = useMemo(() => filterRows(data, columns, debouncedQuery), [data, columns, debouncedQuery]);\nconst sorted = useMemo(() => { ...; return sortRows(filtered, sort.key, sort.direction, col?.sortFn); }, [filtered, sort, columns]);\nBoth recompute a full O(n) filter / O(n log n) sort over the entire data array synchronously on the main thread, and critically — they're gated on data itself, not just the debounced query. If a parent re-fetches or a WebSocket streams row updates, data changes frequently and neither useMemo has any throttling for that path (debounce only applies to query). And separately: {pageRows.map((row, i) => (<tr>...))} renders exactly pageSize DOM rows with no cap — pageSize={5000} renders 5000 <tr> elements in one commit, a classic large-DOM freeze independent of the sort/filter cost.\n\nThe one fix — offload filterRows/sortRows to a Web Worker, keeping DataTableProps<T> unchanged:\n\n// dataTableWorker.ts — runs off the main thread\nimport { filterRows, sortRows } from './dataTableUtils';\n\nself.onmessage = (e) => {\n  const { requestId, data, columnKeys, query, sortKey, sortDirection } = e.data;\n  const pseudoColumns = columnKeys.map((key) => ({ key }));\n  let result = filterRows(data, pseudoColumns, query);\n  if (sortKey) result = sortRows(result, sortKey, sortDirection);\n  (self as any).postMessage({ requestId, rows: result });\n};\n\n// internal hook — replaces the two useMemos, same inputs/outputs, no prop changes\nfunction useOffloadedFilterSort<T extends object>(\n  data: T[],\n  columns: ColumnDef<T>[],\n  debouncedQuery: string,\n  sort: SortState<T>,\n  workerThreshold = 5000\n): T[] {\n  const [result, setResult] = useState<T[]>([]);\n  const workerRef = useRef<Worker | null>(null);\n  const latestRequestId = useRef(0);\n  const hasCustomSortFn = !!(sort.key && columns.find((c) => c.key === sort.key)?.sortFn);\n  const useWorker = data.length >= workerThreshold && !hasCustomSortFn; // functions can't cross postMessage, so a custom sortFn stays synchronous\n\n  useEffect(() => {\n    if (!useWorker) return;\n    workerRef.current = new Worker(new URL('./dataTableWorker.ts', import.meta.url));\n    workerRef.current.onmessage = (e) => {\n      if (e.data.requestId === latestRequestId.current) setResult(e.data.rows);\n    };\n    return () => workerRef.current?.terminate();\n  }, [useWorker]);\n\n  useEffect(() => {\n    if (!useWorker) {\n      let r = filterRows(data, columns, debouncedQuery);\n      if (sort.key) r = sortRows(r, sort.key, sort.direction, columns.find((c) => c.key === sort.key)?.sortFn);\n      setResult(r);\n      return;\n    }\n    const id = ++latestRequestId.current;\n    workerRef.current?.postMessage({\n      requestId: id,\n      data,\n      columnKeys: columns.map((c) => c.key),\n      query: debouncedQuery,\n      sortKey: sort.key,\n      sortDirection: sort.direction,\n    });\n  }, [data, columns, debouncedQuery, sort, useWorker]);\n\n  return result;\n}\n\nPlugged in by replacing the two useMemo blocks in DataTable with one call: const sorted = useOffloadedFilterSort(data, columns, debouncedQuery, sort); — DataTableProps<T> is untouched; this is purely an internal implementation swap, small datasets (< 5000 rows, or any column using a custom sortFn) stay on the original synchronous path since the worker overhead isn't worth it there.\n\nCompanion one-liner for the named pageSize={5000} case, cheap enough to include alongside without it being "a second fix": const effectivePageSize = Math.min(pageSize, 200); used wherever pageSize currently drives pageRows/totalPages — caps rendered <tr> count regardless of what a consumer passes in.`
};

export default function Home() {
  // Main Config States
  const [submissionId, setSubmissionId] = useState("568744f7-c0b1-499c-8c91-bc99330f4202");
  const [baseUrl, setBaseUrl] = useState("https://caliber.antiers.work/api/v1/submissions");
  
  // Headers State
  const [authorization, setAuthorization] = useState(
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjI0YzI5YS0yODMzLTQzMGItYTc0ZC0zZjFhY2M3ZWU0MzUiLCJlbWFpbCI6Im5lZXJhai5rdW1hckBhbnRpZXJzb2x1dGlvbnMuY29tIiwicm9sZSI6ImxlYXJuZXIiLCJvcmdJZCI6ImZkNzk1NTBlLTBkYjctNDE1NS04MjgwLWVhM2MwMThhZjE5MyIsImp0aSI6ImQ1YmY1YjgwLWFlMDktNGRlYy05YjZlLTRhNmYyNDQ2ZDU3OCIsImlhdCI6MTc4NzcyOTE2OSwiZXhwIjoxNzg3NzMwMDY5fQ.BXhrO7MyirLU4a5xFUjPGRtRpoS5oT-lHllpEolnl_U"
  );
  const [cookie, setCookie] = useState(
    "refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjI0YzI5YS0yODMzLTQzMGItYTc0ZC0zZjFhY2M3ZWU0MzUiLCJub25jZSI6IjA0YTRiMWIzLWIxNWMtNGRiMy04ZmRiLTg5MWY1MTA2NzVlZiIsImlhdCI6MTc4NzcyOTE2OSwiZXhwIjoxNzg4MzMzOTY5fQ.uJMZc6DVO8nBJGpnBvzYd0HWbt44QnAWGxQbRYqV-iM; access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjI0YzI5YS0yODMzLTQzMGItYTc0ZC0zZjFhY2M3ZWU0MzUiLCJlbWFpbCI6Im5lZXJhai5rdW1hckBhbnRpZXJzb2x1dGlvbnMuY29tIiwicm9sZSI6ImxlYXJuZXIiLCJvcmdJZCI6ImZkNzk1NTBlLTBkYjctNDE1NS04MjgwLWVhM2MwMThhZjE5MyIsImp0aSI6ImQ1YmY1YjgwLWFlMDktNGRlYy05YjZlLTRhNmYyNDQ2ZDU3OCIsImlhdCI6MTc4NzcyOTE2OSwiZXhwIjoxNzg3NzMwMDY5fQ.BXhrO7MyirLU4a5xFUjPGRtRpoS5oT-lHllpEolnl_U; _lr_hb_-xwvneq%2Fcaliber={%22heartbeat%22:1787729383193}; _lr_tabs_-xwvneq%2Fcaliber={%22recordingID%22:%226-01a03c78-1c0e-7338-a5a7-4d3b768c89b3%22%2C%22sessionID%22:0%2C%22lastActivity%22:1787729383341%2C%22hasActivity%22:true%2C%22confirmed%22:true%2C%22clearsIdentifiedUser%22:false}"
  );

  // Secondary cURL Input State
  const [secondaryCurl, setSecondaryCurl] = useState("");
  const [secondaryStatus, setSecondaryStatus] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Payload Body States
  const [questionId, setQuestionId] = useState("q3");
  const [answer, setAnswer] = useState(INITIAL_ANSWERS["q3"]);

  // Keystroke Metrics State
  const [keystroke, setKeystroke] = useState({
    keystrokeCount: 2125,
    backspaceCount: 120,
    finalLength: 2175,
    avgIntervalMs: 147,
    intervalStdDevMs: 515,
    unmatchedInsertionChars: 0,
    compositionCharsTotal: 0,
    compositionEventCount: 0,
    compositionDurationMs: 0,
  });

  // Automation Flags State
  const [automation, setAutomation] = useState({
    webdriver: false,
    noPlugins: false,
    noChromeRuntime: false,
    noMouseMovement: false,
    suspicious: false,
  });

  // UI & Execution States
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"curl" | "response" | "jsonBody">("curl");

  // Computed Full URL
  const targetUrl = `${baseUrl.replace(/\/$/, "")}/${submissionId}/probe/answer`;

  // Handle Question ID change & sync initial answer if available
  const handleQuestionChange = (newQId: string) => {
    setQuestionId(newQId);
    if (INITIAL_ANSWERS[newQId]) {
      const newAns = INITIAL_ANSWERS[newQId];
      setAnswer(newAns);
      autoCalculateKeystrokes(newAns);
    }
  };

  // Auto-estimate keystrokes based on answer text
  const autoCalculateKeystrokes = (text: string) => {
    const len = text.length;
    const bs = keystroke.backspaceCount || 120;
    setKeystroke((prev) => ({
      ...prev,
      finalLength: len,
      keystrokeCount: len + bs * 2,
    }));
  };

  // Analyze Secondary cURL and extract Authorization, Cookie, Submission ID & Body
  const handleParseSecondaryCurl = () => {
    if (!secondaryCurl.trim()) {
      setSecondaryStatus({ type: "error", msg: "Please paste a secondary cURL request first!" });
      return;
    }

    try {
      const parsed: ParsedCurl = parseCurlCommand(secondaryCurl);
      let updatedCount = 0;
      const extractedFields: string[] = [];

      if (parsed.authorization) {
        setAuthorization(parsed.authorization);
        updatedCount++;
        extractedFields.push("Authorization");
      }

      if (parsed.cookie) {
        setCookie(parsed.cookie);
        updatedCount++;
        extractedFields.push("Cookie");
      }

      if (parsed.submissionId) {
        setSubmissionId(parsed.submissionId);
        updatedCount++;
        extractedFields.push("Submission ID");
      }

      if (parsed.bodyData && typeof parsed.bodyData === "object") {
        if (parsed.bodyData.questionId) {
          setQuestionId(parsed.bodyData.questionId);
          extractedFields.push("Question ID");
        }
        if (typeof parsed.bodyData.answer === "string") {
          setAnswer(parsed.bodyData.answer);
          extractedFields.push("Answer Text");
        }
        if (parsed.bodyData.keystroke && typeof parsed.bodyData.keystroke === "object") {
          setKeystroke((prev) => ({ ...prev, ...parsed.bodyData.keystroke }));
          extractedFields.push("Keystrokes");
        }
        if (parsed.bodyData.automation && typeof parsed.bodyData.automation === "object") {
          setAutomation((prev) => ({ ...prev, ...parsed.bodyData.automation }));
          extractedFields.push("Automation Flags");
        }
        updatedCount++;
      }

      if (updatedCount > 0) {
        setSecondaryStatus({
          type: "success",
          msg: `Successfully extracted and updated: ${extractedFields.join(", ")}!`,
        });
      } else {
        setSecondaryStatus({
          type: "info",
          msg: "No Authorization, Cookie, or JSON Body detected in the pasted cURL. Make sure it contains valid headers and body.",
        });
      }
    } catch (err: any) {
      setSecondaryStatus({ type: "error", msg: `Failed to parse cURL: ${err.message}` });
    }
  };

  // Construct JSON Payload Object
  const payloadObject = {
    questionId,
    answer,
    keystroke,
    automation,
  };

  // Formatted JSON string
  const jsonBodyString = JSON.stringify(payloadObject, null, 2);
  // Escape single quotes for bash execution: ' -> '\''
  const bashSafeJson = jsonBodyString.replace(/'/g, "'\\''");

  // Generate runnable cURL string
  const generatedCurl = `curl --location '${targetUrl}' \\
--header 'accept: application/json, text/plain, */*' \\
--header 'accept-language: en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7' \\
--header 'authorization: ${authorization}' \\
--header 'cache-control: no-cache' \\
--header 'content-type: application/json' \\
--header 'origin: https://caliber.antiers.work' \\
--header 'pragma: no-cache' \\
--header 'priority: u=1, i' \\
--header 'referer: https://caliber.antiers.work/dashboard/modules/5583e11c-d61e-4e31-8b8a-2167fb15379f' \\
--header 'sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"' \\
--header 'sec-ch-ua-mobile: ?0' \\
--header 'sec-ch-ua-platform: "Linux"' \\
--header 'sec-fetch-dest: empty' \\
--header 'sec-fetch-mode: cors' \\
--header 'sec-fetch-site: same-origin' \\
--header 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36' \\
--header 'Cookie: ${cookie}' \\
--data '${bashSafeJson}'`;

  // Copy cURL to Clipboard
  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generatedCurl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Execute API Request via Next.js Proxy Route
  const handleExecuteRequest = async () => {
    setLoading(true);
    setApiResponse(null);
    setActiveTab("response");

    const reqHeaders = {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7",
      "authorization": authorization,
      "cache-control": "no-cache",
      "content-type": "application/json",
      "origin": "https://caliber.antiers.work",
      "pragma": "no-cache",
      "referer": "https://caliber.antiers.work/dashboard/modules/5583e11c-d61e-4e31-8b8a-2167fb15379f",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
      "Cookie": cookie,
    };

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetUrl,
          headers: reqHeaders,
          method: "POST",
          body: payloadObject,
        }),
      });

      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: err.message || "Network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  // Execute Pasted/Secondary cURL directly
  const handleExecutePastedCurl = async () => {
    if (!secondaryCurl.trim()) {
      setSecondaryStatus({ type: "error", msg: "Please paste a cURL request first!" });
      return;
    }

    setLoading(true);
    setApiResponse(null);
    setActiveTab("response");

    try {
      const parsed: ParsedCurl = parseCurlCommand(secondaryCurl);
      
      const execUrl = parsed.url || targetUrl;
      const execHeaders: Record<string, string> = { ...parsed.headers };

      if (!execHeaders["authorization"] && parsed.authorization) {
        execHeaders["authorization"] = parsed.authorization;
      }
      if (!execHeaders["Cookie"] && parsed.cookie) {
        execHeaders["Cookie"] = parsed.cookie;
      }
      if (!execHeaders["content-type"]) {
        execHeaders["content-type"] = "application/json";
      }

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetUrl: execUrl,
          headers: execHeaders,
          method: "POST",
          body: parsed.bodyData || payloadObject,
        }),
      });

      const data = await res.json();
      setApiResponse(data);
      setSecondaryStatus({
        type: "success",
        msg: `Executed pasted cURL request for URL: ${execUrl}`,
      });
    } catch (err: any) {
      setApiResponse({ error: err.message || "Failed to execute pasted cURL" });
      setSecondaryStatus({ type: "error", msg: `Execution error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* App Header */}
      <header className="app-header">
        <div className="header-title-group">
          <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "0.5rem", borderRadius: "10px", color: "#818cf8" }}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h1 className="app-title">Caliber Probe API Studio</h1>
              <span className="app-badge">Next.js 15</span>
            </div>
            <p className="app-subtitle">Extract headers, customize question payload & keystrokes, and trigger submissions.</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-secondary" onClick={handleCopyCurl}>
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy cURL"}
          </button>
          <button className="btn btn-primary" onClick={handleExecuteRequest} disabled={loading}>
            {loading ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
            {loading ? "Sending..." : "Execute API Request"}
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="studio-grid">
        {/* Left Column: API Credentials & Header Token Extractor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Card 1: Submission Endpoint & Query ID */}
          <div className="studio-card">
            <div className="card-header">
              <h2 className="card-title">
                <Database size={18} color="#6366f1" /> Endpoint Configuration
              </h2>
              <span className="form-label-note">POST Method</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Submission ID (URL Path parameter)
                <span className="form-label-note">Auto-updates target URL</span>
              </label>
              <input
                type="text"
                className="input-text input-mono"
                value={submissionId}
                onChange={(e) => setSubmissionId(e.target.value)}
                placeholder="e.g. 568744f7-c0b1-499c-8c91-bc99330f4202"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Endpoint URL</label>
              <input
                type="text"
                className="input-text input-mono"
                value={targetUrl}
                readOnly
                style={{ opacity: 0.85, background: "rgba(0,0,0,0.3)" }}
              />
            </div>
          </div>

          {/* Card 2: Secondary cURL Token Extractor */}
          <div className="studio-card" style={{ borderColor: "rgba(6, 182, 212, 0.3)" }}>
            <div className="card-header">
              <h2 className="card-title">
                <Sparkles size={18} color="#06b6d4" /> Secondary cURL Header Extractor
              </h2>
              <span className="app-badge" style={{ background: "rgba(6,182,212,0.15)", borderColor: "rgba(6,182,212,0.3)", color: "#67e8f9" }}>
                Auto-Parse
              </span>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Paste ANY new cURL request below. Click <strong>&quot;Extract &amp; Inject Tokens&quot;</strong> to automatically parse its <code>authorization</code> Bearer token and <code>Cookie</code> string into your request!
            </p>

            <textarea
              className="input-textarea input-mono"
              rows={4}
              placeholder="Paste secondary cURL request here..."
              value={secondaryCurl}
              onChange={(e) => setSecondaryCurl(e.target.value)}
            />

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn btn-accent btn-sm" onClick={handleParseSecondaryCurl}>
                  <ArrowRight size={14} /> Extract &amp; Inject Tokens
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleExecutePastedCurl}
                  disabled={loading}
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  {loading ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
                  Execute Pasted cURL Directly
                </button>
              </div>

              {secondaryCurl && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSecondaryCurl(""); setSecondaryStatus(null); }}
                >
                  Clear Input
                </button>
              )}
            </div>

            {secondaryStatus && (
              <div className={`alert-banner alert-${secondaryStatus.type}`}>
                {secondaryStatus.type === "success" && <ShieldCheck size={16} />}
                {secondaryStatus.msg}
              </div>
            )}
          </div>

          {/* Card 3: Active Headers (Auth & Cookie) */}
          <div className="studio-card">
            <div className="card-header">
              <h2 className="card-title">
                <Key size={18} color="#f59e0b" /> Active Authentication Headers
              </h2>
            </div>
            {/* rest remains same */}

            <div className="form-group">
              <label className="form-label">
                Authorization Header (Bearer JWT)
              </label>
              <textarea
                className="input-textarea input-mono"
                rows={2}
                value={authorization}
                onChange={(e) => setAuthorization(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Cookie Header
              </label>
              <textarea
                className="input-textarea input-mono"
                rows={3}
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* Right Column: Payload Customizer (Question ID, Answer, Keystrokes, Automation) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="studio-card">
            <div className="card-header">
              <h2 className="card-title">
                <FileText size={18} color="#10b981" /> Question &amp; Answer Payload
              </h2>
            </div>

            {/* Question ID Dropdown & Selector */}
            <div className="form-group">
              <label className="form-label">
                Question ID Dropdown
                <span className="form-label-note">Select or type custom ID</span>
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select
                  className="input-select"
                  value={questionId}
                  onChange={(e) => handleQuestionChange(e.target.value)}
                  style={{ width: "140px" }}
                >
                  <option value="q1">q1 (Probe 1)</option>
                  <option value="q2">q2 (Probe 2)</option>
                  <option value="q3">q3 (Probe 3)</option>
                  <option value="q4">q4 (Probe 4)</option>
                  <option value="q5">q5 (Probe 5)</option>
                  <option value="custom">Custom ID...</option>
                </select>

                <input
                  type="text"
                  className="input-text input-mono"
                  value={questionId}
                  onChange={(e) => setQuestionId(e.target.value)}
                  placeholder="e.g. q1"
                />
              </div>
            </div>

            {/* Answer Box */}
            <div className="form-group">
              <div className="form-label">
                <span>Answer Text Content (Accepts code, newlines &amp; all chars)</span>
                <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                  Length: {answer.length} chars
                </span>
              </div>
              <textarea
                className="input-textarea input-mono"
                rows={8}
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  autoCalculateKeystrokes(e.target.value);
                }}
                placeholder="Enter probe answer text here..."
              />
            </div>

            {/* Quick Answer Loaders */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuestionChange("q1")}
              >
                Load Preset Q1 Answer
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuestionChange("q3")}
              >
                Load Preset Q3 Answer
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => autoCalculateKeystrokes(answer)}
              >
                <RefreshCw size={12} /> Sync Keystroke Length
              </button>
            </div>

            {/* Keystroke Fields Config */}
            <div style={{ marginTop: "0.75rem" }}>
              <div className="form-label" style={{ marginBottom: "0.5rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Sliders size={14} color="#a5b4fc" /> Keystroke Metrics Parameters
                </span>
                <span className="form-label-note">Editable input fields</span>
              </div>

              <div className="keystroke-grid">
                <div className="keystroke-item">
                  <label>keystrokeCount</label>
                  <input
                    type="number"
                    value={keystroke.keystrokeCount}
                    onChange={(e) => setKeystroke({ ...keystroke, keystrokeCount: Number(e.target.value) })}
                  />
                </div>

                <div className="keystroke-item">
                  <label>backspaceCount</label>
                  <input
                    type="number"
                    value={keystroke.backspaceCount}
                    onChange={(e) => setKeystroke({ ...keystroke, backspaceCount: Number(e.target.value) })}
                  />
                </div>

                <div className="keystroke-item">
                  <label>finalLength</label>
                  <input
                    type="number"
                    value={keystroke.finalLength}
                    onChange={(e) => setKeystroke({ ...keystroke, finalLength: Number(e.target.value) })}
                  />
                </div>

                <div className="keystroke-item">
                  <label>avgIntervalMs</label>
                  <input
                    type="number"
                    value={keystroke.avgIntervalMs}
                    onChange={(e) => setKeystroke({ ...keystroke, avgIntervalMs: Number(e.target.value) })}
                  />
                </div>

                <div className="keystroke-item">
                  <label>intervalStdDevMs</label>
                  <input
                    type="number"
                    value={keystroke.intervalStdDevMs}
                    onChange={(e) => setKeystroke({ ...keystroke, intervalStdDevMs: Number(e.target.value) })}
                  />
                </div>

                <div className="keystroke-item">
                  <label>unmatchedInsertions</label>
                  <input
                    type="number"
                    value={keystroke.unmatchedInsertionChars}
                    onChange={(e) => setKeystroke({ ...keystroke, unmatchedInsertionChars: Number(e.target.value) })}
                  />
                </div>

                <div className="keystroke-item">
                  <label>compositionChars</label>
                  <input
                    type="number"
                    value={keystroke.compositionCharsTotal}
                    onChange={(e) => setKeystroke({ ...keystroke, compositionCharsTotal: Number(e.target.value) })}
                  />
                </div>

                <div className="keystroke-item">
                  <label>compositionEvents</label>
                  <input
                    type="number"
                    value={keystroke.compositionEventCount}
                    onChange={(e) => setKeystroke({ ...keystroke, compositionEventCount: Number(e.target.value) })}
                  />
                </div>

                <div className="keystroke-item">
                  <label>compositionDuration</label>
                  <input
                    type="number"
                    value={keystroke.compositionDurationMs}
                    onChange={(e) => setKeystroke({ ...keystroke, compositionDurationMs: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Automation Flags */}
            <div style={{ marginTop: "0.75rem" }}>
              <div className="form-label" style={{ marginBottom: "0.5rem" }}>
                <span>Automation Flags</span>
                <span className="form-label-note">Browser fingerprint simulation</span>
              </div>

              <div className="toggle-grid">
                {Object.keys(automation).map((key) => {
                  const active = (automation as any)[key];
                  return (
                    <div
                      key={key}
                      className={`toggle-card ${active ? "active" : ""}`}
                      onClick={() => setAutomation({ ...automation, [key]: !active })}
                    >
                      <span className="toggle-label">{key}</span>
                      <div className="toggle-switch">
                        <div className="toggle-knob" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Generated cURL & Live Execution Output Panel */}
      <div className="studio-card" style={{ marginTop: "1rem" }}>
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === "curl" ? "active" : ""}`}
            onClick={() => setActiveTab("curl")}
          >
            <Code size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
            Generated cURL Command
          </button>
          
          <button
            className={`tab-btn ${activeTab === "jsonBody" ? "active" : ""}`}
            onClick={() => setActiveTab("jsonBody")}
          >
            <FileText size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
            Parsed Payload JSON
          </button>

          <button
            className={`tab-btn ${activeTab === "response" ? "active" : ""}`}
            onClick={() => setActiveTab("response")}
          >
            <Zap size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
            Live Response {apiResponse && `(${apiResponse.status || "Completed"})`}
          </button>
        </div>

        {activeTab === "curl" && (
          <div className="code-container">
            <div className="code-header">
              <span>Executable bash command with updated submission ID &amp; injected tokens</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-primary btn-sm" onClick={handleExecuteRequest} disabled={loading}>
                  {loading ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
                  Run This cURL
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleCopyCurl}>
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <pre className="code-body">{generatedCurl}</pre>
          </div>
        )}

        {activeTab === "jsonBody" && (
          <div className="code-container">
            <div className="code-header">
              <span>Request Body JSON</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(payloadObject, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                Copy JSON
              </button>
            </div>
            <pre className="code-body">{JSON.stringify(payloadObject, null, 2)}</pre>
          </div>
        )}

        {activeTab === "response" && (
          <div className="code-container">
            <div className="code-header">
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <span>API Execution Output</span>
                {apiResponse && (
                  <span
                    className="app-badge"
                    style={{
                      background: apiResponse.ok ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)",
                      color: apiResponse.ok ? "#6ee7b7" : "#fda4af",
                      borderColor: apiResponse.ok ? "rgba(16,185,129,0.4)" : "rgba(244,63,94,0.4)",
                    }}
                  >
                    STATUS: {apiResponse.status || "ERROR"} ({apiResponse.responseTimeMs || 0}ms)
                  </span>
                )}
              </div>
            </div>
            <pre className="code-body">
              {loading
                ? "Sending request to Caliber API server via Next.js proxy route..."
                : apiResponse
                ? JSON.stringify(apiResponse, null, 2)
                : "No response yet. Click 'Execute API Request' above to test the request."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
