/* Updated script.js to read from a local JSON file and improve UI */

let correctScore = 0;
let wrongScore = 0;
let askedQuestions = [];
let wrongQuestions = [];
let currentQuestion = {};

const questionLabel = document.getElementById('question-label');
const optionsContainer = document.getElementById('options-container');
const feedbackLabel = document.getElementById('feedback-label');
const nextButton = document.getElementById('next-button');
const reviewButton = document.getElementById('review-button');
const correctLabel = document.getElementById('correct-label');
const wrongLabel = document.getElementById('wrong-label');

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
    nextButton.disabled = true;
    if (askedQuestions.length === questions.length) {
        askedQuestions = [];
    }

    while (true) {
        currentQuestion = questions[Math.floor(Math.random() * questions.length)];
        if (!askedQuestions.includes(currentQuestion)) {
            askedQuestions.push(currentQuestion);
            break;
        }
    }

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
    if (selectedOption === currentQuestion.answer) {
        correctScore++;
        correctLabel.innerText = `Correct: ${correctScore}`;
        feedbackLabel.innerText = "Correct! Well done.";
        feedbackLabel.style.color = "#28a745";
    } else {
        wrongScore++;
        wrongLabel.innerText = `Wrong: ${wrongScore}`;
        feedbackLabel.innerText = `Wrong! The correct answer was: ${currentQuestion.answer}`;
        feedbackLabel.style.color = "#dc3545";
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
    const questions = await loadQuestions();
    loadNewQuestion(questions);
});
reviewButton.addEventListener('click', showWrongQuestions);

window.onload = async () => {
    const questions = await loadQuestions();
    loadNewQuestion(questions);
};

/* Add styles for the popup */
const style = document.createElement('style');
style.innerText = `
.popup-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}
.popup {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    text-align: center;
}
.popup h2 {
    margin-top: 0;
}
.popup ul {
    text-align: left;
    margin: 10px 0;
}
.popup button {
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}
.popup button:hover {
    background: #0056b3;
}
`;
document.head.appendChild(style);
