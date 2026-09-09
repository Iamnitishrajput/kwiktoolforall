/* KwikToolForAll Document Scanner Core Application Logic Engine */

// State Object Store
let appState = {
    pages: [], // Array of objects containing properties: { originalImage: Image, currentFilter: string, rotation: int, brightness: int, contrast: int, cropBox: object }
    currentPageIndex: -1
};

// Default Workspace Values
const DEFAULT_PAGE_STATE = {
    originalImage: null,
    currentFilter: 'original',
    rotation: 0,
    brightness: 100,
    contrast: 100,
    cropBox: { x: 10, y: 10, w: 80, h: 80 } // percentage limits
};

// Canvas references
let mainCanvas, ctx;
let cropCanvas, cropCtx;
let isCroppingMode = false;
let activeHandle = null;

// Initialization Hook
document.addEventListener("DOMContentLoaded", () => {
    mainCanvas = document.getElementById('scanner-canvas');
    ctx = mainCanvas.getContext('2d');
    cropCanvas = document.getElementById('crop-overlay-canvas');
    cropCtx = cropCanvas.getContext('2d');
    
    setupViewRouting();
    setupFileInputs();
    setupControlListeners();
    setupCropInteraction();
});

// 1. Navigation Flow Routing & Popular Link Fixes
function setupViewRouting() {
    const routeTo = (viewId) => {
        document.querySelectorAll('.app-view').forEach(view => view.classList.add('hidden'));
        document.getElementById(`view-${viewId}`).classList.remove('hidden');
        
        // Handle navbar activation styling
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        if (viewId === 'home') document.getElementById('nav-home').classList.add('active');
        if (viewId === 'scanner') document.getElementById('nav-scanner').classList.add('active');
    };

    // Header Links
    document.getElementById('logo-home').addEventListener('click', () => routeTo('home'));
    document.getElementById('nav-home').addEventListener('click', () => routeTo('home'));
    document.getElementById('nav-scanner').addEventListener('click', () => routeTo('scanner'));

    // Broken "Popular:" tag element fix mapping redirection
    document.querySelectorAll('.tag-link, .feature-card').forEach(element => {
        element.addEventListener('click', (e) => {
            const target = element.getAttribute('data-target');
            if (target === 'scanner') {
                routeTo('scanner');
            } else if (target === 'pdf') {
                alert("Redirecting to the local 'Image to PDF' module bundle...");
            }
        });
    });

    // Fix the Top Right Cross Button Navigation Back Routing
    document.getElementById('scanner-close-btn').addEventListener('click', () => {
        resetApp();
        routeTo('home');
    });

    // Reset loop
    document.getElementById('btn-restart-tool').addEventListener('click', () => {
        resetApp();
        routeTo('scanner');
    });
}

// 2. Multi-Image Local Uploader Interface Execution
function setupFileInputs() {
    const fileInput = document.getElementById('scanner-file-input');
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        let loadedCount = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const newPage = JSON.parse(JSON.stringify(DEFAULT_PAGE_STATE));
                    newPage.originalImage = img; // Retain DOM node references local
                    appState.pages.push(newPage);
                    
                    loadedCount++;
                    if (loadedCount === files.length) {
                        // Switch into workspace presentation structure
                        appState.currentPageIndex = appState.pages.length - files.length;
                        document.getElementById('upload-placeholder').classList.add('hidden');
                        document.getElementById('btn-toggle-crop').classList.remove('hidden');
                        enableControlPanels(true);
                        updateWorkspaceUI();
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
        // Clear file input buffer
        fileInput.value = '';
    });
}

// Control UI State Activation
function enableControlPanels(enable) {
    const panels = ['section-filters', 'section-adjustments', 'section-export'];
    panels.forEach(id => {
        const element = document.getElementById(id);
        if (enable) element.classList.remove('disabled-state');
        else element.classList.add('disabled-state');
    });
    
    document.getElementById('slider-brightness').disabled = !enable;
    document.getElementById('slider-contrast').disabled = !enable;
    document.getElementById('btn-rotate').disabled = !enable;
    document.getElementById('btn-download').disabled = !enable;
    document.getElementById('btn-share').disabled = !enable;
}

// 3. UI Adjustments Engine (Filters, Sliders, Rotations)
function setupControlListeners() {
    // Limited Filter Buttons Active Highlighting Setup
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (appState.currentPageIndex === -1) return;
            this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            appState.pages[appState.currentPageIndex].currentFilter = this.getAttribute('data-filter');
            renderCurrentImage();
        });
    });

    // Output Formats Active Group Selector
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Adjustment Inputs Tracking
    const bSlider = document.getElementById('slider-brightness');
    const cSlider = document.getElementById('slider-contrast');
    
    bSlider.addEventListener('input', (e) => {
        if (appState.currentPageIndex === -1) return;
        document.getElementById('val-brightness').innerText = e.target.value;
        appState.pages[appState.currentPageIndex].brightness = parseInt(e.target.value);
        renderCurrentImage();
    });

    cSlider.addEventListener('input', (e) => {
        if (appState.currentPageIndex === -1) return;
        document.getElementById('val-contrast').innerText = e.target.value;
        appState.pages[appState.currentPageIndex].contrast = parseInt(e.target.value);
        renderCurrentImage();
    });

    // Rotation Control Setup
    document.getElementById('btn-rotate').addEventListener('click', () => {
        if (appState.currentPageIndex === -1) return;
        let page = appState.pages[appState.currentPageIndex];
        page.rotation = (page.rotation + 90) % 360;
        renderCurrentImage();
    });

    // Multi-page navigation hooks
    document.getElementById('btn-prev-page').addEventListener('click', () => {
        if (appState.currentPageIndex > 0) {
            appState.currentPageIndex--;
            updateWorkspaceUI();
        }
    });

    document.getElementById('btn-next-page').addEventListener('click', () => {
        if (appState.currentPageIndex < appState.pages.length - 1) {
            appState.currentPageIndex++;
            updateWorkspaceUI();
        }
    });

    // Action Triggers Configuration
    document.getElementById('btn-download').addEventListener('click', () => triggerExport(false));
    document.getElementById('btn-share').addEventListener('click', () => triggerExport(true));
}

// 4. Mathematical Overlay Coordinates Logic Engine for Free Square Crop
function setupCropInteraction() {
    const toggleCropBtn = document.getElementById('btn-toggle-crop');
    
    toggleCropBtn.addEventListener('click', () => {
        if (appState.currentPageIndex === -1) return;
        isCroppingMode = !isCroppingMode;
        
        if (isCroppingMode) {
            toggleCropBtn.classList.add('active');
            toggleCropBtn.innerText = '✓ Apply Crop Area';
            cropCanvas.classList.remove('hidden');
            drawCropOverlay();
        } else {
            toggleCropBtn.classList.remove('active');
            toggleCropBtn.innerText = '◪ Free Square Crop';
            cropCanvas.classList.add('hidden');
            renderCurrentImage(); // Redraw canvas cropped bounds
        }
    });

    // Mouse & Touch Calculation Handlers for Interactive Box Vectors
    const getMousePos = (e) => {
        const rect = cropCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: ((clientX - rect.left) / rect.width) * 100,
            y: ((clientY - rect.top) / rect.height) * 100
        };
    };

    const handleStart = (e) => {
        if (!isCroppingMode || appState.currentPageIndex === -1) return;
        const pos = getMousePos(e);
        const box = appState.pages[appState.currentPageIndex].cropBox;
        const tolerance = 4; // click handle boundary zone padding radius
        
        // Evaluate Hit Targets on Corners
        if (Math.abs(pos.x - box.x) < tolerance && Math.abs(pos.y - box.y) < tolerance) activeHandle = 'topleft';
        else if (Math.abs(pos.x - (box.x + box.w)) < tolerance && Math.abs(pos.y - box.y) < tolerance) activeHandle = 'topright';
        else if (Math.abs(pos.x - box.x) < tolerance && Math.abs(pos.y - (box.y + box.h)) < tolerance) activeHandle = 'bottomleft';
        else if (Math.abs(pos.x - (box.x + box.w)) < tolerance && Math.abs(pos.y - (box.y + box.h)) < tolerance) activeHandle = 'bottomright';
        else if (pos.x > box.x && pos.x < box.x + box.w && pos.y > box.y && pos.y < box.y + box.h) activeHandle = 'drag'; // Inside Box drag movement
    };

    const handleMove = (e) => {
        if (!activeHandle || !isCroppingMode) return;
        e.preventDefault();
        const pos = getMousePos(e);
        let box = appState.pages[appState.currentPageIndex].cropBox;
        
        const minSize = 10;
        
        if (activeHandle === 'topleft') {
            let rightX = box.x + box.w;
            let bottomY = box.y + box.h;
            box.x = Math.max(0, Math.min(pos.x, rightX - minSize));
            box.y = Math.max(0, Math.min(pos.y, bottomY - minSize));
            box.w = rightX - box.x;
            box.h = bottomY - box.y;
        } else if (activeHandle === 'topright') {
            let bottomY = box.y + box.h;
            let currentRight = Math.min(100, Math.max(box.x + minSize, pos.x));
            box.y = Math.max(0, Math.min(pos.y, bottomY - minSize));
            box.w = currentRight - box.x;
            box.h = bottomY - box.y;
        } else if (activeHandle === 'bottomleft') {
            let rightX = box.x + box.w;
            let currentBottom = Math.min(100, Math.max(box.y + minSize, pos.y));
            box.x = Math.max(0, Math.min(pos.x, rightX - minSize));
            box.w = rightX - box.x;
            box.h = currentBottom - box.y;
        } else if (activeHandle === 'bottomright') {
            box.w = Math.min(100 - box.x, Math.max(minSize, pos.x - box.x));
            box.h = Math.min(100 - box.y, Math.max(minSize, pos.y - box.y));
        } else if (activeHandle === 'drag') {
            // Drag calculation requires historical step offset. Approximate linearly:
            if (!this.lastPos) { this.lastPos = pos; return; }
            let dx = pos.x - this.lastPos.x;
            let dy = pos.y - this.lastPos.y;
            
            box.x = Math.max(0, Math.min(100 - box.w, box.x + dx));
            box.y = Math.max(0, Math.min(100 - box.h, box.y + dy));
            this.lastPos = pos;
        }
        
        drawCropOverlay();
    };

    const handleEnd = () => {
        activeHandle = null;
        this.lastPos = null;
    };

    cropCanvas.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    cropCanvas.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
}

// Vector Render Pipeline Logic for Crop Selection Mask
function drawCropOverlay() {
    const w = cropCanvas.width;
    const h = cropCanvas.height;
    const box = appState.pages[appState.currentPageIndex].cropBox;
    
    cropCtx.clearRect(0, 0, w, h);
    
    // Draw Shade Overlay masking outer region
    cropCtx.fillStyle = "rgba(0, 0, 0, 0.45)";
    cropCtx.fillRect(0, 0, w, h);
    
    // Convert percentage limits to target pixel coordinate values
    const px = (box.x / 100) * w;
    const py = (box.y / 100) * h;
    const pw = (box.w / 100) * w;
    const ph = (box.h / 100) * h;
    
    // Clear targeted center box window
    cropCtx.clearRect(px, py, pw, ph);
    
    // Border Box Stroke Outline
    cropCtx.strokeStyle = "#2563eb";
    cropCtx.lineWidth = 2;
    cropCtx.strokeRect(px, py, pw, ph);
    
    // Interactive Anchors Node Points Circle Drawing
    cropCtx.fillStyle = "#ffffff";
    const handles = [
        [px, py], [px + pw, py], [px, py + ph], [px + pw, py + ph]
    ];
    handles.forEach(([hx, hy]) => {
        cropCtx.beginPath();
        cropCtx.arc(hx, hy, 6, 0, 2 * Math.PI);
        cropCtx.fill();
        cropCtx.stroke();
    });
}

// 5. Canvas Pixel Transformation Processing Subsystem
function renderCurrentImage() {
    if (appState.currentPageIndex === -1) return;
    const page = appState.pages[appState.currentPageIndex];
    const img = page.originalImage;
    
    // Virtual calculation parameters context configurations
    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
    
    // If not in cropping mode state, render the sub region bounded by active crop parameters calculations
    if (!isCroppingMode) {
        srcX = (page.cropBox.x / 100) * img.width;
        srcY = (page.cropBox.y / 100) * img.height;
        srcW = (page.cropBox.w / 100) * img.width;
        srcH = (page.cropBox.h / 100) * img.height;
    }

    // Adaptively scale structural canvas elements sizing layout match properties
    let targetW = srcW;
    let targetH = srcH;
    
    if (page.rotation === 90 || page.rotation === 270) {
        targetW = srcH;
        targetH = srcW;
    }
    
    mainCanvas.width = targetW;
    mainCanvas.height = targetH;
    
    // Set match mirroring specifications onto tracking dimensions layer
    cropCanvas.width = mainCanvas.width;
    cropCanvas.height = mainCanvas.height;
    
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    
    // Coordinate Context transformation setup tracking spatial rotation properties
    ctx.save();
    ctx.translate(mainCanvas.width / 2, mainCanvas.height / 2);
    ctx.rotate((page.rotation * Math.PI) / 180);
    
    // Draw targeted image buffer maps inside rotated coordinates grid
    ctx.drawImage(
        img, 
        srcX, srcY, srcW, srcH, 
        -srcW / 2, -srcH / 2, srcW, srcH
    );
    ctx.restore();
    
    // Extract Image Node pixel frames for hardware array logic parsing
    let imgData = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    let data = imgData.data;
    
    // Apply contrast / brightness modifications
    let bMul = page.brightness / 100;
    let cFactor = (259 * (page.contrast + 255)) / (255 * (259 - page.contrast));
    
    for (let i = 0; i < data.length; i += 4) {
        // Brightness adjustments evaluation
        let r = data[i] * bMul;
        let g = data[i+1] * bMul;
        let b = data[i+2] * bMul;
        
        // Contrast operations logic
        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;
        
        // Filter mapping pipelines options validation
        if (page.currentFilter === 'grayscale' || page.currentFilter === 'bw') {
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            if (page.currentFilter === 'bw') {
                gray = gray > 128 ? 255 : 0; // Pure solid clip execution tracking
            }
            r = g = b = gray;
        }
        
        // Bounds clamping protection checks
        data[i] = Math.max(0, Math.min(255, r));
        data[i+1] = Math.max(0, Math.min(255, g));
        data[i+2] = Math.max(0, Math.min(255, b));
    }
    
    ctx.putImageData(imgData, 0, 0);
}

// UI Synchronizations Wrapper Function Block
function updateWorkspaceUI() {
    if (appState.currentPageIndex === -1) return;
    const page = appState.pages[appState.currentPageIndex];
    
    // Synchronize UI active group highlighting states matching target indices
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.getAttribute('data-filter') === page.currentFilter) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    
    document.getElementById('slider-brightness').value = page.brightness;
    document.getElementById('val-brightness').innerText = page.brightness;
    
    document.getElementById('slider-contrast').value = page.contrast;
    document.getElementById('val-contrast').innerText = page.contrast;
    
    // Handle pagination items text blocks labels rendering maps
    if (appState.pages.length > 1) {
        document.getElementById('page-controls-row').classList.remove('hidden');
        document.getElementById('page-counter').innerText = `Page ${appState.currentPageIndex + 1} of ${appState.pages.length}`;
        document.getElementById('btn-prev-page').disabled = appState.currentPageIndex === 0;
        document.getElementById('btn-next-page').disabled = appState.currentPageIndex === appState.pages.length - 1;
    } else {
        document.getElementById('page-controls-row').classList.add('hidden');
    }
    
    if (isCroppingMode) {
        drawCropOverlay();
    } else {
        renderCurrentImage();
    }
}

// 6. Native Share API & Integrated Multi format local Downloader Package Systems
function triggerExport(useNativeShare = false) {
    if (!appState.pages.length) return;
    
    const format = document.querySelector('.format-btn.active').getAttribute('data-format');
    
    // Execute sequence simulations mapping down single file data buffers array tracks
    mainCanvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const fileName = `kwiktool-scan-${Date.now()}.${format === 'pdf' ? 'pdf' : format}`;
        
        if (useNativeShare) {
            // Check native web share application platform bindings accessibility hooks
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: blob.type })] })) {
                try {
                    const fileObj = new File([blob], fileName, { type: blob.type });
                    await navigator.share({
                        files: [fileObj],
                        title: 'Scanned Document Document Package',
                        text: 'Processed via KwikToolForAll local web application toolkit.'
                    });
                    showThankYouScreen();
                } catch (err) {
                    console.warn("Share operations canceled or aborted by context user client layer:", err);
                }
            } else {
                alert("Native app document package injection sharing hooks are missing or restricted inside this web container. Defaulting straight into standard local systems browser downloading pipeline stream layout...");
                executeLocalDownload(blob, fileName);
            }
        } else {
            executeLocalDownload(blob, fileName);
        }
    }, format === 'pdf' ? 'image/jpeg' : `image/${format}`, 0.90);
}

function executeLocalDownload(blob, name) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Redirect context view screens layouts towards target confirmation pages
    showThankYouScreen();
}

function showThankYouScreen() {
    document.querySelectorAll('.app-view').forEach(view => view.classList.add('hidden'));
    document.getElementById('view-thankyou').classList.remove('hidden');
}

function resetApp() {
    appState.pages = [];
    appState.currentPageIndex = -1;
    isCroppingMode = false;
    activeHandle = null;
    
    document.getElementById('upload-placeholder').classList.remove('hidden');
    document.getElementById('btn-toggle-crop').classList.add('hidden');
    document.getElementById('btn-toggle-crop').classList.remove('active');
    document.getElementById('btn-toggle-crop').innerText = '◪ Free Square Crop';
    cropCanvas.classList.add('hidden');
    
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    enableControlPanels(false);
}
