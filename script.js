console.log("Script Loaded: Fixed Icons, Avatar & Summary");

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfQS9MLVUp1WHnZ47cFktiPB7QtUmVcVBjeE67NqyhXAca_Tw/formResponse";
const GOOGLE_ENTRY_ID = "entry.1044193202";
const IS_TEST_MODE = false; 

let startButton, welcomeScreen, loginScreen, appMainContainer, chatWindow, userInput, sendButton, botStatus, largeAvatar, problemNote, problemNoteText;
let loginBtn, participantInput;
let isBotTyping = false;

let currentUserID = localStorage.getItem('mati_participant_id');
let studentName = ""; 
let studentGender = ""; 

// מיפוי תמונות מתי (לפי התיקייה MatiCharacter)
const matiExpressions = {
    welcoming: "Mati_welcoming.png",
    inviting: "Mati_inviting_action.png",
    confident: "Mati_confident.png",
    compliment: "Mati_compliment.png",
    thinking: "Mati_thinking.png",
    support: "Mati_support.png",
    frustration: "Mati_frustration.png",
    happy: "Mati_inviting_action.png",
    ready: "Mati_ready.png"
};

document.addEventListener('DOMContentLoaded', async () => {
  loginBtn = document.getElementById('login-btn');
  participantInput = document.getElementById('participant-id-input');
  loginScreen = document.getElementById('login-screen');
  welcomeScreen = document.getElementById('welcome-screen');
  startButton = document.getElementById('start-button');
  appMainContainer = document.getElementById('app-main-container');
  chatWindow = document.getElementById('chat-window');
  userInput = document.getElementById('user-input');
  sendButton = document.getElementById('send-button');
  botStatus = document.getElementById('bot-status');
  largeAvatar = document.getElementById('large-avatar');
  problemNote = document.getElementById('problem-note');
  problemNoteText = document.getElementById('problem-note-text');

  window.bot = new MathProblemGuidingBot();
  await window.bot.loadProblemsFromFile();

  if (IS_TEST_MODE) {
      loginScreen.classList.add('hidden');
      welcomeScreen.classList.remove('hidden');
  } else if (currentUserID) {
      if (participantInput) participantInput.value = currentUserID;
  }

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

function updateAvatar(expressionKey) {
    // וידוא שהתמונה קיימת במערך
    if (matiExpressions[expressionKey] && largeAvatar) {
        largeAvatar.src = `MatiCharacter/${matiExpressions[expressionKey]}`; 
    }
    
    // עדכון סטטוס טקסטואלי
    if (botStatus) {
        if (expressionKey === 'thinking') botStatus.textContent = 'מתי חושבת...';
        else if (expressionKey === 'compliment' || expressionKey === 'happy') botStatus.textContent = 'מתי שמחה!';
        else botStatus.textContent = 'מתי ממתינה...';
    }
}

function displayMessage(text, sender, expression = 'neutral') {
    if (!chatWindow) return;
    
    // עדכון הדמות אם זו הודעה מהבוט
    if (sender === 'bot') { 
        updateAvatar(expression); 
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender + '-message');
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
                // הורדתי את "שאלה 1" - רק השאלה עצמה
                boy: "מה אני צריך למצוא?",
                girl: "מה אני צריכה למצוא?",
                icon: 'magnifying_glass.png', 
                code: 'א',
                next: 'q1_answer'
            },
            'q2_ask': {
                // הורדתי את "שאלה 2"
                boy: "מה אני יודע? (אילו נתונים יש לי?)",
                girl: "מה אני יודעת? (אילו נתונים יש לי?)",
                icon: 'list.png', 
                code: 'ב',
                next: 'q2_answer'
            },
            'q3_ask': {
                // הורדתי את "שאלה 3"
                boy: "איזה מידע חסר לי כדי לפתור?",
                girl: "איזה מידע חסר לי כדי לפתור?",
                icon: 'Missing_puzzle.png', 
                code: 'ג',
                next: 'q3_answer'
            }
        };
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
    }
    
    handleGenderSelection(gender) {
        studentGender = gender;
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
        
        // אם זו לא פקודה פנימית, הצג את תשובת המשתמש
        if (reply) {
            displayMessage(reply, 'user');
            userInput.value = '';
        }
        
        if (this.currentStep === 'wait_for_name') {
            studentName = reply;
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
        } 
    }

    _displayCurrentGuidingQuestion() {
        this.errorCount = 0; 
        const stepData = this.genderedTexts[this.currentStep];
        if (!stepData) return;
        
        const textToShow = (studentGender === 'girl') ? stepData.girl : stepData.boy;
        // שימוש ב-images/ לנתיב התמונה
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
            this.updateStars(questionCode, true);
            
            const feedback = this.generateFeedback(questionCode, 'positive');
            const genderedFeedback = (studentGender === 'girl') ? feedback.girl : feedback.boy;
            
            displayMessage(genderedFeedback, 'bot', 'compliment'); // הבעה שמחה
            
            let nextStep = (questionCode === 'א' ? 'q2_ask' : questionCode === 'ב' ? 'q3_ask' : 'done');
            
            setTimeout(() => {
                this.currentStep = nextStep;
                if (this.currentStep !== 'done') { 
                    this._displayCurrentGuidingQuestion(); 
                } else { 
                    this._showFinalSummary(); // קריאה לפונקציית הסיכום החדשה
                }
            }, 2500);
        } else {
            this.errorCount++;
            this.updateStars(questionCode, false); 
            if (this.errorCount >= 2) {
                const clarificationText = this.currentProblem.clarifications[questionCode];
                displayMessage(`**אני כאן לעזור!**<br>בוא/י ננסה רמז: ${clarificationText}`, 'bot', 'thinking'); // הבעה חושבת
                this.errorCount = 0; 
            } else {
                const feedback = this.generateFeedback(questionCode, 'negative');
                const genderedFeedback = (studentGender === 'girl') ? feedback.girl : feedback.boy;
                displayMessage(genderedFeedback, 'bot', 'support'); // הבעה תומכת
            }
        }
    }

    // פונקציה חדשה לסיכום בסוף
    _showFinalSummary() {
        const summaryHtml = `
            <div class="summary-box">
                <h3>כל הכבוד! פתרת את הבעיה בשלושה צעדים:</h3>
                <ul>
                    <li>🔍 ${studentGender === 'girl' ? 'מה אני צריכה למצוא?' : 'מה אני צריך למצוא?'}</li>
                    <li>📋 ${studentGender === 'girl' ? 'מה אני יודעת?' : 'מה אני יודע?'}</li>
                    <li>🧩 מה עליי לעשות כדי למצוא את הפתרון?</li>
                </ul>
                <strong>שמרי על השגרה הזו – היא תעזור לך גם בשאלות הבאות!</strong>
            </div>
        `;
        displayMessage(summaryHtml, 'bot', 'happy');
    }
    
    _checkAnswer(reply, keywords) {
        const normalizedReply = reply.toLowerCase().trim();
        return keywords.some(keyword => normalizedReply.includes(keyword.toLowerCase()));
    }
    
    updateStars(questionCode, isCorrect) {
        const starIndex = questionCode === 'א' ? 0 : questionCode === 'ב' ? 1 : 2;
        const starElement = document.getElementById(`star-${starIndex}`);
        if (starElement) { 
            // וידוא שנתיב התמונות נכון
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