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
    playerName: '',
    playerPhone: ''
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
    playerNameInput: document.getElementById('player-name-input'),
    playerPhoneInput: document.getElementById('player-phone-input')
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    
    // Testa a conexão com o Supabase
    testSupabaseConnection();
    
    // Pré-carrega o placar do Supabase para cache
    loadScoreboard();
});

// Função para testar a conexão com o Supabase
async function testSupabaseConnection() {
    try {
        // Teste 1: Verificar se a tabela existe
        const { data: tableData, error: tableError } = await supabase
            .from('placar')
            .select('*')
            .limit(1);
            
        if (tableError) {
            // Em caso de erro, pode ser tratado silenciosamente ou com notificação ao usuário
        }
        
        // Teste 2: Inserção de teste usando a estrutura correta
        const testData = {
            nome: 'Teste Conexão',
            telefone: '11999999999',
            tempo_restante: '1:30'
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('placar')
            .insert([testData])
            .select();
            
        if (insertError) {
            // Em caso de erro, pode ser tratado silenciosamente ou com notificação ao usuário
        }
            
    } catch (error) {
        // Em caso de erro crítico, pode ser tratado silenciosamente ou com notificação ao usuário
    }
}

function initializeEventListeners() {
    // Botões do menu principal
    document.getElementById('start-game').addEventListener('click', showPlayerNameModal);
    document.getElementById('show-scoreboard').addEventListener('click', showScoreboard);
    
    // Modal de nome do jogador
    document.getElementById('start-game-with-name').addEventListener('click', handleStartGameWithName);
    document.getElementById('cancel-player-name').addEventListener('click', hidePlayerNameModal);
    document.getElementById('player-name-input').addEventListener('keypress', handleNameInputKeypress);
    document.getElementById('player-name-input').addEventListener('input', validateNameInput);
    document.getElementById('player-phone-input').addEventListener('input', handlePhoneInput);
    document.getElementById('player-phone-input').addEventListener('keypress', handleNameInputKeypress);
    
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
    elements.playerPhoneInput.value = '';
    elements.playerNameModal.classList.remove('hidden');
    setTimeout(() => elements.playerNameInput.focus(), 100);
    validateNameInput(); // Atualiza o estado do botão
}

function hidePlayerNameModal() {
    elements.playerNameModal.classList.add('hidden');
}

// Função para aplicar máscara de telefone
function handlePhoneInput(event) {
    let value = event.target.value;
    
    // Remove tudo que não é número
    value = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX
    if (value.length <= 11) {
        if (value.length >= 6) {
            value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        } else if (value.length >= 2) {
            value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        }
    }
    
    event.target.value = value;
    validateNameInput();
}

// Função para extrair apenas os números do telefone
function getCleanPhone(phoneValue) {
    return phoneValue.replace(/\D/g, '');
}

function handleNameInputKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleStartGameWithName();
    }
}

function validateNameInput() {
    const name = elements.playerNameInput.value.trim();
    const phone = getCleanPhone(elements.playerPhoneInput.value);
    const startButton = document.getElementById('start-game-with-name');
    
    // Permite jogar apenas com nome (telefone opcional para debugging)
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
    const phone = getCleanPhone(elements.playerPhoneInput.value);
    
    if (name.length === 0) {
        elements.playerNameInput.focus();
        return;
    }
    
    // Telefone é opcional para testes
    gameState.playerName = name;
    gameState.playerPhone = phone || 'não informado';
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
        // Calcula o tempo de conclusão (diferença entre 2 minutos e tempo restante)
        const completionTime = GAME_CONFIG.GAME_TIME - gameState.timeRemaining;
        saveScoreToSupabase(completionTime);
    } else {
        showGameOverModal(false, 0, 0);
    }
}

function showGameOverModal(won, score, position) {
    if (won) {
        elements.gameResultTitle.textContent = '🎉 Parabéns!';
        elements.gameResultTitle.className = 'text-2xl font-bold mb-4 text-amber-500';
        
        // Formata o tempo de conclusão
        const minutes = Math.floor(score / 60);
        const seconds = score % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (position) {
            elements.gameResultMessage.innerHTML = `
                Você completou o jogo em <strong>${timeString}</strong>!<br>
                <span class="text-lg text-black">Sua colocação: <strong class="text-amber-500">${position}º lugar</strong></span>
            `;
        } else {
            elements.gameResultMessage.innerHTML = `
                Você completou o jogo em <strong>${timeString}</strong>!<br>
                <span class="text-sm text-amber-600">Salvando pontuação...</span>
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
        // Formata o tempo de conclusão como string "m:ss"
        const minutes = Math.floor(score / 60);
        const seconds = score % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Adiciona a nova pontuação no Supabase usando tempo_restante
        const { data, error } = await supabase
            .from('placar')
            .insert([
                {
                    nome: gameState.playerName,
                    telefone: gameState.playerPhone,
                    tempo_restante: timeString
                }
            ])
            .select();

        if (error) {
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
        // Em caso de erro, usar localStorage como fallback
        const position = saveScoreToLocalStorage(score);
        showGameOverModal(true, score, position);
    }
}

// Função para formatar telefone para exibição
function formatPhoneForDisplay(phone) {
    if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (phone.length === 10) {
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
}

async function getPlayerPosition(score) {
    try {
        const { data, error } = await supabase
            .from('placar')
            .select('*')
            .order('created_at', { ascending: true }); // Busca todos os registros

        if (error) {
            return 1;
        }

        // Converte strings de tempo para segundos para ordenação
        const scoresWithSeconds = data.map(item => {
            // Usa tempo_restante (coluna correta da tabela)
            const timeField = item.tempo_restante;
            if (!timeField) {
                return 0;
            }
            
            const timeParts = timeField.split(':');
            const totalSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
            return totalSeconds;
        }).filter(seconds => seconds > 0); // Remove itens inválidos

        // Para tempo_restante: ordena do maior para o menor (mais tempo restante = melhor)
        // Mas como estamos salvando tempo de conclusão, vamos inverter a lógica
        scoresWithSeconds.sort((a, b) => a - b); // Menor tempo = melhor

        // Encontra a posição baseada na pontuação
        let position = 1;
        for (let i = 0; i < scoresWithSeconds.length; i++) {
            if (scoresWithSeconds[i] < score) {
                position++;
            } else {
                break;
            }
        }

        return position;
    } catch (error) {
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
            // Em caso de erro, usar localStorage como fallback
            loadScoreboardFromLocalStorage();
            return;
        }

        if (!data || data.length === 0) {
            displayScoreboard([]);
            return;
        }

        // Converte e ordena os dados usando tempo_restante
        const sortedData = data
            .map(item => {
                // Usa tempo_restante (coluna correta da tabela)
                const timeField = item.tempo_restante;
                
                if (!timeField) {
                    return null;
                }
                
                // Converte tempo string para segundos para ordenação
                const timeParts = timeField.split(':');
                const totalSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
                return {
                    ...item,
                    totalSeconds
                };
            })
            .filter(item => item !== null) // Remove itens inválidos
            .sort((a, b) => a.totalSeconds - b.totalSeconds) // Ordena do menor para o maior tempo
            .slice(0, 10); // Pega apenas os top 10

        displayScoreboard(sortedData);

    } catch (error) {
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
        scoreElement.className = `p-3 rounded ${
            index === 0 ? 'bg-amber-500 text-black' : 
            index === 1 ? 'bg-amber-300 text-black' : 
            index === 2 ? 'bg-amber-200 text-black' : 
            'bg-amber-100 text-black'
        }`;
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
        
        // Usa tempo_restante (coluna correta) ou fallback para localStorage
        let displayTime = '';
        if (score.tempo_restante) {
            displayTime = score.tempo_restante;
        } else if (score.pontuacao !== undefined) {
            // Para dados do localStorage (fallback)
            const minutes = Math.floor(score.pontuacao / 60);
            const seconds = score.pontuacao % 60;
            displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            displayTime = 'N/A';
        }
        
        // Formata o telefone
        let displayPhone = '';
        if (score.telefone) {
            displayPhone = formatPhoneForDisplay(score.telefone);
        } else {
            displayPhone = 'Não informado';
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
            <div class="grid grid-cols-12 gap-2 items-center">
                <div class="col-span-1 font-bold text-center">${medal}</div>
                <div class="col-span-4">
                    <div class="font-semibold">${score.nome || score.name || 'Jogador Anônimo'}</div>
                    <div class="text-xs opacity-75">${displayPhone}</div>
                </div>
                <div class="col-span-3 text-center">
                    <div class="font-semibold">${displayTime}</div>
                    <div class="text-xs opacity-75">Conclusão</div>
                </div>
                <div class="col-span-4 text-right">
                    <div class="text-sm opacity-75">${displayDate}</div>
                </div>
            </div>
        `;
        
        elements.scoreboardList.appendChild(scoreElement);
    });
}
