// 1. Keishin Naufa Alfaridzhi (103112400061)
// 2. Dafa Awal Wahyu Pambudi (103112400275)
// 3. Elfan Endriyanto (103112430040)
// 4. Abisar Fathir (103112400068)
// 5. Ariel Ahnaf Kusuma (103112400050)
localStorage.removeItem("iterativeResults");
localStorage.removeItem("recursiveResults");

const BOARD_SIZE = 100;

const ORIGINAL_SNAKE_LADDER_MAP = {
  // Ladders (naik)
  3: 22, // 3 -> 22
  8: 26, // 8 -> 26
  21: 42, // 21 -> 42
  32: 51, // 32 -> 51
  43: 77, // 43 -> 77
  56: 83, // 56 -> 83
  70: 89, // 70 -> 89

  // Snakes (turun)
  16: 6, // 16 -> 6
  27: 7, // 27 -> 7
  35: 5, // 35 -> 5
  47: 19, // 47 -> 19
  63: 18, // 63 -> 18
  66: 45, // 66 -> 45
  73: 53, // 73 -> 53
  96: 75, // 96 -> 75
};

let snakeLadderMap = { ...ORIGINAL_SNAKE_LADDER_MAP };

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function average(arr) {
  if (!arr || arr.length == 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function createBoardMap() {
  const boardMap = Array.from({ length: BOARD_SIZE + 1 }, (_, index) => index);

  Object.entries(snakeLadderMap).forEach(([from, to]) => {
    boardMap[Number(from)] = to;
  });

  return boardMap;
}

function findShortestPathBFS(boardMap) {
  let queue = [{ pos: 1, steps: 0 }];
  let visited = new Array(101).fill(false);
  visited[1] = true;

  while (queue.length > 0) {
    let current = queue.shift();

    if (current.pos === 100) return current.steps;

    for (let dice = 1; dice <= 6; dice++) {
      let nextPos = current.pos + dice;

      if (nextPos <= 100) {
        let finalPos = boardMap[nextPos];

        if (!visited[finalPos]) {
          visited[finalPos] = true;
          queue.push({ pos: finalPos, steps: current.steps + 1 });
        }
      }
    }
  }
  return -1;
}

function findShortestPathDP(boardMap) {
  let dp = new Array(101).fill(Infinity);
  dp[100] = 0;
  let isConverged = false;

  while (!isConverged) {
    isConverged = true;

    for (let i = 99; i >= 1; i--) {
      let minSteps = Infinity;

      for (let dice = 1; dice <= 6; dice++) {
        let nextPos = i + dice;
        if (nextPos <= 100) {
          let finalPos = boardMap[nextPos];
          minSteps = Math.min(minSteps, dp[finalPos]);
        }
      }

      if (minSteps !== Infinity && dp[i] > 1 + minSteps) {
        dp[i] = 1 + minSteps;
        isConverged = false;
      }
    }
  }
  return dp[1] !== Infinity ? dp[1] : -1;
}

document.getElementById("reset-chart").addEventListener("click", resetChart);
document.getElementById("k-runs").addEventListener("input", updateTableTitle);
document
  .getElementById("run-iterative")
  .addEventListener("click", runIterative);
document
  .getElementById("run-recursive")
  .addEventListener("click", runRecursive);
document
  .getElementById("start-visualization")
  .addEventListener("click", startVisualization);

let iterativeResults =
  JSON.parse(localStorage.getItem("iterativeResults")) || [];
let recursiveResults =
  JSON.parse(localStorage.getItem("recursiveResults")) || [];

function normalizeExperimentResults(results) {
  const normalizedResults = {};

  Object.keys(results || {}).forEach((inputSize) => {
    const data = results[inputSize] || {};
    normalizedResults[inputSize] = {
      bfs: data.bfs || data.iterative || [],
      dp: data.dp || data.recursive || [],
    };
  });

  return normalizedResults;
}

let experimentResults = normalizeExperimentResults(
  JSON.parse(localStorage.getItem("ExperimentResults")) || {},
);

function updateResultsTable() {
  const tbody = document.querySelector("#results-table tbody");
  tbody.innerHTML = "";

  Object.keys(experimentResults)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((inputSize) => {
      const data = experimentResults[inputSize];

      const avgBfs = average(data.bfs);
      const avgDp = average(data.dp);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${inputSize}</td>
        <td>${data.bfs.length ? avgBfs.toFixed(2) : "-"}</td>
        <td>${data.dp.length ? avgDp.toFixed(2) : "-"}</td>
      `;

      tbody.appendChild(row);
    });
}

function updateTableTitle() {
  const kInput = document.getElementById("k-runs");
  const k = kInput ? kInput.value : 1;

  document.getElementById("table-title").innerText =
    `Records of Average Execution Time (K = ${k})`;
}

let lineChart = null;

function updateLineChart() {
  const ctx = document.getElementById("performanceChart").getContext("2d");

  const bfsData = [];
  const dpData = [];

  Object.keys(experimentResults)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((inputSize) => {
      const data = experimentResults[inputSize];

      if (data.bfs.length > 0) {
        bfsData.push({
          x: Number(inputSize),
          y: average(data.bfs),
        });
      }

      if (data.dp.length > 0) {
        dpData.push({
          x: Number(inputSize),
          y: average(data.dp),
        });
      }
    });

  const chartData = {
    datasets: [
      {
        label: "BFS (Average)",
        data: bfsData,
        borderColor: "rgba(230, 164, 88, 1)",
        backgroundColor: "rgba(230, 164, 88, 0.3)",
        fill: false,
        tension: 0.2,
      },
      {
        label: "DP (Average)",
        data: dpData,
        borderColor: "rgba(94, 21, 204, 1)",
        backgroundColor: "rgba(94, 21, 204, 0.3)",
        fill: false,
        tension: 0.2,
      },
    ],
  };

  const config = {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      parsing: false,
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Input Size (Number of Simulations)",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Average Execution Time (ms)",
          },
        },
      },
    },
  };

  if (lineChart) {
    lineChart.destroy();
  }

  lineChart = new Chart(ctx, config);
}

function resetChart() {
  if (!confirm("Reset all chart data?")) return;

  iterativeResults = [];
  recursiveResults = [];
  experimentResults = {};

  localStorage.removeItem("IterativeResults");
  localStorage.removeItem("RecursiveResults");
  localStorage.removeItem("ExperimentResults");

  if (lineChart) {
    lineChart.destroy();
    lineChart = null;
  }

  updateResultsTable();
  updateTableTitle();
  updateLineChart();

  document.getElementById("results").innerText = "Chart data reset.";
}

let lastIterativeTime = null;
let lastRecursiveTime = null;

function runIterative() {
  let totalSteps = 0;
  let totalTime = 0;
  const runs =
    parseInt(document.getElementById("simulation-runs").value) || 1000;
  const K = parseInt(document.getElementById("k-runs").value) || 1;
  const boardMap = createBoardMap();

  if (!experimentResults[runs]) {
    experimentResults[runs] = { bfs: [], dp: [] };
  }

  for (let k = 0; k < K; k++) {
    const startTime = performance.now();
    for (let i = 0; i < runs; i++) {
      totalSteps += findShortestPathBFS(boardMap);
    }
    const endTime = performance.now();

    const executionTime = endTime - startTime;
    totalTime += executionTime;

    experimentResults[runs].bfs.push(executionTime);
  }

  localStorage.setItem("ExperimentResults", JSON.stringify(experimentResults));

  const avgTime = totalTime / K;
  const avgSteps = totalSteps / (runs * K);

  document.getElementById("results").innerText =
    `BFS | Input Size: ${runs}, K: ${K}, ` +
    `Avg Steps: ${avgSteps.toFixed(2)}, ` +
    `Avg Time: ${avgTime.toFixed(2)} ms`;

  updateResultsTable();
  updateTableTitle();
  updateLineChart();
}

function runRecursive() {
  let totalSteps = 0;
  let totalTime = 0;
  const runs =
    parseInt(document.getElementById("simulation-runs").value) || 1000;
  const K = parseInt(document.getElementById("k-runs").value) || 1;
  const boardMap = createBoardMap();

  if (!experimentResults[runs]) {
    experimentResults[runs] = { bfs: [], dp: [] };
  }

  for (let k = 0; k < K; k++) {
    const startTime = performance.now();
    for (let i = 0; i < runs; i++) {
      totalSteps += findShortestPathDP(boardMap);
    }
    const endTime = performance.now();

    const executionTime = endTime - startTime;
    totalTime += executionTime;

    experimentResults[runs].dp.push(executionTime);
  }

  localStorage.setItem("ExperimentResults", JSON.stringify(experimentResults));

  const avgTime = totalTime / K;
  const avgSteps = totalSteps / (runs * K);

  document.getElementById("results").innerText =
    `DP | Input Size: ${runs}, K: ${K}, ` +
    `Avg Steps: ${avgSteps.toFixed(2)}, ` +
    `Avg Time: ${avgTime.toFixed(2)} ms`;

  updateResultsTable();
  updateLineChart();
}

function renderBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  // Calculate board size based on viewport, leaving space for sidebar
  const maxWidth = window.innerWidth - 320; // Leave space for sidebar
  const maxHeight = window.innerHeight - 200; // Leave space for title and controls
  const boardSize = Math.min(maxWidth * 0.8, maxHeight * 0.8, 600); // Max 600px
  const cellSize = boardSize / 10;

  board.style.width = boardSize + "px";
  board.style.height = boardSize + "px";

  for (let row = 10; row >= 1; row--) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";

    for (let col = 1; col <= 10; col++) {
      let num;
      if (row % 2 === 1) {
        // odd row, left to right
        num = (row - 1) * 10 + col;
      } else {
        // even row, right to left
        num = (row - 1) * 10 + (10 - col + 1);
      }

      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `cell-${num}`;
      cell.innerText = num;
      cell.style.width = cellSize + "px";
      cell.style.height = cellSize + "px";

      // checkerboard
      let isGray =
        (row % 2 === 1 && col % 2 === 1) || (row % 2 === 0 && col % 2 === 0);
      const baseBg = isGray ? "#d9d9d9" : "#3594ac";
      cell.style.background = baseBg;
      // store original background and text color so we can restore them later
      cell.dataset.origBg = baseBg;
      cell.dataset.origColor = "#000000";

      // ladders green
      if (snakeLadderMap[num] && snakeLadderMap[num] > num) {
        cell.style.background = "#b8de99";
      }

      // snakes orange
      if (snakeLadderMap[num] && snakeLadderMap[num] < num) {
        cell.style.background = "#e6a458";
      }

      rowDiv.appendChild(cell);
    }

    board.appendChild(rowDiv);
  }
}

function updatePlayer(position) {
  document.querySelectorAll(".player").forEach((c) => {
    c.classList.remove("player");
    // restore stored original styles so layout/colors remain consistent
    if (c.dataset.origBg) c.style.background = c.dataset.origBg;
    else c.style.removeProperty("background");
    if (c.dataset.origColor) c.style.color = c.dataset.origColor;
    else c.style.removeProperty("color");
  });

  const cell = document.getElementById(`cell-${position}`);
  if (cell) {
    cell.classList.add("player");
    cell.style.background = "#ffffff";
    cell.style.color = "#1f1f1f";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startVisualization() {
  let position = 0;
  renderBoard();

  while (position < BOARD_SIZE) {
    await delay(500);

    position += rollDice();

    if (snakeLadderMap[position]) {
      // Highlight the snake/ladder cell
      await highlightCell(
        position,
        snakeLadderMap[position] > position ? "ladder" : "snake",
      );
      position = snakeLadderMap[position];
    }

    updatePlayer(position);
  }
}

function highlightCell(cellNumber, type) {
  return new Promise((resolve) => {
    const cell = document.getElementById(`cell-${cellNumber}`);
    if (cell) {
      const originalBg = cell.style.background;
      if (type === "snake") {
        cell.style.background = "#ff0000"; // Red for snake
      } else {
        cell.style.background = "#00ff00"; // Bright green for ladder
      }
      setTimeout(() => {
        cell.style.background = originalBg;
        resolve();
      }, 500);
    } else {
      resolve();
    }
  });
}

function updatePlayer(position) {
  document.querySelectorAll(".player").forEach((c) => {
    c.classList.remove("player");
    // restore stored original styles so layout/colors remain consistent
    if (c.dataset.origBg) c.style.background = c.dataset.origBg;
    else c.style.removeProperty("background");
    if (c.dataset.origColor) c.style.color = c.dataset.origColor;
    else c.style.removeProperty("color");
  });

  const cell = document.getElementById(`cell-${position}`);
  if (cell) {
    cell.classList.add("player");
    cell.style.background = "#ffffff";
    cell.style.color = "#1f1f1f";
  }
}

renderBoard();
updateResultsTable();
updateTableTitle();
updateLineChart();

document.getElementById("run-iterative").innerText = "Run BFS";
document.getElementById("run-recursive").innerText = "Run DP";

const tableHeaders = document.querySelectorAll("#results-table thead th");
if (tableHeaders.length >= 3) {
  tableHeaders[1].innerText = "BFS (ms)";
  tableHeaders[2].innerText = "DP (ms)";
}

window.addEventListener("resize", () => {
  renderBoard();
});
