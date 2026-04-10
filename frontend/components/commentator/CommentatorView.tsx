"use client";

import { useEffect, useRef } from "react";

interface CommentatorViewProps {
  commentary: string[];
  summaries: string[];
  generation: number;
}

export function CommentatorView({ commentary, summaries, generation }: CommentatorViewProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [commentary, summaries]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
        AI Commentator
      </h2>

      <div ref={feedRef} className="flex-1 overflow-auto space-y-2">
        {summaries.map((s, i) => (
          <div key={`s-${i}`} className="border-l-2 border-yellow-500/50 pl-3 py-1">
            <div className="text-[10px] text-yellow-500/70 uppercase font-semibold mb-0.5">
              Generation {i} Summary
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{s}</p>
          </div>
        ))}

        {commentary.map((c, i) => (
          <div key={`c-${i}`} className="text-xs text-gray-400 border-l-2 border-emerald-500/30 pl-3 py-0.5">
            {c}
          </div>
        ))}

        {commentary.length === 0 && summaries.length === 0 && (
          <div className="text-center text-gray-600 py-8 text-sm">
            Commentary will appear during simulation...
          </div>
        )}
      </div>
    </div>
  );
}
