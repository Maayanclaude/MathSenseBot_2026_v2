console.log("Script Loaded: Staggered Appearance (Text -> Note -> Button)");

// --- הגדרות ---
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfQS9MLVUp1WHnZ47cFktiPB7QtUmVcVBjeE67NqyhXAca_Tw/formResponse";
const GOOGLE_ENTRY_ID = "entry.1044193202";
const IS_TEST_MODE = false; 

let startButton, welcomeScreen, loginScreen, appMainContainer, chatWindow, userInput, sendButton, largeAvatar, problemNote, problemNoteText;
let loginBtn, participantInput;
let isBotTyping = false;
let currentUserID = localStorage.getItem('mati_participant_id');
let studentName = ""; 
let studentGender = ""; 

// --- 10 ההבעות ---
const matiExpressions = {
    ready: "Mati_ready.png",
    welcoming: "Mati_welcoming.png",
    support: "Mati_support.png",
    inviting: "Mati_inviting_action.png",
    confident: "Mati_confident.png",
    compliment: "Mati_compliment.png",
    confuse: "Mati_confuse.png",
    thinking: "Mati_calculates.png", // הדמות החדשה
    empathic: "Mati_empathic.png",
    excited: "Mati_excited.png",
    success: "Mati_success.png", 
    hi: "Mati_hi.png"
};

// --- סאונד ---
function playSound(soundName) {
    const audio = new Audio(`sounds/${soundName}.mp3`);
    audio.volume = 0.6;
    audio.play().catch(e => console.log("Audio play failed:", e));
}

// --- אתחול ---
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

// --- פונקציות עזר ---
function updateAvatar(expressionKey) {
    if (matiExpressions[expressionKey] && largeAvatar) {
        largeAvatar.src = `MatiCharacter/${matiExpressions[expressionKey]}`; 
    }
    // כוכב ביד - רק בsuccess
    const heldStar = document.getElementById('held-star');
    if (heldStar) {
        if (expressionKey === 'success') heldStar.classList.remove('hidden'); 
        else heldStar.classList.add('hidden'); 
    }
}

function displayMessage(text, sender, expression = 'neutral') {
    if (!chatWindow) return;
    if (sender === 'bot') { updateAvatar(expression); }
    
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
        
        if (opt.value === 'next_problem') {
            btn.classList.add('next-problem-btn'); 
            btn.onclick = () => window.bot.loadNextProblem();
        } else {
            btn.onclick = () => window.bot.handleGenderSelection(opt.value);
        }
        btnContainer.appendChild(btn);
    });
    chatWindow.appendChild(btnContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- הבוט ---
class MathProblemGuidingBot {
    constructor() {
        this.problems = [];
        this.currentProblem = null;
        this.currentProblemIndex = 0; 
        this.currentStep = 'intro'; 
        this.errorCount = 0; 
        
        this.genderedTexts = {
            'q1_ask': {
                boy: "מה אני צריך למצוא?",
                girl: "מה אני צריכה למצוא?",
                icon: 'magnifying_glass.png', 
                code: 'א',
                next: 'q1_answer'
            },
            'q2_ask': {
                boy: "מה אני כבר יודע? (אילו נתונים יש לי?)",
                girl: "מה אני כבר יודעת? (אילו נתונים יש לי?)",
                icon: 'list.png', 
                code: 'ב',
                next: 'q2_answer'
            },
            'q3_ask': {
                boy: "מה עליי לעשות כדי למצוא את הפתרון?",
                girl: "מה עליי לעשות כדי למצוא את הפתרון?",
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
            this.currentProblemIndex = 0;
            this.currentProblem = this.problems[this.currentProblemIndex]; 
        } catch (error) { console.error(error); }
    }
    
    startConversationLogic() {
        const introText = "היי, אני מתי!<br>יחד נפתור בעיות מילוליות במתמטיקה בשלושה שלבים.<br>לפני שנתחיל, אשמח לדעת איך קוראים לך?";
        displayMessage(introText, 'bot', 'welcoming'); 
        this.currentStep = 'wait_for_name'; 
    }
    
    // --- פונקציה לבעיה הבאה ---
    loadNextProblem() {
        this.currentProblemIndex++;
        
        if (this.currentProblemIndex >= this.problems.length) {
            displayMessage("כל הכבוד! סיימת את כל הבעיות להיום! 🏆", 'bot', 'excited');
            return;
        }

        this.currentProblem = this.problems[this.currentProblemIndex];
        
        // איפוס
        chatWindow.innerHTML = ''; 
        this.resetStars();         
        this.errorCount = 0;
        problemNote.classList.add('hidden'); // מסתירים את הפתק בהתחלה
        
        // שלב 1: מתי מדברת
        const transitionText = (studentGender === 'boy') ? 
            "נהדר! הנה הבעיה המילולית הבאה.<br>קרא אותה טוב, וכשתהיה מוכן לחץ על הכפתור." :
            "נהדר! הנה הבעיה המילולית הבאה.<br>קראי אותה טוב, וכשתהיי מוכנה לחצי על הכפתור.";
            
        displayMessage(transitionText, 'bot', 'welcoming');
        
        // שלב 2: אחרי 2 שניות - הבעיה מופיעה
        setTimeout(() => {
            problemNoteText.innerText = this.currentProblem.question;
            problemNote.classList.remove('hidden');
            
            // שלב 3: אחרי עוד שנייה וחצי - הכפתור מופיע
            setTimeout(() => {
                const btnLabel = (studentGender === 'boy') ? "אני מוכן! 🚀" : "אני מוכנה! 🚀";
                displayChoiceButtons([
                    { label: btnLabel, value: "ready_to_start" }
                ]);
                
                this.currentStep = 'wait_for_button_click';
            }, 1500);
            
        }, 2000);
    }

    resetStars() {
        for (let i = 0; i < 3; i++) {
            const star = document.getElementById(`star-${i}`);
            if (star) star.src = 'icons/star_empty.png';
        }
    }

    handleGenderSelection(gender) {
        // טיפול בכפתור "מוכן"
        if (gender === 'ready_to_start') {
            document.querySelectorAll('.choice-btn-container').forEach(b => b.remove());
            this.currentStep = 'q1_ask';
            this._displayCurrentGuidingQuestion();
            return;
        }

        studentGender = gender;
        document.querySelectorAll('.choice-btn-container').forEach(b => b.remove());
        
        const niceToMeet = `נעים להכיר, ${studentName}!`;
        displayMessage(niceToMeet, 'user'); 
        
        setTimeout(() => {
            // שלב 1: מתי מדברת
            const readyText = gender === 'boy' 
                ? "נהדר! בוא נתחיל.<br>הנה הבעיה המילולית הראשונה שלנו!<br>קרא אותה טוב, וכשתהיה מוכן, לחץ על הכפתור!"
                : "נהדר! בואי נתחיל.<br>הנה הבעיה המילולית הראשונה שלנו!<br>קראי אותה טוב, וכשתהיי מוכנה, לחצי על הכפתור!";
            
            displayMessage(readyText, 'bot', 'ready'); 
            
            // שלב 2: אחרי 2 שניות - הבעיה מופיעה
            setTimeout(() => {
                problemNoteText.innerText = this.currentProblem.question;
                problemNote.classList.remove('hidden');
                
                updateAvatar('inviting'); 
                
                // שלב 3: אחרי עוד שנייה וחצי - הכפתור מופיע
                setTimeout(() => {
                    const btnLabel = gender === 'boy' ? "אני מוכן! 🚀" : "אני מוכנה! 🚀";
                    displayChoiceButtons([
                        { label: btnLabel, value: "ready_to_start" }
                    ]);
                    
                    this.currentStep = 'wait_for_button_click'; 
                }, 1500);
                
            }, 2000);
        }, 500);
    }

    handleUserReply(reply) {
        if (isBotTyping) return; 
        if (reply) {
            displayMessage(reply, 'user');
            userInput.value = '';
        }
        
        if (this.currentStep === 'wait_for_name') {
            studentName = reply;
            const genderText = `נעים מאוד, ${studentName}.<br>אני רוצה לוודא שאני פונה אליך נכון.<br>האם תעדיפ.י שאפנה אליך בלשון זכר (בן) או לשון נקבה (בת)?`;
            displayMessage(genderText, 'bot', 'hi'); 
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
        
        if (this.currentStep === 'wait_for_button_click') {
             displayMessage("לחץ/י על הכפתור כדי להתחיל", 'bot', 'support');
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
        const questionHtml = `<div class="guided-question"><img src="icons/${stepData.icon}"><span>${textToShow}</span></div>`;
        
        displayMessage(questionHtml, 'bot', 'thinking');
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
            playSound('success-chime');
            
            const feedback = this.generateFeedback(questionCode, 'positive');
            const genderedFeedback = (studentGender === 'girl') ? feedback.girl : feedback.boy;
            
            displayMessage(genderedFeedback, 'bot', 'success');
            
            let nextStep = (questionCode === 'א' ? 'q2_ask' : questionCode === 'ב' ? 'q3_ask' : 'done');
            
            setTimeout(() => {
                this.currentStep = nextStep;
                if (this.currentStep !== 'done') { 
                    this._displayCurrentGuidingQuestion(); 
                } else { 
                    this._showFinalSummary(); 
                }
            }, 3000); 
        } else {
            this.errorCount++;
            this.updateStars(questionCode, false); 
            
            const clarificationText = this.currentProblem.clarifications[questionCode];
            const mediationText = `כיוון יפה! בואי נדייק: ${clarificationText}.<br><strong>נסה/י לכתוב את זה עכשיו:</strong>`;
            
            displayMessage(mediationText, 'bot', 'support');
        }
    }

    _showFinalSummary() {
        playSound('yeah');
        const summaryHtml = `
            <div class="summary-box">
                <h3>כל הכבוד! פתרת את הבעיה בשלושה צעדים:</h3>
                <ul>
                    <li><img src="icons/magnifying_glass.png"> ${studentGender === 'girl' ? 'מה אני צריכה למצוא?' : 'מה אני צריך למצוא?'}</li>
                    <li><img src="icons/list.png"> ${studentGender === 'girl' ? 'מה אני יודעת?' : 'מה אני יודע?'}</li>
                    <li><img src="icons/Missing_puzzle.png"> מה עליי לעשות כדי למצוא את הפתרון?</li>
                </ul>
                <br>
                <strong>שמרי על השגרה הזו – היא תעזור לך גם בשאלות הבאות!</strong>
            </div>
        `;
        displayMessage(summaryHtml, 'bot', 'excited');
        
        const matiImage = document.getElementById('large-avatar');
        if (matiImage) {
            matiImage.classList.add('mati-bounce');
            setTimeout(() => { matiImage.classList.remove('mati-bounce'); }, 5000);
        }

        // כפתור לבעיה הבאה
        setTimeout(() => {
            displayChoiceButtons([
                { label: "לבעיה הבאה ⬅️", value: "next_problem" }
            ]);
        }, 2000);
    }
    
    _checkAnswer(reply, keywords) {
        const normalizedReply = reply.toLowerCase().trim();
        return keywords.some(keyword => normalizedReply.includes(keyword.toLowerCase()));
    }
    
    updateStars(questionCode, isCorrect) {
        const starIndex = questionCode === 'א' ? 0 : questionCode === 'ב' ? 1 : 2;
        const starElement = document.getElementById(`star-${starIndex}`);
        if (starElement) { 
            starElement.src = isCorrect ? 'icons/star_gold.png' : 'icons/star_empty.png'; 
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
            'א': { boy: "...", girl: "..." },
            'ב': { boy: "...", girl: "..." },
            'ג': { boy: "...", girl: "..." }
          }
        };
        return feedbackMessages[type][questionCode];
    }
}