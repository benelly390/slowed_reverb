// ==========================================
// ASCII City-in-Rain Background
// ==========================================
const asciiCanvas = document.getElementById('asciiBg');
const asciiCtx = asciiCanvas.getContext('2d');

let cols = 0;
let rows = 0;
const fontSize = 14;
let buildings = [];
let rainDrops = [];

const rainChars = '･｡.·˖⁺✦';
const blockChars = '█▉▊▋▌▍▎▏';
const windowChars = '▪▫';

function resizeAsciiCanvas() {
  asciiCanvas.width = window.innerWidth;
  asciiCanvas.height = window.innerHeight;
  cols = Math.floor(asciiCanvas.width / fontSize);
  rows = Math.floor(asciiCanvas.height / fontSize);
  generateBuildings();
  initRain();
}

function generateBuildings() {
  buildings = [];
  let x = 0;
  while (x < cols) {
    const width = 3 + Math.floor(Math.random() * 6);
    const height = Math.floor(rows * 0.3) + Math.floor(Math.random() * rows * 0.35);
    const gap = Math.random() > 0.7 ? 1 + Math.floor(Math.random() * 2) : 0;

    const building = { x, width: Math.min(width, cols - x), height, windows: [] };

    for (let wx = 1; wx < building.width - 1; wx += 2) {
      for (let wy = 2; wy < building.height - 2; wy += 2) {
        if (Math.random() > 0.6) building.windows.push({ x: wx, y: wy });
      }
    }

    buildings.push(building);
    x += width + gap;
  }
}

function initRain() {
  rainDrops = [];
  for (let i = 0; i < cols; i++) {
    rainDrops.push({
      col: i,
      y: Math.random() * -rows,
      speed: 0.3 + Math.random() * 0.5,
      char: rainChars[Math.floor(Math.random() * rainChars.length)]
    });
  }
}

function isInsideBuilding(col, rowFromTop) {
  for (const b of buildings) {
    if (col >= b.x && col < b.x + b.width && rowFromTop > rows - b.height) return true;
  }
  return false;
}

function drawCity() {
  asciiCtx.fillStyle = 'rgba(10, 10, 15, 0.12)';
  asciiCtx.fillRect(0, 0, asciiCanvas.width, asciiCanvas.height);
  asciiCtx.font = `${fontSize}px 'Courier New', monospace`;

  for (const b of buildings) {
    const baseY = rows - b.height;
    for (let by = 0; by < b.height; by++) {
      for (let bx = 0; bx < b.width; bx++) {
        const col = b.x + bx;
        const row = baseY + by;
        const x = col * fontSize;
        const y = row * fontSize;

        const isWindow = b.windows.some((w) => w.x === bx && w.y === by);
        if (isWindow) {
          const flicker = Math.random() > 0.95 ? 0.3 : 0.6;
          asciiCtx.fillStyle = `hsla(45, 80%, 60%, ${flicker})`;
          asciiCtx.fillText(windowChars[0], x, y);
        } else {
          const shade = blockChars[Math.floor(Math.random() * blockChars.length)];
          const alpha = 0.3 + Math.random() * 0.2;
          asciiCtx.fillStyle = `hsla(260, 30%, 25%, ${alpha})`;
          asciiCtx.fillText(shade, x, y);
        }
      }
    }
  }

  for (const drop of rainDrops) {
    const x = drop.col * fontSize;
    const y = drop.y * fontSize;
    if (!isInsideBuilding(drop.col, drop.y)) {
      const hue = 220 + Math.random() * 60;
      const alpha = 0.3 + Math.random() * 0.3;
      asciiCtx.fillStyle = `hsla(${hue}, 70%, 70%, ${alpha})`;
      asciiCtx.fillText(drop.char, x, y);
    }

    drop.y += drop.speed;
    if (drop.y > rows) {
      drop.y = Math.random() * -10;
      drop.char = rainChars[Math.floor(Math.random() * rainChars.length)];
    }
  }

  requestAnimationFrame(drawCity);
}

// ==========================================
// Audio Engine
// ==========================================
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const controls = document.getElementById('controls');
const dropZoneText = dropZone.querySelector('p');

const playBtn = document.getElementById('playBtn');
const downloadBtn = document.getElementById('downloadBtn');
const speedSlider = document.getElementById('speedSlider');
const reverbSlider = document.getElementById('reverbSlider');
const bitrateSelect = document.getElementById('bitrateSelect');
const speedValue = document.getElementById('speedValue');
const reverbValue = document.getElementById('reverbValue');

const vizCanvas = document.getElementById('visualizer');
const vizCtx = vizCanvas.getContext('2d');

let audioContext = null;
let audioBuffer = null;
let currentSource = null;
let isPlaying = false;
let analyser = null;
let animationId = null;

function updateLabels() {
  speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(2)}x`;
  reverbValue.textContent = `${Math.round(parseFloat(reverbSlider.value) * 100)}%`;
}

function initAudioContext() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
}

function createImpulseResponse(ctx, duration = 2.5, decay = 2.0) {
  const length = Math.floor(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return impulse;
}

function createEffectChain(ctx, buffer, speed, reverbMix) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed;

  const convolver = ctx.createConvolver();
  convolver.buffer = createImpulseResponse(ctx);

  const dryGain = ctx.createGain();
  dryGain.gain.value = 1 - reverbMix;

  const wetGain = ctx.createGain();
  wetGain.gain.value = reverbMix;

  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.9;

  source.connect(dryGain);
  source.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(masterGain);
  wetGain.connect(masterGain);

  return { source, masterGain };
}

function initAnalyser() {
  if (!analyser && audioContext) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
  }
}

function drawVisualizer() {
  if (!analyser) return;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  vizCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  vizCtx.fillRect(0, 0, vizCanvas.width, vizCanvas.height);

  const barWidth = (vizCanvas.width / bufferLength) * 0.75;
  const gap = (vizCanvas.width / bufferLength) * 0.25;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * vizCanvas.height * 0.85;
    const hue = 260 + (i / bufferLength) * 40;
    vizCtx.fillStyle = `hsl(${hue}, 70%, 55%)`;
    vizCtx.fillRect(x, vizCanvas.height - barHeight, barWidth, barHeight);
    x += barWidth + gap;
  }

  animationId = requestAnimationFrame(drawVisualizer);
}

function stopPlayback() {
  if (currentSource) {
    currentSource.stop();
    currentSource = null;
  }
  isPlaying = false;
  playBtn.textContent = '▶ 미리듣기';
  if (animationId) cancelAnimationFrame(animationId);
}

function startPlayback() {
  if (!audioBuffer) return;
  stopPlayback();

  initAudioContext();
  initAnalyser();
  const speed = parseFloat(speedSlider.value);
  const reverbMix = parseFloat(reverbSlider.value);

  const { source, masterGain } = createEffectChain(audioContext, audioBuffer, speed, reverbMix);
  masterGain.connect(analyser);
  analyser.connect(audioContext.destination);

  source.start(0);
  currentSource = source;
  isPlaying = true;
  playBtn.textContent = '⏸ 정지';
  drawVisualizer();

  source.onended = () => {
    isPlaying = false;
    playBtn.textContent = '▶ 미리듣기';
    if (animationId) cancelAnimationFrame(animationId);
  };
}

async function loadFile(file) {
  initAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  controls.style.display = 'block';
  dropZoneText.textContent = file.name;

  speedSlider.disabled = false;
  reverbSlider.disabled = false;
  bitrateSelect.disabled = false;
  playBtn.disabled = false;
  downloadBtn.disabled = false;
}

function floatToInt16(floatArray) {
  const int16 = new Int16Array(floatArray.length);
  for (let i = 0; i < floatArray.length; i++) {
    const s = Math.max(-1, Math.min(1, floatArray[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function bufferToMP3(renderedBuffer, bitrate) {
  const numChannels = renderedBuffer.numberOfChannels;
  const sampleRate = renderedBuffer.sampleRate;
  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrate);
  const mp3Data = [];
  const sampleBlockSize = 1152;

  for (let i = 0; i < renderedBuffer.length; i += sampleBlockSize) {
    const left = renderedBuffer.getChannelData(0).subarray(i, i + sampleBlockSize);
    const leftInt = floatToInt16(left);

    if (numChannels === 2) {
      const right = renderedBuffer.getChannelData(1).subarray(i, i + sampleBlockSize);
      const rightInt = floatToInt16(right);
      const mp3buf = mp3encoder.encodeBuffer(leftInt, rightInt);
      if (mp3buf.length > 0) mp3Data.push(mp3buf);
    } else {
      const mp3buf = mp3encoder.encodeBuffer(leftInt);
      if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }
  }

  const tail = mp3encoder.flush();
  if (tail.length > 0) mp3Data.push(tail);
  return new Blob(mp3Data, { type: 'audio/mp3' });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) loadFile(e.target.files[0]);
});

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('audio/')) loadFile(file);
  else alert('오디오 파일을 업로드해 주세요.');
});

playBtn.addEventListener('click', () => {
  if (isPlaying) stopPlayback();
  else startPlayback();
});

downloadBtn.addEventListener('click', async () => {
  if (!audioBuffer) return;

  const bitrate = parseInt(bitrateSelect.value, 10);
  downloadBtn.disabled = true;
  downloadBtn.textContent = `랜더링 중... (${bitrate}kbps)`;

  const speed = parseFloat(speedSlider.value);
  const reverbMix = parseFloat(reverbSlider.value);
  const duration = audioBuffer.duration / speed;

  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(duration * audioBuffer.sampleRate),
    audioBuffer.sampleRate
  );

  const { source, masterGain } = createEffectChain(offlineCtx, audioBuffer, speed, reverbMix);
  masterGain.connect(offlineCtx.destination);
  source.start(0);

  const rendered = await offlineCtx.startRendering();
  const mp3Blob = bufferToMP3(rendered, bitrate);

  const baseName = dropZoneText.textContent.replace(/\.[^/.]+$/, '') || 'output';
  triggerDownload(mp3Blob, `${baseName}_slowed_reverb_${bitrate}kbps.mp3`);

  downloadBtn.disabled = false;
  downloadBtn.textContent = '▼ 다운로드 (MP3)';
});

[speedSlider, reverbSlider].forEach((el) => el.addEventListener('input', updateLabels));
updateLabels();

speedSlider.disabled = true;
reverbSlider.disabled = true;
bitrateSelect.disabled = true;
playBtn.disabled = true;
downloadBtn.disabled = true;

document.addEventListener('keydown', (e) => {
  if (
    e.code === 'Space' &&
    audioBuffer &&
    document.activeElement.tagName !== 'INPUT' &&
    document.activeElement.tagName !== 'SELECT'
  ) {
    e.preventDefault();
    playBtn.click();
  }
});

resizeAsciiCanvas();
window.addEventListener('resize', resizeAsciiCanvas);
drawCity();
