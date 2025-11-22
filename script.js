console.log("Script loaded: Standard Version");

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfQS9MLVUp1WHnZ47cFktiPB7QtUmVcVBjeE67NqyhXAca_Tw/formResponse";
const GOOGLE_ENTRY_ID = "entry.1044193202";
const IS_TEST_MODE = false; 

let startButton, welcomeScreen, loginScreen, appMainContainer, chatWindow, userInput, sendButton, botStatus, largeAvatar, problemNote, problemNoteText;
let loginBtn, participantInput;
let isBotTyping = false;

let currentUserID = localStorage.getItem('mati_participant_id');
let studentName = ""; 
let studentGender = ""; 

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
        btn.onclick = () => window.bot.handleGenderSelection(opt.value); 
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
        
        this.genderedTexts = {
            'q1_ask': {
                boy: "מעולה. בוא נתחיל.<br><strong>שאלה 1: מה אני צריך למצוא?</strong>",
                girl: "מעולה. בואי נתחיל.<br><strong>שאלה 1: מה אני צריכה למצוא?</strong>",
                // לפי התמונה שלך:
                icon: 'magnifying_glass.png', 
                code: 'א',
                next: 'q1_answer'
            },
            'q2_ask': {
                boy: "יופי! עכשיו <strong>שאלה 2: מה אני יודע? (אילו נתונים יש לי?)</strong>",
                girl: "יופי! עכשיו <strong>שאלה 2: מה אני יודעת? (אילו נתונים יש לי?)</strong>",
                // לפי התמונה שלך:
                icon: 'list.png', 
                code: 'ב',
                next: 'q2_answer'
            },
            'q3_ask': {
                boy: "כמעט סיימנו לתרגם!<br><strong>שאלה 3: איזה מידע חסר לי כדי לפתור?</strong>",
                girl: "כמעט סיימנו לתרגם!<br><strong>שאלה 3: איזה מידע חסר לי כדי לפתור?</strong>",
                // לפי התמונה שלך:
                icon: 'Missing_puzzle.png', 
                code: 'ג',
                next: 'q3_answer'
            }
        };
    }

    sendToGoogle(actionType, inputContent, resultStatus) {
        if (IS_TEST_MODE) { return; }
        const timestamp = new Date().toLocaleTimeString('he-IL');
        const userInfo = `${currentUserID} (${studentName} - ${studentGender})`;
        const logData = `${timestamp} | User: ${userInfo} | Step: ${this.currentStep} | Input: "${inputContent}" | Status: ${resultStatus}`;
        const formData = new FormData();
        formData.append(GOOGLE_ENTRY_ID, logData);
        fetch(GOOGLE_FORM_URL, { method: "POST", mode: "no-cors", body: formData }).catch(console.error);
    }

    async loadProblemsFromFile() {
        try {
            const response = await fetch('questions_data.json');
            this.problems = await response.json();
            this.currentProblem = this.problems[0]; 
        } catch (error) { console.error(error); }
    }
    
    startConversationLogic() {
        if (!this.currentProblem) return;
        displayMessage("היי, אני מתי<br>יחד נפתור בעיות מילוליות<br>בשלושה שלבים.<br>אשמח לדעת, איך קוראים לך?", 'bot', 'welcoming');
        this.currentStep = 'wait_for_name'; 
        this.sendToGoogle('system', 'Chat Started', 'Waiting for name');
    }
    
    handleGenderSelection(gender) {
        studentGender = gender;
        this.sendToGoogle('intro', gender, 'gender_selected');
        document.querySelectorAll('.choice-btn-container').forEach(b => b.remove());
        displayMessage(`נעים להכיר, ${studentName}! (${gender === 'boy' ? 'בן' : 'בת'})`, 'user');
        setTimeout(() => {
            const welcomeText = gender === 'boy' ? "מצוין! בוא נתחיל." : "מצוינת! בואי נתחיל.";
            displayMessage(welcomeText, 'bot', 'happy');
            setTimeout(() => {
                chatWindow.innerHTML = ''; 
                problemNoteText.innerText = this.currentProblem.question;
                problemNote.classList.remove('hidden');
                this.currentStep = 'q1_ask';
                this._displayCurrentGuidingQuestion();
            }, 1500);
        }, 500);
    }

    handleUserReply(reply) {
        if (isBotTyping) return; 
        displayMessage(reply, 'user');
        userInput.value = '';
        if (this.currentStep === 'wait_for_name') {
            studentName = reply;
            this.sendToGoogle('intro', reply, 'name_received');
            displayMessage(`היי ${studentName}, כדי שאדע איך לפנות אליך:`, 'bot', 'inviting');
            displayChoiceButtons([
                { label: "אני בן 👦", value: "boy" },
                { label: "אני בת 👧", value: "girl" }
            ]);
            this.currentStep = 'wait_for_gender';
            return;
        }
        if (this.currentStep === 'wait_for_gender') {
            displayMessage("נא לבחור בכפתור למעלה 👆", 'bot', 'support');
            return;
        }
        const currentQuestionCode = this._getCurrentQuestionCode();
        if (currentQuestionCode) {
            this._processAnswer(currentQuestionCode, reply);
        } else if (this.currentStep === 'done') {
            displayMessage("סיימנו בהצלחה! כל הכבוד.", 'bot', 'confident');
            this.sendToGoogle('system', 'Problem Finished', 'Success');
        }
    }

    _displayCurrentGuidingQuestion() {
        this.errorCount = 0; 
        const stepData = this.genderedTexts[this.currentStep];
        if (!stepData) return;
        const textToShow = (studentGender === 'girl') ? stepData.girl : stepData.boy;
        const questionHtml = `<div class="guided-question"><img src="images/${stepData.icon}"><span>${textToShow}</span></div>`;
        displayMessage(questionHtml, 'bot', 'inviting');
        this.currentStep = stepData.next; 
    }
    
    _getCurrentQuestionCode() {
        if (this.currentStep === 'q1_answer') return 'א';
        if (this.currentStep === 'q2_answer') return 'ב';
        if (this.currentStep === 'q3_answer') return 'ג';
        return null;
    }

    _processAnswer(questionCode, reply) {
        const keywords = this.currentProblem.keywords[questionCode];
        const isCorrect = this._checkAnswer(reply, keywords);
        if (isCorrect) {
            this.sendToGoogle('answer', reply, 'correct');
            this.updateStars(questionCode, true);
            const feedback = this.generateFeedback(questionCode, 'positive');
            const genderedFeedback = (studentGender === 'girl') ? feedback.girl : feedback.boy;
            displayMessage(genderedFeedback, 'bot', 'compliment');
            let nextStep = (questionCode === 'א' ? 'q2_ask' : questionCode === 'ב' ? 'q3_ask' : 'done');
            setTimeout(() => {
                this.currentStep = nextStep;
                if (this.currentStep !== 'done') { this._displayCurrentGuidingQuestion(); } 
                else { this.handleUserReply(''); }
            }, 3500);
        } else {
            this.errorCount++;
            this.updateStars(questionCode, false); 
            if (this.errorCount >= 2) {
                this.sendToGoogle('answer', reply, 'wrong_hint_shown');
                const clarificationText = this.currentProblem.clarifications[questionCode];
                displayMessage(`**אני כאן לעזור!**<br>בוא/י ננסה רמז: ${clarificationText}`, 'bot', 'thinking');
                this.errorCount = 0; 
            } else {
                this.sendToGoogle('answer', reply, 'wrong');
                const feedback = this.generateFeedback(questionCode, 'negative');
                const genderedFeedback = (studentGender === 'girl') ? feedback.girl : feedback.boy;
                displayMessage(genderedFeedback, 'bot', 'support');
            }
        }
    }
    
    _checkAnswer(reply, keywords) {
        const normalizedReply = reply.toLowerCase().trim();
        return keywords.some(keyword => normalizedReply.includes(keyword.toLowerCase()));
    }
    
    updateStars(questionCode, isCorrect) {
        const starIndex = questionCode === 'א' ? 0 : questionCode === 'ב' ? 1 : 2;
        const starElement = document.getElementById(`star-${starIndex}`);
        if (starElement) { 
            // לפי התמונה שלך: star_gold.png
            starElement.src = isCorrect ? 'images/star_gold.png' : 'images/star_empty.png'; 
        }
    }
    
    generateFeedback(questionCode, type) {
        const feedbackMessages = {
          positive: {
            'א': { boy: "מצוין! זיהית בדיוק מה צריך למצוא.", girl: "מצוינת! זיהית בדיוק מה צריך למצוא." },
            'ב': { boy: "כל הכבוד! מצאת את כל הנתונים.", girl: "כל הכבוד! מצאת את כל הנתונים." },
            'ג': { boy: "הבנה מעולה!", girl: "הבנה מעולה!" }
          },
          negative: {
            'א': { boy: "זה לא בדיוק זה. מה צריך למצוא?", girl: "זה לא בדיוק זה. מה צריך למצוא?" },
            'ב': { boy: "אולי חסר משהו? חפש מספרים.", girl: "אולי חסר משהו? חפשי מספרים." },
            'ג': { boy: "בוא נחשוב שוב.", girl: "בואי נחשוב שוב." }
          }
        };
        return feedbackMessages[type][questionCode];
    }
}

window.bot = null;

document.addEventListener('DOMContentLoaded', async () => {
  startButton = document.getElementById('start-button');
  welcomeScreen = document.getElementById('welcome-screen');
  loginScreen = document.getElementById('login-screen');
  appMainContainer = document.getElementById('app-main-container');
  chatWindow = document.getElementById('chat-window');
  userInput = document.getElementById('user-input');
  sendButton = document.getElementById('send-button');
  botStatus = document.getElementById('bot-status');
  largeAvatar = document.getElementById('large-avatar');
  problemNote = document.getElementById('problem-note');
  problemNoteText = document.getElementById('problem-note-text');
  loginBtn = document.getElementById('login-btn');
  participantInput = document.getElementById('participant-id-input');

  window.bot = new MathProblemGuidingBot();
  await window.bot.loadProblemsFromFile();

  if (IS_TEST_MODE) {
      currentUserID = "Tester"; 
      if (loginScreen) loginScreen.classList.add('hidden');
      if (welcomeScreen) welcomeScreen.classList.remove('hidden');
  } else {
      if (currentUserID) {
          if (participantInput) participantInput.value = currentUserID;
          if (loginScreen) loginScreen.classList.remove('hidden');
          if (welcomeScreen) welcomeScreen.classList.add('hidden');
      } else {
          if (loginScreen) loginScreen.classList.remove('hidden');
          if (welcomeScreen) welcomeScreen.classList.add('hidden');
      }
  }
  if (appMainContainer) appMainContainer.classList.add('hidden');

  if (loginBtn) {
      loginBtn.addEventListener('click', () => {
          const idVal = participantInput.value.trim();
          if (idVal.length > 0) {
              currentUserID = idVal;
              localStorage.setItem('mati_participant_id', currentUserID);
              loginScreen.classList.add('hidden');
              welcomeScreen.classList.remove('hidden');
          } else { alert("נא להזין קוד משתתף"); }
      });
  }

  if (startButton) {
    startButton.addEventListener('click', () => {
      welcomeScreen.classList.add('hidden');
      appMainContainer.classList.remove('hidden');
      window.bot.startConversationLogic();
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const reply = userInput.value.trim();
      if (reply) window.bot.handleUserReply(reply);
    });
  }
  
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendButton.click();
    });
  }
});