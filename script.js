const TRIVIA_API_URL = 'https://opentdb.com/api.php?amount=10&category=9&difficulty=medium&type=multiple';
const PANTRY_API_URL = 'https://pantry-proxy-api-mu.vercel.app/'


const quizBox = document.getElementById('quiz-box');
const questionNumber = document.getElementById('question-number');
const questionText = document.getElementById('question-text');
const timerDisplay = document.getElementById('time-left');
const choicesContainer = document.getElementById('choices-container');
const nextBtn = document.getElementById('next-btn');
const loader = document.getElementById('loader');
const highScoreContainer = document.getElementById('high-score-container');
const highScoreList = document.getElementById('high-scores-list');
const playAgainBtn = document.getElementById('play-again-btn');

let currentQuestion = 0;
let questions = [];
let totalScore = 0;
let timerInterval;
let startTime;
let highScores = [];
const totalTime = 10000;

//Fetch Questions
async function fetchQuestions() {
    try {
        const response = await fetch(TRIVIA_API_URL);
        const data = await response.json();
        questions = data.results;
        console.log(questions);
        loadQuestion();
    }

    catch(error) {
        console.error('Error Fetching questions', error)
        questionText.innerText = 'Failed to load questions. Please try again later'
    }
}
//Load each question to UI 
function loadQuestion(){
    if(currentQuestion >= questions.length) {
        endGame();
        return;
    }
    const question = questions[currentQuestion];
    questionText.innerText = decodeHTML(question.question);
    questionNumber.innerText = `Question ${currentQuestion + 1}`;

    //Reset 
    choicesContainer.innerText = '';
    nextBtn.disabled = true;

    //Prepare our choices
    const choices = [...question.incorrect_answers, question.correct_answer].sort(()=> Math.random() - 0.5);
    choices.forEach(choice => {
        choice = choice.trim();
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('choice');
        button.innerText = decodeHTML(choice);
        button.onclick = () => checkAnswer(choice, question.correct_answer.trim());
        choicesContainer.appendChild(button);
    })

    resetTimer();
    startTimer();

}

//Load Next Question
nextBtn.addEventListener('click', ()=> {
    currentQuestion++;
    console.log(currentQuestion)
    loadQuestion();
})

//Ensure special characters are decoded
function decodeHTML(html) {
    const txt = document.createElement('div');
    txt.innerHTML = html;
    return txt.textContent;
}

function startTimer() {
    startTime = Date.now();
    let timeLeft = totalTime;
    updateTimerDisplay(timeLeft);
}

//Reset timer to 10 seconds
function resetTimer(){
    clearInterval(timerInterval);
    updateTimerDisplay(totalTime);

    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        timeLeft = totalTime -elapsedTime;

        if(timeLeft <= 0){
            clearInterval(timerInterval);
            timeLeft = 0;
            updateTimerDisplay(timeLeft);
            disabledChoices();
            nextBtn.disabled = false;
            const correctAnswer = questions[currentQuestion].correct_answer;
            highlightCorrectAnswer(correctAnswer);
            
        }

        else {
            updateTimerDisplay(timeLeft);
        }
    }, 50)
}

// Update timer UI
function updateTimerDisplay(timeLeft) {
    const seconds = (timeLeft / 1000).toFixed(2);
    timerDisplay.textContent = seconds;
}

//Check if Answer us correct
function checkAnswer(selectedAnswer, correctAnswer) {
    clearInterval(timerInterval);
    disabledChoices();
    highlightCorrectAnswer(correctAnswer);
    

    
    if (selectedAnswer === correctAnswer){
        const elapsedTime = Date.now() - startTime;
        const timeLeft = totalTime -elapsedTime;
        const weightScore = Math.floor((timeLeft / totalTime) * 1000);
        totalScore += weightScore;
    }
        nextBtn.disabled = false;

}

//Disabled choices when time expires or choice selected 
function disabledChoices(){
    const choices = document.querySelectorAll('.choice');
    choices.forEach((choice) => {
        choice.disabled =true;
    })
}

//Highlight correct answer
function highlightCorrectAnswer(correctAnswer){
    const choices = document.querySelectorAll('.choice');
    console.log(choices);
    choices.forEach((choice) => {
        if (choice.innerText === decodeHTML(correctAnswer)){
            choice.classList.add("correct");
        } 
        else {
            choice.classList.add("wrong");
        } 
    });

}

//End Game when Finished All Questions
function endGame() {
    quizBox.style.display = 'none';
    saveHighScore();
}

//Save High Score
async function saveHighScore(){
    const name = prompt('Enter your name for the scoreboard');
    const date = new Date().toLocaleDateString();
    const newScore = {name, score: totalScore, date,};

    loader.style.display = 'block';
    console.log('New Score:', newScore);
    try {
        const response = await fetch(PANTRY_API_URL);
        if(response.ok) {
            const data = await response.json();
            highScores = data.highScores || [];

        }
    } catch(error) {
        console.log('Basket Not Found, Creating a New One.');
        highScores = [];
    }

    highScores.push(newScore);
    highScores.sort((a,b) => b.score - a.score);
    highScores = highScores.slice(0,10);

    try {
        await fetch(PANTRY_API_URL, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({highScores}),
        })
    }catch(error){
        console.error('Error Saving HighScore', error);
    }

    displayHighScores(newScore);

    function displayHighScores(newScore){
        highScoreList.innerText = '';
        highScores.forEach((score)=> {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            nameCell.innerText = score.name;
            const scoreCell = document.createElement('td');
            scoreCell.innerText = score.score;
            const dateCell = document.createElement('td');
            dateCell.innerText = score.date;

            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(dateCell);

            //Highlight High Score if it's top 10 
            if (score.name === newScore.name && score.score === newScore.score && score.date === newScore.date){
                row.classList.add('highlight');
            }

            highScoreList.appendChild(row);

        }); 

        loader.style.display = 'none';
        highScoreContainer.style.display = 'flex';
    }   
}   

//Reload page to start quiz over
playAgainBtn.addEventListener('click', ()=> {
    window.location.reload();
});
//Startup
fetchQuestions();
console.log(nextBtn)