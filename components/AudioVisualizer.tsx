"use client"
import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  stream: MediaStream | null;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  const audioCtxRef = useRef<AudioContext>(null);
  const analyserRef = useRef<AnalyserNode>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode>(null);

  useEffect(() => {
    if (!stream) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize Audio Context
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);

    analyser.fftSize = 64;
    source.connect(analyser);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const resizeCanvas = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(canvas.parentElement!);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const displayWidth = canvas.width / window.devicePixelRatio;
      const displayHeight = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const barWidth = (displayWidth / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * displayHeight;

        const intensity = dataArray[i] / 255;
        const r = Math.round(200 + intensity * 55);
        const g = Math.round(140 - intensity * 40);
        const b = Math.round(80 - intensity * 50);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, displayHeight - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtx) audioCtx.close();
      resizeObserver.disconnect();
    };
  }, [stream]);

  return (
    <div className="w-full h-40 rounded-xl bg-black/20 ring-1 ring-border/50 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
};

export default AudioVisualizer;
