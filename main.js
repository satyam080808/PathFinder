const rows = 25;
const cols = 25;
const grid = [];
let startNode = null;
let endNode = null;
let currentMode = "start";
let running = false;
let executionTimes = { dijkstra: 0, bfs: 0, dfs: 0, astar: 0 }; // Track execution times

function initGrid() {
  const gridElement = document.getElementById("grid");
  gridElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  gridElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.col = col;

      cell.addEventListener("click", () => handleCellClick(row, col));
      gridElement.appendChild(cell);

      grid[row][col] = {
        row,
        col,
        isBarrier: false,
        isVisited: false,
        distance: Infinity,
        heuristic: 0,
        previous: null,
      };
    }
  }
}

function handleCellClick(row, col) {
  if (running) return;

  const cell = grid[row][col];
  const cellElement = document.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );

  if (currentMode === "start") {
    if (startNode) {
      const oldStart = document.querySelector(
        `[data-row="${startNode.row}"][data-col="${startNode.col}"]`
      );
      oldStart.classList.remove("start");
    }
    startNode = cell;
    cellElement.classList.add("start");
  } else if (currentMode === "end") {
    if (endNode) {
      const oldEnd = document.querySelector(
        `[data-row="${endNode.row}"][data-col="${endNode.col}"]`
      );
      oldEnd.classList.remove("end");
    }
    endNode = cell;
    cellElement.classList.add("end");
  } else if (currentMode === "barrier") {
    cell.isBarrier = !cell.isBarrier;
    cellElement.classList.toggle("barrier");
  }
}

function generateAutoBarriers() {
  resetGrid();
  for (let i = 0; i < rows * cols * 0.3; i++) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);

    if (
      (startNode && startNode.row === randomRow && startNode.col === randomCol) ||
      (endNode && endNode.row === randomRow && endNode.col === randomCol)
    ) {
      continue;
    }

    const cell = grid[randomRow][randomCol];
    cell.isBarrier = true;
    const cellElement = document.querySelector(
      `[data-row="${randomRow}"][data-col="${randomCol}"]`
    );
    cellElement.classList.add("barrier");
  }
}

function setMode(mode) {
  currentMode = mode;
}

function resetGrid() {
  startNode = null;
  endNode = null;
  running = false;
  for (const row of grid) {
    for (const cell of row) {
      cell.isBarrier = false;
      cell.isVisited = false;
      cell.distance = Infinity;
      cell.previous = null;

      const cellElement = document.querySelector(
        `[data-row="${cell.row}"][data-col="${cell.col}"]`
      );
      cellElement.className = "cell";
    }
  }
}

function runSelectedAlgorithm() {
  if (running) return;
  const selector = document.getElementById("algorithm-selector");
  const selectedAlgorithm = selector.value;

  if (!startNode || !endNode) {
    alert("Please set start and end points.");
    return;
  }

  resetVisited();

  running = true;
  const startTime = performance.now();

  switch (selectedAlgorithm) {
    case "dijkstra":
      runDijkstra();
      break;
    case "bfs":
      runBFS();
      break;
    case "dfs":
      runDFS();
      break;
    case "astar":
      runAStar();
      break;
    default:
      alert("Invalid algorithm selected.");
  }

  const endTime = performance.now();
  executionTimes[selectedAlgorithm] = endTime - startTime;
  updatePerformanceChart(); // Update performance chart after the algorithm runs
}

function updatePerformanceChart() {
  const chartElement = document.getElementById("performance-chart");
  chartElement.innerHTML = `
    <h3>Algorithm Performance Comparison</h3>
    <ul>
      <li>Dijkstra: ${executionTimes.dijkstra.toFixed(2)} ms</li>
      <li>BFS: ${executionTimes.bfs.toFixed(2)} ms</li>
      <li>DFS: ${executionTimes.dfs.toFixed(2)} ms</li>
      <li>A*: ${executionTimes.astar.toFixed(2)} ms</li>
    </ul>
  `;
}

function getNeighbors(node) {
  const neighbors = [];
  const { row, col } = node;

  if (row > 0) neighbors.push(grid[row - 1][col]); // Up
  if (row < rows - 1) neighbors.push(grid[row + 1][col]); // Down
  if (col > 0) neighbors.push(grid[row][col - 1]); // Left
  if (col < cols - 1) neighbors.push(grid[row][col + 1]); // Right

  return neighbors.filter((neighbor) => !neighbor.isBarrier);
}

function reconstructPath() {
  let current = endNode;
  while (current.previous) {
    animateCell(current, "path");
    current = current.previous;
  }
}

function animateCell(node, className) {
  const cellElement = document.querySelector(
    `[data-row="${node.row}"][data-col="${node.col}"]`
  );
  cellElement.classList.add(className);
}

function resetVisited() {
  for (const row of grid) {
    for (const cell of row) {
      cell.isVisited = false;
      const cellElement = document.querySelector(
        `[data-row="${cell.row}"][data-col="${cell.col}"]`
      );
      cellElement.classList.remove("visited", "path");
    }
  }
}

async function runDijkstra() {
  const pq = [startNode];
  startNode.distance = 0;

  while (pq.length > 0) {
    pq.sort((a, b) => a.distance - b.distance);
    const current = pq.shift();

    if (current.isVisited) continue;
    current.isVisited = true;

    animateCell(current, "visited");
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (current === endNode) {
      reconstructPath();
      endTime = performance.now(); // End performance tracking
      logExecutionTime("Dijkstra");
      running = false;
      return;
    }

    for (const neighbor of getNeighbors(current)) {
      if (!neighbor.isVisited) {
        const newDistance = current.distance + 1;
        if (newDistance < neighbor.distance) {
          neighbor.distance = newDistance;
          neighbor.previous = current;
          pq.push(neighbor);
        }
      }
    }
  }
  running = false;
}

async function runBFS() {
  const queue = [startNode];

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.isVisited) continue;
    current.isVisited = true;

    animateCell(current, "visited");
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (current === endNode) {
      reconstructPath();
      endTime = performance.now();
      logExecutionTime("BFS");
      running = false;
      return;
    }

    for (const neighbor of getNeighbors(current)) {
      if (!neighbor.isVisited && !queue.includes(neighbor)) {
        neighbor.previous = current;
        queue.push(neighbor);
      }
    }
  }
  running = false;
}

async function runDFS() {
  const stack = [startNode];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current.isVisited) continue;
    current.isVisited = true;

    animateCell(current, "visited");
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (current === endNode) {
      reconstructPath();
      endTime = performance.now();
      logExecutionTime("DFS");
      running = false;
      return;
    }

    for (const neighbor of getNeighbors(current)) {
      if (!neighbor.isVisited && !stack.includes(neighbor)) {
        neighbor.previous = current;
        stack.push(neighbor);
      }
    }
  }
  running = false;
}

async function runAStar() {
  const openSet = [startNode];
  startNode.distance = 0;
  startNode.heuristic = heuristic(startNode, endNode);

  while (openSet.length > 0) {
    openSet.sort((a, b) => (a.distance + a.heuristic) - (b.distance + b.heuristic));
    const current = openSet.shift();

    if (current.isVisited) continue;
    current.isVisited = true;

    animateCell(current, "visited");
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (current === endNode) {
      reconstructPath();
      endTime = performance.now();
      logExecutionTime("A*");
      running = false;
      return;
    }

    for (const neighbor of getNeighbors(current)) {
      if (!neighbor.isVisited) {
        const newDistance = current.distance + 1;
        if (newDistance < neighbor.distance) {
          neighbor.distance = newDistance;
          neighbor.previous = current;
          neighbor.heuristic = heuristic(neighbor, endNode);
          openSet.push(neighbor);
        }
      }
    }
  }
  running = false;
}

function heuristic(node, target) {
  return Math.abs(node.row - target.row) + Math.abs(node.col - target.col);
}

function logExecutionTime(algorithm) {
  const executionTime = (endTime - startTime).toFixed(2);
  console.log(`${algorithm} execution time: ${executionTime} ms`);
  document.getElementById("execution-time").textContent = `Execution Time: ${executionTime} ms`;
}

window.onload = initGrid;
