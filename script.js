const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfQS9MLVUp1WHnZ47cFktiPB7QtUmVcVBjeE67NqyhXAca_Tw/formResponse";
const GOOGLE_ENTRY_ID = "entry.1044193202";
const IS_TEST_MODE = false; 

// משתנים גלובליים
let startButton, welcomeScreen, loginScreen, appMainContainer, chatWindow, userInput, sendButton, botStatus, largeAvatar, problemNote, problemNoteText;
let loginBtn, participantInput;
let isBotTyping = false;

let currentUserID = localStorage.getItem('mati_participant_id');
let studentName = ""; 
let studentGender = ""; // 'boy' או 'girl'

const matiExpressions = {
    welcoming: "Mati_welcoming.png",
    inviting: "Mati_inviting_action.png",
    confident: "Mati_confident.png",
    compliment: "Mati_compliment.png",
    thinking: "Mati_thinking.png",
    support: "Mati_support.png",
    frustration: "Mati_frustration.png",
    happy: "Mati_inviting_action.png"
};

function updateAvatar(expressionKey) {
    if (matiExpressions[expressionKey] && largeAvatar) {
        largeAvatar.src = `MatiCharacter/${matiExpressions[expressionKey]}`; 
    }
    if (botStatus) {
        botStatus.textContent = expressionKey === 'thinking' ? 'מתי חושבת...' : 'מתי ממתינה…';
    }
}

function displayMessage(text, sender, expression = 'neutral') {
    if (!chatWindow) return;
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender + '-message');
    if (sender === 'bot') { updateAvatar(expression); }
    messageElement.innerHTML = text; 
    chatWindow.appendChild(messageElement);
    setTimeout(() => { chatWindow.scrollTop = chatWindow.scrollHeight; }, 50);
}

function displayChoiceButtons(options) {
    const btnContainer = document.createElement('div');
    btnContainer.classList.add('choice-btn-container');
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.classList.add('choice-btn');
        btn.innerText = opt.label;
        btn.onclick = () => bot.handleGenderSelection(opt.value); 
        btnContainer.appendChild(btn);
    });
    
    chatWindow.appendChild(btnContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

class MathProblemGuidingBot {
    constructor() {
        this.problems = [];
        this.currentProblem = null;
        this.currentStep = 'intro'; 
        this.errorCount = 0; 
        
        // כאן השינוי הגדול: הטקסטים מותאמים מגדרית
        this.genderedTexts = {
            'q1_ask': {
                boy: "מעולה. בוא נתחיל.<br><strong>שאלה 1: מה אני צריך למצוא?</strong>",
                girl: "מעולה. בואי נתחיל.<br><strong>שאלה