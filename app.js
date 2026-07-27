const container = document.getElementById('canvas-container');
const tooltip = document.getElementById('tooltip');

const scene = new THREE.Scene();
// Add a subtle fog to give depth
scene.fog = new THREE.FogExp2(0x0f172a, 0.002);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 600;
controls.minDistance = 50;

// Scale factor to translate -100 to 100 ranges into 3D space coordinates
const scale = 1.5;

const gridHelperX = new THREE.GridHelper(300, 10, 0x334155, 0x1e293b);
gridHelperX.position.y = -150; // Place grid at bottom of Authority axis
scene.add(gridHelperX);

// Custom Axes
const axisLength = 160;

// X Axis (Economic: Left - Right) -> RED
const xMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
const xGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-axisLength, 0, 0),
    new THREE.Vector3(axisLength, 0, 0)
]);
const xAxis = new THREE.Line(xGeo, xMat);
scene.add(xAxis);

// Y Axis (Authority: Lib - Auth) -> GREEN
const yMat = new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 2 });
const yGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -axisLength, 0),
    new THREE.Vector3(0, axisLength, 0)
]);
const yAxis = new THREE.Line(yGeo, yMat);
scene.add(yAxis);

// Z Axis (Social: Prog - Cons) -> BLUE (Note: in Three.js, -Z is forward/away from camera)
// We map Social: High (Progressive) to +Z, Low (Conservative) to -Z
const zMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
const zGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -axisLength),
    new THREE.Vector3(0, 0, axisLength)
]);
const zAxis = new THREE.Line(zGeo, zMat);
scene.add(zAxis);

// Axis Labels
function createAxisLabel(text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    context.font = "bold 28px 'Inter', sans-serif";
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "rgba(0,0,0,0.8)";
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(40, 10, 1);
    return sprite;
}

const spheres = [];
const labels = [];

const xLabelRight = createAxisLabel("Free Market", "#ef4444");
xLabelRight.position.set(axisLength + 20, 0, 0);
scene.add(xLabelRight);
labels.push(xLabelRight);

const xLabelLeft = createAxisLabel("Regulated Market", "#ef4444");
xLabelLeft.position.set(-axisLength - 20, 0, 0);
scene.add(xLabelLeft);
labels.push(xLabelLeft);

const yLabelTop = createAxisLabel("Authoritarian", "#22c55e");
yLabelTop.position.set(0, axisLength + 10, 0);
scene.add(yLabelTop);
labels.push(yLabelTop);

const yLabelBottom = createAxisLabel("Libertarian", "#22c55e");
yLabelBottom.position.set(0, -axisLength - 10, 0);
scene.add(yLabelBottom);
labels.push(yLabelBottom);

const zLabelFront = createAxisLabel("Progressive", "#3b82f6");
zLabelFront.position.set(0, 0, axisLength + 20);
scene.add(zLabelFront);
labels.push(zLabelFront);

const zLabelBack = createAxisLabel("Conservative", "#3b82f6");
zLabelBack.position.set(0, 0, -axisLength - 20);
scene.add(zLabelBack);
labels.push(zLabelBack);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(100, 200, 100);
scene.add(dirLight);

const pointLight = new THREE.PointLight(0x818cf8, 1, 500);
pointLight.position.set(-100, -100, -100);
scene.add(pointLight);

// Create a canvas for text sprites
function createTextSprite(message) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512; // High res for crisp text
    canvas.height = 128;

    context.font = "bold 40px 'Inter', sans-serif";
    const textWidth = context.measureText(message).width;

    context.fillStyle = "rgba(0, 0, 0, 0)"; // Transparent bg
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";
    context.shadowColor = "rgba(0,0,0,0.8)";
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);

    // Scale sprite to look good
    sprite.scale.set(40, 10, 1);
    return sprite;
}

const sphereGeometry = new THREE.SphereGeometry(3.5, 32, 32);

ideologiesData.forEach(item => {
    // Determine color based on general quadrant/positioning for visual flair
    // Mixing colors based on normalized coordinates (0 to 1)
    const r = (item.econ + 100) / 200; // Red for Economic Right
    const g = (item.auth + 100) / 200; // Green for Authoritarian
    const b = (item.soc + 100) / 200;  // Blue for Social Progressive

    // Adjust colors slightly to avoid pure muddy gray in center, keep it vibrant
    const color = new THREE.Color().setRGB(
        0.2 + r * 0.8,
        0.2 + g * 0.8,
        0.2 + b * 0.8
    );

    const material = new THREE.MeshPhongMaterial({
        color: color,
        shininess: 80,
        specular: 0x444444
    });

    const mesh = new THREE.Mesh(sphereGeometry, material);

    // Mapping:
    // X: Economic (-100 Left to 100 Right)
    // Y: Authority (-100 Lib to 100 Auth)
    // Z: Social (We'll map +100 Progressive to +Z, -100 Conservative to -Z)

    mesh.position.set(
        item.econ * scale,
        item.auth * scale,
        item.soc * scale
    );

    // Store data on mesh for raycaster
    mesh.userData = item;

    scene.add(mesh);
    spheres.push(mesh);

    // Add text label below sphere
    const label = createTextSprite(item.name);
    label.position.copy(mesh.position);
    label.position.y -= 7; // offset below
    scene.add(label);
    labels.push(label);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredSphere = null;
let selectedSphere = null;

// Set initial camera position
function resetCamera() {
    camera.position.set(200, 150, 250);
    controls.target.set(0, 0, 0);
    controls.update();
    hideTooltip();
    if (selectedSphere) {
        selectedSphere.scale.set(1, 1, 1);
        selectedSphere = null;
    }
}
resetCamera();

document.getElementById('reset-btn').addEventListener('click', resetCamera);

const legendToggle = document.getElementById('legend-toggle');
const legendContent = document.getElementById('legend-content');
const legendIcon = document.getElementById('legend-icon');

legendToggle.addEventListener('click', () => {
    legendContent.classList.toggle('hidden');
    legendIcon.classList.toggle('rotate-180');
});

// Handle window resize
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateTooltipPosition(event) {
    // Keep tooltip within bounds
    let x = event.clientX;
    let y = event.clientY;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function positionTooltip(sphereScreenX, sphereScreenY) {
    const margin = 14;
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;

    // Try placing above the sphere; fall back to below if not enough room
    let left = sphereScreenX - tw / 2;
    let top = sphereScreenY - th - margin;

    if (top < margin) {
        top = sphereScreenY + margin;
    }

    // Clamp horizontally within viewport
    left = Math.max(margin, Math.min(window.innerWidth - tw - margin, left));
    // Clamp vertically within viewport
    top = Math.max(margin, Math.min(window.innerHeight - th - margin, top));

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

function showTooltip(data, event) {
    document.getElementById('tt-title').innerText = data.name;
    document.getElementById('tt-desc').innerText = data.desc;

    document.getElementById('tt-econ-detail').innerText = data.detail.economy;
    document.getElementById('tt-auth-detail').innerText = data.detail.authority;
    document.getElementById('tt-soc-detail').innerText = data.detail.social;

    // Collapse detail section on each new selection
    const detail = document.getElementById('tt-detail');
    const icon = document.getElementById('tt-detail-icon');
    detail.classList.add('hidden');
    icon.classList.remove('open');
    tooltip.classList.remove('expanded');

    tooltip.style.opacity = 1;
    tooltip.style.pointerEvents = 'auto';

    const screenPos = selectedSphere.position.clone().project(camera);
    const sx = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
    positionTooltip(sx, sy);
}

document.getElementById('tt-detail-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    const detail = document.getElementById('tt-detail');
    const icon = document.getElementById('tt-detail-icon');
    detail.classList.toggle('hidden');
    icon.classList.toggle('open');
    const isOpen = !detail.classList.contains('hidden');
    if (isOpen) {
        // Wait for layout, then only enable scroll if content genuinely overflows
        requestAnimationFrame(() => {
            tooltip.classList.toggle('expanded', tooltip.scrollHeight > tooltip.clientHeight);
        });
    } else {
        tooltip.classList.remove('expanded');
    }
});

function hideTooltip() {
    tooltip.style.opacity = 0;
    tooltip.style.pointerEvents = 'none';
}

window.addEventListener('mousemove', onMouseMove, false);
function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast for hover effect
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        const object = intersects[0].object;

        if (hoveredSphere !== object) {
            if (hoveredSphere && hoveredSphere !== selectedSphere) {
                hoveredSphere.scale.set(1, 1, 1); // Reset previous
            }
            hoveredSphere = object;
            if (hoveredSphere !== selectedSphere) {
                hoveredSphere.scale.set(1.5, 1.5, 1.5); // Enlarge on hover
            }
            container.style.cursor = 'pointer';
        }
    } else {
        if (hoveredSphere && hoveredSphere !== selectedSphere) {
            hoveredSphere.scale.set(1, 1, 1);
        }
        hoveredSphere = null;
        container.style.cursor = 'default';
    }
}

// Touch tap detection for mobile (OrbitControls consumes touch events, preventing click)
let touchStartPos = null;
let touchStartTime = 0;

container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        touchStartTime = Date.now();
    }
}, { passive: true });

container.addEventListener('touchend', (e) => {
    if (!touchStartPos) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.x;
    const dy = touch.clientY - touchStartPos.y;
    const dt = Date.now() - touchStartTime;
    touchStartPos = null;

    // Only treat as a tap if short duration and minimal movement
    if (dt < 300 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        handleTap(touch.clientX, touch.clientY);
    }
});

function handleTap(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        const object = intersects[0].object;

        if (selectedSphere) {
            selectedSphere.scale.set(1, 1, 1);
        }

        selectedSphere = object;
        selectedSphere.scale.set(2, 2, 2);
        showTooltip(selectedSphere.userData, null);
    } else {
        if (selectedSphere) {
            selectedSphere.scale.set(1, 1, 1);
            selectedSphere = null;
        }
        hideTooltip();
    }
}

window.addEventListener('click', onClick, false);
function onClick(event) {
    // Update mouse from click/tap position (essential for mobile where mousemove doesn't fire)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        const object = intersects[0].object;

        // Reset previously selected
        if (selectedSphere) {
            selectedSphere.scale.set(1, 1, 1);
        }

        selectedSphere = object;
        selectedSphere.scale.set(2, 2, 2); // Enlarge selected more

        showTooltip(selectedSphere.userData, event);

        // Optional: Animate camera slightly towards selected object (simplified)
        // controls.target.copy(selectedSphere.position);
    } else {
        // Clicked on empty space
        if (selectedSphere) {
            selectedSphere.scale.set(1, 1, 1);
            selectedSphere = null;
        }
        hideTooltip();
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Optional: gently rotate the whole scene if no interaction
    // scene.rotation.y += 0.001;

    // Make text labels always face camera
    labels.forEach(label => {
        label.quaternion.copy(camera.quaternion);
    });

    if (selectedSphere && tooltip.style.opacity === '1') {
        const screenPos = selectedSphere.position.clone().project(camera);
        const sx = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
        positionTooltip(sx, sy);
    }

    controls.update();
    renderer.render(scene, camera);
}

// Start loop
window.onload = function () {
    animate();
};
