"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { AgentData } from "@/lib/types";

function project(agent: AgentData): [number, number] {
  const g = agent.genome;
  const x = (g.risk_appetite + g.contrarian) / 2 - g.follow_leader / 2 + 0.25;
  const y = (g.creation_frequency + g.hype_intensity) / 2 - g.entry_threshold / 2 + 0.25;
  return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
}

export function StrategyScatter({ agents }: { agents: AgentData[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || agents.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 280;
    const height = 200;
    const margin = { top: 10, right: 10, bottom: 25, left: 30 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 1]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text").attr("fill", "#6b7280").attr("font-size", "8px");
    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text").attr("fill", "#6b7280").attr("font-size", "8px");

    g.append("text").attr("x", innerW / 2).attr("y", innerH + 22).attr("text-anchor", "middle")
      .attr("fill", "#6b7280").attr("font-size", "9px").text("Risk-Seeking \u2192");
    g.append("text").attr("x", -innerH / 2).attr("y", -22).attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)").attr("fill", "#6b7280").attr("font-size", "9px")
      .text("Creator \u2192");

    const pts = agents.map((a) => ({ agent: a, pos: project(a) }));

    g.selectAll("circle")
      .data(pts)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.pos[0]))
      .attr("cy", (d) => y(d.pos[1]))
      .attr("r", 4)
      .attr("fill", "#34d399")
      .attr("fill-opacity", 0.6)
      .attr("stroke", "#059669")
      .attr("stroke-width", 1);

    pts.slice(0, 3).forEach((d) => {
      g.append("text")
        .attr("x", x(d.pos[0]) + 6)
        .attr("y", y(d.pos[1]) + 3)
        .attr("fill", "#9ca3af")
        .attr("font-size", "8px")
        .text(d.agent.name);
    });
  }, [agents]);

  return <svg ref={svgRef} width={280} height={200} />;
}
