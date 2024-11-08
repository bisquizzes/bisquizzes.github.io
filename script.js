let correctScore = 0;
let wrongScore = 0;
let askedQuestions = [];
let wrongQuestions = [];
let currentQuestion = {};
let askedQuestionIndices = [];

let isExamMode = false;
let examQuestions = [];
let examCurrentQuestionIndex = 0;
let examUserAnswers = [];
let examTimer;
let examTimeLeft = 3600;
let examEnded = false;

const questionLabel = document.getElementById('question-label');
const optionsContainer = document.getElementById('options-container');
const feedbackLabel = document.getElementById('feedback-label');
const nextButton = document.getElementById('next-button');
const reviewButton = document.getElementById('review-button');
const correctLabel = document.getElementById('correct-label');
const wrongLabel = document.getElementById('wrong-label');
const examModeButton = document.getElementById('exam-mode-button');
const examInfoButton = document.getElementById('exam-info-button');
const exitExamModeButton = document.getElementById('exit-exam-mode-button');
const questionCounter = document.getElementById('question-counter');
const timerLabel = document.getElementById('timer-label');

correctLabel.style.color = "green";
wrongLabel.style.color = "red";

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const questions = await response.json();
        return questions;
    } catch (error) {
        console.error('Error loading questions:', error);
        return [];
    }
}

function loadNewQuestion(questions) {
    if (isExamMode) return;

    nextButton.disabled = true;
    if (askedQuestionIndices.length === questions.length) {
        askedQuestionIndices = [];
    }

    let questionIndex;
    while (true) {
        questionIndex = Math.floor(Math.random() * questions.length);
        if (!askedQuestionIndices.includes(questionIndex)) {
            askedQuestionIndices.push(questionIndex);
            break;
        }
    }

    currentQuestion = questions[questionIndex];

    questionLabel.innerText = currentQuestion.question;
    feedbackLabel.innerText = "";
    optionsContainer.innerHTML = "";
    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option;
        button.className = 'button';
        button.onclick = () => checkAnswer(option);
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedOption) {
    if (isExamMode) return;

    if (selectedOption === currentQuestion.answer) {
        correctScore++;
        correctLabel.innerText = `Correct: ${correctScore}`;
        feedbackLabel.innerText = "Correct! Well done.";
        feedbackLabel.style.color = "#28a745";
        feedbackLabel.style.fontWeight = "bold";
    } else {
        wrongScore++;
        wrongLabel.innerText = `Wrong: ${wrongScore}`;
        feedbackLabel.innerText = `Wrong! The correct answer was: ${currentQuestion.answer}`;
        feedbackLabel.style.color = "#dc3545";
        feedbackLabel.style.fontWeight = "bold";

        if (!wrongQuestions.includes(currentQuestion)) {
            wrongQuestions.push(currentQuestion);
        }

        Array.from(optionsContainer.children).forEach(button => {
            if (button.innerText === selectedOption) {
                button.style.backgroundColor = "#dc3545";
                button.style.color = "white";
            }
        });
    }

    Array.from(optionsContainer.children).forEach(button => {
        button.onclick = null;
        if (button.innerText === currentQuestion.answer) {
            button.style.backgroundColor = "#28a745";
            button.style.color = "white";
        }
    });
    nextButton.disabled = false;
}

function showWrongQuestions() {
    const popupContainer = document.createElement('div');
    popupContainer.className = 'popup-container';

    if (wrongQuestions.length === 0) {
        popupContainer.innerHTML = '<div class="popup"><p>No wrong questions to review.</p><button onclick="closePopup()">Close</button></div>';
    } else {
        const questionList = wrongQuestions.map(q => `<li>${q.question}</li>`).join('');
        popupContainer.innerHTML = `<div class="popup"><h2>Review Wrong Questions</h2><ul>${questionList}</ul><button onclick="closePopup()">Close</button></div>`;
    }

    document.body.appendChild(popupContainer);
}

function closePopup() {
    const popup = document.querySelector('.popup-container');
    if (popup) {
        popup.remove();
    }
}

nextButton.addEventListener('click', async () => {
    if (isExamMode) return;
    const questions = await loadQuestions();
    loadNewQuestion(questions);
});

reviewButton.addEventListener('click', showWrongQuestions);

examModeButton.addEventListener('click', startExamMode);
examInfoButton.addEventListener('click', showExamInfo);
exitExamModeButton.addEventListener('click', exitExamMode);

async function startExamMode() {
    isExamMode = true;
    examQuestions = [];
    examCurrentQuestionIndex = 0;
    examUserAnswers = [];
    examTimeLeft = 3600;

    document.getElementById('default-score-frame').style.display = 'none';
    document.getElementById('default-buttons').style.display = 'none';

    document.getElementById('exam-score-frame').style.display = 'flex';
    document.getElementById('exam-buttons').style.display = 'block';

    document.getElementById('exam-mode-button').style.display = 'none';
    document.getElementById('exam-info-button').style.display = 'none';

    document.getElementById('exam-mode-label').style.display = 'block';

    feedbackLabel.innerText = "";

    const allQuestions = await loadQuestions();
    examQuestions = getRandomQuestions(allQuestions, 30);

    startExamTimer();

    loadExamQuestion();
}

function getRandomQuestions(questions, num) {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

function startExamTimer() {
    updateTimerLabel();
    examTimer = setInterval(() => {
        examTimeLeft--;
        updateTimerLabel();

        if (examTimeLeft <= 0) {
            clearInterval(examTimer);
            submitExam();
        }
    }, 1000);
}

function updateTimerLabel() {
    const hours = Math.floor(examTimeLeft / 3600);
    const minutes = Math.floor((examTimeLeft % 3600) / 60);
    const seconds = examTimeLeft % 60;

    timerLabel.innerText = `Time Left: ${hours}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
}

function loadExamQuestion() {
    if (examEnded) {
        return;
    }

    if (examCurrentQuestionIndex >= examQuestions.length) {
        submitExam();
        return;
    }

    const currentExamQuestion = examQuestions[examCurrentQuestionIndex];
    questionLabel.innerText = currentExamQuestion.question;
    optionsContainer.innerHTML = "";

    currentExamQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option;
        button.className = 'button';
        button.onclick = () => selectExamAnswer(option);
        optionsContainer.appendChild(button);
    });

    questionCounter.innerText = `Question ${examCurrentQuestionIndex + 1}/${examQuestions.length}`;

    feedbackLabel.innerText = "";
}

function selectExamAnswer(selectedOption) {
    if (examEnded) {
        return;
    }

    const currentExamQuestion = examQuestions[examCurrentQuestionIndex];
    examUserAnswers.push({
        question: currentExamQuestion.question,
        selectedAnswer: selectedOption,
        correctAnswer: currentExamQuestion.answer
    });

    Array.from(optionsContainer.children).forEach(button => {
        button.onclick = null;
        if (button.innerText === selectedOption) {
            button.style.backgroundColor = "#007bff";
            button.style.color = "white";
        }
    });

    setTimeout(() => {
        examCurrentQuestionIndex++;
        loadExamQuestion();
    }, 500);
}

function submitExam() {
    clearInterval(examTimer);

    examEnded = true;

    let correctAnswers = 0;
    let totalQuestions = examQuestions.length;

    for (let i = 0; i < examUserAnswers.length; i++) {
        if (examUserAnswers[i].selectedAnswer === examUserAnswers[i].correctAnswer) {
            correctAnswers++;
        }
    }

    questionLabel.innerText = `You scored ${correctAnswers}/${totalQuestions} (${((correctAnswers / totalQuestions) * 100).toFixed(2)}%)`;
    optionsContainer.innerHTML = "";

    const reviewBtn = document.createElement('button');
    reviewBtn.innerText = 'Review Your Answers';
    reviewBtn.className = 'button';
    reviewBtn.onclick = showExamReview;
    optionsContainer.appendChild(reviewBtn);

    document.getElementById('exam-score-frame').style.display = 'none';

    feedbackLabel.innerText = "";
}

function showExamReview() {
    const popupContainer = document.createElement('div');
    popupContainer.className = 'popup-container';

    let reviewContent = '<div class="popup"><h2>Your Answers</h2><ul>';

    for (let i = 0; i < examUserAnswers.length; i++) {
        const qa = examUserAnswers[i];
        const isCorrect = qa.selectedAnswer === qa.correctAnswer;
        reviewContent += `<li>
            <strong>Question ${i + 1}:</strong> ${qa.question}<br>
            <strong>Your Answer:</strong> ${qa.selectedAnswer} ${isCorrect ? '✅' : '❌'}<br>
            ${!isCorrect ? `<strong>Correct Answer:</strong> ${qa.correctAnswer}` : ''}
        </li><br>`;
    }

    reviewContent += '</ul><button onclick="closePopup()">Close</button></div>';
    popupContainer.innerHTML = reviewContent;
    document.body.appendChild(popupContainer);
}

function exitExamMode() {
    if (confirm('Are you sure you want to exit exam mode? Your progress will be lost.')) {
        clearInterval(examTimer);

        isExamMode = false;
        examQuestions = [];
        examCurrentQuestionIndex = 0;
        examUserAnswers = [];
        examTimeLeft = 0;

        document.getElementById('exam-score-frame').style.display = 'none';
        document.getElementById('exam-buttons').style.display = 'none';

        document.getElementById('default-score-frame').style.display = 'flex';
        document.getElementById('default-buttons').style.display = 'block';

        document.getElementById('exam-mode-button').style.display = 'block';
        document.getElementById('exam-info-button').style.display = 'block';

        document.getElementById('exam-mode-label').style.display = 'none';

        questionLabel.innerText = '';
        optionsContainer.innerHTML = '';
        feedbackLabel.innerText = '';

        nextButton.disabled = true;
        const questions = loadQuestions();
        questions.then(qs => loadNewQuestion(qs));
    }
}

function showExamInfo() {
    const popupContainer = document.createElement('div');
    popupContainer.className = 'popup-container';

    popupContainer.innerHTML = `
        <div class="popup">
            <h2>Mid-Term Exam Mode</h2>
            <p>In Mid-Term Exam Mode, you will be given 30 random questions to solve within 1 hour.</p>
            <p>You won't receive immediate feedback after each question.</p>
            <p>At the end of the exam, you'll see your score and have the option to review the questions you got wrong.</p>
            <button onclick="closePopup()">Close</button>
        </div>
    `;

    document.body.appendChild(popupContainer);
}

window.onload = async () => {
    const questions = await loadQuestions();
    loadNewQuestion(questions);
};

/* Existing styles for the popup are already in styles.css */
