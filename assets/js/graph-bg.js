/* AICS — Animated Knowledge Graph · dual-agent */
(function () {
  'use strict';

  const canvas = document.getElementById('kg-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Colour helpers ── */
  const GOLD  = '#fed802';
  const TEAL  = '#5cd6c0';
  const goldA  = a => `rgba(254,216,2,${a})`;
  const tealA  = a => `rgba(92,214,192,${a})`;
  const whiteA = a => `rgba(255,255,255,${a})`;

  /* ── Rounded-rect path helper ── */
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,       y + h - r, r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,     y,     x + r,   y,         r);
    ctx.closePath();
  }

  /* ── Graph definition ── */
  const NODE_DATA = [
    { id:  0, label: 'LLMs',               fx: 0.14, fy: 0.22 },
    { id:  1, label: 'Knowledge Graphs',   fx: 0.44, fy: 0.14 },
    { id:  2, label: 'Entity Resolution',  fx: 0.74, fy: 0.26 },
    { id:  3, label: 'Neurosymbolic AI',   fx: 0.30, fy: 0.44 },
    { id:  4, label: 'Info. Extraction',   fx: 0.62, fy: 0.46 },
    { id:  5, label: 'Network Science',    fx: 0.12, fy: 0.64 },
    { id:  6, label: 'Ontology Learning',  fx: 0.48, fy: 0.62 },
    { id:  7, label: 'Graph Embedding',    fx: 0.80, fy: 0.64 },
    { id:  8, label: 'Causal Inference',   fx: 0.56, fy: 0.72 },
    { id:  9, label: 'Ontology Induction', fx: 0.76, fy: 0.84 },
    { id: 10, label: 'Multimodal AI',      fx: 0.40, fy: 0.30 },
    { id: 11, label: 'Autonomous Agents',  fx: 0.84, fy: 0.44 },
    { id: 12, label: 'Logical Inference',  fx: 0.06, fy: 0.40 },
    { id: 13, label: 'AI for Social Good', fx: 0.68, fy: 0.18 },
    { id: 14, label: 'Commonsense KBs',    fx: 0.22, fy: 0.60 },
    { id: 15, label: 'Healthcare AI',      fx: 0.90, fy: 0.70 },
    { id: 16, label: 'Clinical Knowledge', fx: 0.88, fy: 0.86 },
  ];

  const EDGE_DATA = [
    [0,1],[0,3],[0,10],[0,12],
    [1,2],[1,3],[1,6],[1,10],[1,13],
    [2,4],[2,7],[2,11],[2,13],
    [3,4],[3,5],[3,6],[3,10],[3,14],
    [4,6],[4,7],[4,11],
    [5,6],[5,8],[5,12],[5,14],
    [6,7],[6,8],[6,9],
    [7,9],[7,11],
    [8,9],[8,14],
    [9,11],[10,11],[10,13],
    [12,5],[12,14],[13,11],
    [15,6],[15,8],[15,9],[15,7],[1,15],
    [16,15],[16,9],[16,7],[16,11],
  ];

  const QUESTIONS = [
    {
      text:    'Can AI expose the hidden structures of trafficking networks?',
      nodeIds: [1, 5, 13, 2],
      rgb:     [247, 151, 30],
    },
    {
      text:    'What would it take for AI to reason like a clinician?',
      nodeIds: [15, 16, 8, 9],
      rgb:     [92, 214, 192],
    },
    {
      text:    'Can machines truly reason — or are they just pattern matching?',
      nodeIds: [0, 3, 12, 10],
      rgb:     [192, 132, 252],
    },
    {
      text:    'Can knowledge graphs bring structure to complex real-world systems?',
      nodeIds: [1, 6, 9, 7],
      rgb:     [254, 216, 2],
    },
  ];

  /* ── Runtime ── */
  let W = 0, H = 0;
  let nodes = [], edges = [];
  let animT = 0;

  const PH = { TYPING: 0, LIGHTING: 1, TRAVERSING: 2, FADING: 3 };

  /* ── Agent factory ── */
  function makeAgent(wxFrac, wyFrac, startQIdx, facing, hatColor, hatColorA) {
    return {
      wxFrac, wyFrac, facing,   // facing: 1 = right, -1 = left (mirrors robot)
      hatColor, hatColorA,      // graduation cap colour
      wx: 0, wy: 0,
      dy: 0,
      bobPhase: Math.random() * Math.PI * 2,
      blinkCD:  120 + Math.floor(Math.random() * 80),
      eyeOpen:  1,
      mouthAmp: 0,
      phase: PH.TYPING, phaseStart: 0,
      qIdx: startQIdx,
      glow: {},
      bub: { alpha: 0, chars: 0 },
      sig: { on: false, path: [], seg: 0, prog: 0, speed: 0.006, x: 0, y: 0, trail: [] },
    };
  }

  // Agent 0: bottom-left, Q0, faces right — gold cap
  // Agent 1: top-right,   Q2, faces left — teal cap
  const agents = [
    makeAgent(0.07, 0.75, 0,  1, GOLD, goldA),
    makeAgent(0.93, 0.18, 2, -1, TEAL, tealA),
  ];

  /* ── Node radius scales with canvas width ── */
  function nodeR() { return Math.max(30, Math.min(68, W * 0.045)); }

  /* ── Build graph ── */
  function build() {
    const r = nodeR();
    nodes = NODE_DATA.map(n => ({
      ...n, r,
      phase:  Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      amp:    8 + Math.random() * 12,
      cx: n.fx * W, cy: n.fy * H,
    }));
    // Two glow values per edge — one per agent
    edges = EDGE_DATA.map(([a, b]) => ({ a, b, eg: [0, 0] }));
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    agents.forEach(ag => {
      ag.wx = Math.round(ag.wxFrac * W);
      ag.wy = Math.round(ag.wyFrac * H);
    });
    if (nodes.length) {
      const r = nodeR();
      nodes.forEach(n => { n.cx = n.fx * W; n.cy = n.fy * H; n.r = r; });
    }
  }

  /* ── Phase transitions ── */
  function goPhase(ag, p, now) {
    ag.phase = p; ag.phaseStart = now;
    if (p === PH.TYPING)     { ag.bub.chars = 0; ag.bub.alpha = 1; }
    if (p === PH.TRAVERSING) { buildSigPath(ag); }
    if (p === PH.FADING)     { ag.sig.on = false; }
  }

  function buildSigPath(ag) {
    const q = QUESTIONS[ag.qIdx];
    ag.sig.path = [{ x: ag.wx, y: ag.wy + ag.dy - 80 }];
    q.nodeIds.forEach(id => ag.sig.path.push({ x: nodes[id].cx, y: nodes[id].cy }));
    ag.sig.path.push({ ...ag.sig.path[1] }); // close cycle
    ag.sig.seg = 0; ag.sig.prog = 0; ag.sig.trail = []; ag.sig.on = true;
  }

  /* ── Update ── */
  function update(now) {
    animT += 0.006;

    nodes.forEach(n => {
      n.cx = n.fx * W + Math.sin(animT + n.phase)          * n.amp;
      n.cy = n.fy * H + Math.cos(animT * 0.65 + n.phaseY)  * n.amp * 0.55;
    });

    agents.forEach(ag => {
      const elapsed = now - ag.phaseStart;
      const q = QUESTIONS[ag.qIdx];

      ag.bobPhase += 0.04;
      ag.dy = Math.sin(ag.bobPhase) * 4;

      if (--ag.blinkCD <= 0) {
        ag.eyeOpen = Math.max(0, ag.eyeOpen - 0.35);
        if (ag.eyeOpen <= 0) { ag.eyeOpen = 1; ag.blinkCD = 140 + Math.random() * 120; }
      }

      ag.mouthAmp = (ag.phase === PH.TYPING && ag.bub.chars < q.text.length)
        ? Math.abs(Math.sin(animT * 10)) : 0;

      if (ag.phase === PH.TYPING) {
        ag.bub.chars = Math.min(q.text.length, Math.floor(elapsed / 42));
        if (ag.bub.chars >= q.text.length && elapsed > q.text.length * 42 + 660)
          goPhase(ag, PH.LIGHTING, now);
      }
      else if (ag.phase === PH.LIGHTING) {
        const lit = Math.min(q.nodeIds.length, Math.floor(elapsed / 400) + 1);
        q.nodeIds.slice(0, lit).forEach(id => {
          ag.glow[id] = Math.min(1, (ag.glow[id] || 0) + 0.04);
        });
        Object.keys(ag.glow).forEach(k => {
          if (!q.nodeIds.includes(+k)) ag.glow[k] = Math.max(0, ag.glow[k] - 0.03);
        });
        if (elapsed > q.nodeIds.length * 400 + 330) goPhase(ag, PH.TRAVERSING, now);
      }
      else if (ag.phase === PH.TRAVERSING) {
        q.nodeIds.forEach(id => { ag.glow[id] = Math.min(1, (ag.glow[id] || 0) + 0.015); });

        if (ag.sig.on) {
          ag.sig.path[0] = { x: ag.wx, y: ag.wy + ag.dy - 80 };
          q.nodeIds.forEach((id, i) => {
            ag.sig.path[i + 1] = { x: nodes[id].cx, y: nodes[id].cy };
          });
          ag.sig.path[5] = { ...ag.sig.path[1] };

          ag.sig.prog += ag.sig.speed;
          if (ag.sig.prog >= 1) {
            ag.sig.prog = 0; ag.sig.seg++;
            if (ag.sig.seg >= ag.sig.path.length - 1) ag.sig.seg = 1;
          }
          const pa = ag.sig.path[ag.sig.seg], pb = ag.sig.path[ag.sig.seg + 1];
          if (pa && pb) {
            ag.sig.x = pa.x + (pb.x - pa.x) * ag.sig.prog;
            ag.sig.y = pa.y + (pb.y - pa.y) * ag.sig.prog;
            ag.sig.trail.push({ x: ag.sig.x, y: ag.sig.y, life: 1 });
            if (ag.sig.trail.length > 55) ag.sig.trail.shift();
            ag.sig.trail.forEach(p => p.life = Math.max(0, p.life - 0.028));
          }
        }
        if (elapsed > 10000) goPhase(ag, PH.FADING, now);
      }
      else if (ag.phase === PH.FADING) {
        ag.bub.alpha = Math.max(0, 1 - elapsed / 1150);
        Object.keys(ag.glow).forEach(k => {
          ag.glow[k] = Math.max(0, (ag.glow[k] || 0) - 0.018);
          if (!ag.glow[k]) delete ag.glow[k];
        });
        if (elapsed > 1800) { ag.qIdx = (ag.qIdx + 1) % QUESTIONS.length; goPhase(ag, PH.TYPING, now); }
      }
    });

    // Per-agent edge glow
    edges.forEach(e => {
      agents.forEach((ag, ai) => {
        const want = (ag.glow[e.a] > 0.4 && ag.glow[e.b] > 0.4) ? 0.75 : 0;
        e.eg[ai] += (want - e.eg[ai]) * 0.04;
      });
    });
  }

  /* ── Draw: graph ── */
  function drawGraph() {
    // Edges — one pass per agent so colours don't blend
    agents.forEach((ag, ai) => {
      const [r, g, b] = QUESTIONS[ag.qIdx].rgb;
      edges.forEach(e => {
        if (e.eg[ai] <= 0.25) return;
        const na = nodes[e.a], nb = nodes[e.b];
        ctx.save();
        ctx.shadowColor = `rgba(${r},${g},${b},${e.eg[ai]})`;
        ctx.shadowBlur  = 12 + e.eg[ai] * 16;
        ctx.beginPath(); ctx.moveTo(na.cx, na.cy); ctx.lineTo(nb.cx, nb.cy);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.75 + e.eg[ai] * 0.25})`;
        ctx.lineWidth   = 2 + e.eg[ai] * 1.5;
        ctx.stroke();
        ctx.restore();
      });
    });

    // Nodes — use dominant agent's colour
    nodes.forEach(n => {
      let maxGl = 0, dr = 255, dg = 255, db = 255;
      agents.forEach(ag => {
        const gl = ag.glow[n.id] || 0;
        if (gl > maxGl) { maxGl = gl; [dr, dg, db] = QUESTIONS[ag.qIdx].rgb; }
      });
      const lit = maxGl > 0.05;

      if (lit) {
        ctx.beginPath();
        ctx.arc(n.cx, n.cy, n.r + 8 + maxGl * 18, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${dr},${dg},${db},${maxGl * 0.28})`;
        ctx.lineWidth = 1.5; ctx.stroke();
      }

      ctx.beginPath(); ctx.arc(n.cx, n.cy, n.r, 0, Math.PI * 2);
      ctx.fillStyle   = lit ? `rgba(${dr},${dg},${db},${0.10 * maxGl})` : whiteA(0.03);
      ctx.strokeStyle = lit ? `rgba(${dr},${dg},${db},${0.65 + maxGl * 0.35})` : whiteA(0.18);
      ctx.lineWidth   = lit ? 1.5 : 1;
      ctx.fill(); ctx.stroke();

      ctx.fillStyle    = lit ? `rgba(${dr},${dg},${db},${0.75 + maxGl * 0.25})` : whiteA(0.38);
      ctx.font         = '500 17px ui-monospace,"SF Mono",Menlo,monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.label, n.cx, n.cy);
    });
  }

  /* ── Draw: signal ── */
  function drawSignal(ag) {
    if (!ag.sig.on || ag.sig.path.length < 6) return;
    const [r, g, b] = QUESTIONS[ag.qIdx].rgb;

    const avgGlow = QUESTIONS[ag.qIdx].nodeIds
      .reduce((s, id) => s + (ag.glow[id] || 0), 0) / QUESTIONS[ag.qIdx].nodeIds.length;

    if (avgGlow > 0.25) {
      ctx.save();
      ctx.shadowColor = `rgba(${r},${g},${b},${avgGlow})`;
      ctx.shadowBlur  = 14 + avgGlow * 18;
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.75 + avgGlow * 0.25})`;
      ctx.lineWidth   = 2;
      for (let i = 1; i < ag.sig.path.length - 1; i++) {
        const pa = ag.sig.path[i], pb = ag.sig.path[i + 1];
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }
      ctx.restore();
    }

    ag.sig.trail.forEach(p => {
      if (p.life <= 0) return;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 + p.life * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.life * 0.55})`; ctx.fill();
    });

    const gr = ctx.createRadialGradient(ag.sig.x, ag.sig.y, 0, ag.sig.x, ag.sig.y, 22);
    gr.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath(); ctx.arc(ag.sig.x, ag.sig.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = gr; ctx.fill();

    ctx.beginPath(); ctx.arc(ag.sig.x, ag.sig.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
  }

  /* ── Draw: PhD graduation cap (robot local coords) ── */
  function drawGradCap(ag) {
    const hc  = ag.hatColor;
    const hcA = ag.hatColorA;

    // Base band sitting on top of head (head top = y -54)
    rrect(-16, -62, 32, 9, 2);
    ctx.fillStyle = hc; ctx.strokeStyle = hcA(0.9); ctx.lineWidth = 1;
    ctx.fill(); ctx.stroke();

    // Board — flat parallelogram for 3-D look
    ctx.beginPath();
    ctx.moveTo(-24, -62); ctx.lineTo(24, -62);
    ctx.lineTo(20,  -73); ctx.lineTo(-20, -73);
    ctx.closePath();
    ctx.fillStyle = hc; ctx.strokeStyle = hcA(0.9); ctx.lineWidth = 1;
    ctx.fill(); ctx.stroke();

    // Centre button
    ctx.beginPath(); ctx.arc(0, -67, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6,6,10,0.9)'; ctx.fill();

    // Tassel (hangs from right edge of board)
    ctx.strokeStyle = hcA(0.85); ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(20, -67); ctx.lineTo(24, -54); ctx.stroke();
    ctx.beginPath(); ctx.arc(24, -52, 3, 0, Math.PI * 2);
    ctx.fillStyle = hcA(0.9); ctx.fill();
  }

  /* ── Draw: robot ── */
  function drawRobot(ag) {
    const rx = ag.wx;
    const ry = ag.wy + ag.dy;
    // Scale with viewport — midpoint between compact and full size
    const sc = Math.max(0.42, Math.min(1.05, H / 900));

    ctx.save();
    ctx.translate(rx, ry);
    ctx.scale(sc * ag.facing, sc);  // negative x-scale mirrors robot for right-side agent

    /* Ground shadow */
    ctx.beginPath(); ctx.ellipse(0, 60, 26, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();

    /* Body */
    rrect(-20, 8, 40, 34, 7);
    ctx.fillStyle = 'rgba(8,8,14,0.96)'; ctx.strokeStyle = TEAL; ctx.lineWidth = 1.5;
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = tealA(0.22); ctx.lineWidth = 1;
    for (const px of [-10, 0, 10]) {
      ctx.beginPath(); ctx.moveTo(px, 16); ctx.lineTo(px, 34); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 22, 4, 0, Math.PI * 2);
    ctx.fillStyle = ag.phase === PH.TRAVERSING ? goldA(0.9) : tealA(0.5); ctx.fill();

    /* Legs */
    ctx.strokeStyle = TEAL; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, 42); ctx.lineTo(-11, 58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 11, 42); ctx.lineTo( 11, 58); ctx.stroke();
    ctx.fillStyle = TEAL;
    ctx.beginPath(); ctx.ellipse(-11, 60, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 11, 60, 8, 4, 0, 0, Math.PI * 2); ctx.fill();

    /* Arms */
    ctx.strokeStyle = TEAL; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-20, 16); ctx.lineTo(-35, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 20, 16); ctx.lineTo( 35, 30); ctx.stroke();
    ctx.fillStyle = TEAL;
    ctx.beginPath(); ctx.arc(-35, 30, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 35, 30, 5, 0, Math.PI * 2); ctx.fill();

    /* Neck */
    ctx.strokeStyle = tealA(0.45); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -2); ctx.stroke();

    /* Head */
    rrect(-22, -54, 44, 46, 9);
    ctx.fillStyle = 'rgba(8,8,14,0.96)'; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
    ctx.fill(); ctx.stroke();

    /* Eyes */
    for (const ex of [-10, 10]) {
      ctx.beginPath(); ctx.arc(ex, -34, 9, 0, Math.PI * 2);
      ctx.fillStyle = tealA(0.14); ctx.fill();
      ctx.save();
      ctx.translate(ex, -34);
      ctx.scale(1, Math.max(0.06, ag.eyeOpen));
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = TEAL; ctx.fill();
      ctx.beginPath(); ctx.arc(2, -2, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
      ctx.restore();
    }

    /* Mouth */
    ctx.strokeStyle = goldA(0.75); ctx.lineWidth = 2; ctx.lineCap = 'round';
    if (ag.mouthAmp > 0.05) {
      ctx.beginPath(); ctx.arc(0, -18, 5 + ag.mouthAmp * 3, 0.1, Math.PI - 0.1); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, -20, 6, 0.2, Math.PI - 0.2); ctx.stroke();
    }

    /* PhD cap — draw before antenna so antenna sits on top */
    drawGradCap(ag);

    /* Antenna — emerges from cap top */
    const aBob = Math.sin(animT * 1.8) * 4;
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -67);
    ctx.quadraticCurveTo(aBob * 0.5, -76, aBob, -88);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(aBob, -92, 6, 0, Math.PI * 2);
    ctx.fillStyle = goldA(0.9); ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(aBob, -92, 12, 0, Math.PI * 2);
    ctx.fillStyle = goldA(ag.phase === PH.TRAVERSING ? 0.30 : 0.10); ctx.fill();

    ctx.restore();
  }

  /* ── Draw: speech bubble ── */
  function drawBubble(ag) {
    if (ag.bub.alpha <= 0) return;
    const q    = QUESTIONS[ag.qIdx];
    const text = q.text.slice(0, ag.bub.chars);
    if (!text) return;

    const sc     = Math.max(0.42, Math.min(1.05, H / 900));
    const mouthY = ag.wy + ag.dy - Math.round(18 * sc);
    const bw     = Math.min(300, W * 0.22);
    const pad    = 15;

    ctx.save();
    ctx.globalAlpha = ag.bub.alpha;
    ctx.font = `500 15px ui-monospace,"SF Mono",Menlo,monospace`;

    const lines = wrapText(text, bw - pad * 2);
    const lineH = 23;
    const bh    = pad * 2 + lines.length * lineH;
    const by    = mouthY - bh / 2;

    // Bubble sits to the right for facing-right agent, left for facing-left
    const bx = ag.facing === 1
      ? ag.wx + Math.round(48 * sc)
      : ag.wx - bw - Math.round(48 * sc);

    rrect(bx, by, bw, bh, 10);
    ctx.fillStyle   = 'rgba(6,6,10,0.92)';
    ctx.strokeStyle = goldA(0.75);
    ctx.lineWidth   = 1.5;
    ctx.fill(); ctx.stroke();

    // Tail points toward robot
    const ty = by + bh / 2;
    ctx.beginPath();
    if (ag.facing === 1) {
      ctx.moveTo(bx,      ty - 7);
      ctx.lineTo(bx - 13, ty);
      ctx.lineTo(bx,      ty + 7);
    } else {
      ctx.moveTo(bx + bw,      ty - 7);
      ctx.lineTo(bx + bw + 13, ty);
      ctx.lineTo(bx + bw,      ty + 7);
    }
    ctx.closePath();
    ctx.fillStyle   = 'rgba(6,6,10,0.92)';
    ctx.strokeStyle = goldA(0.75);
    ctx.lineWidth   = 1.5;
    ctx.fill(); ctx.stroke();

    ctx.fillStyle    = '#e6e6e6';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => ctx.fillText(line, bx + pad, by + pad + i * lineH));

    if (ag.bub.chars < q.text.length && Math.floor(Date.now() / 380) % 2 === 0) {
      const lw  = ctx.measureText(lines[lines.length - 1] || '').width;
      const cx2 = bx + pad + lw + 2;
      const cy2 = by + pad + (lines.length - 1) * lineH;
      ctx.fillStyle = GOLD;
      ctx.fillRect(cx2, cy2 + 2, 2, lineH - 4);
    }

    ctx.restore();
  }

  /* ── Text-wrap helper ── */
  function wrapText(text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    words.forEach(w => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line !== '') { lines.push(line); line = w; }
      else { line = test; }
    });
    if (line) lines.push(line);
    return lines;
  }

  /* ── Main loop ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawGraph();
    agents.forEach(ag => drawSignal(ag));
    agents.forEach(ag => drawRobot(ag));
    agents.forEach(ag => drawBubble(ag));
  }

  function loop(now) { update(now); draw(); requestAnimationFrame(loop); }

  /* ── Boot ── */
  window.addEventListener('resize', resize);
  resize();
  build();

  const t0 = performance.now();
  // Both agents start in sync — same phase, different questions
  goPhase(agents[0], PH.TYPING, t0);
  goPhase(agents[1], PH.TYPING, t0);

  requestAnimationFrame(loop);
})();
