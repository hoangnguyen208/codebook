"use client";

import { useEffect, useRef } from "react";
import {
  Blocks,
  GitBranch,
  Hash,
  Code2,
  Globe,
  Terminal,
  FileText,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconDefs = [
  { Icon: Blocks, color: "text-white/80" },
  { Icon: GitBranch, color: "text-white/80" },
  { Icon: Hash, color: "text-emerald-400" },
  { Icon: Code2, color: "text-blue-400" },
  { Icon: Globe, color: "text-sky-400" },
  { Icon: Terminal, color: "text-cyan-400" },
  { Icon: FileText, color: "text-amber-400" },
  { Icon: Bookmark, color: "text-pink-400" },
];

interface IconState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  baseX: number;
  baseY: number;
}

export function ChaosContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconEls = useRef<(HTMLDivElement | null)[]>([]);
  const iconStates = useRef<IconState[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.3;

    iconStates.current = iconDefs.map((_, i) => {
      const angle = (i / iconDefs.length) * Math.PI * 2;
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        baseX: cx + Math.cos(angle) * radius,
        baseY: cy + Math.sin(angle) * radius,
      };
    });

    const damping = 0.92;
    const springStrength = 0.0008;
    const maxSpeed = 0.6;
    const repelRadius = 120;
    const repelStrength = 0.3;

    function animate() {
      if (!container) return;
      const currentRect = container.getBoundingClientRect();
      const width = currentRect.width;
      const height = currentRect.height;
      const mouse = mouseRef.current;

      for (let i = 0; i < iconStates.current.length; i++) {
        const icon = iconStates.current[i];

        const springX = (icon.baseX - icon.x) * springStrength;
        const springY = (icon.baseY - icon.y) * springStrength;
        icon.vx += springX;
        icon.vy += springY;

        const dx = icon.x - mouse.x;
        const dy = icon.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) * repelStrength;
          icon.vx += (dx / dist) * force;
          icon.vy += (dy / dist) * force;
        }

        icon.vx *= damping;
        icon.vy *= damping;

        if (Math.abs(icon.vx) > maxSpeed)
          icon.vx = Math.sign(icon.vx) * maxSpeed;
        if (Math.abs(icon.vy) > maxSpeed)
          icon.vy = Math.sign(icon.vy) * maxSpeed;

        icon.x += icon.vx;
        icon.y += icon.vy;

        const margin = 20;
        if (icon.x < margin) {
          icon.x = margin;
          icon.vx *= -0.5;
        }
        if (icon.x > width - margin) {
          icon.x = width - margin;
          icon.vx *= -0.5;
        }
        if (icon.y < margin) {
          icon.y = margin;
          icon.vy *= -0.5;
        }
        if (icon.y > height - margin) {
          icon.y = height - margin;
          icon.vy *= -0.5;
        }

        icon.rotation += icon.rotationSpeed;
      }

      frameRef.current = requestAnimationFrame(animate);
      renderPositions();
    }

    function renderPositions() {
      for (let i = 0; i < iconStates.current.length; i++) {
        const el = iconEls.current[i];
        const state = iconStates.current[i];
        if (!el) continue;

        el.style.transform = `translate(-50%, -50%) translate(${state.x}px, ${state.y}px) rotate(${state.rotation}rad)`;
      }
    }

    function onMouseMove(e: MouseEvent) {
      const r = container!.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      };
    }
    function onMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    let resizeTimeout: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const r = container!.getBoundingClientRect();
        const newCx = r.width / 2;
        const newCy = r.height / 2;
        const newRadius = Math.min(r.width, r.height) * 0.3;
        iconStates.current.forEach((icon, i) => {
          const angle = (i / iconDefs.length) * Math.PI * 2;
          icon.baseX = newCx + Math.cos(angle) * newRadius;
          icon.baseY = newCy + Math.sin(angle) * newRadius;
        });
      }, 100);
    }
    window.addEventListener("resize", onResize);

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full overflow-hidden rounded-xl border border-border/40 bg-card/50"
    >
      {iconDefs.map((icon, i) => (
        <div
          key={i}
          ref={(el) => {
            iconEls.current[i] = el;
          }}
          className="absolute top-0 left-0 pointer-events-none will-change-transform"
          style={{ transform: "translate(-50%, -50%) translate(0px, 0px) rotate(0rad)" }}
        >
          <icon.Icon className={cn("size-5", icon.color)} />
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-3">
        <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">
          Your scattered tools
        </span>
      </div>
    </div>
  );
}
