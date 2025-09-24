document.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const rankingScreen = document.getElementById("ranking-screen");
  const endScreen = document.getElementById("end-screen");
  // Adicionando a nova tela de instruções
  const instructionsScreen = document.getElementById("instructions-screen");
  const wordGrid = document.getElementById("word-grid");
  const wordsToFindList = document.getElementById("words-to-find");
  const scoreDisplay = document.getElementById("score");
  const timerDisplay = document.getElementById("timer");
  const endMessage = document.getElementById("end-message");
  const finalScoreDisplay = document.getElementById("final-score");
  const playerNameInput = document.getElementById("player-name");
  const levelSelect = document.getElementById("level-select");
  const noRankingMessage = document.getElementById("no-ranking-message");
  const muteButton = document.getElementById("mute-button");
  const muteIcon = document.getElementById("mute-icon");

  let currentLevel;
  let score = 0;
  let timer;
  let timeLeft;
  let gridData = [];
  let selectedCells = [];
  let foundWords = [];
  let firstClickCell = null;
  let isMuted = false;

  // Variável para controlar o estado do arraste
  let isSelecting = false;

  // Referência para os elementos de áudio
  const bgMusic = document.getElementById("bg-music");
  const foundWordSound = document.getElementById("found-word-sound");
  const gameOverSound = document.getElementById("game-over-sound");

  // Definição dos níveis do jogo, com palavras e tamanhos de grade
  const levels = {
    easy: {
      size: 10,
      words: ["GATO", "SOL", "CASA", "LUA", "CARRO", "AMOR"],
      time: 240,
    },
    medium: {
      size: 14,
      words: [
        "COMPUTADOR",
        "ESCOLA",
        "TECLADO",
        "JOGOS",
        "CELULAR",
        "MUSICA",
        "LIVRO",
        "CANETA",
        "ABACAXI",
        "FLORESTA",
      ],
      time: 300,
    },
    hard: {
      size: 18,
      words: [
        "DESENVOLVIMENTO",
        "PROGRAMACAO",
        "ALGORITMO",
        "COMPUTACAO",
        "TECNOLOGIA",
        "SISTEMAS",
        "INTELIGENCIA",
        "DADOS",
        "SEGURANCA",
        "FRAMEWORK",
        "APLICACAO",
        "JAVASCRIPT",
      ],
      time: 420,
    },
  };

  // Ordem dos níveis do jogo
  const levelOrder = ["easy", "medium", "hard"];
  let currentLevelIndex = 0;

  // Funções de controle da interface (mostrar/esconder telas)
  window.showScreen = (screenId) => {
    const screens = document.querySelectorAll(".screen");
    screens.forEach((screen) => (screen.style.display = "none"));
    document.getElementById(screenId).style.display = "flex";
  };

  window.toggleMute = () => {
    isMuted = !isMuted;
    if (isMuted) {
      bgMusic.muted = true;
      foundWordSound.muted = true;
      gameOverSound.muted = true;
      muteIcon.src = "https://api.iconify.design/ic:baseline-volume-off.svg";
    } else {
      bgMusic.muted = false;
      foundWordSound.muted = false;
      gameOverSound.muted = false;
      muteIcon.src = "https://api.iconify.design/ic:baseline-volume-up.svg";
    }
  };

  // Funções principais do jogo
  window.startGame = () => {
    const selectedLevel = levelSelect.value;
    currentLevelIndex = levelOrder.indexOf(selectedLevel);
    if (currentLevelIndex === -1) {
      currentLevelIndex = 0;
    }

    currentLevel = levels[levelOrder[currentLevelIndex]];
    score = 0;
    foundWords = [];
    selectedCells = [];
    firstClickCell = null;
    updateScore();

    // Inicia o jogo, gerando a grade e o temporizador
    generateGrid();
    renderWordsToFind();
    showScreen("game-screen");
    startTimer();
    playBackgroundMusic();
  };

  window.restartGame = () => {
    clearInterval(timer);
    stopBackgroundMusic();
    showScreen("start-screen");
  };

  // Lógica para gerar a grade de palavras
  function generateGrid() {
    const size = currentLevel.size;
    gridData = Array.from({ length: size }, () => Array(size).fill(""));

    let wordsToPlace = shuffleArray([...currentLevel.words]);
    let placedWords = 0;
    for (const word of wordsToPlace) {
      if (placeWordInGrid(word)) {
        placedWords++;
      }
    }

    fillEmptyCells();
    renderGrid();
  }

  function placeWordInGrid(word) {
    const size = currentLevel.size;
    const directions = [
      { dx: 1, dy: 0 }, // Horizontal
      { dx: 0, dy: 1 }, // Vertical
      { dx: 1, dy: 1 }, // Diagonal (descendente)
      { dx: 1, dy: -1 }, // Diagonal (ascendente)
      { dx: -1, dy: 0 }, // Horizontal invertida
      { dx: 0, dy: -1 }, // Vertical invertida
      { dx: -1, dy: -1 }, // Diagonal invertida (descendente)
      { dx: -1, dy: 1 }, // Diagonal invertida (ascendente)
    ];

    const shuffledDirections = shuffleArray(directions);

    for (const dir of shuffledDirections) {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (canPlaceWord(word, i, j, dir)) {
            for (let k = 0; k < word.length; k++) {
              const x = i + k * dir.dx;
              const y = j + k * dir.dy;
              gridData[x][y] = word[k];
            }
            return true;
          }
        }
      }
    }
    return false;
  }

  function canPlaceWord(word, startX, startY, dir) {
    const size = currentLevel.size;
    const len = word.length;

    if (
      startX + (len - 1) * dir.dx < 0 ||
      startX + (len - 1) * dir.dx >= size ||
      startY + (len - 1) * dir.dy < 0 ||
      startY + (len - 1) * dir.dy >= size
    ) {
      return false;
    }

    for (let k = 0; k < len; k++) {
      const x = startX + k * dir.dx;
      const y = startY + k * dir.dy;
      if (gridData[x][y] !== "" && gridData[x][y] !== word[k]) {
        return false;
      }
    }
    return true;
  }

  function fillEmptyCells() {
    const size = currentLevel.size;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (gridData[i][j] === "") {
          const randomChar =
            alphabet[Math.floor(Math.random() * alphabet.length)];
          gridData[i][j] = randomChar;
        }
      }
    }
  }

  function renderGrid() {
    wordGrid.innerHTML = "";
    wordGrid.style.gridTemplateColumns = `repeat(${currentLevel.size}, 1fr)`;

    for (let i = 0; i < currentLevel.size; i++) {
      for (let j = 0; j < currentLevel.size; j++) {
        const cell = document.createElement("div");
        cell.classList.add("grid-cell");
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.textContent = gridData[i][j] || "";

        // Adicionando os eventos de mouse para seleção por arraste
        cell.addEventListener("mousedown", handleMouseDown);
        cell.addEventListener("mouseover", handleCellHover);
        cell.addEventListener("mouseup", handleMouseUp);

        wordGrid.appendChild(cell);
      }
    }
  }

  function renderWordsToFind() {
    wordsToFindList.innerHTML = "";
    currentLevel.words.forEach((word) => {
      const li = document.createElement("li");
      li.textContent = word;
      li.id = `word-${word}`;
      wordsToFindList.appendChild(li);
    });
  }

  // Lógica de seleção por arraste
  function handleMouseDown(event) {
    const cell = event.target;
    if (cell.classList.contains("found")) {
      return;
    }
    isSelecting = true;
    firstClickCell = cell;
    cell.classList.add("selected-start");
    selectedCells.push(cell);
  }

  function handleMouseUp(event) {
    if (!isSelecting) {
      return;
    }
    isSelecting = false;
    const lastCell = event.target;
    checkWord(firstClickCell, lastCell);
    resetSelection();
  }

  function handleCellHover(event) {
    if (!isSelecting) {
      return;
    }
    const cell = event.target;
    const path = getSelectedPath(firstClickCell, cell);

    selectedCells.forEach((c) => c.classList.remove("selected", "hovering"));
    selectedCells = [];
    path.forEach((c) => {
      c.classList.add("selected", "hovering");
      selectedCells.push(c);
    });

    firstClickCell.classList.add("selected-start");
    cell.classList.add("selected-end");
  }

  function checkWord(startCell, endCell) {
    const cells = getSelectedPath(startCell, endCell);
    const selectedWord = cells.map((c) => c.textContent).join("");

    const reversedWord = selectedWord.split("").reverse().join("");

    const wordsToCheck = [...currentLevel.words];

    if (
      wordsToCheck.includes(selectedWord) ||
      wordsToCheck.includes(reversedWord)
    ) {
      let foundWord = selectedWord;
      if (wordsToCheck.includes(reversedWord)) {
        foundWord = reversedWord;
      }
      if (!foundWords.includes(foundWord)) {
        foundWords.push(foundWord);
        cells.forEach((cell) => cell.classList.add("found"));
        document
          .getElementById(`word-${foundWord}`)
          .classList.add("found-word-item");
        updateScore(foundWord.length * 10);
        playFoundWordSound();
      }
    }
    resetSelection();
    if (foundWords.length === currentLevel.words.length) {
      endGame(true, false);
    }
  }

  function getSelectedPath(start, end) {
    const cells = [];
    const startRow = parseInt(start.dataset.row);
    const startCol = parseInt(start.dataset.col);
    const endRow = parseInt(end.dataset.row);
    const endCol = parseInt(end.dataset.col);

    const dx = Math.abs(endCol - startCol);
    const dy = Math.abs(endRow - startRow);
    const isDiagonal = dx === dy;
    const isStraight = dx === 0 || dy === 0;

    if (!isDiagonal && !isStraight) {
      return [];
    }

    let currentRow = startRow;
    let currentCol = startCol;
    while (true) {
      const cell = document.querySelector(
        `[data-row="${currentRow}"][data-col="${currentCol}"]`
      );
      if (!cell) break;
      cells.push(cell);
      if (currentRow === endRow && currentCol === endCol) break;
      currentRow += Math.sign(endRow - startRow);
      currentCol += Math.sign(endCol - startCol);
    }
    return cells;
  }

  function resetSelection() {
    selectedCells.forEach((c) =>
      c.classList.remove(
        "selected",
        "selected-start",
        "selected-end",
        "hovering"
      )
    );
    firstClickCell = null;
    selectedCells = [];
  }

  function startTimer() {
    clearInterval(timer);
    timeLeft = currentLevel.time;
    updateTimerDisplay();
    timer = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timer);
        endGame(false);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }

  function updateScore(points = 0) {
    score += points;
    scoreDisplay.textContent = score;
  }

  function endGame(win, completedAllLevels = false) {
    clearInterval(timer);
    stopBackgroundMusic();
    const saveScoreSection = document.getElementById("save-score");

    if (win && !completedAllLevels) {
      endMessage.textContent =
        "Parabéns, você encontrou todas as palavras deste nível!";
      finalScoreDisplay.textContent = score;
      saveScoreSection.innerHTML = `
          <p>Pronto para o próximo nível?</p>
          <button onclick="window.startNextLevel()">Próximo Nível</button>
      `;
      showScreen("end-screen");
    } else if (win && completedAllLevels) {
      endMessage.textContent =
        "Parabéns, você completou todos os níveis do jogo!";
      finalScoreDisplay.textContent = score;
      saveScoreSection.innerHTML = `
          <p>Insira seu nome para salvar sua pontuação:</p>
          <input type="text" id="player-name" placeholder="Seu nome" maxlength="15">
          <button onclick="window.saveScore()">Salvar Pontuação</button>
          <button onclick="window.restartGame()">Voltar ao Início</button>
      `;
      showScreen("end-screen");
    } else {
      endMessage.textContent = "O tempo acabou! Tente novamente.";
      finalScoreDisplay.textContent = score;
      playGameOverSound();
      saveScoreSection.innerHTML = `
          <p>Insira seu nome para salvar sua pontuação:</p>
          <input type="text" id="player-name" placeholder="Seu nome" maxlength="15">
          <button onclick="window.saveScore()">Salvar Pontuação</button>
          <button onclick="window.restartGame()">Voltar ao Início</button>
      `;
      showScreen("end-screen");
    }
  }

  window.startNextLevel = () => {
    currentLevelIndex++;
    if (currentLevelIndex < levelOrder.length) {
      currentLevel = levels[levelOrder[currentLevelIndex]];
      foundWords = [];
      selectedCells = [];
      firstClickCell = null;

      wordGrid.innerHTML = "";
      wordsToFindList.innerHTML = "";

      generateGrid();
      renderWordsToFind();
      showScreen("game-screen");
      startTimer();
    } else {
      endGame(true, true);
    }
  };

  // Funções de controle de áudio
  function playBackgroundMusic() {
    if (!isMuted) {
      bgMusic.currentTime = 0;
      bgMusic
        .play()
        .catch((error) =>
          console.error("Erro ao tocar música de fundo:", error)
        );
    }
  }

  function stopBackgroundMusic() {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }

  function playFoundWordSound() {
    if (!isMuted) {
      foundWordSound.currentTime = 0;
      foundWordSound
        .play()
        .catch((error) => console.error("Erro ao tocar som de acerto:", error));
    }
  }

  function playGameOverSound() {
    if (!isMuted) {
      gameOverSound.currentTime = 0;
      gameOverSound
        .play()
        .catch((error) =>
          console.error("Erro ao tocar som de derrota:", error)
        );
    }
  }

  // Utilitários
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Lógica de Ranking
  const RANKING_KEY = "word_search_ranking";
  const rankingList = document.getElementById("ranking-list");

  function getRanking() {
    const ranking = localStorage.getItem(RANKING_KEY);
    return ranking ? JSON.parse(ranking) : [];
  }

  function saveRanking(ranking) {
    localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));
  }

  window.renderRanking = () => {
    const ranking = getRanking();
    ranking.sort((a, b) => b.score - a.score);
    rankingList.innerHTML = "";

    if (ranking.length === 0) {
      noRankingMessage.style.display = "block";
    } else {
      noRankingMessage.style.display = "none";
      ranking.slice(0, 10).forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${index + 1}. ${item.name}</span><span>${
          item.score
        }</span>`;
        rankingList.appendChild(li);
      });
    }
  };

  window.saveScore = () => {
    const playerName = document.getElementById("player-name").value.trim();
    if (playerName && score > 0) {
      const ranking = getRanking();
      ranking.push({ name: playerName, score: score });
      saveRanking(ranking);
      showScreen("ranking-screen");
      renderRanking();
    } else {
      alert("Por favor, digite seu nome para salvar a pontuação.");
    }
  };

  showScreen("start-screen");
});
