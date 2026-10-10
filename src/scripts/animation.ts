/**
 *
 * Starts an interactive background animation on a canvas element.
 *
 * It is based on Conway's Game of Life, with a few modifications
 * to make it work well as a dynamic background. The basic rules are:
 *
 *   - Live cells with < 2 live neighbors die (underpopulation)
 *   - Live cells with > 3 live neighbors die (overpopulation)
 *   - Dead cells with exactly 3 live neighbors become alive (reproduction)
 *   - Live cells with 2 or 3 live neighbors survive to the next generation
 *
 * The following modifications were made:
 *
 *   - Base rules can be altered by setting a custom rulestring
 *   - Cells have a small chance of randomly dying (entropy!)
 *   - Users can move or click their mouse to create small disturbances
 *   - Random clusters of cells can optionally appear every X seconds
 *
 * Cells are also not simply "alive" or "dead". Instead, they have an energy level
 * that gradually increases or decreases, allowing cells to slowly fade out as they die.
 *
 */

const logo = document.getElementById("logo-button") as HTMLButtonElement;
const canvas = document.getElementById("game-of-life") as HTMLCanvasElement;
const context = canvas.getContext("2d") as CanvasRenderingContext2D;

let cols = 0, rows = 0;
let currGrid: Uint8Array, nextGrid: Uint8Array, glowGrid: Float32Array;
let colorTable: string[];
let lastPointerSpawn = 0;
let baseColor = getComputedStyle(canvas).color;

// a.k.a. "Coagulations" - https://conwaylife.com/wiki/OCA:Coagulations
const rulestring = "B378/S235678";
const match = rulestring.match(/B(\d+)\/S(\d+)/);
if (!match) throw Error(`Invalid rulestring: ${rulestring}`);
const BIRTH = new Set([...match[1]].map(Number));
const SURVIVAL = new Set([...match[2]].map(Number));

// Tha knobs
const CELL_GAP = 2;
const CELL_SIZE = 7;
const UPDATE_INTERVAL_MS = 60;
const RANDOM_SPAWNS_ENABLED = false;
const MIN_SPAWN_DELAY_MS = 500;
const MAX_SPAWN_DELAY_MS = 2000;
const MIN_CLUSTER_RADIUS = 3;
const MAX_CLUSTER_RADIUS = 5;
const CLUSTER_CELL_CHANCE = 0.30;
const CLUSTER_EXPANSION_FACTOR = 2;
const CLUSTER_BURST_COUNT = 5;
const CLUSTER_BURST_INTERVAL = 50;
const RANDOM_DEATH_CHANCE = 0.15;
const GLOW_DECAY_RATE = 0.85;
const GLOW_THRESHOLD = 0.30;
const POINTER_SPAWN_COOLDOWN_MS = 50;

// Change the canvas fillStyle on theme toggles
const themeObserver = new MutationObserver(() => {
    baseColor = getComputedStyle(canvas).color;
    draw();
});

themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
});

const getRandIntInclusive = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Returns the array index for a given grid position
const getIndex = (x: number, y: number) => y * cols + x;

// Advances the simulation and redraws the canvas
const update = () => { step(); draw(); };

// Creates a new grid based on the current window size
function createWorld() {
    cols = Math.ceil(window.innerWidth / CELL_SIZE);
    rows = Math.ceil(window.innerHeight / CELL_SIZE);

    currGrid = new Uint8Array(cols * rows);
    nextGrid = new Uint8Array(cols * rows);
    glowGrid = new Float32Array(cols * rows);

    // The code below fixes blurriness by correcting the canvas resolution
    // https://developer.mozilla.org/docs/Web/API/Window/devicePixelRatio

    const scale = window.devicePixelRatio || 1;

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    canvas.width = Math.floor(window.innerWidth * scale);
    canvas.height = Math.floor(window.innerHeight * scale);

    context.setTransform(scale, 0, 0, scale, 0, 0);
}

// Spawns a random cluster of cells at the given position
function spawnCluster(x: number, y: number, radius: number) {
    for (let offsetX = -radius; offsetX <= radius; offsetX++) {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {

            // Skip cells outside circular radius
            if (offsetX * offsetX + offsetY * offsetY > radius * radius) continue;

            // Randomly skip cells to not spawn perfect shapes
            if (Math.random() > CLUSTER_CELL_CHANCE) continue;

            const cellX = x + offsetX;
            const cellY = y + offsetY;

            // Skip cells outside the grid
            if (
                cellX >= 0 && cellX < cols &&
                cellY >= 0 && cellY < rows
            ) {
                currGrid[getIndex(cellX, cellY)] = 1;
                glowGrid[getIndex(cellX, cellY)] = 1;
            }
        }
    }
}

// Counts the living cells surrounding a given position (Moore)
function countNeighbors(x: number, y: number) {
    let count = 0;

    const hasLeft = x > 0;
    const hasRight = x < cols - 1;
    const hasTop = y > 0;
    const hasBottom = y < rows - 1;

    const idx = getIndex(x, y);

    // Directly check all 8 surrounding positions (Moore)

    if (hasTop) {
        count += currGrid[idx - cols];
        if (hasLeft)  count += currGrid[idx - cols - 1];
        if (hasRight) count += currGrid[idx - cols + 1];
    }

    if (hasBottom) {
        count += currGrid[idx + cols];
        if (hasLeft)  count += currGrid[idx + cols - 1];
        if (hasRight) count += currGrid[idx + cols + 1];
    }

    if (hasLeft)  count += currGrid[idx - 1];
    if (hasRight) count += currGrid[idx + 1];

    return count;
}

// Calculates the next generation using the Game of Life rules
function step() {
    nextGrid.fill(0);

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {

            const idx = getIndex(x, y);
            const isAlive = currGrid[idx];
            const neighbors = countNeighbors(x, y);

            // Determine the next state of the current cell
            if (isAlive) {
                const isLucky = Math.random() > RANDOM_DEATH_CHANCE;
                const willSurvive = SURVIVAL.has(neighbors) && isLucky;
                nextGrid[idx] = willSurvive ? 1 : 0;
                glowGrid[idx] = 1;
            } else {
                // const canReproduce = neighbors === 3;
                const willBeBorn = BIRTH.has(neighbors);
                nextGrid[idx] = willBeBorn ? 1 : 0;
                glowGrid[idx] *= GLOW_DECAY_RATE;
            }
        }
    }

    [currGrid, nextGrid] = [nextGrid, currGrid];
}

// Draws all living (+ fading-out) cells onto the canvas
function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Render cells with their corresponding glow
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {

            const idx = getIndex(x, y);
            const glow = glowGrid[idx];

            if (glow < GLOW_THRESHOLD) continue;

            const cellX = x * CELL_SIZE;
            const cellY = y * CELL_SIZE;

            // Example with CELL_SIZE = 6 and CELL_GAP = 2:
            // The current cell (cellX, cellY) is at the top-left corner (X)
            // The 2px gap leaves 1px on each side, and the filled area is 4x4
            //
            //     0 1 2 3 4 5
            //   0 X . . . . .
            //   1 . █ █ █ █ .
            //   2 . █ █ █ █ .
            //   3 . █ █ █ █ .
            //   4 . █ █ █ █ .
            //   5 . . . . . .

            context.fillStyle = baseColor;
            context.globalAlpha = glow;
            context.fillRect(
                cellX + CELL_GAP / 2,
                cellY + CELL_GAP / 2,
                CELL_SIZE - CELL_GAP,
                CELL_SIZE - CELL_GAP
            );
        }
    }
}

// Repeatedly spawns random cell clusters at random intervals
function scheduleSpawns() {
    const spawnDelay = getRandIntInclusive(MIN_SPAWN_DELAY_MS, MAX_SPAWN_DELAY_MS)

    setTimeout(() => {
        const spawnX = Math.floor(Math.random() * cols);
        const spawnY = Math.floor(Math.random() * rows);
        const radius = getRandIntInclusive(MIN_CLUSTER_RADIUS, MAX_CLUSTER_RADIUS);

        spawnCluster(spawnX, spawnY, radius);
        scheduleSpawns();
    }, spawnDelay);
}

// Spawn an optionally expanded cell cluster at the given location
function spawnAtPointer(e: PointerEvent, expandedCluster = true) {
    const cellX = Math.floor(e.clientX / CELL_SIZE);
    const cellY = Math.floor(e.clientY / CELL_SIZE);

    let radius = getRandIntInclusive(MIN_CLUSTER_RADIUS, MAX_CLUSTER_RADIUS);
    if (expandedCluster) radius *= CLUSTER_EXPANSION_FACTOR;

    spawnCluster(cellX, cellY, radius);
}

// Spawns a burst of randomly positioned clusters at staggered intervals
function spawnClusterBurst() {
    for (let count = 0; count < CLUSTER_BURST_COUNT; count++) {
        const cellX = getRandIntInclusive(0, cols - 1);
        const cellY = getRandIntInclusive(0, rows - 1);
        const radius = getRandIntInclusive(MIN_CLUSTER_RADIUS, MAX_CLUSTER_RADIUS)
            * CLUSTER_EXPANSION_FACTOR;

        setTimeout(() => spawnCluster(cellX, cellY, radius), count * CLUSTER_BURST_INTERVAL);
    }
}

// Setup
createWorld();
spawnClusterBurst();
if (RANDOM_SPAWNS_ENABLED) scheduleSpawns();
setInterval(update, UPDATE_INTERVAL_MS);

// Start the world over on window resizes
window.addEventListener("resize", createWorld);

// Spawn multiple cell clusters on logo clicks
logo.addEventListener("click", spawnClusterBurst);

// Spawn a big cell cluster at the mouse location on every click
canvas.addEventListener("pointerdown", spawnAtPointer);

// Spawn a small cell cluster at the mouse location periodically
canvas.addEventListener("pointermove", (e) => {
    const now = performance.now();

    if (now - lastPointerSpawn >= POINTER_SPAWN_COOLDOWN_MS) {
        lastPointerSpawn = now;
        spawnAtPointer(e, false);
    }
});
