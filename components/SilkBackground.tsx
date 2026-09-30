'use client';

import { useEffect, useRef } from 'react';

/**
 * Organic Silk & Fluid Mesh Gradient Background Engine
 * Renders an ambient physical cloth-weave shader with specular crests.
 * - Dark Mode: Deep obsidian black (#080A0E) with subtle graphite/titanium sheen folds.
 * - Light Mode: Organic soft stone clay (#E2E6EC) with delicate warm vermilion-cherry undertones.
 */
export default function SilkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) return;

    const activeCanvas: HTMLCanvasElement = canvas;
    const activeGl: WebGLRenderingContext = gl;

    // Vertex Shader (Fullscreen Quad)
    const vsSource = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    // Fragment Shader (Silk cloth physics with crest gleam & weave)
    const fsSource = `
      precision highp float;
      uniform vec2 u_res;
      uniform float u_time;
      uniform float u_isDark;

      // Cloth Coordinates calculation
      vec2 getCoordinates(vec2 xy, float angle, float zoom, float folds, float drape, float time) {
        float ca = cos(angle);
        float sa = sin(angle);
        float u = (xy.x * ca + xy.y * sa) / zoom;
        float v = (-xy.x * sa + xy.y * ca) / zoom;
        float a = 0.35 + drape * 0.3;
        float wu = a * sin(1.9 * v + 0.6 * u + time) + 0.05 * sin(4.1 * v - 1.3 * u - time * 0.6);
        float wv = a * 0.6 * sin(1.7 * u - 0.5 * v - time * 0.8) + 0.05 * sin(3.7 * u + 1.1 * v + time * 0.5);
        u += wu;
        v += wv;
        float pull = (v + 0.45) * 1.7;
        float spread = 1.0 - 0.25 * exp(-pull * pull);
        return vec2(((u + 0.2) / spread - 0.2) * folds, v);
      }

      // Height displacement
      float cloth(vec2 xy, float time) {
        const float TAU = 6.28318530718;
        vec2 coord = getCoordinates(xy, 0.65, 1.3, 5.0, 0.45, time);
        float lane0 = coord.x;
        float v = coord.y;
        float lane = lane0 + 0.45 * sin(lane0 * 0.53 + v * 0.7) + 0.1 * sin(lane0 * 1.31 - v * 1.1 + time * 0.4);
        float lp = lane * 0.35;
        float rolled = lp + 0.05 * sin(TAU * lp + 0.4);
        float amp = 0.6 + 0.35 * sin(lane * 0.71 + v * 0.9);
        float along = 0.8 + 0.2 * sin(v * 2.4 + lane * 0.4 + time * 0.25);
        float h = amp * along * (0.5 + 0.5 * cos(TAU * rolled));
        h += 0.25 * sin(lane * 0.4 + v * 1.3);
        return 0.25 * h;
      }

      void main() {
        float aspect = u_res.x / u_res.y;
        float fit = min(1.0, 1.6 / aspect);
        vec2 p = (vec2(gl_FragCoord.x / u_res.x, 1.0 - gl_FragCoord.y / u_res.y) - 0.5) * vec2(aspect, 1.0) * fit;

        float e = 0.002;
        float h = cloth(p, u_time);
        
        // Calculate normal vector
        float dhx = (cloth(p + vec2(e, 0.0), u_time) - cloth(p - vec2(e, 0.0), u_time)) / (2.0 * e);
        float dhy = (cloth(p + vec2(0.0, e), u_time) - cloth(p - vec2(0.0, e), u_time)) / (2.0 * e);
        vec3 N = normalize(vec3(-dhx, -dhy, 1.0));

        // Light direction
        vec3 L = normalize(vec3(0.6, 0.8, 0.75));
        vec3 V = vec3(0.0, 0.0, 1.0);
        vec3 H = normalize(L + V);

        float nl = max(dot(N, L), 0.0);
        float nh = max(dot(N, H), 0.0);
        float specular = pow(nh, 12.0);

        // Ambient depth shadow
        float depthAo = clamp(h * 2.5 + 0.5, 0.0, 1.0);

        vec3 color;
        if (u_isDark > 0.5) {
          // DARK MODE: Predominantly black obsidian (#080A0E) with graphite & titanium folds
          vec3 darkBase = vec3(0.035, 0.042, 0.055);
          vec3 darkRidge = vec3(0.075, 0.088, 0.115);
          vec3 darkGlint = vec3(0.18, 0.22, 0.28);

          color = mix(darkBase, darkRidge, depthAo * 0.7);
          color += darkGlint * specular * 0.45;
          color += vec3(0.015, 0.02, 0.03) * nl;
        } else {
          // LIGHT MODE: Soft stone clay (#E2E6EC) with delicate warm vermilion & black cherry undertones
          vec3 lightBase = vec3(0.88, 0.90, 0.93);
          vec3 lightRidge = vec3(0.93, 0.95, 0.97);
          vec3 warmCherry = vec3(0.85, 0.80, 0.79);

          color = mix(lightBase, lightRidge, depthAo * 0.8);
          color = mix(color, warmCherry, (1.0 - depthAo) * 0.25);
          color += vec3(0.06, 0.06, 0.06) * specular * 0.35;
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function createShader(type: number, source: string) {
      const shader = activeGl.createShader(type);
      if (!shader) return null;
      activeGl.shaderSource(shader, source);
      activeGl.compileShader(shader);
      if (!activeGl.getShaderParameter(shader, activeGl.COMPILE_STATUS)) {
        activeGl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(activeGl.VERTEX_SHADER, vsSource);
    const fs = createShader(activeGl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = activeGl.createProgram();
    if (!program) return;
    activeGl.attachShader(program, vs);
    activeGl.attachShader(program, fs);
    activeGl.linkProgram(program);
    if (!activeGl.getProgramParameter(program, activeGl.LINK_STATUS)) return;

    activeGl.useProgram(program);

    // Quad geometry
    const buffer = activeGl.createBuffer();
    activeGl.bindBuffer(activeGl.ARRAY_BUFFER, buffer);
    activeGl.bufferData(activeGl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), activeGl.STATIC_DRAW);

    const posLoc = activeGl.getAttribLocation(program, 'a_pos');
    activeGl.enableVertexAttribArray(posLoc);
    activeGl.vertexAttribPointer(posLoc, 2, activeGl.FLOAT, false, 0, 0);

    const resLoc = activeGl.getUniformLocation(program, 'u_res');
    const timeLoc = activeGl.getUniformLocation(program, 'u_time');
    const isDarkLoc = activeGl.getUniformLocation(program, 'u_isDark');

    let animId = 0;
    const startTime = performance.now();

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const canvasWidth = Math.round(width * dpr);
      const canvasHeight = Math.round(height * dpr);

      if (activeCanvas.width !== canvasWidth || activeCanvas.height !== canvasHeight) {
        activeCanvas.width = canvasWidth;
        activeCanvas.height = canvasHeight;
        activeGl.viewport(0, 0, canvasWidth, canvasHeight);
      }
    }

    window.addEventListener('resize', resize);
    resize();

    function render() {
      const now = performance.now();
      const elapsed = (now - startTime) * 0.00035; // gentle ambient pace
      const isDark = document.documentElement.classList.contains('dark') ? 1.0 : 0.0;

      activeGl.uniform2f(resLoc, activeCanvas.width, activeCanvas.height);
      activeGl.uniform1f(timeLoc, prefersReducedMotion ? 0.5 : elapsed);
      activeGl.uniform1f(isDarkLoc, isDark);

      activeGl.drawArrays(activeGl.TRIANGLES, 0, 3);

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    }

    render();

    // Re-render immediately on theme class mutations
    const observer = new MutationObserver(() => {
      if (prefersReducedMotion) render();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      observer.disconnect();
      activeGl.deleteProgram(program);
      activeGl.deleteShader(vs);
      activeGl.deleteShader(fs);
      activeGl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none transition-opacity duration-700"
      style={{ opacity: 0.95 }}
    />
  );
}
