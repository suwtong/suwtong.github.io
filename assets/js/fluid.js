'use strict';

// WebGL Fluid Simulation (simplified version inspired by PavelDoGreat/WebGL-Fluid-Simulation)
(function () {
  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  // Resize canvas
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // Shader sources
  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;

    // Simplex-like noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec2 mod289v2(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289v2(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= aspect;

      float t = u_time * 0.15;

      // Multiple layers of fluid-like noise
      float n1 = snoise(p * 1.5 + vec2(t * 0.4, t * 0.3));
      float n2 = snoise(p * 3.0 + vec2(-t * 0.3, t * 0.5));
      float n3 = snoise(p * 5.0 + vec2(t * 0.2, -t * 0.4));

      // Mouse interaction
      vec2 mouseUV = u_mouse / u_resolution;
      mouseUV = mouseUV * 2.0 - 1.0;
      mouseUV.x *= aspect;
      float mouseDist = length(p - mouseUV);
      float mouseInfluence = smoothstep(0.8, 0.0, mouseDist) * 0.3;

      // Combine
      float noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2 + mouseInfluence;

      // Color palette - soft, warm blue
      vec3 color1 = vec3(0.95, 0.97, 1.0);   // soft white-blue
      vec3 color2 = vec3(0.85, 0.92, 0.98);  // light sky blue
      vec3 color3 = vec3(0.88, 0.94, 0.97);  // pale azure
      vec3 color4 = vec3(0.90, 0.95, 0.99);  // ice blue

      vec3 color = mix(color1, color2, smoothstep(-0.5, 0.5, noise));
      color = mix(color, color3, smoothstep(0.0, 0.8, n2));
      color = mix(color, color4, smoothstep(0.3, 0.9, n3) * 0.5);

      // Subtle warm glow near mouse
      color += vec3(0.02, 0.04, 0.06) * mouseInfluence * 1.5;

      // Soft vignette (very subtle)
      float vignette = 1.0 - length(uv - 0.5) * 0.15;
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Compile shader
  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Create program
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  gl.useProgram(program);

  // Full screen quad
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const timeLocation = gl.getUniformLocation(program, 'u_time');
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  const mouseLocation = gl.getUniformLocation(program, 'u_mouse');

  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;
  let targetMouseX = mouseX;
  let targetMouseY = mouseY;

  canvas.addEventListener('mousemove', function (e) {
    targetMouseX = e.clientX;
    targetMouseY = canvas.height - e.clientY;
  });

  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    targetMouseX = e.touches[0].clientX;
    targetMouseY = canvas.height - e.touches[0].clientY;
  });

  // Animation loop
  const startTime = Date.now();

  function render() {
    const time = (Date.now() - startTime) / 1000;

    // Smooth mouse
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    gl.uniform1f(timeLocation, time);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform2f(mouseLocation, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }

  render();
})();
