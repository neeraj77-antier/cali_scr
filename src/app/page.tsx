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
  Database,
  Lock,
  Unlock,
  ShieldAlert,
  MessageSquare,
  Send,
  CheckCircle2,
  ListOrdered,
  Layers,
  HelpCircle
} from "lucide-react";

export default function Home() {
  // Authentication & Security States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Active Studio Mode: "probe" | "interview"
  const [studioMode, setStudioMode] = useState<"probe" | "interview">("interview");

  // Main Config States - Probe Submissions
  const [submissionId, setSubmissionId] = useState("");
  const [probeBaseUrl, setProbeBaseUrl] = useState("https://caliber.antiers.work/api/v1/submissions");

  // Main Config States - Interview Studio
  const [moduleId, setModuleId] = useState("f147f619-a3cc-4c10-b134-3d78ebd2a7ca");
  const [interviewId, setInterviewId] = useState("bb7a6e59-7c1d-40af-b803-8ef1e9c50b6e");
  const [interviewStatus, setInterviewStatus] = useState<"not_started" | "active" | "completed">("not_started");
  const [interviewAction, setInterviewAction] = useState<"start" | "message" | "complete">("start");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [interviewAnswer, setInterviewAnswer] = useState<string>("");
  const [interviewHistory, setInterviewHistory] = useState<Array<{ role: "interviewer" | "candidate"; text: string; timestamp: string }>>([]);

  // Shared Headers State
  const [authorization, setAuthorization] = useState(
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YzY3YzRkOC0yYzlmLTQxMDgtYThmZi00MGM4MGNhNDlkNDEiLCJlbWFpbCI6Im11c2thbi5zYWluaUBhbnRpZXJzb2x1dGlvbnMuY29tIiwicm9sZSI6ImxlYXJuZXIiLCJvcmdJZCI6ImZkNzk1NTBlLTBkYjctNDE1NS04MjgwLWVhM2MwMThhZjE5MyIsImp0aSI6IjlmNDhiNWRiLWIwOTItNDljYi1iOWJiLTNjM2JjOGVjYjI3MiIsImlhdCI6MTc4ODE3ODg2OCwiZXhwIjoxNzg4MTc5NzY4fQ.6bm8LWz0owaRYAlnei_D4S1CI-HUJEzZwXXy3pm3FFA"
  );
  const [cookie, setCookie] = useState(
    "lr_hb-xwvneq%2Fcaliber={%22heartbeat%22:1788168962728}; lr_tabs-xwvneq%2Fcaliber={%22recordingID%22:%226-01a0572c-9782-7b1b-9147-1b93d3fe22ec%22%2C%22sessionID%22:0%2C%22lastActivity%22:1788169009517%2C%22hasActivity%22:false%2C%22confirmed%22:true%2C%22clearsIdentifiedUser%22:false}; refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YzY3YzRkOC0yYzlmLTQxMDgtYThmZi00MGM4MGNhNDlkNDEiLCJub25jZSI6IjVkMDgyZWMyLTBhODItNDBkMC1hN2E3LTRkYzZkN2M5OTRiNSIsImlhdCI6MTc4ODE3ODg2OCwiZXhwIjoxNzg4Nzg3NjY4fQ.yhoHScHR-Q-R4ZDdN9FybvzBSG_N03HiSjdQopeRoGg; access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YzY3YzRkOC0yYzlmLTQxMDgtYThmZi00MGM4MGNhNDlkNDEiLCJlbWFpbCI6Im11c2thbi5zYWluaUBhbnRpZXJzb2x1dGlvbnMuY29tIiwicm9sZSI6ImxlYXJuZXIiLCJvcmdJZCI6ImZkNzk1NTBlLTBkYjctNDE1NS04MjgwLWVhM2MwMThhZjE5MyIsImp0aSI6IjlmNDhiNWRiLWIwOTItNDljYi1iOWJiLTNjM2JjOGVjYjI3MiIsImlhdCI6MTc4ODE3ODg2OCwiZXhwIjoxNzg4MTc5NzY4fQ.6bm8LWz0owaRYAlnei_D4S1CI-HUJEzZwXXy3pm3FFA"
  );

  // Secondary cURL Input State
  const [secondaryCurl, setSecondaryCurl] = useState("");
  const [secondaryStatus, setSecondaryStatus] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Probe Payload Body States
  const [questionId, setQuestionId] = useState("q1");
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [probeAnswer, setProbeAnswer] = useState("");
  const [answerView, setAnswerView] = useState<"batch" | "active">("batch");

  // Interview Metadata State
  const [interviewMetadata, setInterviewMetadata] = useState({
    pasteEvents: 0,
    focusLossCount: 0,
    focusLossMs: 0,
    timeOnTaskMs: 0,
    viewedAt: new Date().toISOString(),
  });

  // Keystroke Metrics State
  const [keystroke, setKeystroke] = useState({
    keystrokeCount: 0,
    backspaceCount: 0,
    finalLength: 0,
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
    languagesEmpty: false,
    noMouseMovement: false,
    suspicious: false,
  });

  // UI & Execution States
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"curl" | "response" | "jsonBody">("curl");
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  // Interview Turn Tracking
  const [turnCount, setTurnCount] = useState(0);
  const [maxTurns, setMaxTurns] = useState(12);

  useEffect(() => {
    setIsMounted(true);
    const savedAuth = localStorage.getItem("caliber_studio_auth");
    if (savedAuth === "LUDHIANA") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput.trim() === "LUDHIANA") {
      setIsAuthenticated(true);
      localStorage.setItem("caliber_studio_auth", "LUDHIANA");
      setAuthError("");
      setPasswordInput("");
    } else {
      setAuthError("Invalid access password. Access denied.");
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("caliber_studio_auth");
  };

  // Helper for computing active cURL target URL & payload
  const getActiveEndpoint = () => {
    if (studioMode === "probe") {
      return `${probeBaseUrl.replace(/\/$/, "")}/${submissionId}/probe/answer`;
    }
    if (interviewAction === "start") {
      return "https://caliber.antiers.work/api/v1/interviews";
    }
    if (interviewAction === "complete") {
      return `https://caliber.antiers.work/api/v1/interviews/${interviewId}/complete`;
    }
    return `https://caliber.antiers.work/api/v1/interviews/${interviewId}/message`;
  };

  const getActivePayload = () => {
    if (studioMode === "probe") {
      return {
        questionId,
        answer: probeAnswer,
        keystroke,
        automation,
      };
    }
    if (interviewAction === "start") {
      return { moduleId };
    }
    if (interviewAction === "complete") {
      return {
        metadata: {
          ...interviewMetadata,
          viewedAt: new Date().toISOString(),
          keystroke: {
            ...keystroke,
            finalLength: 0,
          },
          automation,
        },
      };
    }
    return {
      content: interviewAnswer,
      metadata: {
        ...interviewMetadata,
        viewedAt: new Date().toISOString(),
        keystroke: {
          ...keystroke,
          finalLength: interviewAnswer.length,
        },
        automation,
      },
    };
  };

  const targetUrl = getActiveEndpoint();
  const payloadObject = getActivePayload();
  const jsonBodyString = JSON.stringify(payloadObject, null, 2);
  const bashSafeJson = jsonBodyString.replace(/'/g, "'\\''");

  const generatedCurl = `curl --location '${targetUrl}' \\
--header 'accept: application/json, text/plain, */*' \\
--header 'accept-language: en-US,en;q=0.9' \\
--header 'authorization: ${authorization}' \\
--header 'content-type: application/json' \\
--header 'origin: https://caliber.antiers.work' \\
--header 'priority: u=1, i' \\
--header 'referer: https://caliber.antiers.work/dashboard/modules/${moduleId}' \\
--header 'sec-ch-ua: "Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"' \\
--header 'sec-ch-ua-mobile: ?0' \\
--header 'sec-ch-ua-platform: "Linux"' \\
--header 'sec-fetch-dest: empty' \\
--header 'sec-fetch-mode: cors' \\
--header 'sec-fetch-site: same-origin' \\
--header 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36' \\
--header 'Cookie: ${cookie}' \\
--data '${bashSafeJson}'`;

  // Explicitly Trigger Fresh cURL Generation & Focus Tab
  const handleGenerateNewCurl = () => {
    setActiveTab("curl");
    if (studioMode === "probe") {
      autoCalculateKeystrokes(probeAnswer);
    } else {
      autoCalculateKeystrokes(interviewAnswer);
    }
    setGenerateMessage("Fresh cURL command generated with updated payload!");
    setTimeout(() => setGenerateMessage(null), 3000);
  };

  // Handle Question ID change & sync saved answer for Probe Studio
  const handleQuestionChange = (newQId: string) => {
    setQuestionId(newQId);
    const targetAns = answersMap[newQId] || "";
    setProbeAnswer(targetAns);
    autoCalculateKeystrokes(targetAns);
  };

  // Handle Probe Answer text change
  const handleProbeAnswerChange = (newAns: string) => {
    setProbeAnswer(newAns);
    setAnswersMap((prev) => ({ ...prev, [questionId]: newAns }));
    autoCalculateKeystrokes(newAns);
  };

  const handleSpecificAnswerChange = (qId: string, newAns: string) => {
    setAnswersMap((prev) => ({ ...prev, [qId]: newAns }));
    if (questionId === qId) {
      setProbeAnswer(newAns);
      autoCalculateKeystrokes(newAns);
    }
  };

  // Handle Interview Answer text change
  const handleInterviewAnswerChange = (newAns: string) => {
    setInterviewAnswer(newAns);
    autoCalculateKeystrokes(newAns);
  };

  // Auto-estimate keystrokes based on answer text
  const autoCalculateKeystrokes = (text: string) => {
    const len = text.length;
    const bs = keystroke.backspaceCount || 0;
    setKeystroke((prev) => ({
      ...prev,
      finalLength: len,
      keystrokeCount: len + bs * 2,
    }));
  };

  // Analyze Secondary cURL and extract Authorization, Cookie, Submission ID, Interview ID, Module ID & Body
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
        setStudioMode("probe");
      }

      if (parsed.interviewId) {
        setInterviewId(parsed.interviewId);
        updatedCount++;
        extractedFields.push("Interview ID");
        setStudioMode("interview");

        // Detect action from URL suffix
        if (parsed.url.includes("/complete")) {
          setInterviewAction("complete");
          extractedFields.push("Action → Complete Test");
        } else if (parsed.url.includes("/message")) {
          setInterviewAction("message");
          extractedFields.push("Action → Submit Answer");
        }
      }

      // Start Interview: URL is /interviews with no UUID — only moduleId in body
      if (!parsed.interviewId && parsed.url.match(/\/interviews\s*$|\/interviews['"]?\s/i)) {
        setStudioMode("interview");
        setInterviewAction("start");
        updatedCount++;
        extractedFields.push("Action → Start Interview");
      }

      if (parsed.moduleId) {
        setModuleId(parsed.moduleId);
        updatedCount++;
        extractedFields.push("Module ID");
      }

      if (parsed.bodyData && typeof parsed.bodyData === "object") {
        if (parsed.bodyData.questionId) {
          const qId = parsed.bodyData.questionId;
          setQuestionId(qId);
          extractedFields.push("Question ID");
        }

        if (typeof parsed.bodyData.answer === "string") {
          setProbeAnswer(parsed.bodyData.answer);
          setAnswersMap((prev) => ({ ...prev, [parsed.bodyData.questionId || questionId]: parsed.bodyData.answer }));
          autoCalculateKeystrokes(parsed.bodyData.answer);
          extractedFields.push("Probe Answer");
        }

        if (typeof parsed.bodyData.content === "string") {
          setInterviewAnswer(parsed.bodyData.content);
          autoCalculateKeystrokes(parsed.bodyData.content);
          extractedFields.push("Interview Answer Content");
          setStudioMode("interview");
          setInterviewAction("message");
        }

        if (parsed.bodyData.metadata && typeof parsed.bodyData.metadata === "object") {
          setInterviewMetadata((prev) => ({ ...prev, ...parsed.bodyData.metadata }));
          if (parsed.bodyData.metadata.keystroke) {
            setKeystroke((prev) => ({ ...prev, ...parsed.bodyData.metadata.keystroke }));
          }
          if (parsed.bodyData.metadata.automation) {
            setAutomation((prev) => ({ ...prev, ...parsed.bodyData.metadata.automation }));
          }
          extractedFields.push("Interview Metadata");
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
          msg: "No Authorization, Cookie, or JSON Body detected in the pasted cURL.",
        });
      }
    } catch (err: any) {
      setSecondaryStatus({ type: "error", msg: `Failed to parse cURL: ${err.message}` });
    }
  };

  // Copy cURL to Clipboard
  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generatedCurl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to extract question/message from API response
  const extractQuestionFromResponse = (data: any): string | null => {
    if (!data) return null;
    if (typeof data === "string") return data;

    // Actual Caliber API field — highest priority
    if (data.interviewerMsg) return data.interviewerMsg;

    // Fallback common field names
    if (data.question) return data.question;
    if (data.content) return data.content;
    if (data.message) return data.message;
    if (data.nextQuestion) return data.nextQuestion;

    if (Array.isArray(data.messages) && data.messages.length > 0) {
      const last = data.messages[data.messages.length - 1];
      if (typeof last === "string") return last;
      if (last?.content) return last.content;
      if (last?.text) return last.text;
    }

    if (data.interview?.messages && Array.isArray(data.interview.messages)) {
      const last = data.interview.messages[data.interview.messages.length - 1];
      if (last?.content) return last.content;
    }

    if (data.data) {
      return extractQuestionFromResponse(data.data);
    }

    return null;
  };

  // Helper to extract Interview / Session ID from Start Interview response
  const extractInterviewIdFromResponse = (data: any): string | null => {
    if (!data) return null;
    if (typeof data !== "object") return null;

    // Actual Caliber API field — highest priority
    if (data.sessionId && typeof data.sessionId === "string") return data.sessionId;

    // Fallback common field names
    if (data.id && typeof data.id === "string") return data.id;
    if (data.interviewId && typeof data.interviewId === "string") return data.interviewId;
    if (data._id && typeof data._id === "string") return data._id;
    if (data.interview && data.interview.id) return data.interview.id;
    if (data.data) return extractInterviewIdFromResponse(data.data);

    return null;
  };

  // Execute API Request via Next.js Proxy Route
  const handleExecuteRequest = async (overrideAction?: "start" | "message" | "complete") => {
    const currentAct = overrideAction || (studioMode === "interview" ? interviewAction : "start");
    
    setLoading(true);
    setApiResponse(null);
    setActiveTab("response");

    let reqUrl = targetUrl;
    let reqBody = payloadObject;

    if (studioMode === "interview" && overrideAction) {
      setInterviewAction(overrideAction);
      if (overrideAction === "start") {
        reqUrl = "https://caliber.antiers.work/api/v1/interviews";
        reqBody = { moduleId };
      } else if (overrideAction === "message") {
        reqUrl = `https://caliber.antiers.work/api/v1/interviews/${interviewId}/message`;
        reqBody = {
          content: interviewAnswer,
          metadata: {
            ...interviewMetadata,
            viewedAt: new Date().toISOString(),
            keystroke: {
              ...keystroke,
              finalLength: interviewAnswer.length,
            },
            automation,
          },
        };
      } else if (overrideAction === "complete") {
        reqUrl = `https://caliber.antiers.work/api/v1/interviews/${interviewId}/complete`;
        reqBody = {
          metadata: {
            ...interviewMetadata,
            viewedAt: new Date().toISOString(),
            keystroke: {
              ...keystroke,
              finalLength: 0,
            },
            automation,
          },
        };
      }
    }

    const reqHeaders = {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "authorization": authorization,
      "content-type": "application/json",
      "origin": "https://caliber.antiers.work",
      "priority": "u=1, i",
      "referer": `https://caliber.antiers.work/dashboard/modules/${moduleId}`,
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      "Cookie": cookie,
    };

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetUrl: reqUrl,
          headers: reqHeaders,
          method: "POST",
          body: reqBody,
        }),
      });

      const resData = await res.json();
      setApiResponse(resData);

      // Post-Processing for Interview Actions
      if (studioMode === "interview" && resData.ok) {
        // Extract turn tracking from response (present in both start & message responses)
        const responseData = resData.data || {};
        if (typeof responseData.turnCount === "number") setTurnCount(responseData.turnCount);
        if (typeof responseData.maxTurns === "number") setMaxTurns(responseData.maxTurns);

        if (currentAct === "start") {
          const newIntId = extractInterviewIdFromResponse(responseData);
          if (newIntId) setInterviewId(newIntId);
          setInterviewStatus("active");
          setTurnCount(responseData.turnCount ?? 0);
          setMaxTurns(responseData.maxTurns ?? 12);

          const questionText = extractQuestionFromResponse(responseData) || "Interview started! Please write your response below.";
          setCurrentQuestion(questionText);
          setInterviewHistory([
            { role: "interviewer", text: questionText, timestamp: new Date().toLocaleTimeString() }
          ]);
          setGenerateMessage(`Interview started! Session ID: ${newIntId || interviewId} — ${responseData.maxTurns ?? 12} turns total`);
        } else if (currentAct === "message") {
          const newTurn = responseData.turnCount ?? turnCount + 1;
          setTurnCount(newTurn);

          const isDone = responseData.done === true || newTurn >= (responseData.maxTurns ?? maxTurns);

          const newQuestion = isDone
            ? (extractQuestionFromResponse(responseData) || "Interview complete — all questions answered. Click 'Complete Test' to submit.")
            : (extractQuestionFromResponse(responseData) || "Next question received!");

          setInterviewHistory((prev) => [
            ...prev,
            { role: "candidate", text: interviewAnswer, timestamp: new Date().toLocaleTimeString() },
            { role: "interviewer", text: newQuestion, timestamp: new Date().toLocaleTimeString() },
          ]);

          setCurrentQuestion(newQuestion);
          setInterviewAnswer("");

          if (isDone) {
            setGenerateMessage(`All ${responseData.maxTurns ?? maxTurns} turns done! Click 'Complete Test' to submit.`);
          } else {
            setGenerateMessage(`Turn ${newTurn}/${responseData.maxTurns ?? maxTurns} — Answer submitted! Next question ready.`);
          }
        } else if (currentAct === "complete") {
          setInterviewStatus("completed");
          setGenerateMessage("Interview test completed and submitted successfully!");
        }
        setTimeout(() => setGenerateMessage(null), 5000);
      }
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

  if (!isMounted) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem"
      }}>
        <div style={{
          maxWidth: "420px",
          width: "100%",
          background: "var(--bg-card)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "20px",
          padding: "2.5rem 2rem",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          textAlign: "center"
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            padding: "1rem",
            borderRadius: "50%",
            color: "#a5b4fc"
          }}>
            <Lock size={32} />
          </div>

          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-main)" }}>Protected Studio Access</h2>
            <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
              Enter security password to access Caliber Probe &amp; Interview Studio.
            </p>
          </div>

          <form onSubmit={handleUnlock} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <input
                type="password"
                className="input-text"
                placeholder="Enter access password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                style={{ textAlign: "center", letterSpacing: "0.2em", fontSize: "1rem" }}
              />
            </div>

            {authError && (
              <div className="alert-banner alert-error" style={{ justifyContent: "center" }}>
                <ShieldAlert size={16} /> {authError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.75rem" }}>
              <Unlock size={16} /> Unlock Access
            </button>
          </form>
        </div>
      </div>
    );
  }

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
              <h1 className="app-title">Caliber API Studio</h1>
              <span className="app-badge">Next.js 15</span>
            </div>
            <p className="app-subtitle">Probe Submissions &amp; AI Interview Automation Studio.</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-accent" onClick={handleGenerateNewCurl}>
            <Sparkles size={16} /> Refresh cURL
          </button>
          <button className="btn btn-secondary" onClick={handleLock} title="Lock session">
            <Lock size={16} /> Lock
          </button>
          <button className="btn btn-secondary" onClick={handleCopyCurl}>
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy cURL"}
          </button>
          <button className="btn btn-primary" onClick={() => handleExecuteRequest()} disabled={loading}>
            {loading ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
            {loading ? "Executing..." : "Execute API Request"}
          </button>
        </div>
      </header>

      {/* Main Studio Mode Switcher Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <nav className="section-nav">
          <button
            className={`section-nav-btn ${studioMode === "interview" ? "active" : ""}`}
            onClick={() => setStudioMode("interview")}
          >
            <MessageSquare size={18} color={studioMode === "interview" ? "#a5b4fc" : undefined} />
            AI Interviews Studio
          </button>

          <button
            className={`section-nav-btn ${studioMode === "probe" ? "active" : ""}`}
            onClick={() => setStudioMode("probe")}
          >
            <Layers size={18} color={studioMode === "probe" ? "#67e8f9" : undefined} />
            Probe Submissions Studio
          </button>
        </nav>

        {studioMode === "interview" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Interview Status:</span>
            <span
              className="app-badge"
              style={{
                background:
                  interviewStatus === "completed"
                    ? "rgba(16,185,129,0.2)"
                    : interviewStatus === "active"
                    ? "rgba(99,102,241,0.2)"
                    : "rgba(245,158,11,0.2)",
                color:
                  interviewStatus === "completed"
                    ? "#6ee7b7"
                    : interviewStatus === "active"
                    ? "#a5b4fc"
                    : "#fcd34d",
                borderColor:
                  interviewStatus === "completed"
                    ? "rgba(16,185,129,0.4)"
                    : interviewStatus === "active"
                    ? "rgba(99,102,241,0.4)"
                    : "rgba(245,158,11,0.4)",
              }}
            >
              {interviewStatus === "completed" ? "COMPLETED" : interviewStatus === "active" ? "IN PROGRESS" : "NOT STARTED"}
            </span>
          </div>
        )}
      </div>

      {generateMessage && (
        <div className="alert-banner alert-success">
          <ShieldCheck size={18} /> {generateMessage}
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="studio-grid">
        {/* Left Column: API Credentials & Header Extractor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Card 1: Active Endpoint Configuration */}
          {studioMode === "probe" ? (
            <div className="studio-card">
              <div className="card-header">
                <h2 className="card-title">
                  <Database size={18} color="#6366f1" /> Probe Endpoint Configuration
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
          ) : (
            /* Interview Studio Card 1: Session Controls */
            <div className="studio-card" style={{ borderColor: "rgba(139, 92, 246, 0.3)" }}>
              <div className="card-header">
                <h2 className="card-title">
                  <MessageSquare size={18} color="#a78bfa" /> Interview Session Controls
                </h2>
                <span className="app-badge" style={{ background: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.3)", color: "#c084fc" }}>
                  Step 1 &amp; 3
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Module ID
                  <span className="form-label-note">Required for Start Interview API</span>
                </label>
                <input
                  type="text"
                  className="input-text input-mono"
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  placeholder="e.g. f147f619-a3cc-4c10-b134-3d78ebd2a7ca"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Active Interview ID
                  <span className="form-label-note">Auto-captured or manual</span>
                </label>
                <input
                  type="text"
                  className="input-text input-mono"
                  value={interviewId}
                  onChange={(e) => setInterviewId(e.target.value)}
                  placeholder="e.g. bb7a6e59-7c1d-40af-b803-8ef1e9c50b6e"
                />
              </div>

              {/* Start Interview Action Button */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                <button
                  className="btn btn-purple"
                  style={{ flex: 1, padding: "0.75rem" }}
                  onClick={() => handleExecuteRequest("start")}
                  disabled={loading}
                >
                  {loading && interviewAction === "start" ? (
                    <RefreshCw size={16} className="spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  Start Interview
                </button>

                <button
                  className="btn btn-rose"
                  style={{ padding: "0.75rem 1.25rem" }}
                  onClick={() => handleExecuteRequest("complete")}
                  disabled={loading || !interviewId}
                  title="Submit entire interview test"
                >
                  {loading && interviewAction === "complete" ? (
                    <RefreshCw size={16} className="spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Complete Test
                </button>
              </div>
            </div>
          )}

          {/* Card 2: Secondary cURL Token Extractor */}
          <div className="studio-card" style={{ borderColor: "rgba(6, 182, 212, 0.3)" }}>
            <div className="card-header">
              <h2 className="card-title">
                <Sparkles size={18} color="#06b6d4" /> Secondary cURL Extractor
              </h2>
              <span className="app-badge" style={{ background: "rgba(6,182,212,0.15)", borderColor: "rgba(6,182,212,0.3)", color: "#67e8f9" }}>
                Auto-Parse
              </span>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Paste ANY cURL request (Probe or Interview). Click <strong>&quot;Extract &amp; Inject Tokens&quot;</strong> to parse Authorization, Cookie, Submission/Interview IDs!
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

        {/* Right Column: Dynamic Payload Customizer based on Active Mode */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {studioMode === "interview" ? (
            /* AI INTERVIEW MODE CARDS */
            <>
              {/* Interview Card: Current Question & Answer Input */}
              <div className="studio-card" style={{ borderColor: "rgba(16, 185, 129, 0.3)" }}>
                <div className="card-header">
                  <h2 className="card-title">
                    <HelpCircle size={18} color="#10b981" /> Active Interview Question &amp; Answer
                  </h2>
                  <span className="app-badge" style={{ background: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.3)", color: "#6ee7b7" }}>
                    Step 2: Message API
                  </span>
                </div>

                {/* Display Current Question Received */}
                <div style={{
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "12px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6ee7b7" }}>
                      Interviewer Prompt / Question:
                    </span>
                    <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                      {currentQuestion ? `${currentQuestion.length} chars` : "Awaiting start"}
                    </span>
                  </div>

                  <p style={{
                    fontSize: "0.925rem",
                    color: currentQuestion ? "#ffffff" : "var(--text-muted)",
                    lineHeight: 1.6,
                    fontStyle: currentQuestion ? "normal" : "italic"
                  }}>
                    {currentQuestion || "Click 'Start Interview' above to generate the first question from the server."}
                  </p>
                </div>

                {/* Answer Field for Candidate */}
                <div className="form-group">
                  <div className="form-label">
                    <span>Write Your Response / Answer:</span>
                    <span className="form-label-note" style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                      Length: {interviewAnswer.length} chars
                    </span>
                  </div>

                  <textarea
                    className="input-textarea input-mono"
                    rows={6}
                    placeholder="Type your detailed interview response here..."
                    value={interviewAnswer}
                    onChange={(e) => handleInterviewAnswerChange(e.target.value)}
                  />
                </div>

                {/* Submit & Complete Buttons */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-emerald"
                    style={{ flex: 2, padding: "0.75rem" }}
                    onClick={() => handleExecuteRequest("message")}
                    disabled={loading || !interviewAnswer.trim() || turnCount >= maxTurns}
                    title={turnCount >= maxTurns ? "All turns used — click Complete Test to submit" : ""}
                  >
                    {loading && interviewAction === "message" ? (
                      <RefreshCw size={16} className="spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {turnCount >= maxTurns
                      ? "All Turns Done"
                      : `Submit Answer (Turn ${turnCount + 1}/${maxTurns})`}
                  </button>

                  <button
                    className="btn btn-rose"
                    style={{ flex: 1, padding: "0.75rem" }}
                    onClick={() => handleExecuteRequest("complete")}
                    disabled={loading}
                  >
                    {loading && interviewAction === "complete" ? (
                      <RefreshCw size={16} className="spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Complete Test
                  </button>
                </div>
              </div>

              {/* Interview Conversation Timeline Card */}
              {interviewHistory.length > 0 && (
                <div className="studio-card">
                  <div className="card-header">
                    <h2 className="card-title">
                      <ListOrdered size={18} color="#818cf8" /> Conversation Timeline ({interviewHistory.length} messages)
                    </h2>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto", paddingRight: "0.25rem" }}>
                    {interviewHistory.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: item.role === "interviewer" ? "rgba(99, 102, 241, 0.1)" : "rgba(16, 185, 129, 0.1)",
                          border: item.role === "interviewer" ? "1px solid rgba(99, 102, 241, 0.25)" : "1px solid rgba(16, 185, 129, 0.25)",
                          borderRadius: "10px",
                          padding: "0.75rem 1rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: item.role === "interviewer" ? "#a5b4fc" : "#6ee7b7", fontWeight: 700 }}>
                          <span>{item.role === "interviewer" ? "🤖 AI Interviewer" : "👤 Candidate Answer"}</span>
                          <span style={{ opacity: 0.7 }}>{item.timestamp}</span>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-main)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* PROBE SUBMISSIONS MODE CARD */
            <div className="studio-card">
              <div className="card-header" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <h2 className="card-title">
                  <FileText size={18} color="#10b981" /> Question &amp; Answer Payload
                </h2>
                <div style={{ display: "flex", gap: "0.25rem", background: "rgba(0,0,0,0.3)", padding: "0.2rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <button
                    className={`btn btn-sm ${answerView === "batch" ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                    onClick={() => setAnswerView("batch")}
                  >
                    Batch Entry (Q1, Q2, Q3)
                  </button>
                  <button
                    className={`btn btn-sm ${answerView === "active" ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                    onClick={() => setAnswerView("active")}
                  >
                    Active Focus
                  </button>
                </div>
              </div>

              {/* Quick Switcher Buttons */}
              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" style={{ marginBottom: "0.5rem" }}>
                  <span>Select Active Question ID for Submission:</span>
                  <span className="form-label-note">Currently selected: <strong>{questionId}</strong></span>
                </label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {["q1", "q2", "q3"].map((qKey) => {
                    const isSelected = questionId === qKey;
                    const hasContent = !!answersMap[qKey]?.trim();
                    return (
                      <button
                        key={qKey}
                        className={`btn btn-sm ${isSelected ? "btn-accent" : "btn-secondary"}`}
                        onClick={() => handleQuestionChange(qKey)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          borderRadius: "8px",
                          fontSize: "0.825rem",
                          border: isSelected ? "1px solid var(--accent-cyan)" : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {qKey.toUpperCase()}
                        <span
                          style={{
                            fontSize: "0.65rem",
                            marginLeft: "6px",
                            padding: "2px 5px",
                            borderRadius: "4px",
                            background: isSelected
                              ? "rgba(255,255,255,0.25)"
                              : hasContent
                              ? "rgba(16,185,129,0.2)"
                              : "rgba(255,255,255,0.06)",
                            color: isSelected
                              ? "#fff"
                              : hasContent
                              ? "#6ee7b7"
                              : "var(--text-muted)",
                          }}
                        >
                          {hasContent ? `${answersMap[qKey].length}c` : "empty"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {answerView === "batch" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Q1 Box */}
                  <div style={{
                    background: questionId === "q1" ? "rgba(99, 102, 241, 0.1)" : "rgba(0,0,0,0.2)",
                    border: questionId === "q1" ? "1px solid var(--accent-indigo)" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                    padding: "0.85rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: questionId === "q1" ? "#a5b4fc" : "var(--text-main)" }}>
                        Q1 Answer Content
                      </span>
                      {questionId === "q1" && (
                        <span className="app-badge" style={{ background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", borderColor: "rgba(99, 102, 241, 0.4)" }}>
                          ACTIVE TARGET
                        </span>
                      )}
                    </div>
                    <textarea
                      className="input-textarea input-mono"
                      rows={4}
                      value={answersMap["q1"] || ""}
                      onChange={(e) => handleSpecificAnswerChange("q1", e.target.value)}
                      placeholder="Paste Q1 answer text here..."
                    />
                  </div>

                  {/* Q2 Box */}
                  <div style={{
                    background: questionId === "q2" ? "rgba(99, 102, 241, 0.1)" : "rgba(0,0,0,0.2)",
                    border: questionId === "q2" ? "1px solid var(--accent-indigo)" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                    padding: "0.85rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: questionId === "q2" ? "#a5b4fc" : "var(--text-main)" }}>
                        Q2 Answer Content
                      </span>
                      {questionId === "q2" && (
                        <span className="app-badge" style={{ background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", borderColor: "rgba(99, 102, 241, 0.4)" }}>
                          ACTIVE TARGET
                        </span>
                      )}
                    </div>
                    <textarea
                      className="input-textarea input-mono"
                      rows={4}
                      value={answersMap["q2"] || ""}
                      onChange={(e) => handleSpecificAnswerChange("q2", e.target.value)}
                      placeholder="Paste Q2 answer text here..."
                    />
                  </div>

                  {/* Q3 Box */}
                  <div style={{
                    background: questionId === "q3" ? "rgba(99, 102, 241, 0.1)" : "rgba(0,0,0,0.2)",
                    border: questionId === "q3" ? "1px solid var(--accent-indigo)" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                    padding: "0.85rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: questionId === "q3" ? "#a5b4fc" : "var(--text-main)" }}>
                        Q3 Answer Content
                      </span>
                      {questionId === "q3" && (
                        <span className="app-badge" style={{ background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", borderColor: "rgba(99, 102, 241, 0.4)" }}>
                          ACTIVE TARGET
                        </span>
                      )}
                    </div>
                    <textarea
                      className="input-textarea input-mono"
                      rows={4}
                      value={answersMap["q3"] || ""}
                      onChange={(e) => handleSpecificAnswerChange("q3", e.target.value)}
                      placeholder="Paste Q3 answer text here..."
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <div className="form-label">
                    <span>Answer Text Content ({questionId})</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                      Length: {probeAnswer.length} chars
                    </span>
                  </div>
                  <textarea
                    className="input-textarea input-mono"
                    rows={8}
                    value={probeAnswer}
                    onChange={(e) => handleProbeAnswerChange(e.target.value)}
                    placeholder={`Enter ${questionId} answer text here...`}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleProbeAnswerChange("")}
                >
                  Clear Active Answer
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => autoCalculateKeystrokes(probeAnswer)}
                >
                  <RefreshCw size={12} /> Sync Keystroke Length ({probeAnswer.length})
                </button>
              </div>
            </div>
          )}

          {/* Shared Card: Keystrokes & Anti-Detection Parameters */}
          <div className="studio-card">
            <div className="form-label" style={{ marginBottom: "0.5rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Sliders size={14} color="#a5b4fc" /> Keystroke &amp; Metadata Parameters
              </span>
              <span className="form-label-note">Editable metrics</span>
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
                <label>focusLossCount</label>
                <input
                  type="number"
                  value={interviewMetadata.focusLossCount}
                  onChange={(e) => setInterviewMetadata({ ...interviewMetadata, focusLossCount: Number(e.target.value) })}
                />
              </div>

              <div className="keystroke-item">
                <label>timeOnTaskMs</label>
                <input
                  type="number"
                  value={interviewMetadata.timeOnTaskMs}
                  onChange={(e) => setInterviewMetadata({ ...interviewMetadata, timeOnTaskMs: Number(e.target.value) })}
                />
              </div>

              <div className="keystroke-item">
                <label>pasteEvents</label>
                <input
                  type="number"
                  value={interviewMetadata.pasteEvents}
                  onChange={(e) => setInterviewMetadata({ ...interviewMetadata, pasteEvents: Number(e.target.value) })}
                />
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
              <span>Executable bash command with updated endpoints &amp; injected tokens</span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn btn-accent btn-sm" onClick={handleGenerateNewCurl}>
                  <Sparkles size={14} /> Refresh cURL
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => handleExecuteRequest()} disabled={loading}>
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
            <div className="code-header" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>⚡ API Response</span>
                {apiResponse && (
                  <span
                    className="app-badge"
                    style={{
                      background: apiResponse.ok ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)",
                      color: apiResponse.ok ? "#6ee7b7" : "#fda4af",
                      borderColor: apiResponse.ok ? "rgba(16,185,129,0.4)" : "rgba(244,63,94,0.4)",
                      fontSize: "0.8rem",
                      padding: "0.25rem 0.6rem"
                    }}
                  >
                    STATUS: {apiResponse.status || "500"} {apiResponse.statusText || ""} ({apiResponse.responseTimeMs || 0}ms)
                  </span>
                )}
              </div>

              {apiResponse && apiResponse.data && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      typeof apiResponse.data === "object"
                        ? JSON.stringify(apiResponse.data, null, 2)
                        : String(apiResponse.data)
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copied ? "Copied Response" : "Copy Response Data"}
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                <RefreshCw size={28} className="spin" style={{ color: "#818cf8", marginBottom: "1rem" }} />
                <p style={{ fontSize: "0.95rem", color: "var(--text-main)", fontWeight: 500 }}>
                  Executing request to Caliber API...
                </p>
                <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  Bypassing CORS &amp; forwarding headers...
                </p>
              </div>
            ) : apiResponse ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
                {/* Main Response Data */}
                <div>
                  <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#818cf8", fontWeight: 600, marginBottom: "0.5rem" }}>
                    Response Data Payload
                  </div>
                  <pre className="code-body" style={{ maxHeight: "350px", overflowY: "auto", margin: 0 }}>
                    {typeof apiResponse.data === "object"
                      ? JSON.stringify(apiResponse.data, null, 2)
                      : apiResponse.data || JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>

                {/* Status or Error Banner if applicable */}
                {apiResponse.status === 401 && (
                  <div className="alert-banner alert-error" style={{ margin: 0 }}>
                    <ShieldAlert size={16} /> <strong>401 Unauthorized:</strong> Your Bearer Authorization token or Cookie may be expired. Extract fresh tokens from a new cURL request.
                  </div>
                )}

                {/* Response Metadata & Headers */}
                {apiResponse.headers && (
                  <details style={{ marginTop: "0.5rem", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <summary style={{ cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>
                      View Server Response Headers &amp; Meta ({Object.keys(apiResponse.headers).length} headers)
                    </summary>
                    <pre className="code-body" style={{ marginTop: "0.75rem", fontSize: "0.8rem", background: "transparent" }}>
                      {JSON.stringify(apiResponse.headers, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                <Zap size={32} style={{ color: "rgba(255,255,255,0.2)", marginBottom: "0.75rem" }} />
                <p style={{ fontSize: "0.9rem" }}>No response received yet.</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Click <strong>&quot;Execute API Request&quot;</strong>, <strong>&quot;Start Interview&quot;</strong>, or <strong>&quot;Submit Answer&quot;</strong> above to trigger request.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
