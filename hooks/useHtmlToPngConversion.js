import { useState, useCallback } from "react";

export function useHtmlToPngConversion({ startMarioAnimation, stopMarioAnimation, outputRef, html }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleConvert = useCallback(async () => {
    if (!html.trim()) {
      setError("Please enter some HTML content first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    startMarioAnimation();

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      setResult(data);
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      stopMarioAnimation();
      setLoading(false);
    }
  }, [html, startMarioAnimation, stopMarioAnimation, outputRef]);

  return { loading, result, error, setError, handleConvert };
}
