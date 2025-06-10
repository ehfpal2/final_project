// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('함수 영어단어 학습 챗봇이 시작됩니다!');
    
    // DOM 요소 가져오기 - null 체크 추가
    const chatArea = document.getElementById('chatArea');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.querySelector('.send-btn');
    
    // 요소가 존재하지 않으면 에러 메시지 출력
    if (!chatArea || !userInput || !sendBtn) {
        console.error('필요한 DOM 요소를 찾을 수 없습니다:', {
            chatArea: !!chatArea,
            userInput: !!userInput,
            sendBtn: !!sendBtn
        });
        return;
    }

    // 함수 관련 영어 단어 데이터
    const vocabularyData = {
        c: [
            { 
                word: "function", 
                meaning: "함수", 
                example: "int main() { return 0; }", 
                korean: "특정 작업을 수행하는 코드 블록" 
            },
            { 
                word: "parameter", 
                meaning: "매개변수", 
                example: "void func(int parameter)", 
                korean: "함수에 전달되는 값" 
            },
            { 
                word: "argument", 
                meaning: "인수", 
                example: "func(5); // 5 is argument", 
                korean: "함수 호출 시 전달하는 실제 값" 
            },
            { 
                word: "return", 
                meaning: "반환", 
                example: "return value;", 
                korean: "함수에서 값을 돌려주는 것" 
            },
            { 
                word: "void", 
                meaning: "공허한", 
                example: "void function()", 
                korean: "반환값이 없는 함수 타입" 
            },
            { 
                word: "declare", 
                meaning: "선언하다", 
                example: "int func();", 
                korean: "함수의 존재를 알리는 것" 
            },
            { 
                word: "define", 
                meaning: "정의하다", 
                example: "int func() { return 1; }", 
                korean: "함수의 실제 내용을 작성하는 것" 
            },
            { 
                word: "prototype", 
                meaning: "원형", 
                example: "int add(int, int);", 
                korean: "함수의 선언부" 
            },
            { 
                word: "invoke", 
                meaning: "호출하다", 
                example: "func();", 
                korean: "함수를 실행시키는 것" 
            },
            { 
                word: "scope", 
                meaning: "범위", 
                example: "local/global scope", 
                korean: "변수나 함수가 유효한 영역" 
            }
        ],
        python: [
            { 
                word: "def", 
                meaning: "정의", 
                example: "def function():", 
                korean: "파이썬에서 함수를 정의하는 키워드" 
            },
            { 
                word: "lambda", 
                meaning: "람다", 
                example: "lambda x: x*2", 
                korean: "익명 함수를 만드는 키워드" 
            },
            { 
                word: "yield", 
                meaning: "생성하다", 
                example: "yield value", 
                korean: "제너레이터에서 값을 반환" 
            },
            { 
                word: "decorator", 
                meaning: "장식자", 
                example: "@decorator", 
                korean: "함수를 수정하는 함수" 
            },
            { 
                word: "closure", 
                meaning: "클로저", 
                example: "nested function", 
                korean: "내부 함수가 외부 변수를 참조" 
            },
            { 
                word: "generator", 
                meaning: "생성기", 
                example: "def gen(): yield 1", 
                korean: "값을 하나씩 생성하는 함수" 
            },
            { 
                word: "recursion", 
                meaning: "재귀", 
                example: "func calls itself", 
                korean: "함수가 자기 자신을 호출" 
            },
            { 
                word: "docstring", 
                meaning: "문서 문자열", 
                example: '"""documentation"""', 
                korean: "함수 설명을 위한 문자열" 
            },
            { 
                word: "kwargs", 
                meaning: "키워드 인수", 
                example: "**kwargs", 
                korean: "키워드 형태의 가변 인수" 
            },
            { 
                word: "args", 
                meaning: "인수들", 
                example: "*args", 
                korean: "위치 기반의 가변 인수" 
            }
        ]
    };

    // 전역 변수
    let currentQuiz = null;
    let quizScore = 0;
    let totalQuestions = 0;

    // 메시지 추가 함수
    function addMessage(content, isUser = false) {
        try {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.innerHTML = `<div class="${isUser ? 'user-message' : 'bot-message'}">${content}</div>`;
            chatArea.appendChild(messageDiv);
            chatArea.scrollTop = chatArea.scrollHeight;
        } catch (error) {
            console.error('메시지 추가 중 에러:', error);
        }
    }

    // 메시지 처리 함수
    async function processMessage(prompt) {
        try {
            const lowerPrompt = prompt.toLowerCase();
            
            if (lowerPrompt.includes('퀴즈') || lowerPrompt.includes('quiz')) {
                startQuiz();
            } else if (lowerPrompt.includes('단어') && lowerPrompt.includes('목록')) {
                showWordList();
            } else if (lowerPrompt.includes('랜덤') || lowerPrompt.includes('random')) {
                randomWord();
            } else if (lowerPrompt.includes('도움') || lowerPrompt.includes('help')) {
                showHelp();
            } else if (lowerPrompt.includes('c언어') || lowerPrompt.includes('c language')) {
                showLanguageWords('c');
            } else if (lowerPrompt.includes('파이썬') || lowerPrompt.includes('python')) {
                showLanguageWords('python');
            } else if (lowerPrompt.includes('점수')) {
                showScore();
            } else {
                // 단어 검색 먼저 시도
                const searchResult = searchWord(prompt);
                if (!searchResult) {
                    // 검색 결과가 없으면 기본 응답
                    const reply = getBotResponse(prompt);
                    addMessage(`봇: ${reply}`);
                }
            }
        } catch (error) {
            console.error('메시지 처리 중 에러:', error);
            addMessage('죄송합니다. 처리 중 오류가 발생했습니다.');
        }
    }

    // 기본 봇 응답 함수
    function getBotResponse(prompt) {
        const responses = [
            "함수 관련 영어 단어를 학습하고 싶으시면 '퀴즈'나 '단어 목록'을 입력해보세요!",
            "C언어나 Python 함수에 대해 궁금한 단어가 있으시면 직접 검색해보세요.",
            "'도움말'을 입력하시면 사용법을 확인할 수 있습니다.",
            "랜덤 단어를 보고 싶으시면 '랜덤'을 입력해주세요!",
            "특정 언어의 단어만 보고 싶으시면 'c언어' 또는 '파이썬'을 입력해보세요."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // 퀴즈 시작 함수
    function startQuiz() {
        try {
            const allWords = [...vocabularyData.c, ...vocabularyData.python];
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            const options = generateQuizOptions(randomWord);
            
            currentQuiz = {
                word: randomWord,
                correctAnswer: randomWord.meaning
            };

            let quizHTML = `
                <div class="word-card">
                    <h3>📝 퀴즈 타임!</h3>
                    <p><strong>"${randomWord.word}"</strong>의 뜻은 무엇일까요?</p>
                    <div class="quiz-options">
            `;

            options.forEach((option, index) => {
                quizHTML += `<div class="quiz-option" onclick="checkAnswer('${option}', ${index})">${option}</div>`;
            });

            quizHTML += `</div></div>`;
            
            addMessage(quizHTML);
        } catch (error) {
            console.error('퀴즈 시작 중 에러:', error);
            addMessage('퀴즈를 시작하는 중 오류가 발생했습니다.');
        }
    }

    // 퀴즈 선택지 생성 함수
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

    // 답변 확인 함수 - 전역 함수로 만들기
    window.checkAnswer = function(selectedAnswer, optionIndex) {
        try {
            totalQuestions++;
            const options = document.querySelectorAll('.quiz-option');
            
            if (selectedAnswer === currentQuiz.correctAnswer) {
                quizScore++;
                options[optionIndex].classList.add('correct');
                addMessage(`🎉 정답입니다! "${currentQuiz.word.word}"은 "${currentQuiz.word.meaning}"이라는 뜻입니다.<br><br>📝 예제: <code>${currentQuiz.word.example}</code><br>💡 설명: ${currentQuiz.word.korean}<br><br>현재 점수: ${quizScore}/${totalQuestions}`);
            } else {
                options[optionIndex].classList.add('incorrect');
                options.forEach((option, idx) => {
                    if (option.textContent === currentQuiz.correctAnswer) {
                        option.classList.add('correct');
                    }
                });
                addMessage(`❌ 틀렸습니다. 정답은 "${currentQuiz.correctAnswer}"입니다.<br><br>📝 예제: <code>${currentQuiz.word.example}</code><br>💡 설명: ${currentQuiz.word.korean}<br><br>현재 점수: ${quizScore}/${totalQuestions}`);
            }

            setTimeout(() => {
                addMessage(`<div class="menu-buttons"><div class="menu-btn" onclick="startQuiz()">🔄 다음 퀴즈</div><div class="menu-btn" onclick="showScore()">📊 점수 확인</div></div>`);
            }, 1000);
        } catch (error) {
            console.error('답변 확인 중 에러:', error);
        }
    };

    // 전역 함수들 정의
    window.startQuiz = startQuiz;
    window.showScore = function() {
        const percentage = totalQuestions > 0 ? Math.round((quizScore / totalQuestions) * 100) : 0;
        let message = `📊 <strong>현재 점수</strong><br>정답: ${quizScore}/${totalQuestions} (${percentage}%)`;
        
        if (percentage >= 80) {
            message += "<br>🌟 훌륭합니다!";
        } else if (percentage >= 60) {
            message += "<br>👍 잘하고 있어요!";
        } else if (totalQuestions > 0) {
            message += "<br>💪 더 연습해보세요!";
        } else {
            message = "📊 아직 퀴즈를 시작하지 않았습니다.<br>퀴즈를 풀어보세요!";
        }
        
        addMessage(message);
    };

    window.showWordList = function() {
        let message = "<h3>📖 함수 관련 영어 단어 목록</h3><br>";
        message += "<strong>🔵 C언어 함수 관련 단어:</strong><br>";
        vocabularyData.c.forEach(word => {
            message += `• <strong>${word.word}</strong> - ${word.meaning}<br>`;
        });
        
        message += "<br><strong>🐍 Python 함수 관련 단어:</strong><br>";
        vocabularyData.python.forEach(word => {
            message += `• <strong>${word.word}</strong> - ${word.meaning}<br>`;
        });
        
        addMessage(message);
    };

    window.randomWord = function() {
        const allWords = [...vocabularyData.c, ...vocabularyData.python];
        const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
        
        const wordHTML = `
            <div class="word-card">
                <h3>🎲 오늘의 단어</h3>
                <p><strong>${randomWord.word}</strong> - ${randomWord.meaning}</p>
                <p>💡 ${randomWord.korean}</p>
                <p>📝 예제: <code>${randomWord.example}</code></p>
            </div>
        `;
        
        addMessage(wordHTML);
    };

    window.showHelp = function() {
        const helpMessage = `
            <h3>❓ 도움말</h3><br>
            <strong>🎯 사용 방법:</strong><br>
            • <strong>퀴즈</strong>: "퀴즈" 또는 "quiz" 입력<br>
            • <strong>단어 목록</strong>: "단어 목록" 입력<br>
            • <strong>랜덤 단어</strong>: "랜덤" 입력<br>
            • <strong>C언어 단어</strong>: "c언어" 입력<br>
            • <strong>Python 단어</strong>: "파이썬" 입력<br>
            • <strong>점수 확인</strong>: "점수" 입력<br>
            • <strong>단어 검색</strong>: 단어를 직접 입력<br><br>
            
            <strong>📚 학습 팁:</strong><br>
            • 퀴즈를 통해 암기력을 향상시키세요<br>
            • 예제 코드를 직접 실습해보세요<br>
            • 모르는 단어는 검색 기능을 활용하세요<br><br>
            
            즐거운 학습 되세요! 🎉
        `;
        
        addMessage(helpMessage);
    };

    // 언어별 단어 표시 함수
    function showLanguageWords(language) {
        const words = vocabularyData[language];
        const langName = language === 'c' ? 'C언어' : 'Python';
        
        let message = `<h3>${langName} 함수 관련 영어 단어</h3><br>`;
        words.forEach(word => {
            message += `<div class="word-card">
                <h3>${word.word} - ${word.meaning}</h3>
                <p>💡 ${word.korean}</p>
                <p>📝 예제: <code>${word.example}</code></p>
            </div>`;
        });
        
        addMessage(message);
    }

    // 단어 검색 함수
    function searchWord(searchTerm) {
        const allWords = [...vocabularyData.c, ...vocabularyData.python];
        const found = allWords.find(word => 
            word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
            word.meaning.includes(searchTerm) ||
            word.korean.includes(searchTerm)
        );
        
        if (found) {
            const wordHTML = `
                <div class="word-card">
                    <h3>🔍 검색 결과</h3>
                    <p><strong>${found.word}</strong> - ${found.meaning}</p>
                    <p>💡 ${found.korean}</p>
                    <p>📝 예제: <code>${found.example}</code></p>
                </div>
            `;
            addMessage(wordHTML);
            return true;
        } else {
            addMessage(`"${searchTerm}"에 대한 단어를 찾을 수 없습니다. 😅<br>다른 단어를 검색해보시거나 아래 버튼을 이용해보세요!<br><br><div class="menu-buttons"><div class="menu-btn" onclick="showWordList()">📖 전체 단어보기</div><div class="menu-btn" onclick="randomWord()">🎲 랜덤 단어</div></div>`);
            return false;
        }
    }

    // 메시지 전송 함수
    async function sendMessage() {
        try {
            const prompt = userInput.value.trim();
            if (!prompt) return;
            
            // 사용자 메시지 표시
            addMessage(`나: ${prompt}`, true);
            userInput.value = '';
            
            // 봇 응답 처리
            await processMessage(prompt);
        } catch (error) {
            console.error('메시지 전송 중 에러:', error);
            addMessage('메시지 전송 중 오류가 발생했습니다.');
        }
    }

    // 엔터키 처리 함수
    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    }

    // 이벤트 리스너 등록
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', handleKeyPress);
    
    console.log('챗봇 초기화 완료!');
});