"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

interface LandingPageProps {
  onLaunch: () => void;
}

/* ── glow texture helper ── */
function createGlowTexture(color: string, size = 64): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function hexToCSS(hex: number): string {
  return "#" + hex.toString(16).padStart(6, "0");
}

export function LandingPage({ onLaunch }: LandingPageProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [countersStarted, setCountersStarted] = useState(false);
  const launchingRef = useRef(false);
  const flashRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const counterRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Counter animation ── */
  const animateCounter = useCallback(
    (el: HTMLDivElement, target: number, duration = 2000) => {
      const startTime = performance.now();
      function update(now: number) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = String(Math.floor(target * eased));
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    },
    []
  );

  /* ── IntersectionObserver for scroll animations ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    const els = document.querySelectorAll(".animate-on-scroll");
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  /* ── Counter observer for numbers section ── */
  useEffect(() => {
    const numbersSection = document.getElementById("landing-numbers");
    if (!numbersSection) return;

    const numbersObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersStarted) {
            setCountersStarted(true);
            counterRefs.current.forEach((el) => {
              if (el) {
                const target = parseInt(el.dataset.target || "0", 10);
                animateCounter(el, target, 1800);
              }
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    numbersObserver.observe(numbersSection);
    return () => numbersObserver.disconnect();
  }, [countersStarted, animateCounter]);

  /* ── Three.js scene ── */
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.04);

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 2.2, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x030712);
    container.appendChild(renderer.domElement);

    /* ── DNA Helix ── */
    const helixGroup = new THREE.Group();
    scene.add(helixGroup);
    const strandCount = 120;
    const helixR = 0.55;
    const helixH = 3.2;
    const turns = 3;
    const emerald = 0x10b981;
    const cyan = 0x06b6d4;

    function makeStrand(color: number, offset: number): THREE.Points {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(strandCount * 3);
      for (let i = 0; i < strandCount; i++) {
        const t = i / strandCount;
        const angle = t * Math.PI * 2 * turns + offset;
        pos[i * 3] = helixR * Math.cos(angle);
        pos[i * 3 + 1] = t * helixH - helixH / 2;
        pos[i * 3 + 2] = helixR * Math.sin(angle);
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.1,
        map: createGlowTexture(hexToCSS(color)),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Points(geo, mat);
    }

    helixGroup.add(makeStrand(emerald, 0));
    helixGroup.add(makeStrand(cyan, Math.PI));

    /* base-pair lines */
    const linesMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
    });
    for (let i = 0; i < strandCount; i += 4) {
      const t = i / strandCount;
      const a = t * Math.PI * 2 * turns;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(
          helixR * Math.cos(a),
          t * helixH - helixH / 2,
          helixR * Math.sin(a)
        ),
        new THREE.Vector3(
          helixR * Math.cos(a + Math.PI),
          t * helixH - helixH / 2,
          helixR * Math.sin(a + Math.PI)
        ),
      ]);
      helixGroup.add(new THREE.Line(geo, linesMat));
    }

    /* ── Orbiting agent particles ── */
    const agentColors = [0xef4444, 0x3b82f6, 0x10b981, 0x8b5cf6, 0xeab308];

    interface Agent {
      sprite: THREE.Sprite;
      dist: number;
      speed: number;
      yOff: number;
      phase: number;
      color: number;
      trails: THREE.Sprite[];
      prevPos: THREE.Vector3[];
    }

    const agents: Agent[] = [];
    const trailCount = 5;

    for (let i = 0; i < 20; i++) {
      const color = agentColors[i % 5];
      const mat = new THREE.SpriteMaterial({
        map: createGlowTexture(hexToCSS(color), 64),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.85,
      });
      const s = new THREE.Sprite(mat);
      const dist = 1.4 + Math.random() * 2.2;
      const speed =
        (0.15 + Math.random() * 0.35) * (Math.random() > 0.5 ? 1 : -1);
      const yOff = (Math.random() - 0.5) * 2.4;
      const phase = Math.random() * Math.PI * 2;
      s.scale.set(0.18, 0.18, 1);
      const agent: Agent = {
        sprite: s,
        dist,
        speed,
        yOff,
        phase,
        color,
        trails: [],
        prevPos: [],
      };

      /* trail ghosts */
      for (let j = 0; j < trailCount; j++) {
        const tm = mat.clone();
        tm.opacity = 0.18 - j * 0.03;
        const ts = new THREE.Sprite(tm);
        ts.scale.set(0.12, 0.12, 1);
        scene.add(ts);
        agent.trails.push(ts);
      }

      agents.push(agent);
      scene.add(s);
    }

    /* ── Background stars ── */
    const starCount = 350;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 40;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.06,
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    scene.add(new THREE.AmbientLight(0x112233, 0.3));

    /* ── Mouse tracking ── */
    let mx = 0;
    let my = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    document.addEventListener("mousemove", handleMouseMove);

    /* ── Scroll position ── */
    let scrollY = 0;
    const handleScroll = () => {
      scrollY =
        window.pageYOffset /
        (document.body.scrollHeight - window.innerHeight || 1);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    /* ── Flash effects ── */
    interface Flash {
      sprite: THREE.Sprite;
      life: number;
    }
    const flashes: Flash[] = [];
    function spawnFlash(pos: THREE.Vector3) {
      const mat = new THREE.SpriteMaterial({
        map: createGlowTexture("#ffffff", 64),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 1,
      });
      const s = new THREE.Sprite(mat);
      s.position.copy(pos);
      s.scale.set(0.05, 0.05, 1);
      scene.add(s);
      flashes.push({ sprite: s, life: 1 });
    }

    /* ── Launch zoom state ── */
    let launchT = 0;

    /* ── Render loop ── */
    const clock = new THREE.Clock();
    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();

      /* helix rotation */
      helixGroup.rotation.y += launchingRef.current ? dt * 8 : dt * 0.25;

      /* camera */
      if (!launchingRef.current) {
        const orbitA = t * 0.06;
        const scrollAngle = scrollY * Math.PI * 0.4;
        const camDist = 5.5;
        camera.position.x =
          camDist * Math.sin(orbitA + scrollAngle) + mx * 0.4;
        camera.position.z =
          camDist * Math.cos(orbitA + scrollAngle) + my * 0.2;
        camera.position.y = 2.2 - scrollY * 1.5 - my * 0.3;
        camera.lookAt(0, 0, 0);
      } else {
        launchT += dt;
        const p = Math.min(launchT / 2.2, 1);
        camera.position.lerp(new THREE.Vector3(0, 0, 0.3), p * p * 0.04);
        camera.lookAt(0, 0, 0);
        if (p >= 0.85 && flashRef.current) {
          flashRef.current.style.opacity = "1";
        }
      }

      /* agents */
      agents.forEach((a) => {
        const angle = t * a.speed + a.phase;
        const x = a.dist * Math.cos(angle);
        const z = a.dist * Math.sin(angle);
        const y = a.yOff + Math.sin(t * a.speed * 0.7) * 0.3;
        a.prevPos.unshift(new THREE.Vector3(x, y, z));
        if (a.prevPos.length > trailCount + 1) a.prevPos.pop();
        a.sprite.position.set(x, y, z);
        a.trails.forEach((tr, j) => {
          if (a.prevPos[j + 1]) tr.position.copy(a.prevPos[j + 1]);
        });
      });

      /* collision flashes */
      if (Math.random() < 0.012) {
        const a = agents[Math.floor(Math.random() * agents.length)];
        spawnFlash(a.sprite.position.clone());
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life -= dt * 2.5;
        f.sprite.scale.setScalar(0.05 + 0.45 * (1 - f.life));
        f.sprite.material.opacity = Math.max(0, f.life);
        if (f.life <= 0) {
          scene.remove(f.sprite);
          flashes.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    /* ── Resize ── */
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  /* ── Launch handler ── */
  const handleLaunch = useCallback(() => {
    if (launchingRef.current) return;
    launchingRef.current = true;

    if (contentRef.current) {
      contentRef.current.style.opacity = "0";
    }

    setTimeout(() => {
      onLaunch();
    }, 2500);
  }, [onLaunch]);

  const counters = [
    { target: 20, label: "AI Agents", sub: '"competing in real-time"' },
    { target: 25, label: "Genome Dimensions", sub: '"shaping AI personality"' },
    { target: 100, label: "Generations", sub: '"of natural selection"' },
    { target: 66, label: "Unit Tests", sub: '"production-grade code"' },
  ];

  return (
    <div className="relative" style={{ background: "#030712", color: "#fff" }}>
      {/* Three.js canvas container */}
      <div ref={canvasContainerRef} className="fixed inset-0 z-0" />

      {/* HTML content overlay */}
      <div
        ref={contentRef}
        id="landing-content"
        className="relative z-10"
        style={{ transition: "opacity 0.6s" }}
      >
        {/* ═══ HERO ═══ */}
        <section className="landing-section" id="landing-hero">
          <div className="landing-section-inner" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className="landing-hero-title">DARWIN.MEME</div>
            <div className="landing-hero-subtitle">AI Evolution Arena</div>
            <p className="landing-hero-tagline">
              Watch artificial intelligence discover trading strategies through
              natural selection
            </p>
          </div>
          <div className="landing-scroll-indicator animate-on-scroll stagger-5">
            <div className="landing-scroll-line" />
            <span>SCROLL DOWN</span>
            <div className="landing-scroll-arrows">
              <span>&#8964;</span>
              <span>&#8964;</span>
            </div>
          </div>
        </section>

        {/* ═══ THE PROBLEM ═══ */}
        <section className="landing-section" id="landing-problem">
          <div className="landing-dark-overlay" />
          <div
            className="landing-section-inner"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <p className="landing-quote-line animate-on-scroll stagger-1">
              &ldquo;Meme markets are chaos.
            </p>
            <p className="landing-quote-line animate-on-scroll stagger-2">
              No strategy works forever.
            </p>
            <p className="landing-quote-line animate-on-scroll stagger-3">
              What if we stopped designing strategies
            </p>
            <p className="landing-quote-line animate-on-scroll stagger-4">
              &mdash; and let <em>evolution</em> find them?&rdquo;
            </p>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="landing-section" id="landing-how">
          <div className="landing-dark-overlay" />
          <div className="landing-section-inner">
            <div className="landing-section-label animate-on-scroll">
              The Process
            </div>
            <h2 className="landing-section-heading animate-on-scroll stagger-1">
              How It Works
            </h2>
            <div className="landing-steps">
              {[
                {
                  num: "01",
                  title: "SPAWN",
                  desc: "20 AI agents are born with random genomes — each a unique combination of 25 traits shaping their trading personality.",
                },
                {
                  num: "02",
                  title: "COMPETE",
                  desc: "Agents trade in a simulated meme token market, buying, selling, and timing their moves against each other in real time.",
                },
                {
                  num: "03",
                  title: "EVOLVE",
                  desc: "The weakest are eliminated. The strongest reproduce, combining genomes and introducing random mutations into the next generation.",
                },
                {
                  num: "04",
                  title: "EMERGE",
                  desc: "Novel strategies emerge that no human designed — forged through the pressure of 100 generations of natural selection.",
                },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className={`landing-step-card animate-on-scroll stagger-${i + 2}`}
                >
                  <div className="landing-step-num">{step.num}</div>
                  <div className="landing-step-title">{step.title}</div>
                  <p className="landing-step-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ THE AGENTS ═══ */}
        <section className="landing-section" id="landing-agents">
          <div className="landing-dark-overlay" />
          <div className="landing-section-inner">
            <div className="landing-section-label animate-on-scroll">
              The Competitors
            </div>
            <h2 className="landing-section-heading animate-on-scroll stagger-1">
              The Agents
            </h2>
            <div className="landing-agent-grid">
              {[
                {
                  icon: "\u2694\uFE0F",
                  name: "AGGRESSIVE",
                  color: "#ef4444",
                  traits: "HIGH RISK / HIGH REWARD",
                  desc: "Bold and reckless. Goes all-in on momentum plays, thriving in volatile markets but vulnerable to sharp reversals.",
                  delay: 2,
                },
                {
                  icon: "\uD83D\uDD35",
                  name: "FOLLOWER",
                  color: "#3b82f6",
                  traits: "TREND / SOCIAL",
                  desc: "Reads the crowd. Follows dominant market trends and copies successful traders, adapting quickly to consensus.",
                  delay: 3,
                },
                {
                  icon: "\uD83C\uDFA8",
                  name: "CREATOR",
                  color: "#10b981",
                  traits: "NARRATIVE / INFLUENCE",
                  desc: "Generates market narratives and drives sentiment. Creates the hype that other agents react to.",
                  delay: 4,
                },
                {
                  icon: "\uD83D\uDD2E",
                  name: "CONTRARIAN",
                  color: "#8b5cf6",
                  traits: "INVERSE / ANTI-HERD",
                  desc: "Bets against the crowd. Buys fear, sells greed. Profits from market overreactions and panic moments.",
                  delay: 5,
                },
                {
                  icon: "\uD83D\uDD2C",
                  name: "EXPERIMENTER",
                  color: "#eab308",
                  traits: "RANDOM / ADAPTIVE",
                  desc: "The wildcard. Tests unconventional strategies, sometimes finding genius moves hidden in the noise.",
                  delay: 6,
                },
              ].map((agent, i) => (
                <div
                  key={agent.name}
                  className={`landing-agent-card animate-on-scroll stagger-${agent.delay}`}
                  style={{ animationDelay: `${i * 0.8}s` }}
                >
                  <span className="landing-agent-icon">{agent.icon}</span>
                  <div
                    className="landing-agent-name"
                    style={{ color: agent.color }}
                  >
                    {agent.name}
                  </div>
                  <div className="landing-agent-traits">{agent.traits}</div>
                  <p className="landing-agent-desc">{agent.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ BY THE NUMBERS ═══ */}
        <section className="landing-section" id="landing-numbers">
          <div className="landing-darker-overlay" />
          <div className="landing-section-inner">
            <div className="landing-section-label animate-on-scroll">
              The Scale
            </div>
            <h2 className="landing-section-heading animate-on-scroll stagger-1">
              By The Numbers
            </h2>
            <div className="landing-numbers-grid">
              {counters.map((c, i) => (
                <div
                  key={c.label}
                  className={`landing-number-card animate-on-scroll stagger-${i + 2}`}
                >
                  <div
                    className="landing-number-value"
                    data-target={c.target}
                    ref={(el) => {
                      counterRefs.current[i] = el;
                    }}
                  >
                    0
                  </div>
                  <div className="landing-number-label">{c.label}</div>
                  <div className="landing-number-sub">{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ LAUNCH ═══ */}
        <section className="landing-section" id="landing-launch">
          <div className="landing-dark-overlay" />
          <div
            className="landing-section-inner"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div className="animate-on-scroll stagger-1 landing-launch-heading">
              Ready to witness
              <br />
              <span>evolution?</span>
            </div>
            <div className="landing-btn-wrap animate-on-scroll stagger-2">
              <div className="landing-btn-border" />
              <button className="landing-btn" onClick={handleLaunch}>
                &#128640; LAUNCH EVOLUTION
              </button>
            </div>
            <p className="landing-launch-meta animate-on-scroll stagger-3">
              Built for Four.meme AI Sprint Hackathon &bull; $50,000 Prize Pool
            </p>
            <div className="landing-tech-badges animate-on-scroll stagger-4">
              <span className="landing-badge">Python</span>
              <span className="landing-badge">Next.js</span>
              <span className="landing-badge">Three.js</span>
              <span className="landing-badge">OpenAI</span>
            </div>
          </div>
        </section>
      </div>

      {/* Flash overlay for launch transition */}
      <div
        ref={flashRef}
        className="fixed inset-0 z-50 pointer-events-none"
        style={{
          background: "#fff",
          opacity: 0,
          transition: "opacity 0.8s",
        }}
      />
    </div>
  );
}
