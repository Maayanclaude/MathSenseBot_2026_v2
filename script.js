// ==========================================
// הגדרות חיבור לגוגל
// ==========================================
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfTQC9KVZYRcPCvzSK5bDNM3uM1PM1pBHt8bJvl6DXjAFfGpg/formResponse"; 
const GOOGLE_ENTRY_ID = "entry.518023803"; 

// ==========================================
// מצב עבודה (המתג שלך!)
// ==========================================
// true  = מצב פיתוח: מדלג על כניסה, לא שולח לגוגל. (שימי כאן בזמן שאת עובדת)
// false = מצב מחקר: מבקש כניסה, שולח נתונים לגוגל. (שימי כאן לפני שאת שולחת לילדים)
const IS_TEST_MODE = true; 


// ==========================================
// משתנים גלובליים
// ==========================================
let startButton, welcomeScreen, loginScreen, appMainContainer, chatWindow, userInput, sendButton, botStatus, largeAvatar, problemNote, problemNoteText;
let loginBtn, participantInput;
let isBotTyping = false;

let currentUserID = localStorage.getItem('mati_participant_id');

const matiExpressions = {
    welcoming: "Mati_welcoming.png",
    inviting: "Mati_inviting_action.png",
    confident: "Mati_confident.png",
    compliment: "Mati_compliment.png",
    thinking: "Mati_thinking.png",
    support: "Mati_support.png",
    frustration: "Mati_frustration.png"
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
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ==========================================
// מחלקת הבוט
// ==========================================
class MathProblemGuidingBot {
    constructor() {
        this.problems = [];
        this.currentProblem = null;
        this.currentStep = 'intro'; 
        this.errorCount = 0; 
        
        this.stepMapping = {
            'q1_ask': { text: "מעולה. בוא/י נתחיל. **שאלה 1: מהי השאלה המרכזית בבעיה / על מה שואלים אותי?**", code: 'א', next: 'q1_answer', icon: 'magnifier_icon.png' },
            'q2_ask': { text: "יופי! עכשיו **שאלה 2: מה אני יודע/ת? (כלומר, אילו נתונים רלוונטיים קיימים?)**", code: 'ב', next: 'q2_answer', icon: 'list_icon.png' },
            'q3_ask': { text: "כמעט סיימנו עם שלב התרגום! **שאלה 3: איזה מידע/פעולה חסר/ה לי כדי לפתור / כדי לענות?**", code: 'ג', next: 'q3_answer', icon: 'puzzle_icon.png' }
        };
    }

    // --- שליחה לגוגל ---
    sendToGoogle(actionType, inputContent, resultStatus) {
        // אם אנחנו במצב בדיקה - רק מדפיס למסך ולא שולח
        if (IS_TEST_MODE) {
            console.log(`[TEST MODE - User: ${currentUserID}] Log:`, actionType, inputContent, resultStatus);
            return;
        }

        const timestamp = new Date().toLocaleTimeString('he-IL');
        const problemID = this.currentProblem ? this.currentProblem.id : 'intro';
        const logData = `${timestamp} | User: ${currentUserID} | P-${problemID} | ${this.currentStep} | "${inputContent}" | ${resultStatus}`;

        const formData = new FormData();
        formData.append(GOOGLE_ENTRY_ID, logData);

        fetch(GOOGLE_FORM_URL, {
            method: "POST",
            mode: "no-cors",
            body: formData
        }).then(() => console.log("Sent to Google:", logData)).catch(err => console.error("Error:", err));
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
        problemNoteText.innerText = this.currentProblem.question;
        problemNote.classList.remove('hidden');
        displayMessage(`שלום! אני מתי, בוא/י נפתור את הבעיה המילולית הזו יחד:`, 'bot', 'welcoming');
        
        this.sendToGoogle('system', 'Session Started', 'N/A');

        setTimeout(() => {
            this.currentStep = 'q1_ask';
            this._displayCurrentGuidingQuestion();
        }, 3000); 
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
        const currentQuestionCode = this._getCurrentQuestionCode();
        
        if (currentQuestionCode) {
            this._processAnswer(currentQuestionCode, reply);
        } else if (this.currentStep === 'done') {
            displayMessage("סיימנו בהצלחה את שלב התרגום!", 'bot', 'confident');
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
                displayMessage(`**אני כאן לעזור!** בוא/י ננסה רמז: ${clarificationText}`, 'bot', 'thinking');
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
            'א': ["ישר ולעניין! בדיוק זו השאלה המרכזית!"],
            'ב': ["מעולה! אספת את הנתונים הרלוונטיים."],
            'ג': ["הבנה מבריקה! הצלחת לנסח מה חסר."]
          },
          negative: {
            'א': ["זה בסדר, נסה לחפש את סימן השאלה."],
            'ב': ["אולי יש עוד נתונים? חפש מספרים."],
            'ג': ["בוא נחשוב איזו פעולה תעזור לנו."]
          }
        };
        const pool = feedbackMessages[type][questionCode];
        return pool[Math.floor(Math.random() * pool.length)];
    }
}

// ==========================================
// אתחול והרצה
// ==========================================
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

  // --- בדיקת מצב (החלק החדש!) ---
  
  if (IS_TEST_MODE) {
      // אם אנחנו בבדיקה: מדלגים על הכל ישר למסך הפתיחה
      console.log("מצב בדיקה פעיל: דילוג על מסך כניסה.");
      currentUserID = "Tester"; // שם זמני
      if (loginScreen) loginScreen.classList.add('hidden');
      if (welcomeScreen) welcomeScreen.classList.remove('hidden');
      
  } else {
      // אם אנחנו במחקר אמיתי: בודקים משתמש
      if (currentUserID) {
          if (loginScreen) loginScreen.classList.add('hidden');
          if (welcomeScreen) welcomeScreen.classList.remove('hidden');
      } else {
          if (loginScreen) loginScreen.classList.remove('hidden');
          if (welcomeScreen) welcomeScreen.classList.add('hidden');
      }
  }
  
  if (appMainContainer) appMainContainer.classList.add('hidden');

  // כפתור כניסה
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

  // כפתור התחלה
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