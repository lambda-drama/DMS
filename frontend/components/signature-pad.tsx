"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PenLine, Trash2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onSave: (file: File) => void;
  onClear?: () => void;
  existingUrl?: string;
  uploading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SignaturePad({
  onSave,
  onClear,
  existingUrl,
  uploading = false,
  disabled = false,
  className = "",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const canvasReady = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [mode, setMode] = useState<"idle" | "drawing" | "done">(
    existingUrl ? "done" : "idle"
  );

  useEffect(() => {
    if (existingUrl) setMode("done");
  }, [existingUrl]);

  /** Size backing store from container width so the canvas never overflows on mobile. */
  const setupCanvas = useCallback((clear = false) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return null;

    const cssW = container.clientWidth;
    const cssH = 144;

    if (cssW < 1 || cssH < 1) return null;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = "100%";
    canvas.style.maxWidth = "100%";
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (clear) {
      ctx.clearRect(0, 0, cssW, cssH);
    }

    canvasReady.current = true;
    return ctx;
  }, []);

  /**
   * Map pointer to CSS-pixel coords on the canvas (same space as ctx after scale(dpr)).
   * Prefer offsetX/offsetY when the event target is the canvas.
   */
  const getPos = useCallback((e: PointerEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      return { x: 0, y: 0 };
    }

    if (e.target === canvas && Number.isFinite(e.offsetX) && Number.isFinite(e.offsetY)) {
      return {
        x: e.offsetX,
        y: e.offsetY,
      };
    }

    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    return { x, y };
  }, []);

  useEffect(() => {
    if (mode !== "drawing") {
      canvasReady.current = false;
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    setHasStrokes(false);

    const runSetup = () => {
      setupCanvas(true);
    };

    runSetup();
    const ro = new ResizeObserver(() => {
      if (!isDrawing.current) {
        setupCanvas(true);
      }
    });
    ro.observe(container);

    const onPointerDown = (e: PointerEvent) => {
      if (disabled || uploading) return;
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        e.preventDefault();
      }

      if (!canvasReady.current) {
        setupCanvas(true);
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.setPointerCapture(e.pointerId);
      isDrawing.current = true;

      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDrawing.current) return;
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        e.preventDefault();
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pos = getPos(e, canvas);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasStrokes(true);
    };

    const endStroke = (e: PointerEvent) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endStroke);
    canvas.addEventListener("pointercancel", endStroke);
    canvas.addEventListener("pointerleave", endStroke);

    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endStroke);
      canvas.removeEventListener("pointercancel", endStroke);
      canvas.removeEventListener("pointerleave", endStroke);
    };
  }, [mode, disabled, uploading, setupCanvas, getPos]);

  const clearCanvas = () => {
    setupCanvas(true);
    setHasStrokes(false);
    onClear?.();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `signature_${Date.now()}.png`, {
        type: "image/png",
      });
      onSave(file);
      setMode("done");
    }, "image/png");
  };

  const resolveUrl = (url: string) => {
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (uploading) {
    return (
      <div
        className={`flex min-h-[120px] w-full min-w-0 max-w-full items-center justify-center rounded-lg border border-dashed bg-muted/30 ${className}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Saving signature…</span>
      </div>
    );
  }

  if (mode === "idle") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setMode("drawing")}
        className={`flex min-h-[120px] w-full min-w-0 max-w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground transition-colors hover:border-[var(--dms-green)] hover:bg-[var(--dms-green-light)]/30 hover:text-foreground disabled:opacity-50 ${className}`}
      >
        <PenLine className="h-5 w-5" />
        <span className="text-sm font-medium">Customer digital signature</span>
        <span className="text-xs">Tap to sign</span>
      </button>
    );
  }

  if (mode === "done" && existingUrl) {
    return (
      <div
        className={`flex min-h-[120px] w-full min-w-0 max-w-full flex-col items-center justify-center gap-2 rounded-lg border border-[var(--dms-green)]/40 bg-[var(--dms-green-light)]/20 p-3 ${className}`}
      >
        <img
          src={resolveUrl(existingUrl)}
          alt="Customer signature"
          className="max-h-20 object-contain"
        />
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => {
              setMode("drawing");
              clearCanvas();
            }}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Re-sign
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-lg border bg-card ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
          <PenLine className="h-3 w-3" />
          Draw signature
        </span>
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={clearCanvas}
            disabled={!hasStrokes}
          >
            <Trash2 className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setMode("idle");
              clearCanvas();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={saveSignature}
            disabled={!hasStrokes}
          >
            <Check className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="block h-36 w-full max-w-full cursor-crosshair bg-white box-border"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
