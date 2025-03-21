// Global Variables
let questions = [];
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
let selectedCategories = ["All"];
const importantCategories = [
  "Book Questions",
  "2021 Mid Term Exam",
  "2022 Mid Term Exam",
  "2023 Mid Term Exam",
];

// DOM Elements
const questionLabel = document.getElementById("question-label");
const optionsContainer = document.getElementById("options-container");
const feedbackLabel = document.getElementById("feedback-label");
const nextButton = document.getElementById("next-button");
const reviewButton = document.getElementById("review-button");
const correctLabel = document.getElementById("correct-label");
const wrongLabel = document.getElementById("wrong-label");
const examModeButton = document.getElementById("exam-mode-button");
const examInfoButton = document.getElementById("exam-info-button");
const exitExamModeButton = document.getElementById("exit-exam-mode-button");
const questionCounter = document.getElementById("question-counter");
const timerLabel = document.getElementById("timer-label");
const filterButton = document.getElementById("filter-button");
const filterPopup = document.getElementById("filter-popup");
const filterOptionsContainer = document.getElementById("filter-options");

// Style Updates
correctLabel.style.color = "green";
wrongLabel.style.color = "red";

function renderSnippet() {
  const snippetContainer = document.getElementById("snippet-container");
  snippetContainer.innerHTML = "";

  if (currentQuestion.snippet) {
    const snippetElement = document.createElement("div");
    snippetElement.style.border = "1px solid #ccc";
    snippetElement.style.backgroundColor = "#f9f9f9";
    snippetElement.style.padding = "10px";
    snippetElement.style.marginTop = "15px";
    snippetElement.style.borderRadius = "5px";
    snippetElement.style.textAlign = "left";

    if (currentQuestion.renderSnippet) {
      snippetElement.innerHTML = currentQuestion.snippet;
    } else {
      snippetElement.innerText = currentQuestion.snippet;
      snippetElement.style.fontFamily = "monospace";
      snippetElement.style.whiteSpace = "pre-wrap";
    }

    snippetContainer.appendChild(snippetElement);
  }
}

// Function to Load Questions
async function loadQuestions() {
  try {
    const response = await fetch("questions_informationsecurity.json");
    questions = await response.json();
  } catch (error) {
    console.error("Error loading questions:", error);
  }
}

async function openFilterPopup() {
  filterOptionsContainer.innerHTML = ""; // Clear existing options
  filterPopup.style.display = "flex"; // Show popup
  document.body.classList.add("popup-active"); // Add class to darken background

  if (!questions.length) await loadQuestions();

  // Text alert element
  let textAlert = document.getElementById("filter-text-alert");
  if (!textAlert) {
    textAlert = document.createElement("div");
    textAlert.id = "filter-text-alert";
    textAlert.className = "text-alert";
    const popupContent = filterPopup.querySelector(".popup"); // Target the `.popup` container
    popupContent.insertBefore(textAlert, filterOptionsContainer); // Insert above filter options
  }

  // Initialize text alert based on the state of "All" checkbox
  const allCheckbox = document.getElementById("filter-all");
  if (selectedCategories.includes("All")) {
    textAlert.innerText = "Uncheck 'All' to select specific categories.";
  } else {
    textAlert.innerText = ""; // Clear any previous message
  }

  const categories = new Set();
  questions.forEach((question) => {
    if (question.categories && Array.isArray(question.categories)) {
      question.categories.forEach((category) => categories.add(category));
    }
  });

  // Convert to array, sort alphabetically, and ensure "All" is on top
  const sortedCategories = Array.from(categories).sort();
  sortedCategories.unshift("All");

  sortedCategories.forEach((category) => {
    const categoryOption = document.createElement("div");
    categoryOption.className = "filter-option"; // Add a consistent class for styling

    categoryOption.innerHTML = `
            <label>
                <input type="checkbox" class="filter-category" value="${category}">
                <span>${category}</span>
            </label>
        `;

    const categoryCheckbox = categoryOption.querySelector("input");

    if (category === "All") {
      categoryCheckbox.id = "filter-all";
      categoryCheckbox.checked = selectedCategories.includes("All");
      categoryCheckbox.addEventListener("change", () => {
        if (categoryCheckbox.checked) {
          selectedCategories = ["All"];
          textAlert.innerText = "Uncheck 'All' to select specific categories.";
        } else {
          selectedCategories = [];
          textAlert.innerText = "";
        }
        updateCheckboxStates();
      });
    } else {
      categoryCheckbox.checked = selectedCategories.includes(category);
      categoryCheckbox.disabled = selectedCategories.includes("All");
      categoryCheckbox.addEventListener("change", (event) => {
        const isChecked = event.target.checked;
        if (isChecked) {
          selectedCategories.push(category);
        } else {
          selectedCategories = selectedCategories.filter((c) => c !== category);
        }
      });
    }

    filterOptionsContainer.appendChild(categoryOption);
  });

  // Function to update the disabled state of category checkboxes
  function updateCheckboxStates() {
    const categoryCheckboxes =
      filterOptionsContainer.querySelectorAll(".filter-category");
    const allCheckbox = document.getElementById("filter-all");
    categoryCheckboxes.forEach((checkbox) => {
      if (checkbox.value !== "All") {
        checkbox.disabled = allCheckbox.checked;
      }
    });
  }

  // Call updateCheckboxStates to ensure the initial state is correct
  updateCheckboxStates();
}

function closeFilterPopup() {
  filterPopup.style.display = "none";
  document.body.classList.remove("popup-active"); // Remove overlay
}

// Toggle All Option
function toggleAllOption() {
  const isAllSelected = document.getElementById("filter-all").checked;
  document.querySelectorAll(".filter-category").forEach((checkbox) => {
    checkbox.checked = false;
    checkbox.disabled = isAllSelected;
  });
  selectedCategories = isAllSelected ? ["All"] : [];
}

// Toggle Category Option
function toggleCategoryOption(event) {
  const allCheckbox = document.getElementById("filter-all");
  if (allCheckbox.checked) {
    allCheckbox.checked = false;
    selectedCategories = [];
  }

  const category = event.target.value;
  if (event.target.checked) {
    selectedCategories.push(category);
  } else {
    selectedCategories = selectedCategories.filter((cat) => cat !== category);
  }

  if (selectedCategories.length === 0) {
    allCheckbox.checked = true;
    selectedCategories = ["All"];
  }
}

function applyFilter() {
  if (isExamMode) return;

  if (!questions.length) {
    console.error("Questions not loaded. Please reload the page.");
    return;
  }

  if (selectedCategories.includes("All")) {
    selectedCategories = ["All"]; // Reset to show all questions
  }

  askedQuestionIndices = [];
  closeFilterPopup();
  loadNewQuestion();
}

// Only open filter popup if not in exam mode
filterButton.addEventListener("click", () => {
  if (!isExamMode) {
    openFilterPopup();
  }
});

// Check if a Question is Important
function isImportantQuestion(question) {
  return question.categories.some((category) =>
    importantCategories.includes(category)
  );
}

function loadNewQuestion() {
  if (isExamMode) return;

  nextButton.disabled = true;
  feedbackLabel.innerText = "";

  let filteredQuestions = questions;

  // Filter based on selected categories
  if (!selectedCategories.includes("All")) {
    filteredQuestions = questions.filter(
      (question) =>
        question.categories &&
        selectedCategories.every((category) =>
          question.categories.includes(category)
        ) // Ensure all selected categories are matched
    );
  }

  if (filteredQuestions.length === 0) {
    questionLabel.innerText =
      "No questions available for the selected categories.";
    optionsContainer.innerHTML = "";
    return;
  }

  // Prevent duplicate questions
  if (askedQuestionIndices.length >= filteredQuestions.length) {
    askedQuestionIndices = [];
  }

  let questionIndex;
  do {
    questionIndex = Math.floor(Math.random() * filteredQuestions.length);
  } while (askedQuestionIndices.includes(questionIndex));

  askedQuestionIndices.push(questionIndex);
  currentQuestion = filteredQuestions[questionIndex];

  questionLabel.innerText = currentQuestion.question;
  optionsContainer.innerHTML = "";

  currentQuestion.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.innerText = `${String.fromCharCode(65 + index)}) ${option}`;
    button.className = "button";
    button.onclick = () => checkAnswer(option);
    optionsContainer.appendChild(button);
  });

  const importantMarker = document.getElementById("important-marker");
  if (isImportantQuestion(currentQuestion)) {
    importantMarker.style.display = "inline-block";
  } else {
    importantMarker.style.display = "none";
  }

  renderSnippet();
}

function checkAnswer(selectedOption) {
  if (isExamMode) return;

  currentQuestion.userAnswer = selectedOption;

  if (selectedOption === currentQuestion.answer) {
    correctScore++;
    correctLabel.innerText = `Correct: ${correctScore}`;
    feedbackLabel.innerText = "Correct! Well done.";
    feedbackLabel.style.color = "#28a745"; // Green for correct
    feedbackLabel.style.fontWeight = "bold";
  } else {
    wrongScore++;
    wrongLabel.innerText = `Incorrect: ${wrongScore}`;
    feedbackLabel.innerText = `Wrong! The correct answer was: ${currentQuestion.answer}`;
    feedbackLabel.style.color = "#dc3545"; // Red for incorrect
    feedbackLabel.style.fontWeight = "bold";

    // Add the wrong question to the review list
    if (!wrongQuestions.some((q) => q.question === currentQuestion.question)) {
      wrongQuestions.push({ ...currentQuestion, userAnswer: selectedOption });
    }
  }

  // Disable all buttons and apply appropriate styles
  Array.from(optionsContainer.children).forEach((button) => {
    const optionText = button.innerText.split(") ")[1]; // Extract the actual text (after "A)", "B)", etc.)

    button.onclick = null; // Disable the button
    if (optionText === currentQuestion.answer) {
      button.style.backgroundColor = "#28a745"; // Green for correct answer
      button.style.color = "white";
    } else if (optionText === selectedOption) {
      button.style.backgroundColor = "#dc3545"; // Red for incorrect selected option
      button.style.color = "white";
    } else {
      button.style.backgroundColor = "#e0e0e0"; // Grey out other options
      button.style.color = "#6c757d";
    }
  });

  nextButton.disabled = false; // Enable the next button
}

// Show Wrong Questions for Review
function showWrongQuestions() {
  const reviewPopup = document.getElementById("review-popup");
  const wrongQuestionsList = document.getElementById("wrong-questions-list");

  wrongQuestionsList.innerHTML = "";

  if (wrongQuestions.length === 0) {
    wrongQuestionsList.innerHTML = "<p>No wrong questions to review.</p>";
  } else {
    const questionList = wrongQuestions
      .map((q, index) => {
        const isCorrect = q.userAnswer === q.answer;
        return `<li><strong>Question ${index + 1}:</strong> ${
          q.question
        }<br><strong>Your Answer:</strong> ${q.userAnswer} ${
          isCorrect ? "✅" : "❌"
        }<br>${
          !isCorrect ? `<strong>Correct Answer:</strong> ${q.answer}` : ""
        }</li><br>`;
      })
      .join("");

    wrongQuestionsList.innerHTML = `<ul>${questionList}</ul>`;
  }

  reviewPopup.style.display = "flex";
}

// Close Review Popup
function closeReviewPopup() {
  const reviewPopup = document.getElementById("review-popup");
  reviewPopup.style.display = "none";
}

nextButton.addEventListener("click", async () => {
  if (isExamMode) return;
  loadNewQuestion(questions);
});

examModeButton.addEventListener("click", startExamMode);
examInfoButton.addEventListener("click", showExamInfo);
exitExamModeButton.addEventListener("click", exitExamMode);

async function startExamMode() {
  if (!questions.length) {
    console.error("Questions not loaded. Please reload the page.");
    return;
  }
  isExamMode = true;
  examQuestions = getRandomQuestions(questions, 30);
  examCurrentQuestionIndex = 0;
  examUserAnswers = [];
  examTimeLeft = 3600;
  examEnded = false;

  document.getElementById("default-score-frame").style.display = "none";
  document.getElementById("default-buttons").style.display = "none";
  document.getElementById("exam-score-frame").style.display = "flex";
  document.getElementById("exam-buttons").style.display = "block";
  document.getElementById("exam-mode-button").style.display = "none";
  document.getElementById("exam-info-button").style.display = "none";
  document.getElementById("exam-mode-label").style.display = "block";

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

  timerLabel.innerText = `Time Left: ${hours}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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

  currentExamQuestion.options.forEach((option) => {
    const button = document.createElement("button");
    button.innerText = option;
    button.className = "button";
    button.onclick = () => selectExamAnswer(option);
    optionsContainer.appendChild(button);
  });

  questionCounter.innerText = `Question ${examCurrentQuestionIndex + 1}/${
    examQuestions.length
  }`;

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
    correctAnswer: currentExamQuestion.answer,
  });

  Array.from(optionsContainer.children).forEach((button) => {
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
    if (
      examUserAnswers[i].selectedAnswer === examUserAnswers[i].correctAnswer
    ) {
      correctAnswers++;
    }
  }

  questionLabel.innerText = `You scored ${correctAnswers}/${totalQuestions} (${(
    (correctAnswers / totalQuestions) *
    100
  ).toFixed(2)}%)`;
  optionsContainer.innerHTML = "";

  const reviewBtn = document.createElement("button");
  reviewBtn.innerText = "Review Your Answers";
  reviewBtn.className = "button";
  reviewBtn.onclick = showExamReview;
  optionsContainer.appendChild(reviewBtn);

  document.getElementById("exam-score-frame").style.display = "none";

  feedbackLabel.innerText = "";
}

function showExamReview() {
  const popupContainer = document.createElement("div");
  popupContainer.className = "popup-container";

  let reviewContent = '<div class="popup"><h2>Your Answers</h2><ul>';

  for (let i = 0; i < examUserAnswers.length; i++) {
    const qa = examUserAnswers[i];
    const isCorrect = qa.selectedAnswer === qa.correctAnswer;
    reviewContent += `<li>
            <strong>Question ${i + 1}:</strong> ${qa.question}<br>
            <strong>Your Answer:</strong> ${qa.selectedAnswer} ${
      isCorrect ? "✅" : "❌"
    }<br>
            ${
              !isCorrect
                ? `<strong>Correct Answer:</strong> ${qa.correctAnswer}`
                : ""
            }
        </li><br>`;
  }

  reviewContent += '</ul><button onclick="closePopup()">Close</button></div>';
  popupContainer.innerHTML = reviewContent;
  document.body.appendChild(popupContainer);
}

function exitExamMode() {
  if (
    confirm(
      "Are you sure you want to exit exam mode? Your progress will be lost."
    )
  ) {
    clearInterval(examTimer);

    isExamMode = false;
    examQuestions = [];
    examCurrentQuestionIndex = 0;
    examUserAnswers = [];
    examTimeLeft = 0;

    document.getElementById("exam-score-frame").style.display = "none";
    document.getElementById("exam-buttons").style.display = "none";

    document.getElementById("default-score-frame").style.display = "flex";
    document.getElementById("default-buttons").style.display = "block";

    document.getElementById("exam-mode-button").style.display = "block";
    document.getElementById("exam-info-button").style.display = "block";

    document.getElementById("exam-mode-label").style.display = "none";

    questionLabel.innerText = "";
    optionsContainer.innerHTML = "";
    feedbackLabel.innerText = "";

    nextButton.disabled = true;
    const questions = loadQuestions();
    questions.then((qs) => loadNewQuestion(qs));
  }
}

function showExamInfo() {
  const popupContainer = document.createElement("div");
  popupContainer.className = "popup-container";

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

// Event Listeners
window.onload = async () => {
  await loadQuestions();
  loadNewQuestion();
};

filterButton.addEventListener("click", openFilterPopup);
reviewButton.addEventListener("click", showWrongQuestions);
