// --- משתנים גלובליים ואלמנטים מה-DOM ---
let startButton, welcomeScreen, appMainContainer, chatWindow, userInput, sendButton, botStatus, largeAvatar, problemNote, problemNoteText;
let isBotTyping = false;
let successSound; 

// הבעות הדמות (יש לוודא קיום התמונות ב-MatiCharacter/)
const matiExpressions = {
    welcoming: "Mati_welcoming.png",
    inviting: "Mati_inviting_action.png",
    confident: "Mati_confident.png",
    compliment: "Mati_compliment.png",
    thinking: "Mati_thinking.png",
    support: "Mati_support.png",
    frustration: "Mati_frustration.png" // חדש: להבעת תסכול/קושי
};

// --- פונקציות עזר ל-UI ---

// פונקציה לעדכון דמות מתי והבעתה
function updateAvatar(expressionKey) {
    if (matiExpressions[expressionKey] && largeAvatar) {
        largeAvatar.src = `MatiCharacter/${matiExpressions[expressionKey]}`; 
    }
    if (botStatus) {
        botStatus.textContent = expressionKey === 'thinking' ? 'מתי חושבת...' : 'מתי ממתינה…';
    }
}

// פונקציה להצגת הודעה בחלון הצ'אט
function displayMessage(text, sender, expression = 'neutral') {
    if (!chatWindow) return;

    // יוצר את אלמנט ההודעה החדש
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender + '-message');

    if (sender === 'bot') {
        updateAvatar(expression);
    }
    
    messageElement.innerHTML = text; 
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}


// =========================================================
// --- המחלקה הראשית: MathProblemGuidingBot ---
// =========================================================

class MathProblemGuidingBot {
    constructor() {
        this.problems = [];
        this.currentProblem = null;
        this.currentStep = 'intro'; // מצב: 'intro', 'q1_ask', 'q1_answer', 'q2_ask', 'q2_answer', 'q3_ask', 'q3_answer', 'done'
        this.errorCount = 0; // מונה טעויות לשאלה הנוכחית

        // מפת שלבי הדיאלוג
        this.stepMapping = {
            'q1_ask': { text: "מעולה. בוא/י נתחיל. **שאלה 1: מהי השאלה המרכזית בבעיה / על מה שואלים אותי?**", code: 'א', next: 'q1_answer', icon: 'magnifier_icon.png' },
            'q2_ask': { text: "יופי! עכשיו **שאלה 2: מה אני יודע/ת? (כלומר, אילו נתונים רלוונטיים קיימים?)**", code: 'ב', next: 'q2_answer', icon: 'list_icon.png' },
            'q3_ask': { text: "כמעט סיימנו עם שלב התרגום! **שאלה 3: איזה מידע/פעולה חסר/ה לי כדי לפתור / כדי לענות?**", code: 'ג', next: 'q3_answer', icon: 'puzzle_icon.png' }
        };
    }

    // --- טעינת נתונים ---
    async loadProblemsFromFile() {
        try {
            const response = await fetch('questions_data.json');
            this.problems = await response.json();
            // נתחיל עם הבעיה הראשונה (או רנדומלית, לפי הצורך)
            this.currentProblem = this.problems[0]; 
        } catch (error) {
            console.error('Error loading problems:', error);
            displayMessage("אוי, נתקלתי בבעיה בטעינת הבעיות. נסה/י לרענן את הדף.", 'bot', 'support');
        }
    }
    
    // --- מתודת ההתחלה ---
    startConversationLogic() {
        if (!this.currentProblem) {
            displayMessage("אני מוכנה להתחיל! נסה/י ללחוץ שוב על 'נתחיל'.", 'bot', 'support');
            return;
        }

        // 1. הצגת הבעיה בפתקית
        problemNoteText.innerText = this.currentProblem.question;
        problemNote.classList.remove('hidden');
        
        // 2. הודעת פתיחה
        displayMessage(`שלום! אני מתי, בוא/י נפתור את הבעיה המילולית הזו יחד:`, 'bot', 'welcoming');
        
        // 3. מעבר לשלב השאלה הראשונה
        setTimeout(() => {
            this.currentStep = 'q1_ask';
            this._displayCurrentGuidingQuestion();
        }, 3000); 
    }
    
    // --- הצגת שאלת הפיגום הנוכחית ---
    _displayCurrentGuidingQuestion() {
        // איפוס מונה הטעויות לשאלה חדשה
        this.errorCount = 0; 

        const step = this.stepMapping[this.currentStep];
        if (!step) return;

        const questionHtml = `
            <div class="guided-question">
                <img src="icons/${step.icon}" alt="אייקון ${step.code}">
                <span>${step.text}</span>
            </div>
        `;
        displayMessage(questionHtml, 'bot', 'inviting');
        
        // הגדרת המצב הבא: מצפים לתשובה לשאלה זו
        this.currentStep = step.next; 
    }

    // --- טיפול בקלט מהמשתמש ---
    handleUserReply(reply) {
        if (isBotTyping) return; 

        displayMessage(reply, 'user');
        userInput.value = '';
        
        const currentQuestionCode = this._getCurrentQuestionCode();

        if (currentQuestionCode) {
            this._processAnswer(currentQuestionCode, reply);
        } else if (this.currentStep === 'done') {
            displayMessage("סיימנו בהצלחה את שלב התרגום! את/ה מוכן/ה לפתור את הבעיה.", 'bot', 'confident');
            // כאן אפשר להוסיף לוגיקה למעבר לבעיה הבאה
        }
    }
    
    // פונקציית עזר להחזרת קוד השאלה הנוכחי ('א', 'ב', או 'ג')
    _getCurrentQuestionCode() {
        if (this.currentStep === 'q1_answer') return 'א';
        if (this.currentStep === 'q2_answer') return 'ב';
        if (this.currentStep === 'q3_answer') return 'ג';
        return null;
    }

    // --- עיבוד התשובה ובדיקתה ---
    _processAnswer(questionCode, reply) {
        const keywords = this.currentProblem.keywords[questionCode];
        const isCorrect = this._checkAnswer(reply, keywords);

        if (isCorrect) {
            // תשובה נכונה: משוב חיובי ומעבר לשלב הבא
            this.updateStars(questionCode, true);
            displayMessage(this.generateFeedback(questionCode, 'positive'), 'bot', 'compliment');
            // successSound.play(); 
            
            // הגדרת השלב הבא
            let nextStep = (questionCode === 'א' ? 'q2_ask' : questionCode === 'ב' ? 'q3_ask' : 'done');
            
            setTimeout(() => {
                this.currentStep = nextStep;
                if (this.currentStep !== 'done') {
                    this._displayCurrentGuidingQuestion();
                } else {
                    this.handleUserReply(''); // הפעלת מצב 'done'
                }
            }, 3500);
            
        } else {
            // תשובה שגויה: הגדלת מונה טעויות ומשוב תומך/רמז
            this.errorCount++;
            this.updateStars(questionCode, false); // מעדכן לכוכב ריק

            if (this.errorCount >= 2) {
                // רמז אדפטיבי (לאחר 2 טעויות)
                const clarificationText = this.currentProblem.clarifications[questionCode];
                const hintMessage = `**אני כאן לעזור!** בוא/י ננסה רמז: ${clarificationText}`;
                displayMessage(hintMessage, 'bot', 'thinking');
                
                // איפוס מונה הטעויות כדי לתת צ'אנס נוסף
                this.errorCount = 0; 
                
            } else {
                // משוב תומך רגיל (טעות ראשונה)
                displayMessage(this.generateFeedback(questionCode, 'negative'), 'bot', 'support');
            }

            // נשארים באותו שלב (qX_answer) ומצפים לתשובה נוספת.
        }
    }
    
    // --- מנגנון בדיקה פשוט (לפי מילות מפתח) ---
    _checkAnswer(reply, keywords) {
        const normalizedReply = reply.toLowerCase().trim();
        return keywords.some(keyword => normalizedReply.includes(keyword.toLowerCase()));
    }
    
    // --- עדכון כוכבים (פיגום חזותי) ---
    updateStars(questionCode, isCorrect) {
        const starIndex = questionCode === 'א' ? 0 : questionCode === 'ב' ? 1 : 2;
        const starElement = document.getElementById(`star-${starIndex}`);
        if (starElement) {
            starElement.src = isCorrect ? 'icons/star_filled.png' : 'icons/star_empty.png';
        }
    }
    
    // --- מתודת generateFeedback מעודכנת עם תיקוני הניסוח והטון ---
    generateFeedback(questionCode, type) {
        const feedbackMessages = {
          positive: {
            'א': [
              "ישר ולעניין! **בדיוק זו השאלה המרכזית!** עכשיו קל יותר להתקדם.",
              "כל הכבוד לך! זיהית את מה שצריך למצוא בבעיה. צעד ענק קדימה!",
              "מצוין! סמנת את המטרה שלנו. בוא/י נמשיך הלאה."
            ],
            'ב': [
              "מעולה! אספת את כל **הנתונים הרלוונטיים** מתוך הבעיה המילולית. את/ה ממש בלש/ית!",
              "תשובה מדויקת! **הצלחת להבין את נושא הבעיה** ואת הנתונים שיש לנו. זה הבסיס לפתרון.",
              "יופי! הצלחת לזהות את הנתונים הנכונים. בוא/י נראה מה חסר."
            ],
            'ג': [
              "הבנה מבריקה! הצלחת לנסח בדיוק מה אנחנו צריכים לעשות. **זה מטא-קוגניציה!**",
              "בדיוק! ציינת מהי הפעולה (או המידע) החסר/ת. עכשיו אפשר לתכנן את הפתרון.",
              "מדהים! כשמבינים מה חסר, כבר חצי דרך לפתרון. את/ה שולט/ת בזה!"
            ]
          },
          negative: {
            'א': [
              "זה בסדר! הבעיה קצת מבלבלת, אבל בוא/י ננסה שוב. מה נרצה למצוא בסוף הבעיה?",
              "אני רואה שניסית, אבל השאלה המרכזית היא קצת שונה. **נסה/י לחפש את סימן השאלה בבעיה המילולית.**",
              "את/ה כותב/ת לי נתון, אבל אנחנו מחפשים **שאלה**. בוא/י נתמקד במטרה."
            ],
            'ב': [
              "את/ה צודק/ת, זה מידע חשוב, אבל אולי יש עוד? נסה/י לחפש **מספרים** ו**מילים** שמתארות אותם בבעיה.",
              "יפה שהתחלת, אבל יש עוד **נתונים רלוונטיים** בבעיה. בוא/י נקרא שוב לאט ונחפש אותם.",
              "נראה שהתייחסת רק לחלק. בוא/י נחפש את כל הנתונים ש**אומרים לנו** מה קורה בבעיה."
            ],
            'ג': [
              "תשובה טובה, אבל בוא/י נחשוב על הצעד הבא. איזה **פעולה מתמטית** (חיבור? כפל?) תעזור לנו לחבר את מה שיש לנו למה שצריך למצוא?",
              "זה עדיין לא לגמרי ברור. מה הפעולה **האחרונה** שנצטרך לעשות כדי לענות על השאלה הראשית?",
              "בוא/י נדייק: הנתונים שציינת יפים, אבל איזו **פעולה** את/ה צריך/ה כדי לפתור? (למשל: 'אני צריך/ה לחסר')."
            ]
          }
        };

        const pool = feedbackMessages[type][questionCode];
        return pool[Math.floor(Math.random() * pool.length)];
    }
}


// =========================================================
// --- אתחול והרצת האפליקציה ---
// =========================================================

document.addEventListener('DOMContentLoaded', async () => {
  // איסוף אלמנטים (מתבצע רק לאחר טעינת הדף)
  startButton = document.getElementById('start-button');
  welcomeScreen = document.getElementById('welcome-screen');
  appMainContainer = document.getElementById('app-main-container');
  chatWindow = document.getElementById('chat-window');
  userInput = document.getElementById('user-input');
  sendButton = document.getElementById('send-button');
  botStatus = document.getElementById('bot-status');
  largeAvatar = document.getElementById('large-avatar');
  problemNote = document.getElementById('problem-note');
  problemNoteText = document.getElementById('problem-note-text');
  // successSound = new Audio('sounds/success-chime.mp3'); // uncomment when sound file is ready

  // יצירת מופע בוט וטעינת הבעיות
  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  // אם כבר התחילו בעבר (שימוש ב-localStorage)
  if (localStorage.getItem('chatStarted') === 'true') {
    welcomeScreen.classList.add('hidden');
    appMainContainer.classList.remove('hidden');
    bot.startConversationLogic();
  } else {
    welcomeScreen.classList.remove('hidden');
    appMainContainer.classList.add('hidden');
  }

  // כפתור התחלה במסך הפתיחה
  if (startButton) {
    startButton.addEventListener('click', () => {
      localStorage.setItem('chatStarted', 'true');
      welcomeScreen.classList.add('hidden');
      appMainContainer.classList.remove('hidden');
      bot.startConversationLogic();
    });
  }

  // כפתור השליחה
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const reply = userInput.value.trim();
      if (reply) {
        bot.handleUserReply(reply);
      }
    });
  }
  
  // לחיצה על Enter בשדה הקלט
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
  }

});