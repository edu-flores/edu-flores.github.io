/**
 *
 * Starts a background animation on a canvas element.
 *
 * The animation is based on Conway's Game of Life, with a few modifications
 * to make it work well as a dynamic background. The basic rules of the game are:
 *
 *   - Live cells with < 2 live neighbors die (underpopulation)
 *   - Live cells with > 3 live neighbors die (overpopulation)
 *   - Dead cells with exactly 3 live neighbors become alive (reproduction)
 *   - Live cells with 2 or 3 live neighbors survive to the next generation
 *
 * The following modifications were made:
 *
 *   - Random clusters of cells appear every X seconds
 *   - Cells have a small chance of randomly dying (entropy!)
 *   - Users can move or click their mouse to create small disturbances
 *
 * Cells are also not simply "alive" or "dead". Instead, they have an energy level
 * that gradually increases or decreases, allowing cells to slowly fade out as they die.
 *
 */

const canvas = document.getElementById("game-of-life") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

let cols = 0, rows = 0;
let currGrid: Uint8Array, nextGrid: Uint8Array, glowGrid: Float32Array;
let colorTable: string[];

const UPDATE_INTERVAL_MS = 70;
const CELL_SIZE = 6;
const CELL_GAP = 2;

const MIN_SPAWN_DELAY_MS = 500;
const MAX_SPAWN_DELAY_MS = 2000;
const MIN_CLUSTER_RADIUS = 2;
const MAX_CLUSTER_RADIUS = 5;
const CLUSTER_CELL_CHANCE = 0.30;
const RANDOM_DEATH_CHANCE = 0.08;
const POINTER_SENSITIVITY = 0.20;
const GLOW_DECAY_RATE = 0.85;
const GLOW_THRESHOLD = 0.05;

// Change the canvas fillStyle on theme toggles
const themeObserver = new MutationObserver(() => {
    setBaseColor(getComputedStyle(canvas).color);
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

// Pre-computes all 256 possible opacities based on the base color
function setBaseColor(baseColor: string) {
    const prefix = baseColor.slice(0, -1);

    colorTable = Array.from(
        { length: 256 },
        (_, i) => `${prefix}, ${i / 255})`
    );
}

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

    // ---

    setBaseColor(getComputedStyle(canvas).color);
}

// Spawns a random cluster of cells at the given position
function spawnCluster(x: number, y: number, radius: number) {
    for (let offsetX = -radius; offsetX <= radius; offsetX++) {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {

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

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {

            // Skip the current cell
            if (dx === 0 && dy === 0) continue;

            let nx = x + dx;
            let ny = y + dy;

            // Skip cells outside the grid
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;

            count += currGrid[getIndex(nx, ny)];
        }
    }

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
                const isUnderpopulated = neighbors < 2;
                const isOverpopulated = neighbors > 3;
                const isLucky = Math.random() > RANDOM_DEATH_CHANCE;
                nextGrid[idx] = isUnderpopulated || isOverpopulated || !isLucky ? 0 : 1;
                glowGrid[idx] = 1;
            } else {
                const canReproduce = neighbors === 3;
                nextGrid[idx] = canReproduce ? 1 : 0;
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

            context.fillStyle = colorTable[Math.floor(glow * 255)];
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

// Spawn clusters at the pointer's location on movement and clicks
function spawnAtPointer(e: PointerEvent) {
    const cellX = Math.floor(e.clientX / CELL_SIZE);
    const cellY = Math.floor(e.clientY / CELL_SIZE);
    const radius = getRandIntInclusive(MIN_CLUSTER_RADIUS, MAX_CLUSTER_RADIUS);

    spawnCluster(cellX, cellY, radius);
}

createWorld();
scheduleSpawns();
setInterval(update, UPDATE_INTERVAL_MS);

window.addEventListener("resize", createWorld);
window.addEventListener("pointerdown", spawnAtPointer);
window.addEventListener("pointermove", (e) => {
    if (Math.random() < POINTER_SENSITIVITY) spawnAtPointer(e);
});
