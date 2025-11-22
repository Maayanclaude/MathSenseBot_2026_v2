// ==========================================
// הגדרות חיבור לגוגל (סופי)
// ==========================================
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfQS9MLVUp1WHnZ47cFktiPB7QtUmVcVBjeE67NqyhXAca_Tw/formResponse";
const GOOGLE_ENTRY_ID = "entry.1044193202";

// false = המערכת עובדת "על אמת" (כולל כניסה ושליחה לגוגל)
const IS_TEST_MODE = false; 


// ==========================================
// משתנים גלובליים
// ==========================================
let startButton, welcomeScreen, loginScreen, appMainContainer, chatWindow, userInput, sendButton, botStatus, largeAvatar, problemNote, problemNoteText;
let loginBtn, participantInput;
let isBotTyping = false;

let currentUserID = localStorage.getItem('mati_participant_id');
let studentName = ""; 

const matiExpressions = {
    welcoming: "Mati_welcoming.png",
    inviting: "Mati_inviting_action.png",
    confident: "Mati_confident.png",
    compliment: "Mati_compliment.png",
    thinking: "Mati_thinking.png",
    support: "Mati_support.png",
    frustration: "Mati_frustration.png",
    happy: "Mati_inviting_action.png" // הוספתי כדי שיהיה להבעה מחייכת
};

// ==========================================
// פונקציות עזר
// ==========================================
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

// ==========================================
// מחלקת הבוט (הלוגיקה)
// ==========================================
class MathProblemGuidingBot {
    constructor() {
        this.problems = [];
        this.currentProblem = null;
        this.currentStep = 'intro'; 
        this.errorCount = 0; 
        
        this.stepMapping = {
            'q1_ask': { text: "מעולה. בוא/י נתחיל.<br><strong>שאלה 1: מהי השאלה המרכזית בבעיה / על מה שואלים אותי?</strong>", code: 'א', next: 'q1_answer', icon: 'magnifier_icon.png' },
            'q2_ask': { text: "יופי! עכשיו <strong>שאלה 2: מה אני יודע/ת? (כלומר, אילו נתונים רלוונטיים קיימים?)</strong>", code: 'ב', next: 'q2_answer', icon: 'list_icon.png' },
            'q3_ask': { text: "כמעט סיימנו עם שלב התרגום!<br><strong>שאלה 3: איזה מידע/פעולה חסר/ה לי כדי לפתור / כדי לענות?</strong>", code: 'ג', next: 'q3_answer', icon: 'puzzle_icon.png' }
        };
    }

    sendToGoogle(actionType, inputContent, resultStatus) {
        if (IS_TEST_MODE) {
            console.log(`[TEST] ${actionType} | ${inputContent} | ${resultStatus}`);
            return;
        }
        const timestamp = new Date().toLocaleTimeString('he-IL');
        const problemID = this.currentProblem ? this.currentProblem.id : 'intro';
        const userInfo = studentName ? `${currentUserID} (${studentName})` : currentUserID;
        const logData = `${timestamp} | User: ${userInfo} | Step: ${this.currentStep} | Input: "${inputContent}" | Status: ${resultStatus}`;
        const formData = new FormData();
        formData.append(GOOGLE_ENTRY_ID, logData);
        fetch(GOOGLE_FORM_URL, { method: "POST", mode: "no-cors", body: formData }).catch(err => console.error(err));
    }

    async loadProblemsFromFile() {
        try {
            const response = await fetch('questions_data.json');
            this.problems = await response.json();
            this.currentProblem = this.problems[0]; 
        } catch (error) {
            console.error('Error loading problems:', error);
        }
    }
    
    startConversationLogic() {
        if (!this.currentProblem) return;
        
        // --- כאן השינוי לפי הסטוריבורד שלך ---
        // הטקסט המדויק מהתמונה
        displayMessage("היי, אני מתי<br>יחד נפתור בעיות מילוליות<br>בשלושה שלבים.<br>אשמח לדעת, איך קוראים לך?", 'bot', 'welcoming');
        
        this.currentStep = 'wait_for_name'; 
        this.sendToGoogle('system', 'Chat Started', 'Waiting for name');
    }
    
    _displayCurrentGuidingQuestion() {
        this.errorCount = 0; 
        const step = this.stepMapping[this.currentStep];
        if (!step) return;
        const questionHtml = `<div class="guided-question"><img src="icons/${step.icon}"><span>${step.text}</span></div>`;
        displayMessage(questionHtml, 'bot', 'inviting');
        this.currentStep = step.next; 
    }

    handleUserReply(reply) {
        if (isBotTyping) return; 
        displayMessage(reply, 'user');
        userInput.value = '';
        
        // שלב קבלת השם
        if (this.currentStep === 'wait_for_name') {
            studentName = reply;
            this.sendToGoogle('intro', reply, 'name_received');
            
            displayMessage(`נעים להכיר, ${studentName}! 😊<br>בוא/י נסתכל על הבעיה שלפנינו:`, 'bot', 'happy');
            
            problemNoteText.innerText = this.currentProblem.question;
            problemNote.classList.remove('hidden');

            setTimeout(() => {
                this.currentStep = 'q1_ask';
                this._displayCurrentGuidingQuestion();
            }, 2500);
            return;
        }

        const currentQuestionCode = this._getCurrentQuestionCode();
        if (currentQuestionCode) {
            this._processAnswer(currentQuestionCode, reply);
        } else if (this.currentStep === 'done') {
            displayMessage("סיימנו בהצלחה את שלב התרגום! עכשיו אפשר לפתור את התרגיל.", 'bot', 'confident');
            this.sendToGoogle('system', 'Problem Finished', 'Success');
        }
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
            displayMessage(this.generateFeedback(questionCode, 'positive'), 'bot', 'compliment');
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
                displayMessage(this.generateFeedback(questionCode, 'negative'), 'bot', 'support');
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
            starElement.src = isCorrect ? 'icons/star_filled.png' : 'icons/star_empty.png';
        }
    }
    
    generateFeedback(questionCode, type) {
        const feedbackMessages = {
          positive: {
            'א': ["מצוין! זיהית בדיוק את השאלה."],
            'ב': ["כל הכבוד! מצאת את כל הנתונים."],
            'ג': ["הבנה מעולה! עלית על הפעולה הנכונה."]
          },
          negative: {
            'א': ["זה לא בדיוק זה. נסה לחפש את סימן השאלה."],
            'ב': ["אולי חסר משהו? חפש מספרים בסיפור."],
            'ג': ["בוא נחשוב שוב, האם המחיר יגדל או יקטן?"]
          }
        };
        const pool = feedbackMessages[type][questionCode];
        return pool[Math.floor(Math.random() * pool.length)];
    }
}

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

  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  if (IS_TEST_MODE) {
      currentUserID = "Tester"; 
      if (loginScreen) loginScreen.classList.add('hidden');
      if (welcomeScreen) welcomeScreen.classList.remove('hidden');
  } else {
      if (currentUserID) {
          if (loginScreen) loginScreen.classList.add('hidden');
          if (welcomeScreen) welcomeScreen.classList.remove('hidden');
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
          } else {
              alert("נא להזין קוד משתתף");
          }
      });
  }

  if (startButton) {
    startButton.addEventListener('click', () => {
      welcomeScreen.classList.add('hidden');
      appMainContainer.classList.remove('hidden');
      bot.startConversationLogic();
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const reply = userInput.value.trim();
      if (reply) bot.handleUserReply(reply);
    });
  }
  
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendButton.click();
    });
  }
});