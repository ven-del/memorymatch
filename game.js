// Configuração do Supabase
const SUPABASE_URL = 'https://tyofmihrgadjwwlylqgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5b2ZtaWhyZ2Fkand3bHlscWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzI1NzUsImV4cCI6MjA2NDcwODU3NX0.O9z2TDt7TFJiaXgzC9ZHtnHc7-iQ0qJDsEwgUFae1Mw';

// Inicializa o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuração do jogo
const GAME_CONFIG = {
    PREPARATION_TIME: 10, // segundos para memorizar
    GAME_TIME: 120, // 2 minutos em segundos
    TOTAL_PAIRS: 10,
    GRID_SIZE: { cols: 5, rows: 4 }
};

// Dados dos cards
const CARD_DATA = [
    // Tecnologias
    { id: 'javascript', type: 'tech', name: 'JavaScript', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
    { id: 'typescript', type: 'tech', name: 'TypeScript', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
    { id: 'html', type: 'tech', name: 'HTML', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
    { id: 'css', type: 'tech', name: 'CSS', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
    { id: 'java', type: 'tech', name: 'Java', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg', special: true },
    
    // Novos cards com imagens da comunidade
    { id: 'auloes', type: 'community', name: 'Aulões', image: 'auloes.png' },
    { id: 'girls', type: 'community', name: 'Girls', image: 'girls.png' },
    { id: 'podcast', type: 'community', name: 'Podcast', image: 'podcast.png' },
    { id: 'cafe', type: 'community', name: 'Cafézin', image: 'cafe.png', hasText: true },
    
    // Par especial
    { id: 'housejs', type: 'special', name: 'HouseJs', text: 'HouseJs' }
];

// Estado do jogo
let gameState = {
    currentScreen: 'menu',
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    gameTimer: null,
    preparationTimer: null,
    timeRemaining: GAME_CONFIG.GAME_TIME,
    gameStarted: false,
    canFlip: false,
    playerName: ''
};

// Elementos DOM
const elements = {
    mainMenu: document.getElementById('main-menu'),
    gameScreen: document.getElementById('game-screen'),
    scoreboardScreen: document.getElementById('scoreboard-screen'),
    gameOverModal: document.getElementById('game-over-modal'),
    playerNameModal: document.getElementById('player-name-modal'),
    gameBoard: document.getElementById('game-board'),
    timer: document.getElementById('timer'),
    pairsFound: document.getElementById('pairs-found'),
    preparationMessage: document.getElementById('preparation-message'),
    prepText: document.getElementById('prep-text'),
    prepTimer: document.getElementById('prep-timer'),
    scoreboardList: document.getElementById('scoreboard-list'),
    gameResultTitle: document.getElementById('game-result-title'),
    gameResultMessage: document.getElementById('game-result-message'),
    playerNameInput: document.getElementById('player-name-input')
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    // Pré-carrega o placar do Supabase para cache
    loadScoreboard();
});

function initializeEventListeners() {
    // Botões do menu principal
    document.getElementById('start-game').addEventListener('click', showPlayerNameModal);
    document.getElementById('show-scoreboard').addEventListener('click', showScoreboard);
    
    // Modal de nome do jogador
    document.getElementById('start-game-with-name').addEventListener('click', handleStartGameWithName);
    document.getElementById('cancel-player-name').addEventListener('click', hidePlayerNameModal);
    document.getElementById('player-name-input').addEventListener('keypress', handleNameInputKeypress);
    document.getElementById('player-name-input').addEventListener('input', validateNameInput);
    
    // Botões de voltar
    document.getElementById('back-to-menu').addEventListener('click', () => showScreen('menu'));
    document.getElementById('back-to-menu-from-scoreboard').addEventListener('click', () => showScreen('menu'));
    document.getElementById('back-to-menu-from-modal').addEventListener('click', () => {
        hideGameOverModal();
        showScreen('menu');
    });
    
    // Botão de jogar novamente
    document.getElementById('play-again').addEventListener('click', () => {
        hideGameOverModal();
        showPlayerNameModal();
    });
}

function showScreen(screen) {
    // Esconde todas as telas
    elements.mainMenu.classList.add('hidden');
    elements.gameScreen.classList.add('hidden');
    elements.scoreboardScreen.classList.add('hidden');
    
    // Mostra a tela solicitada
    switch(screen) {
        case 'menu':
            elements.mainMenu.classList.remove('hidden');
            gameState.currentScreen = 'menu';
            break;
        case 'game':
            elements.gameScreen.classList.remove('hidden');
            gameState.currentScreen = 'game';
            break;
        case 'scoreboard':
            elements.scoreboardScreen.classList.remove('hidden');
            gameState.currentScreen = 'scoreboard';
            break;
    }
}

function showPlayerNameModal() {
    elements.playerNameInput.value = '';
    elements.playerNameModal.classList.remove('hidden');
    setTimeout(() => elements.playerNameInput.focus(), 100);
    validateNameInput(); // Atualiza o estado do botão
}

function hidePlayerNameModal() {
    elements.playerNameModal.classList.add('hidden');
}

function handleNameInputKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleStartGameWithName();
    }
}

function validateNameInput() {
    const name = elements.playerNameInput.value.trim();
    const startButton = document.getElementById('start-game-with-name');
    
    if (name.length > 0) {
        startButton.disabled = false;
        startButton.classList.remove('disabled:bg-gray-300', 'disabled:cursor-not-allowed');
    } else {
        startButton.disabled = true;
        startButton.classList.add('disabled:bg-gray-300', 'disabled:cursor-not-allowed');
    }
}

function handleStartGameWithName() {
    const name = elements.playerNameInput.value.trim();
    
    if (name.length === 0) {
        elements.playerNameInput.focus();
        return;
    }
    
    gameState.playerName = name;
    hidePlayerNameModal();
    startGame();
}

function startGame() {
    resetGameState();
    showScreen('game');
    generateCards();
    renderCards();
    startPreparationPhase();
}

function resetGameState() {
    gameState.cards = [];
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.timeRemaining = GAME_CONFIG.GAME_TIME;
    gameState.gameStarted = false;
    gameState.canFlip = false;
    
    // Limpa timers existentes
    if (gameState.gameTimer) clearInterval(gameState.gameTimer);
    if (gameState.preparationTimer) clearInterval(gameState.preparationTimer);
    
    // Reset UI
    elements.pairsFound.textContent = '0';
    updateTimerDisplay();
    elements.preparationMessage.classList.remove('hidden');
}

function generateCards() {
    // Cria pares de cards
    const cardPairs = [];
    CARD_DATA.forEach(cardData => {
        // Adiciona dois cards de cada tipo
        cardPairs.push({ ...cardData, pairId: cardData.id + '_1' });
        cardPairs.push({ ...cardData, pairId: cardData.id + '_2' });
    });
    
    // Embaralha os cards
    gameState.cards = shuffleArray(cardPairs);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function renderCards() {
    elements.gameBoard.innerHTML = '';
    
    gameState.cards.forEach((card, index) => {
        const cardElement = createCardElement(card, index);
        elements.gameBoard.appendChild(cardElement);
    });
}

function createCardElement(card, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card h-24';
    cardDiv.dataset.index = index;
    cardDiv.dataset.cardId = card.id;
    
    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';
    
    // Frente do card (costas)
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';
    cardFront.innerHTML = '<img src="logo-preta-housejs-fundo-transparente.svg" alt="HouseJs Logo" class="house-logo-back bg-black">';
    
    // Verso do card (conteúdo)
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    
    // Aplica estilos especiais baseado no tipo
    if (card.type === 'special') {
        cardBack.classList.add('special-card');
        cardBack.innerHTML = `<img src="logo_house.png" alt="HouseJs Logo" class="house-logo-rectangular">`;
    } else if (card.id === 'java' && card.special) {
        cardBack.classList.add('java-special');
        cardBack.innerHTML = `
            <div class="card-content">
                <div class="rosana-photo flex items-center justify-center text-xs"><img src="rosana.png" alt="Rosana" class="rounded-full object-cover"></div>
                <img src="${card.image}" alt="${card.name}" class="java-logo">
            </div>
        `;
    } else if (card.type === 'tech') {
        cardBack.innerHTML = `<img src="${card.image}" alt="${card.name}">`;
    } else if (card.type === 'community') {
        if (card.hasText) {
            // Card do café com texto "Cafézin"
            cardBack.innerHTML = `
                <div class="community-card-content cafe-card">
                    <div class="community-text cafe-text">${card.name}</div>
                    <img src="${card.image}" alt="${card.name}" class="community-image cafe-image">
                </div>
            `;
        } else {
            // Outros cards da comunidade apenas com imagem
            cardBack.innerHTML = `<img src="${card.image}" alt="${card.name}" class="community-image">`;
        }
    }
    
    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    cardDiv.appendChild(cardInner);
    
    // Adiciona event listener
    cardDiv.addEventListener('click', () => handleCardClick(index));
    
    return cardDiv;
}

function startPreparationPhase() {
    let prepTime = GAME_CONFIG.PREPARATION_TIME;
    elements.prepTimer.textContent = prepTime;
    
    // Mostra todos os cards virados durante a preparação
    flipAllCards(true);
    
    gameState.preparationTimer = setInterval(() => {
        prepTime--;
        elements.prepTimer.textContent = prepTime;
        
        if (prepTime <= 0) {
            clearInterval(gameState.preparationTimer);
            endPreparationPhase();
        }
    }, 1000);
}

function endPreparationPhase() {
    // Esconde a mensagem de preparação
    elements.preparationMessage.classList.add('hidden');
    
    // Vira todos os cards de volta
    flipAllCards(false);
    
    // Habilita o clique nos cards e inicia o timer do jogo
    setTimeout(() => {
        gameState.canFlip = true;
        gameState.gameStarted = true;
        startGameTimer();
    }, 600); // Aguarda a animação de virar os cards
}

function flipAllCards(show) {
    const cardElements = document.querySelectorAll('.card');
    cardElements.forEach(card => {
        if (show) {
            card.classList.add('flipped');
        } else {
            card.classList.remove('flipped');
        }
    });
}

function startGameTimer() {
    gameState.gameTimer = setInterval(() => {
        gameState.timeRemaining--;
        updateTimerDisplay();
        
        // Adiciona aviso visual quando restam poucos segundos
        if (gameState.timeRemaining <= 30) {
            elements.timer.classList.add('timer-warning');
        }
        
        if (gameState.timeRemaining <= 0) {
            endGame(false); // Tempo esgotado
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function handleCardClick(index) {
    if (!gameState.canFlip || gameState.flippedCards.length >= 2) return;
    
    const cardElement = document.querySelector(`[data-index="${index}"]`);
    const card = gameState.cards[index];
    
    // Não permite clicar em cards já virados ou matched
    if (cardElement.classList.contains('flipped') || cardElement.classList.contains('matched')) {
        return;
    }
    
    // Vira o card
    cardElement.classList.add('flipped');
    gameState.flippedCards.push({ index, card, element: cardElement });
    
    // Verifica se dois cards foram virados
    if (gameState.flippedCards.length === 2) {
        setTimeout(() => checkForMatch(), 500);
    }
}

function checkForMatch() {
    const [first, second] = gameState.flippedCards;
    
    if (first.card.id === second.card.id) {
        // Match encontrado!
        first.element.classList.add('matched', 'match-animation');
        second.element.classList.add('matched', 'match-animation');
        
        gameState.matchedPairs++;
        elements.pairsFound.textContent = gameState.matchedPairs;
        
        // Remove a animação após um tempo
        setTimeout(() => {
            first.element.classList.remove('match-animation');
            second.element.classList.remove('match-animation');
        }, 600);
        
        // Verifica se o jogo foi completado
        if (gameState.matchedPairs === GAME_CONFIG.TOTAL_PAIRS) {
            setTimeout(() => endGame(true), 600);
        }
    } else {
        // Não é match - vira os cards de volta
        setTimeout(() => {
            first.element.classList.remove('flipped');
            second.element.classList.remove('flipped');
        }, 1000);
    }
    
    // Limpa os cards virados
    gameState.flippedCards = [];
}

function endGame(won) {
    gameState.canFlip = false;
    clearInterval(gameState.gameTimer);
    elements.timer.classList.remove('timer-warning');
    
    if (won) {
        const score = gameState.timeRemaining;
        saveScoreToSupabase(score);
    } else {
        showGameOverModal(false, 0, 0);
    }
}

function showGameOverModal(won, score, position) {
    if (won) {
        elements.gameResultTitle.textContent = '🎉 Parabéns!';
        elements.gameResultTitle.className = 'text-2xl font-bold mb-4 text-amber-500';
        
        if (position) {
            elements.gameResultMessage.innerHTML = `
                Você completou o jogo com <strong>${score} segundos</strong> restantes!<br>
                <span class="text-lg text-black">Sua colocação: <strong class="text-amber-500">${position}º lugar</strong></span>
            `;
        } else {
            elements.gameResultMessage.innerHTML = `
                Você completou o jogo com <strong>${score} segundos</strong> restantes!<br>
                <span class="text-sm text-gray-600">Salvando pontuação...</span>
            `;
        }
    } else {
        elements.gameResultTitle.textContent = '⏰ Tempo Esgotado!';
        elements.gameResultTitle.className = 'text-2xl font-bold mb-4 text-black';
        elements.gameResultMessage.textContent = 'Que pena! O tempo acabou. Tente novamente!';
    }
    
    elements.gameOverModal.classList.remove('hidden');
}

function hideGameOverModal() {
    elements.gameOverModal.classList.add('hidden');
}

async function saveScoreToSupabase(score) {
    // Mostra o modal imediatamente sem a posição
    showGameOverModal(true, score, null);
    
    try {
        // Formata o tempo como string "m:ss"
        const minutes = Math.floor(score / 60);
        const seconds = score % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Adiciona a nova pontuação no Supabase
        const { data, error } = await supabase
            .from('placar')
            .insert([
                {
                    nome: gameState.playerName,
                    tempo_restante: timeString
                }
            ])
            .select();

        if (error) {
            console.error('Erro ao salvar pontuação:', error);
            // Em caso de erro, usar localStorage como fallback
            const position = saveScoreToLocalStorage(score);
            showGameOverModal(true, score, position);
            return;
        }

        // Busca a posição do jogador no ranking
        const position = await getPlayerPosition(score);
        
        // Atualiza o modal com a posição
        showGameOverModal(true, score, position);

    } catch (error) {
        console.error('Erro de conexão:', error);
        // Em caso de erro, usar localStorage como fallback
        const position = saveScoreToLocalStorage(score);
        showGameOverModal(true, score, position);
    }
}

async function getPlayerPosition(score) {
    try {
        const { data, error } = await supabase
            .from('placar')
            .select('tempo_restante')
            .order('created_at', { ascending: true }); // Busca todos os registros

        if (error) {
            console.error('Erro ao buscar posição:', error);
            return 1;
        }

        // Converte strings de tempo para segundos para ordenação
        const scoresWithSeconds = data.map(item => {
            const timeParts = item.tempo_restante.split(':');
            const totalSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
            return totalSeconds;
        });

        // Ordena do maior para o menor
        scoresWithSeconds.sort((a, b) => b - a);

        // Encontra a posição baseada na pontuação
        let position = 1;
        for (let i = 0; i < scoresWithSeconds.length; i++) {
            if (scoresWithSeconds[i] > score) {
                position++;
            } else {
                break;
            }
        }

        return position;
    } catch (error) {
        console.error('Erro ao calcular posição:', error);
        return 1;
    }
}

function saveScoreToLocalStorage(score) {
    let scoreboard = getStoredScoreboard();
    
    // Adiciona a nova pontuação
    const newScore = {
        name: gameState.playerName,
        score: score,
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    
    scoreboard.push(newScore);
    
    // Ordena por pontuação (maior tempo restante primeiro)
    scoreboard.sort((a, b) => b.score - a.score);
    
    // Mantém apenas os top 10
    if (scoreboard.length > 10) {
        scoreboard = scoreboard.slice(0, 10);
    }
    
    // Salva no localStorage
    localStorage.setItem('memoryMatchScoreboard', JSON.stringify(scoreboard));
    
    // Retorna a posição do jogador atual
    return scoreboard.findIndex(s => s === newScore) + 1;
}

function getStoredScoreboard() {
    const stored = localStorage.getItem('memoryMatchScoreboard');
    return stored ? JSON.parse(stored) : [];
}

function showScoreboard() {
    showScreen('scoreboard');
    
    // Mostra indicador de carregamento
    elements.scoreboardList.innerHTML = `
        <div class="text-center text-black py-8">
            <div class="animate-pulse">Carregando placar...</div>
        </div>
    `;
    
    loadScoreboard();
}

async function loadScoreboard() {
    try {
        const { data, error } = await supabase
            .from('placar')
            .select('*')
            .order('created_at', { ascending: true }); // Busca todos os dados

        if (error) {
            console.error('Erro ao carregar placar:', error);
            // Em caso de erro, usar localStorage como fallback
            loadScoreboardFromLocalStorage();
            return;
        }

        // Converte e ordena os dados do maior tempo para o menor
        const sortedData = data
            .map(item => {
                // Converte tempo string para segundos para ordenação
                const timeParts = item.tempo_restante.split(':');
                const totalSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
                return {
                    ...item,
                    totalSeconds
                };
            })
            .sort((a, b) => b.totalSeconds - a.totalSeconds) // Ordena do maior para o menor
            .slice(0, 10); // Pega apenas os top 10

        displayScoreboard(sortedData);

    } catch (error) {
        console.error('Erro de conexão:', error);
        // Em caso de erro, usar localStorage como fallback
        loadScoreboardFromLocalStorage();
    }
}

function loadScoreboardFromLocalStorage() {
    const scoreboard = getStoredScoreboard();
    const formattedData = scoreboard.map(score => ({
        nome: score.name,
        pontuacao: score.score,
        data_jogo: `${score.date} ${score.time}`
    }));
    displayScoreboard(formattedData);
}

function displayScoreboard(scoreboard) {
    elements.scoreboardList.innerHTML = '';
    
    if (scoreboard.length === 0) {
        elements.scoreboardList.innerHTML = `
            <div class="text-center text-black py-8">
                <p>Nenhuma pontuação registrada ainda.</p>
                <p class="text-amber-500 font-bold">Seja o primeiro a jogar!</p>
            </div>
        `;
        return;
    }
    
    scoreboard.forEach((score, index) => {
        const scoreElement = document.createElement('div');
        scoreElement.className = `flex justify-between items-center p-3 rounded ${
            index === 0 ? 'bg-amber-500 text-black' : 
            index === 1 ? 'bg-amber-300 text-black' : 
            index === 2 ? 'bg-amber-200 text-black' : 
            'bg-gray-100 text-black'
        }`;
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
        
        // Usa o tempo_restante se existir (dados do Supabase) ou formata pontuacao (localStorage)
        let displayTime = '';
        if (score.tempo_restante) {
            displayTime = score.tempo_restante;
        } else if (score.pontuacao !== undefined) {
            // Para dados do localStorage (fallback)
            const minutes = Math.floor(score.pontuacao / 60);
            const seconds = score.pontuacao % 60;
            displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Formata a data se existir
        let displayDate = '';
        if (score.created_at) {
            try {
                const date = new Date(score.created_at);
                displayDate = date.toLocaleDateString('pt-BR');
            } catch (e) {
                displayDate = '';
            }
        } else if (score.date) {
            displayDate = score.date;
        }
        
        scoreElement.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="font-bold">${medal}</span>
                <div class="flex flex-col">
                    <span class="font-semibold">${score.nome || score.name || 'Jogador Anônimo'}</span>
                    <span class="text-sm opacity-75">${displayTime} restantes</span>
                </div>
            </div>
            <div class="text-sm opacity-75 text-right">
                ${displayDate ? `<div>${displayDate}</div>` : ''}
            </div>
        `;
        
        elements.scoreboardList.appendChild(scoreElement);
    });
}
