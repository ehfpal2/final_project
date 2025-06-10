// API 키 및 전역 변수
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
let chatArea;
let userInput;
let sendBtn;
let apiStatus;
let currentQuiz = null;
let quizScore = 0;
let totalQuestions = 0;

// 🟢 시스템 프롬프트 설정
const systemPrompt = `
당신은 C언어와 Python 함수 학습을 도와주는 친절하고 전문적인 프로그래밍 튜터입니다.
학생들이 함수 관련 개념을 쉽게 이해할 수 있도록 도와주세요.

주요 역할:
- 프로그래밍 함수 관련 질문에 친절하고 정확하게 답변
- 복잡한 개념을 쉬운 예제와 함께 설명
- 학습자의 수준에 맞춰 단계적으로 설명
- 격려와 동기부여 제공

답변 스타일:
- 친근하고 따뜻한 말투
- 구체적인 코드 예제 포함
- 실무에서 활용할 수 있는 팁 제공
- 필요시 추가 학습 방향 제시
`;

// 🟡 대화 맥락을 저장하는 배열
const conversationHistory = [
    { role: "system", content: systemPrompt }
];

// 단어 데이터
const vocabularyData = {
    c: [
        { word: "function", meaning: "함수", example: "int main() { return 0; }", korean: "특정 작업을 수행하는 코드 블록" },
        { word: "parameter", meaning: "매개변수", example: "void func(int parameter)", korean: "함수에 전달되는 값" },
        { word: "argument", meaning: "인수", example: "func(5); // 5 is argument", korean: "함수 호출 시 전달하는 실제 값" },
        { word: "return", meaning: "반환", example: "return value;", korean: "함수에서 값을 돌려주는 것" },
        { word: "void", meaning: "공허한", example: "void function()", korean: "반환값이 없는 함수 타입" },
        { word: "declare", meaning: "선언하다", example: "int func();", korean: "함수의 존재를 알리는 것" },
        { word: "define", meaning: "정의하다", example: "int func() { return 1; }", korean: "함수의 실제 내용을 작성하는 것" },
        { word: "prototype", meaning: "원형", example: "int add(int, int);", korean: "함수의 선언부" },
        { word: "invoke", meaning: "호출하다", example: "func();", korean: "함수를 실행시키는 것" },
        { word: "scope", meaning: "범위", example: "local/global scope", korean: "변수나 함수가 유효한 영역" }
    ],
    python: [
        { word: "def", meaning: "정의", example: "def function():", korean: "파이썬에서 함수를 정의하는 키워드" },
        { word: "lambda", meaning: "람다", example: "lambda x: x*2", korean: "익명 함수를 만드는 키워드" },
        { word: "yield", meaning: "생성하다", example: "yield value", korean: "제너레이터에서 값을 반환" },
        { word: "decorator", meaning: "장식자", example: "@decorator", korean: "함수를 수정하는 함수" },
        { word: "closure", meaning: "클로저", example: "nested function", korean: "내부 함수가 외부 변수를 참조" },
        { word: "generator", meaning: "생성기", example: "def gen(): yield 1", korean: "값을 하나씩 생성하는 함수" },
        { word: "recursion", meaning: "재귀", example: "func calls itself", korean: "함수가 자기 자신을 호출" },
        { word: "docstring", meaning: "문서 문자열", example: '"""documentation"""', korean: "함수 설명을 위한 문자열" },
        { word: "kwargs", meaning: "키워드 인수", example: "**kwargs", korean: "키워드 형태의 가변 인수" },
        { word: "args", meaning: "인수들", example: "*args", korean: "위치 기반의 가변 인수" }
    ]
};

// GPT API 호출 함수
async function fetchGPTResponse() {
    if (!apiKey) {
        return "GPT API를 사용하려면 .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.";
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo", // 모델 변경 가능
                messages: conversationHistory,
                temperature: 0.7, // 창의성 조절 (0: 정답 중심, 1: 창의적)
                max_tokens: 800
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('GPT API 호출 에러:', error);
        if (error.message.includes('401')) {
            return "API 키가 올바르지 않습니다. VITE_OPENAI_API_KEY를 확인해주세요.";
        } else if (error.message.includes('429')) {
            return "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        } else {
            return "GPT API 호출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
    }
}

// API 키 검증 함수
async function validateApiKey() {
    if (!apiKey) return false;
    
    try {
        const response = await fetch("https://api.openai.com/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// 초기화
async function initializeChatbot() {
    console.log('🚀 통합 챗봇 시작!');
    
    chatArea = document.getElementById('chatArea');
    userInput = document.getElementById('userInput');
    sendBtn = document.getElementById('sendBtn');
    apiStatus = document.getElementById('apiStatus');
    
    if (!chatArea || !userInput || !sendBtn) {
        console.error('요소를 찾을 수 없습니다');
        return;
    }
    
    // API 상태 확인
    await updateApiStatus();
    
    // 이벤트 리스너 등록
    sendBtn.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', handleKeyPress);
    userInput.addEventListener('keydown', handleKeyDown);
    
    showInitialMessage();
    addMenuButtonListeners();
    
    console.log('✅ 통합 챗봇 준비 완료!');
}

// API 상태 업데이트
async function updateApiStatus() {
    if (!apiKey) {
        apiStatus.textContent = "GPT 기능 비활성화";
        apiStatus.className = "api-status disconnected";
        console.log('⚠️ API 키가 설정되지 않았습니다. 학습 기능만 사용 가능합니다.');
        return;
    }

    apiStatus.textContent = "API 연결 확인 중...";
    apiStatus.className = "api-status";
    
    const isValid = await validateApiKey();
    
    if (isValid) {
        apiStatus.textContent = "GPT 기능 활성화 ✓";
        apiStatus.className = "api-status connected";
        console.log('✅ GPT API 연결 성공!');
    } else {
        apiStatus.textContent = "API 키 오류";
        apiStatus.className = "api-status disconnected";
        console.error('❌ API 키가 유효하지 않습니다.');
    }
}

// 초기 메시지
function showInitialMessage() {
    const gptStatus = apiKey ? "GPT 대화 기능 포함" : "학습 기능만 사용 가능";
    const message = `
        안녕하세요! 👋<br>
        C언어와 Python 함수 관련 영어 단어를 학습할 수 있는 통합 챗봇입니다.<br><br>
        <strong>📚 기능:</strong><br>
        • 함수 관련 영어 단어 학습<br>
        • 단어 퀴즈<br>
        • 프로그래밍 질문 (${gptStatus})<br>
        • 자유로운 대화<br><br>
        
        <div class="menu-buttons">
            <div class="menu-btn" data-action="quiz">📝 퀴즈 시작</div>
            <div class="menu-btn" data-action="wordlist">📖 단어 목록</div>
            <div class="menu-btn" data-action="random">🎲 랜덤 단어</div>
            <div class="menu-btn" data-action="help">❓ 도움말</div>
        </div>
    `;
    addMessage(message);
}

// 메시지 추가
function addMessage(content, isUser = false, isGPT = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    let messageClass = 'bot-message';
    if (isUser) messageClass = 'user-message';
    else if (isGPT) messageClass = 'gpt-message';
    
    messageDiv.innerHTML = `<div class="${messageClass}">${content}</div>`;
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// 로딩 메시지 표시
function showLoadingMessage() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message';
    loadingDiv.id = 'loadingMessage';
    loadingDiv.innerHTML = `<div class="gpt-message"><div class="loading"></div> GPT가 생각 중입니다...</div>`;
    chatArea.appendChild(loadingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    return loadingDiv;
}

// 로딩 메시지 제거
function removeLoadingMessage() {
    const loadingMsg = document.getElementById('loadingMessage');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

// 메뉴 버튼 이벤트
function addMenuButtonListeners() {
    chatArea.addEventListener('click', function(event) {
        if (event.target.classList.contains('menu-btn')) {
            const action = event.target.getAttribute('data-action');
            handleMenuAction(action);
        }
        
        if (event.target.classList.contains('quiz-option')) {
            const selectedAnswer = event.target.textContent;
            const optionIndex = Array.from(event.target.parentNode.children).indexOf(event.target);
            checkAnswer(selectedAnswer, optionIndex);
        }
    });
}

// 메뉴 액션 처리
function handleMenuAction(action) {
    switch(action) {
        case 'quiz': startQuiz(); break;
        case 'wordlist': showWordList(); break;
        case 'random': showRandomWord(); break;
        case 'help': showHelp(); break;
        case 'score': showScore(); break;
        case 'nextquiz': startQuiz(); break;
    }
}

// 메시지 전송
async function handleSendMessage() {
    const prompt = userInput.value.trim();
    if (!prompt) return;
    
    // 버튼 비활성화
    sendBtn.disabled = true;
    sendBtn.textContent = '전송중...';
    
    // 사용자 메시지 UI에 출력
    addMessage(`나: ${prompt}`, true);
    userInput.value = '';
    
    await processMessage(prompt);
    
    // 버튼 활성화
    sendBtn.disabled = false;
    sendBtn.textContent = '전송';
}

// 키 입력 처리
function handleKeyPress(event) {
    if (event.key === 'Enter' && !sendBtn.disabled) {
        handleSendMessage();
    }
}

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!sendBtn.disabled) {
            handleSendMessage();
        }
    }
}

// 메시지 처리 - 학습 명령어 우선, 그 다음 GPT
async function processMessage(prompt) {
    const lower = prompt.toLowerCase();
    
    // 학습 관련 명령어 확인 (최우선)
    if (lower.includes('퀴즈')) {
        startQuiz();
    } else if (lower.includes('단어') && lower.includes('목록')) {
        showWordList();
    } else if (lower.includes('랜덤')) {
        showRandomWord();
    } else if (lower.includes('도움')) {
        showHelp();
    } else if (lower.includes('c언어')) {
        showLanguageWords('c');
    } else if (lower.includes('파이썬')) {
        showLanguageWords('python');
    } else if (lower.includes('점수')) {
        showScore();
    } else if (searchWord(prompt)) {
        // 단어 검색 성공
        return;
    } else {
        // 학습 관련이 아닌 경우 GPT API 사용
        if (apiKey) {
            const loadingMsg = showLoadingMessage();
            
            try {
                // 사용자 메시지를 대화 이력에 추가
                conversationHistory.push({ role: "user", content: prompt });
                
                // GPT 응답 받아오기
                const gptResponse = await fetchGPTResponse();
                
                removeLoadingMessage();
                addMessage(gptResponse, false, true);
                
                // GPT 응답도 대화 이력에 추가
                conversationHistory.push({ role: "assistant", content: gptResponse });
                
            } catch (error) {
                removeLoadingMessage();
                addMessage('죄송합니다. GPT 응답을 가져오는 중 오류가 발생했습니다.', false, true);
            }
        } else {
            // API 키가 없는 경우 기본 응답
            addMessage('GPT 기능을 사용하려면 .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요. 현재는 학습 기능만 사용 가능합니다. 📚');
        }
    }
}

// === 학습 기능들 ===

// 퀴즈 시작
function startQuiz() {
    const allWords = [...vocabularyData.c, ...vocabularyData.python];
    const word = allWords[Math.floor(Math.random() * allWords.length)];
    const options = generateQuizOptions(word);
    
    currentQuiz = { word: word, correctAnswer: word.meaning };

    let html = `
        <div class="word-card">
            <h3>📝 퀴즈!</h3>
            <p><strong>"${word.word}"</strong>의 뜻은?</p>
            <div class="quiz-options">
    `;

    options.forEach(option => {
        html += `<div class="quiz-option">${option}</div>`;
    });

    html += `</div></div>`;
    addMessage(html);
}

// 퀴즈 옵션 생성
function generateQuizOptions(correctWord) {
    const allWords = [...vocabularyData.c, ...vocabularyData.python];
    const options = [correctWord.meaning];
    
    while (options.length < 4) {
        const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
        if (!options.includes(randomWord.meaning)) {
            options.push(randomWord.meaning);
        }
    }
    
    return options.sort(() => Math.random() - 0.5);
}

// 답 확인
function checkAnswer(selectedAnswer, optionIndex) {
    totalQuestions++;
    const options = document.querySelectorAll('.quiz-option');
    
    if (selectedAnswer === currentQuiz.correctAnswer) {
        quizScore++;
        options[optionIndex].classList.add('correct');
        addMessage(`🎉 정답! "${currentQuiz.word.word}" = "${currentQuiz.word.meaning}"<br>📝 ${currentQuiz.word.example}<br>💡 ${currentQuiz.word.korean}<br>점수: ${quizScore}/${totalQuestions}`);
    } else {
        options[optionIndex].classList.add('incorrect');
        options.forEach(option => {
            if (option.textContent === currentQuiz.correctAnswer) {
                option.classList.add('correct');
            }
        });
        addMessage(`❌ 틀렸습니다. 정답: "${currentQuiz.correctAnswer}"<br>📝 ${currentQuiz.word.example}<br>💡 ${currentQuiz.word.korean}<br>점수: ${quizScore}/${totalQuestions}`);
    }

    setTimeout(() => {
        addMessage(`<div class="menu-buttons"><div class="menu-btn" data-action="nextquiz">🔄 다음 퀴즈</div><div class="menu-btn" data-action="score">📊 점수</div></div>`);
    }, 1000);
}

// 점수 표시
function showScore() {
    const percentage = totalQuestions > 0 ? Math.round((quizScore / totalQuestions) * 100) : 0;
    let message = `📊 점수: ${quizScore}/${totalQuestions} (${percentage}%)`;
    
    if (percentage >= 80) message += "<br>🌟 훌륭합니다!";
    else if (percentage >= 60) message += "<br>👍 잘하고 있어요!";
    else if (totalQuestions > 0) message += "<br>💪 더 연습해보세요!";
    else message = "📊 퀴즈를 풀어보세요!";
    
    addMessage(message);
}

// 단어 목록
function showWordList() {
    let message = "<h3>📖 단어 목록</h3><br><strong>🔵 C언어:</strong><br>";
    vocabularyData.c.forEach(word => {
        message += `• ${word.word} - ${word.meaning}<br>`;
    });
    
    message += "<br><strong>🐍 Python:</strong><br>";
    vocabularyData.python.forEach(word => {
        message += `• ${word.word} - ${word.meaning}<br>`;
    });}