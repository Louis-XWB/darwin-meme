"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Genome } from "@/lib/types";

interface RadarChartProps {
  genome: Genome;
  size?: number;
}

const TRAITS = [
  { key: "risk_appetite", label: "Risk" },
  { key: "contrarian", label: "Contrarian" },
  { key: "creation_frequency", label: "Create" },
  { key: "hype_intensity", label: "Hype" },
  { key: "follow_leader", label: "Follow" },
  { key: "experiment_rate", label: "Experiment" },
  { key: "exploration_vs_exploit", label: "Explore" },
  { key: "cooperation", label: "Coop" },
] as const;

export function RadarChart({ genome, size = 120 }: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const center = size / 2;
    const radius = size / 2 - 16;
    const angleSlice = (2 * Math.PI) / TRAITS.length;

    const g = svg
      .append("g")
      .attr("transform", `translate(${center},${center})`);

    [0.25, 0.5, 0.75, 1.0].forEach((level) => {
      g.append("circle")
        .attr("r", radius * level)
        .attr("fill", "none")
        .attr("stroke", "#374151")
        .attr("stroke-width", 0.5);
    });

    TRAITS.forEach((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", radius * Math.cos(angle))
        .attr("y2", radius * Math.sin(angle))
        .attr("stroke", "#374151")
        .attr("stroke-width", 0.5);
    });

    const values = TRAITS.map((t) => (genome as unknown as Record<string, number>)[t.key]);
    const points = values.map((v, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [radius * v * Math.cos(angle), radius * v * Math.sin(angle)];
    });

    g.append("polygon")
      .attr("points", points.map((p) => p.join(",")).join(" "))
      .attr("fill", "rgba(52, 211, 153, 0.2)")
      .attr("stroke", "#34d399")
      .attr("stroke-width", 1.5);

    TRAITS.forEach((t, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = (radius + 12) * Math.cos(angle);
      const y = (radius + 12) * Math.sin(angle);
      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#9ca3af")
        .attr("font-size", "7px")
        .text(t.label);
    });
  }, [genome, size]);

  return <svg ref={svgRef} width={size} height={size} />;
}
