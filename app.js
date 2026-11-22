/**
 * Passport Photo Grid - Single Page Application
 * Client-side 2x2" cropper and 4x6" grid generator (6 copies in 2 rows x 3 columns)
 * Default export: 4x6inch.jpg at 300 DPI
 */

(() => {
  'use strict';

  // --- DOM Elements ---
  const uploadSection = document.getElementById('upload-section');
  const workspaceSection = document.getElementById('workspace-section');
  const fileInput = document.getElementById('file-input');
  const cameraInput = document.getElementById('camera-input');
  const browseBtn = document.getElementById('browse-btn');
  const cameraBtn = document.getElementById('camera-btn');
  const sampleBtn = document.getElementById('sample-btn');
  const changePhotoBtn = document.getElementById('change-photo-btn');
  const photoInfoText = document.getElementById('photo-info-text');

  // Crop Viewport Elements
  const cropViewport = document.getElementById('crop-viewport');
  const cropCanvas = document.getElementById('crop-canvas');
  const guideCanvas = document.getElementById('guide-canvas');
  const cropCtx = cropCanvas.getContext('2d');
  const guideCtx = guideCanvas.getContext('2d');

  // Controls Elements
  const zoomSlider = document.getElementById('zoom-slider');
  const zoomVal = document.getElementById('zoom-val');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const tiltSlider = document.getElementById('tilt-slider');
  const tiltVal = document.getElementById('tilt-val');
  const resetTiltBtn = document.getElementById('reset-tilt-btn');
  const rotateLeftBtn = document.getElementById('rotate-left-btn');
  const rotateRightBtn = document.getElementById('rotate-right-btn');
  const flipBtn = document.getElementById('flip-btn');
  const centerBtn = document.getElementById('center-btn');
  const guideSelector = document.getElementById('guide-selector');

  // Lighting adjustments
  const brightnessSlider = document.getElementById('brightness-slider');
  const brightnessVal = document.getElementById('brightness-val');
  const contrastSlider = document.getElementById('contrast-slider');
  const contrastVal = document.getElementById('contrast-val');
  const saturationSlider = document.getElementById('saturation-slider');
  const saturationVal = document.getElementById('saturation-val');
  const resetAdjustmentsBtn = document.getElementById('reset-adjustments-btn');

  // Grid Preview Elements
  const gridPreviewCanvas = document.getElementById('grid-preview-canvas');
  const gridPreviewCtx = gridPreviewCanvas.getContext('2d');
  const guideLinesSelect = document.getElementById('guide-lines-select');
  const resolutionSelect = document.getElementById('resolution-select');

  // Action Buttons
  const downloadGridBtn = document.getElementById('download-grid-btn');
  const downloadSingleBtn = document.getElementById('download-single-btn');
  const printBtn = document.getElementById('print-btn');
  const printImage = document.getElementById('print-image');
  const toastContainer = document.getElementById('toast-container');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');

  // --- Application State ---
  const state = {
    image: null,
    imageLoaded: false,
    imageWidth: 0,
    imageHeight: 0,

    // Transformation parameters
    scale: 1.0,
    minScale: 0.2,
    maxScale: 4.0,
    offsetX: 0,
    offsetY: 0,
    baseRotation: 0, // In increments of 90 degrees
    tilt: 0, // Fine angle in degrees (-15 to +15)
    flipH: false,

    // Lighting filters
    brightness: 100,
    contrast: 100,
    saturation: 100,

    // UI Preferences
    guideType: 'passport', // 'passport', 'grid', 'cross', 'none'
    guideLinesStyle: 'dashed', // 'dashed', 'corner', 'none'
    dpi: 300, // 300 or 600

    // Canvas sizes
    viewportSize: 400
  };

  // --- Gesture & Pointer Handling State ---
  const activePointers = new Map();
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialOffsetX = 0;
  let initialOffsetY = 0;
  let initialPinchDistance = 0;
  let initialPinchScale = 1.0;

  // --- Helpers ---
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3200);
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }

  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  // --- File Loading ---
  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP, etc.).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      loadImageSource(e.target.result, file.name);
    };
    reader.onerror = () => {
      showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
  }

  function loadImageSource(src, fileName = 'Photo') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state.image = img;
      state.imageLoaded = true;
      state.imageWidth = img.naturalWidth || img.width;
      state.imageHeight = img.naturalHeight || img.height;

      // Update info display
      photoInfoText.textContent = `${fileName} (${state.imageWidth} × ${state.imageHeight} px)`;

      // Reset transformations and fit image
      resetTransformations();

      // Switch view from upload card to workspace
      uploadSection.style.display = 'none';
      workspaceSection.classList.add('active');

      // Resize canvas to match container and render
      resizeCanvases();
      renderAll();

      showToast('Photo loaded successfully! Adjust crop and preview below.');
    };
    img.onerror = () => {
      showToast('Could not load image. Please try another file.', 'error');
    };
    img.src = src;
  }

  function resetTransformations() {
    state.baseRotation = 0;
    state.tilt = 0;
    state.flipH = false;
    state.brightness = 100;
    state.contrast = 100;
    state.saturation = 100;

    // Reset controls UI
    tiltSlider.value = 0;
    tiltVal.textContent = '0.0°';
    brightnessSlider.value = 100;
    brightnessVal.textContent = '100%';
    contrastSlider.value = 100;
    contrastVal.textContent = '100%';
    saturationSlider.value = 100;
    saturationVal.textContent = '100%';

    fitAndCenter();
  }

  function fitAndCenter() {
    if (!state.imageLoaded) return;

    state.offsetX = 0;
    state.offsetY = 0;

    // Account for current rotation when computing scale
    const totalAngle = (state.baseRotation + state.tilt) % 180;
    const isTransposed = Math.abs(totalAngle) === 90;
    const w = isTransposed ? state.imageHeight : state.imageWidth;
    const h = isTransposed ? state.imageWidth : state.imageHeight;

    // Scale so image covers the square viewport nicely
    const targetDim = state.viewportSize || 400;
    const scaleToCover = Math.max(targetDim / w, targetDim / h);
    state.scale = scaleToCover;

    // Set slider range dynamically based on image size
    state.minScale = scaleToCover * 0.4;
    state.maxScale = scaleToCover * 4.0;

    zoomSlider.min = state.minScale;
    zoomSlider.max = state.maxScale;
    zoomSlider.value = state.scale;
    updateZoomDisplay();
  }

  function updateZoomDisplay() {
    const pct = Math.round((state.scale / (zoomSlider.min || 0.001)) * 50);
    zoomVal.textContent = `${pct}%`;
    zoomSlider.value = state.scale;
  }

  // --- Upload Event Listeners ---
  browseBtn.addEventListener('click', () => fileInput.click());
  cameraBtn.addEventListener('click', () => cameraInput.click());
  changePhotoBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadFile(e.target.files[0]);
    }
  });

  cameraInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadFile(e.target.files[0]);
    }
  });

  sampleBtn.addEventListener('click', () => {
    loadImageSource('sample-portrait.svg', 'Sample Portrait');
  });

  // Drag and drop handlers
  ['dragenter', 'dragover'].forEach((eventName) => {
    uploadSection.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadSection.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    uploadSection.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadSection.classList.remove('dragover');
    });
  });

  uploadSection.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  });

  // Also allow drag and drop anywhere on the document when workspace is active
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  });

  // Clipboard paste support (Ctrl+V / Cmd+V)
  window.addEventListener('paste', (e) => {
    if (!e.clipboardData) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        loadFile(file);
        showToast('Pasted image from clipboard!');
        break;
      }
    }
  });

  // --- Canvas Resizing ---
  function resizeCanvases() {
    const rect = cropViewport.getBoundingClientRect();
    const size = Math.round(rect.width) || 400;
    state.viewportSize = size;

    const dpr = window.devicePixelRatio || 1;

    // Size cropCanvas and guideCanvas with HiDPI support
    cropCanvas.width = size * dpr;
    cropCanvas.height = size * dpr;
    cropCanvas.style.width = `${size}px`;
    cropCanvas.style.height = `${size}px`;

    guideCanvas.width = size * dpr;
    guideCanvas.height = size * dpr;
    guideCanvas.style.width = `${size}px`;
    guideCanvas.style.height = `${size}px`;

    // Size grid preview canvas (3:2 aspect ratio: 6" x 4")
    const gridHolder = gridPreviewCanvas.parentElement.getBoundingClientRect();
    const gridWidth = Math.round(gridHolder.width) || 540;
    const gridHeight = Math.round(gridWidth * (2 / 3)); // 4" / 6" = 2/3

    gridPreviewCanvas.width = gridWidth * dpr;
    gridPreviewCanvas.height = gridHeight * dpr;
    gridPreviewCanvas.style.width = `${gridWidth}px`;
    gridPreviewCanvas.style.height = `${gridHeight}px`;
  }

  window.addEventListener('resize', () => {
    if (state.imageLoaded) {
      resizeCanvases();
      renderAll();
    }
  });

  // --- Pointer & Touch Gesture Handling ---
  cropViewport.addEventListener('pointerdown', (e) => {
    if (!state.imageLoaded) return;
    cropViewport.setPointerCapture(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1) {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialOffsetX = state.offsetX;
      initialOffsetY = state.offsetY;
    } else if (activePointers.size === 2) {
      isDragging = false;
      const pts = Array.from(activePointers.values());
      initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchScale = state.scale;
    }
  });

  cropViewport.addEventListener('pointermove', (e) => {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1 && isDragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      state.offsetX = initialOffsetX + dx;
      state.offsetY = initialOffsetY + dy;
      renderAll();
    } else if (activePointers.size === 2) {
      const pts = Array.from(activePointers.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (initialPinchDistance > 0) {
        const factor = currentDist / initialPinchDistance;
        state.scale = clamp(initialPinchScale * factor, state.minScale, state.maxScale);
        updateZoomDisplay();
        renderAll();
      }
    }
  });

  function endPointer(e) {
    activePointers.delete(e.pointerId);
    if (activePointers.size === 1) {
      const remaining = Array.from(activePointers.values())[0];
      dragStartX = remaining.x;
      dragStartY = remaining.y;
      initialOffsetX = state.offsetX;
      initialOffsetY = state.offsetY;
      isDragging = true;
    } else if (activePointers.size === 0) {
      isDragging = false;
    }
  }

  cropViewport.addEventListener('pointerup', endPointer);
  cropViewport.addEventListener('pointercancel', endPointer);

  // Mouse wheel zoom
  cropViewport.addEventListener('wheel', (e) => {
    if (!state.imageLoaded) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    state.scale = clamp(state.scale * zoomFactor, state.minScale, state.maxScale);
    updateZoomDisplay();
    renderAll();
  }, { passive: false });

  // --- Toolbar Controls Listeners ---
  zoomSlider.addEventListener('input', (e) => {
    state.scale = parseFloat(e.target.value);
    updateZoomDisplay();
    renderAll();
  });

  zoomInBtn.addEventListener('click', () => {
    state.scale = clamp(state.scale * 1.15, state.minScale, state.maxScale);
    updateZoomDisplay();
    renderAll();
  });

  zoomOutBtn.addEventListener('click', () => {
    state.scale = clamp(state.scale * 0.85, state.minScale, state.maxScale);
    updateZoomDisplay();
    renderAll();
  });

  tiltSlider.addEventListener('input', (e) => {
    state.tilt = parseFloat(e.target.value);
    tiltVal.textContent = `${state.tilt > 0 ? '+' : ''}${state.tilt.toFixed(1)}°`;
    renderAll();
  });

  resetTiltBtn.addEventListener('click', () => {
    state.tilt = 0;
    tiltSlider.value = 0;
    tiltVal.textContent = '0.0°';
    renderAll();
  });

  rotateLeftBtn.addEventListener('click', () => {
    state.baseRotation = (state.baseRotation - 90 + 360) % 360;
    renderAll();
  });

  rotateRightBtn.addEventListener('click', () => {
    state.baseRotation = (state.baseRotation + 90) % 360;
    renderAll();
  });

  flipBtn.addEventListener('click', () => {
    state.flipH = !state.flipH;
    renderAll();
  });

  centerBtn.addEventListener('click', () => {
    fitAndCenter();
    renderAll();
  });

  // Guide overlay selection
  guideSelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.segmented-item');
    if (!btn) return;
    guideSelector.querySelectorAll('.segmented-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.guideType = btn.dataset.guide;
    renderGuideOverlay();
  });

  // Lighting filters
  brightnessSlider.addEventListener('input', (e) => {
    state.brightness = parseInt(e.target.value, 10);
    brightnessVal.textContent = `${state.brightness}%`;
    renderAll();
  });

  contrastSlider.addEventListener('input', (e) => {
    state.contrast = parseInt(e.target.value, 10);
    contrastVal.textContent = `${state.contrast}%`;
    renderAll();
  });

  saturationSlider.addEventListener('input', (e) => {
    state.saturation = parseInt(e.target.value, 10);
    saturationVal.textContent = `${state.saturation}%`;
    renderAll();
  });

  resetAdjustmentsBtn.addEventListener('click', () => {
    state.brightness = 100;
    state.contrast = 100;
    state.saturation = 100;
    brightnessSlider.value = 100;
    brightnessVal.textContent = '100%';
    contrastSlider.value = 100;
    contrastVal.textContent = '100%';
    saturationSlider.value = 100;
    saturationVal.textContent = '100%';
    renderAll();
  });

  // Grid options listeners
  guideLinesSelect.addEventListener('change', (e) => {
    state.guideLinesStyle = e.target.value;
    renderGridPreview();
  });

  resolutionSelect.addEventListener('change', (e) => {
    state.dpi = parseInt(e.target.value, 10);
    renderGridPreview();
  });

  // --- Core Rendering Functions ---

  /**
   * Main render trigger
   */
  function renderAll() {
    if (!state.imageLoaded) return;
    renderCropView();
    renderGuideOverlay();
    renderGridPreview();
  }

  /**
   * Render the single square photo in the user's interactive viewport
   */
  function renderCropView() {
    const dpr = window.devicePixelRatio || 1;
    const w = cropCanvas.width;
    const h = cropCanvas.height;
    const viewportDim = state.viewportSize;

    cropCtx.save();
    cropCtx.clearRect(0, 0, w, h);

    // Scale context for Retina / HiDPI
    cropCtx.scale(dpr, dpr);

    // Plain white photo paper background
    cropCtx.fillStyle = '#ffffff';
    cropCtx.fillRect(0, 0, viewportDim, viewportDim);

    // Center origin
    cropCtx.translate(viewportDim / 2, viewportDim / 2);

    // User pan offset
    cropCtx.translate(state.offsetX, state.offsetY);

    // Total rotation: 90 deg steps + fine tilt
    const totalAngle = ((state.baseRotation + state.tilt) * Math.PI) / 180;
    cropCtx.rotate(totalAngle);

    // Horizontal flip
    cropCtx.scale(state.flipH ? -1 : 1, 1);

    // Scale
    cropCtx.scale(state.scale, state.scale);

    // Filter adjustments
    cropCtx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%)`;

    // Draw source image centered
    cropCtx.drawImage(
      state.image,
      -state.imageWidth / 2,
      -state.imageHeight / 2,
      state.imageWidth,
      state.imageHeight
    );

    cropCtx.restore();
  }

  /**
   * Render alignment guidelines over the crop viewport
   */
  function renderGuideOverlay() {
    const dpr = window.devicePixelRatio || 1;
    const w = guideCanvas.width;
    const h = guideCanvas.height;
    const size = state.viewportSize;

    guideCtx.save();
    guideCtx.clearRect(0, 0, w, h);
    guideCtx.scale(dpr, dpr);

    if (state.guideType === 'none') {
      guideCtx.restore();
      return;
    }

    if (state.guideType === 'grid') {
      // Rule of thirds (3x3 grid)
      guideCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      guideCtx.lineWidth = 1;
      guideCtx.setLineDash([4, 4]);

      const third = size / 3;
      guideCtx.beginPath();
      guideCtx.moveTo(third, 0); guideCtx.lineTo(third, size);
      guideCtx.moveTo(third * 2, 0); guideCtx.lineTo(third * 2, size);
      guideCtx.moveTo(0, third); guideCtx.lineTo(size, third);
      guideCtx.moveTo(0, third * 2); guideCtx.lineTo(size, third * 2);
      guideCtx.stroke();
    } else if (state.guideType === 'cross') {
      // Center crosshair
      guideCtx.strokeStyle = 'rgba(59, 130, 246, 0.75)';
      guideCtx.lineWidth = 1.5;
      guideCtx.setLineDash([6, 6]);

      guideCtx.beginPath();
      guideCtx.moveTo(size / 2, 0); guideCtx.lineTo(size / 2, size);
      guideCtx.moveTo(0, size / 2); guideCtx.lineTo(size, size / 2);
      guideCtx.stroke();
    } else if (state.guideType === 'passport') {
      // US State Dept / ICAO Standard 2x2" Passport Guide
      // In 2" square:
      // - Head height (chin to top of hair) must be 1" to 1 3/8" (50% to 68.75% of total height)
      // - Eyes should be between 1 1/8" (56.25%) and 1 3/8" (68.75%) from bottom
      
      const centerX = size / 2;

      // Color scheme for visibility over both light and dark photos
      const guideColor = 'rgba(245, 158, 11, 0.85)'; // Amber/Gold
      const guideCyan = 'rgba(6, 182, 212, 0.85)';   // Cyan
      const subtleWhite = 'rgba(255, 255, 255, 0.45)';

      // 1. Center vertical symmetry axis
      guideCtx.strokeStyle = subtleWhite;
      guideCtx.lineWidth = 1;
      guideCtx.setLineDash([4, 4]);
      guideCtx.beginPath();
      guideCtx.moveTo(centerX, 0);
      guideCtx.lineTo(centerX, size);
      guideCtx.stroke();

      // 2. Head oval guide (Representative average passport oval)
      // Oval dimensions: width ~44% of photo, height ~58% of photo
      const headOvalW = size * 0.44;
      const headOvalH = size * 0.58;
      const headCenterY = size * 0.45;

      guideCtx.strokeStyle = guideColor;
      guideCtx.lineWidth = 2;
      guideCtx.setLineDash([6, 4]);
      guideCtx.beginPath();
      guideCtx.ellipse(centerX, headCenterY, headOvalW / 2, headOvalH / 2, 0, 0, Math.PI * 2);
      guideCtx.stroke();

      // 3. Horizontal guidelines
      // Crown (Top of head) maximum & minimum guidelines
      const crownMaxY = size * (1 - 0.88); // 1.76" from bottom
      const crownMinY = size * (1 - 0.70); // 1.40" from bottom
      const eyeLevelY = size * (1 - 0.60); // Eye line (~1.20" from bottom)
      const chinLineY = size * (1 - 0.28); // Chin line (~0.56" from bottom)

      guideCtx.font = '10px -apple-system, sans-serif';
      guideCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      guideCtx.textAlign = 'left';

      // Function to draw line with subtle text badge
      function drawHLine(y, label, color, dash = [4, 4]) {
        guideCtx.strokeStyle = color;
        guideCtx.lineWidth = 1.5;
        guideCtx.setLineDash(dash);
        guideCtx.beginPath();
        guideCtx.moveTo(10, y);
        guideCtx.lineTo(size - 10, y);
        guideCtx.stroke();

        // Label background pill
        guideCtx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        const textWidth = guideCtx.measureText(label).width;
        guideCtx.fillRect(14, y - 11, textWidth + 8, 13);

        guideCtx.fillStyle = color;
        guideCtx.fillText(label, 18, y - 2);
      }

      drawHLine(crownMaxY, 'Crown (Max)', guideColor, [4, 4]);
      drawHLine(crownMinY, 'Crown (Min)', 'rgba(245, 158, 11, 0.5)', [2, 4]);
      drawHLine(eyeLevelY, 'Eye Level', guideCyan, [6, 4]);
      drawHLine(chinLineY, 'Chin', guideColor, [4, 4]);
    }

    guideCtx.restore();
  }

  /**
   * Render single 2x2" photo to an offscreen canvas at specified resolution
   * @param {number} R - Pixel resolution of the square (e.g. 600 for 300 DPI)
   * @returns {HTMLCanvasElement}
   */
  function generateSingleSquareCanvas(R) {
    const canvas = document.createElement('canvas');
    canvas.width = R;
    canvas.height = R;
    const ctx = canvas.getContext('2d');

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, R, R);

    if (!state.imageLoaded) return canvas;

    // Viewport-to-output scale multiplier
    const k = R / state.viewportSize;

    ctx.save();
    // Center of square
    ctx.translate(R / 2, R / 2);

    // Apply scaled pan offsets
    ctx.translate(state.offsetX * k, state.offsetY * k);

    // Total rotation
    const totalAngle = ((state.baseRotation + state.tilt) * Math.PI) / 180;
    ctx.rotate(totalAngle);

    // Flip & Scale
    ctx.scale((state.flipH ? -1 : 1) * state.scale * k, state.scale * k);

    // Filter adjustments
    ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%)`;

    // Draw image
    ctx.drawImage(
      state.image,
      -state.imageWidth / 2,
      -state.imageHeight / 2,
      state.imageWidth,
      state.imageHeight
    );

    ctx.restore();
    return canvas;
  }

  /**
   * Render the 4x6" grid canvas (2 rows by 3 columns = 6 copies)
   * @param {number} dpi - 300 or 600
   * @returns {HTMLCanvasElement}
   */
  function generateFullGridCanvas(dpi = 300) {
    // 2" x 2" square at dpi:
    // 300 DPI -> 600 x 600 px
    // 600 DPI -> 1200 x 1200 px
    const R = Math.round(2 * dpi);

    // Grid: 3 columns x 2 rows
    // Width: 3 * 2" = 6" -> 1800 px (at 300 DPI) or 3600 px (at 600 DPI)
    // Height: 2 * 2" = 4" -> 1200 px (at 300 DPI) or 2400 px (at 600 DPI)
    const gridW = 3 * R;
    const gridH = 2 * R;

    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = gridW;
    fullCanvas.height = gridH;
    const fullCtx = fullCanvas.getContext('2d');

    // White paper background
    fullCtx.fillStyle = '#ffffff';
    fullCtx.fillRect(0, 0, gridW, gridH);

    // Generate single square at target resolution
    const singleSquare = generateSingleSquareCanvas(R);

    // Draw 6 copies in a 2x3 grid
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        fullCtx.drawImage(singleSquare, col * R, row * R, R, R);
      }
    }

    // Draw cutting guide lines if selected
    if (state.guideLinesStyle === 'dashed') {
      fullCtx.save();
      fullCtx.strokeStyle = 'rgba(160, 160, 160, 0.7)';
      fullCtx.lineWidth = dpi === 600 ? 2 : 1;
      fullCtx.setLineDash([dpi / 50, dpi / 50]); // Adaptive dashed pattern

      fullCtx.beginPath();
      // Vertical internal dividers (at column 1 and column 2)
      fullCtx.moveTo(R, 0); fullCtx.lineTo(R, gridH);
      fullCtx.moveTo(2 * R, 0); fullCtx.lineTo(2 * R, gridH);

      // Horizontal internal divider (at row 1)
      fullCtx.moveTo(0, R); fullCtx.lineTo(gridW, R);

      // Outer perimeter border
      fullCtx.strokeRect(0, 0, gridW, gridH);

      fullCtx.stroke();
      fullCtx.restore();
    } else if (state.guideLinesStyle === 'corner') {
      // Corner tick marks at borders and intersections so photos remain unlined
      fullCtx.save();
      fullCtx.strokeStyle = 'rgba(120, 120, 120, 0.85)';
      fullCtx.lineWidth = dpi === 600 ? 2.5 : 1.5;
      const tick = Math.round(dpi * 0.12); // ~36px at 300 DPI

      fullCtx.beginPath();

      // Top edge ticks
      fullCtx.moveTo(R, 0); fullCtx.lineTo(R, tick);
      fullCtx.moveTo(2 * R, 0); fullCtx.lineTo(2 * R, tick);

      // Bottom edge ticks
      fullCtx.moveTo(R, gridH); fullCtx.lineTo(R, gridH - tick);
      fullCtx.moveTo(2 * R, gridH); fullCtx.lineTo(2 * R, gridH - tick);

      // Left edge tick
      fullCtx.moveTo(0, R); fullCtx.lineTo(tick, R);

      // Right edge tick
      fullCtx.moveTo(gridW, R); fullCtx.lineTo(gridW - tick, R);

      // Center cross ticks
      fullCtx.moveTo(R - tick, R); fullCtx.lineTo(R + tick, R);
      fullCtx.moveTo(R, R - tick); fullCtx.lineTo(R, R + tick);
      fullCtx.moveTo(2 * R - tick, R); fullCtx.lineTo(2 * R + tick, R);
      fullCtx.moveTo(2 * R, R - tick); fullCtx.lineTo(2 * R, R + tick);

      fullCtx.stroke();
      fullCtx.restore();
    }

    return fullCanvas;
  }

  /**
   * Render the live 4x6 preview onto the screen preview canvas
   */
  function renderGridPreview() {
    if (!state.imageLoaded) return;

    // Use a fast 150 DPI preview for smooth 60fps rendering during pan/zoom
    const previewGrid = generateFullGridCanvas(150);

    const dpr = window.devicePixelRatio || 1;
    const w = gridPreviewCanvas.width;
    const h = gridPreviewCanvas.height;

    gridPreviewCtx.save();
    gridPreviewCtx.clearRect(0, 0, w, h);
    // Draw the generated grid scaled to fit the preview canvas smoothly
    gridPreviewCtx.imageSmoothingEnabled = true;
    gridPreviewCtx.imageSmoothingQuality = 'high';
    gridPreviewCtx.drawImage(previewGrid, 0, 0, w, h);
    gridPreviewCtx.restore();
  }

  // --- JFIF 300 DPI Header Injection ---

  /**
   * Injects or modifies the JFIF APP0 marker in a JPEG binary array buffer to specify exact DPI
   * @param {ArrayBuffer} buffer - The raw JPEG ArrayBuffer
   * @param {number} dpi - The DPI to embed (e.g. 300)
   * @returns {ArrayBuffer}
   */
  function setJfifDpi(buffer, dpi = 300) {
    const bytes = new Uint8Array(buffer);

    // Verify JPEG SOI marker (0xFF, 0xD8)
    if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
      return buffer;
    }

    // Check if APP0 (0xFF, 0xE0) immediately follows SOI
    if (bytes[2] === 0xFF && bytes[3] === 0xE0) {
      // Check identifier 'JFIF\0' at offset 6..10
      if (
        bytes[6] === 0x4A && // J
        bytes[7] === 0x46 && // F
        bytes[8] === 0x49 && // I
        bytes[9] === 0x46 && // F
        bytes[10] === 0x00
      ) {
        // Offset 13: density units (1 = dots per inch)
        bytes[13] = 1;
        // Offset 14..15: Xdensity (16-bit big endian)
        bytes[14] = (dpi >> 8) & 0xFF;
        bytes[15] = dpi & 0xFF;
        // Offset 16..17: Ydensity (16-bit big endian)
        bytes[16] = (dpi >> 8) & 0xFF;
        bytes[17] = dpi & 0xFF;
        return buffer;
      }
    }

    // If no existing JFIF APP0 segment, insert a complete 18-byte APP0 marker after SOI (0xFF, 0xD8)
    const app0 = new Uint8Array([
      0xFF, 0xE0,       // APP0 marker
      0x00, 0x10,       // length = 16 bytes
      0x4A, 0x46, 0x49, 0x46, 0x00, // 'JFIF\0'
      0x01, 0x02,       // version 1.2
      0x01,             // density units: 1 = dots per inch (DPI)
      (dpi >> 8) & 0xFF, dpi & 0xFF, // Xdensity
      (dpi >> 8) & 0xFF, dpi & 0xFF, // Ydensity
      0x00, 0x00        // thumbnail dimensions 0x0
    ]);

    const result = new Uint8Array(bytes.length + app0.length);
    // Copy SOI (first 2 bytes)
    result.set(bytes.subarray(0, 2), 0);
    // Insert APP0 marker
    result.set(app0, 2);
    // Copy rest of JPEG
    result.set(bytes.subarray(2), 2 + app0.length);

    return result.buffer;
  }

  // --- Export Actions ---

  /**
   * Download the 4x6 inch grid as '4x6inch.jpg' with 300 DPI metadata
   */
  downloadGridBtn.addEventListener('click', () => {
    if (!state.imageLoaded) {
      showToast('Please upload a photo first.');
      return;
    }

    downloadGridBtn.disabled = true;
    downloadGridBtn.style.opacity = '0.7';
    showToast('Rendering high-resolution 4x6" grid...');

    // Allow UI to update before heavy canvas export
    setTimeout(() => {
      try {
        const fullCanvas = generateFullGridCanvas(state.dpi);

        fullCanvas.toBlob((blob) => {
          if (!blob) {
            showToast('Export failed. Please try again.', 'error');
            downloadGridBtn.disabled = false;
            downloadGridBtn.style.opacity = '1';
            return;
          }

          blob.arrayBuffer().then((buffer) => {
            // Inject JFIF 300 DPI header
            const bufferWithDpi = setJfifDpi(buffer, state.dpi);
            const finalBlob = new Blob([bufferWithDpi], { type: 'image/jpeg' });

            // Trigger file download with default name '4x6inch.jpg'
            const downloadUrl = URL.createObjectURL(finalBlob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = '4x6inch.jpg';
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(downloadUrl);
              downloadGridBtn.disabled = false;
              downloadGridBtn.style.opacity = '1';
              showToast('Saved 4x6inch.jpg! Ready for printing at CVS, Walgreens, or home.', 'success');
            }, 600);
          });
        }, 'image/jpeg', 0.98);
      } catch (err) {
        console.error(err);
        showToast('Error exporting image.', 'error');
        downloadGridBtn.disabled = false;
        downloadGridBtn.style.opacity = '1';
      }
    }, 50);
  });

  /**
   * Download single 2x2" square photo
   */
  downloadSingleBtn.addEventListener('click', () => {
    if (!state.imageLoaded) return;

    showToast('Exporting single 2x2" photo...');
    const R = Math.round(2 * state.dpi); // 600px at 300 DPI
    const singleCanvas = generateSingleSquareCanvas(R);

    singleCanvas.toBlob((blob) => {
      if (!blob) return;
      blob.arrayBuffer().then((buffer) => {
        const bufferWithDpi = setJfifDpi(buffer, state.dpi);
        const finalBlob = new Blob([bufferWithDpi], { type: 'image/jpeg' });
        const downloadUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = '2x2inch.jpg';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
          showToast('Saved 2x2inch.jpg!');
        }, 600);
      });
    }, 'image/jpeg', 0.98);
  });

  /**
   * Print directly to 4x6 photo printer
   */
  printBtn.addEventListener('click', () => {
    if (!state.imageLoaded) return;

    showToast('Preparing print dialog for 4x6" photo paper...');
    const fullCanvas = generateFullGridCanvas(300);
    const dataUrl = fullCanvas.toDataURL('image/jpeg', 0.98);
    printImage.src = dataUrl;

    printImage.onload = () => {
      window.print();
    };
  });

  // --- Initializer ---
  initTheme();
  resizeCanvases();
})();
