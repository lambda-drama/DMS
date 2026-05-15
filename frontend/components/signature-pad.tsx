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
  const isDrawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [mode, setMode] = useState<"idle" | "drawing" | "done">(
    existingUrl ? "done" : "idle"
  );

  useEffect(() => {
    if (existingUrl) setMode("done");
  }, [existingUrl]);

  const initCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || uploading) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = initCtx();
    if (!ctx) return;
    isDrawing.current = true;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = initCtx();
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasStrokes(true);
  };

  const endDraw = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

  useEffect(() => {
    if (mode !== "drawing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    setHasStrokes(false);
  }, [mode]);

  const resolveUrl = (url: string) => {
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (uploading) {
    return (
      <div className={`flex min-h-[120px] items-center justify-center rounded-lg border border-dashed bg-muted/30 ${className}`}>
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
        className={`flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground transition-colors hover:border-[var(--dms-green)] hover:bg-[var(--dms-green-light)]/30 hover:text-foreground disabled:opacity-50 ${className}`}
      >
        <PenLine className="h-5 w-5" />
        <span className="text-sm font-medium">Customer digital signature</span>
        <span className="text-xs">Tap to sign</span>
      </button>
    );
  }

  if (mode === "done" && existingUrl) {
    return (
      <div className={`flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border border-[var(--dms-green)]/40 bg-[var(--dms-green-light)]/20 p-3 ${className}`}>
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
    <div className={`flex w-full flex-col overflow-hidden rounded-lg border bg-card ${className}`}>
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <PenLine className="h-3 w-3" />
          Draw signature
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={clearCanvas}
            disabled={!hasStrokes}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Clear
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
            <Check className="mr-1 h-3 w-3" />
            Save
          </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="h-28 w-full touch-none cursor-crosshair bg-white"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  );
}
