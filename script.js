// --- משתנים גלובליים ואלמנטים מה-DOM ---
document.addEventListener('DOMContentLoaded', async () => {
  const startButton = document.getElementById('start-button');
  const welcomeScreen = document.getElementById('welcome-screen');
  const appMainContainer = document.getElementById('app-main-container');
  const chatWindow = document.getElementById('chat-window');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const botStatus = document.getElementById('bot-status');
  const stars = document.querySelectorAll('.star'); // וודא שיש אלמנטים עם קלאס .star ב-HTML
  const largeAvatar = document.getElementById('large-avatar'); // וודא שיש אלמנט עם ID large-avatar ב-HTML
  const resetButton = document.getElementById('reset-button'); // וודא שיש אלמנט עם ID reset-button ב-HTML

  const successSound = new Audio('sounds/success-chime.mp3'); // וודא שהנתיב לקובץ נכון
  let isBotTyping = false;

  const avatarExpressions = {
    welcoming: "avatar_welcoming.png",
    inviting: "avatar_inviting_action.png",
    confident: "avatar_confident.png",
    compliment: "avatar_compliment.png",
    thinking: "avatar_thinking.png",
    support: "avatar_support.png",
    confuse: "avatar_confuse.png",
    empathic: "avatar_Empathic.png",
    excited: "avatar_excited.png",
    ready: "avatar_ready.png"
  };

  // --- פונקציות עזר לטיפול ב-UI ובהודעות ---

  // פונקציית עזר להצגה/הסתרה של מסכים
  function showScreen(screenElement) {
    welcomeScreen.classList.add('hidden');
    appMainContainer.classList.add('hidden');
    document.body.classList.remove('app-started');

    screenElement.classList.remove('hidden');
    if (screenElement === appMainContainer) {
      document.body.classList.add('app-started');
    }
  }

  function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'bot' ? 'bot-message' : 'student-message');
    const textSpan = document.createElement('span');
    textSpan.classList.add('message-text');
    textSpan.innerHTML = text;
    messageDiv.appendChild(textSpan);
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function postBotMessageWithEmotion(message, emotion = 'support', showButtons = false, buttons = []) {
    const avatarFilename = avatarExpressions[emotion] || avatarExpressions['support'];
    if (largeAvatar) largeAvatar.src = `./avatars/${avatarFilename}`;
    bot.simulateBotTyping(() => {
      addMessage('bot', message);
      if (showButtons && buttons.length) {
        // וודא שהקלט וכפתור השליחה מנוטרלים כאשר מוצגים כפתורי בחירה
        toggleInput(false);
        const buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('button-group'); // וודא שיש עיצוב CSS לקלאס זה
        buttons.forEach(btnText => {
          const btn = document.createElement('button');
          btn.textContent = btnText;
          btn.classList.add('choice-button'); // וודא שיש עיצוב CSS לקלאס זה
          btn.addEventListener('click', (e) => {
            // הסר בחירה מכפתורים קודמים באותה קבוצה
            document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected')); // וודא שיש עיצוב CSS לקלאס זה
            e.target.classList.add('selected'); // סמן את הכפתור שנבחר
            bot.handleChoiceButtonClick(e); // טפל בלחיצת הכפתור בלוגיקת הבוט
          });
          buttonsDiv.appendChild(btn);
        });
        chatWindow.appendChild(buttonsDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      } else {
        // אם אין כפתורים, וודא שהקלט וכפתור השליחה מופעלים, אלא אם הבוט עדיין מקליד
        if (!isBotTyping) { // הוספת תנאי שמונע הפעלה מוקדמת מידי
          toggleInput(true);
        }
      }
    });
  }

  // פונקציה להפעלה/נטרול של תיבת הקלט וכפתור השליחה
  function toggleInput(enable) {
    userInput.disabled = !enable;
    sendButton.disabled = !enable;
    if (enable) {
      userInput.focus(); // מיקוד על שדה הקלט כשהוא מופעל
    }
  }

  // --- מחלקת הבוט MathProblemGuidingBot ---
  class MathProblemGuidingBot {
    constructor() {
      this.wordProblems = {};
      this.levelOrder = ['level1', 'level2', 'level3'];
      this.currentLevelIndex = 0;
      this.currentProblem = null;
      this.guidingQuestions = [];
      this.currentQuestionIndex = 0;
      this.studentGuidingAnswers = { 'א': '', 'ב': '', 'ג': '' };
      this.dialogStage = 'start'; // שלב התחלתי
      this.userGender = null;
      this.userName = null;
      this.completedProblems = 0;
      this.successfulAnswers = 0;
    }

    async loadProblemsFromFile() {
      try {
        const response = await fetch('questions_data.json'); // וודא שהנתיב לקובץ נכון
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.wordProblems = {
          level1: data.filter(q => q.level === 1),
          level2: data.filter(q => q.level === 2),
          level3: data.filter(q => q.level === 3)
        };
        // בחר בעיה ראשונית רק אם זו לא טעינה מ-localStorage
        if (!localStorage.getItem('chatStarted') || localStorage.getItem('dialogStage') === 'start') {
          this.currentProblem = this.chooseRandomProblem();
        }
      } catch (error) {
        console.error("Failed to load problems:", error);
        alert("אירעה שגיאה בטעינת הבעיות. נסה/י לרענן את העמוד.");
      }
    }

    chooseRandomProblem() {
      const currentLevel = this.levelOrder[this.currentLevelIndex];
      const problems = this.wordProblems[currentLevel];
      if (!problems || problems.length === 0) {
        console.warn(`No problems found for level: ${currentLevel}`);
        return { question: "אין כרגע בעיות ברמה זו. נסה/י שוב מאוחר יותר.", keywords: {}, clarifications: {}, correct_answers: {}, wrong_answer_feedback: {} };
      }
      return problems[Math.floor(Math.random() * problems.length)];
    }

    simulateBotTyping(callback, delay = 900) {
      isBotTyping = true;
      botStatus.textContent = 'מתי מקלידה...'; // וודא שיש אלמנט עם ID bot-status ב-HTML
      setTimeout(() => {
        callback();
        isBotTyping = false;
        botStatus.textContent = 'מתי ממתינה...';
      }, delay);
    }

    // מתודה חדשה לאתחול שיחה או המשך מ-localStorage
    initiateOrResumeConversation() {
      const storedName = localStorage.getItem('userName');
      const storedGender = localStorage.getItem('userGender');
      const storedStage = localStorage.getItem('dialogStage');

      if (storedName && storedGender && storedStage) {
        this.userName = storedName;
        this.userGender = storedGender;
        this.dialogStage = storedStage;
        this.updateGuidingQuestionsByGender();

        showScreen(appMainContainer);
        // בדוק איזו בעיה המשתמש פתר לאחרונה, אם נדרש
        // כרגע, פשוט מתחיל את הבעיה הנוכחית מהרמה הנוכחית
        this.currentProblem = this.chooseRandomProblem(); // יבחר בעיה חדשה באותה רמה

        // המשך מאיפה שהפסקנו
        if (this.dialogStage === 'asking_guiding_questions' || this.dialogStage === 'start_problem') { // 'start_problem' stage added for clarity
            postBotMessageWithEmotion(`היי ${this.userName}! ברוך/ה שוב. הנה הבעיה הנוכחית שלנו:<br><b>${this.currentProblem.question}</b>`, 'confident');
            setTimeout(() => this.askGuidingQuestion(), 1500);
            toggleInput(true); // הפעל קלט אם מצפים לתשובה על שאלה מנחה
        } else if (this.dialogStage === 'continue_or_stop' || this.dialogStage === 'offer_level_up') {
            postBotMessageWithEmotion(`היי ${this.userName}! רוצה להמשיך?`, 'inviting', true, ["כן", "לא"]);
            toggleInput(false); // נטרל קלט כשיש כפתורי בחירה
        } else {
            // אם מצב לא צפוי או שהמשתמש לא סיים את שלבי השם/מגדר, נתחיל את תהליך השאלות
            this.startConversationLogic();
        }

      } else {
        // אם אין מידע שמור, נתחיל את השיחה מההתחלה
        this.startConversationLogic();
      }
    }

    // מתודה זו תופעל להתחלת השיחה (שאלת שם) - הכל בתוך הצ'אט
    startConversationLogic() {
      showScreen(appMainContainer); // עובר למסך הצ'אט הראשי
      postBotMessageWithEmotion("שלום! אני מתי. נפתור יחד בעיות מילוליות במתמטיקה.", 'welcoming');
      setTimeout(() => {
        postBotMessageWithEmotion("איך קוראים לך?", 'inviting');
        this.dialogStage = 'awaiting_name_input'; // שינוי שלב הדיאלוג
        localStorage.setItem('dialogStage', this.dialogStage);
        toggleInput(true); // הפעל קלט עבור השם
      }, 1500);
    }

    // זו המתודה שתטפל בלחיצות כפתורים *בתוך* חלון הצ'אט הראשי (למשל כפתורי מגדר, או "כן"/"לא" להמשך)
    handleChoiceButtonClick(event) {
      const btnText = event.target.textContent;

      // שלב שואל מגדר - מטופל רק באמצעות כפתורים
      if (this.dialogStage === 'awaiting_gender_input') {
        // אין צורך להוסיף הודעה של הסטודנט כאן, הכפתור כבר מסמן את הבחירה.
        this.userGender = btnText === "זכר" ? 'male' : btnText === "נקבה" ? 'female' : 'neutral';
        localStorage.setItem('userGender', this.userGender); // שמור את המגדר
        this.updateGuidingQuestionsByGender(); // עדכן את השאלות המנחות לפי המגדר

        const greeting = this.userGender === 'male'
          ? "נהדר! נדבר בלשון זכר."
          : this.userGender === 'female'
            ? "נהדר! נדבר בלשון נקבה."
            : "נשתמש בלשון ניטרלית כדי שתרגיש/י בנוח.";
        postBotMessageWithEmotion(greeting, 'confident');

        // הודעת פתיחה משולבת - "נעים להכיר [שם], כעת נלמד..."
        setTimeout(() => {
          postBotMessageWithEmotion(`היי ${this.userName}! נעים להכיר, אני מתי ואנחנו נלמד ביחד איך מילים הופכות למספרים בשלושה שלבים.`, 'confident');

          // הצגת הבעיה המילולית הראשונה ומעבר לשלב שאלות מנחות - מיד לאחר ההודעה הקודמת
          setTimeout(() => {
            postBotMessageWithEmotion(`הנה הבעיה שלנו:<br><b>${this.currentProblem.question}</b>`, 'confident');
            this.dialogStage = 'asking_guiding_questions'; // מעבר לשלב השאלות המנחות
            localStorage.setItem('dialogStage', this.dialogStage);
            setTimeout(() => this.askGuidingQuestion(), 1500); // שאלה מנחה ראשונה
          }, 1500); // עיכוב זה הותאם כך שיגיע לאחר ההודעה החדשה

        }, 1500); // לאחר ברכת המגדר
        // כאן אין toggleInput(true) כי askGuidingQuestion כבר יפעיל את הקלט

      } else if (this.dialogStage === 'continue_or_stop') {
        addMessage('student', btnText); // הצג את בחירת התלמיד (כפתור)
        if (btnText === "כן") {
          this.completedProblems++;

          if (this.completedProblems >= 5 && this.currentLevelIndex < this.levelOrder.length - 1) {
            const name = this.userName ? ` ${this.userName}` : "";
            postBotMessageWithEmotion(`וואו${name}! פתרת כבר 5 בעיות ברמה הזו 🎯`, 'excited');
            setTimeout(() => {
              postBotMessageWithEmotion("רוצה לעבור לרמה מתקדמת יותר?", 'inviting', true, ["כן, ברור!", "נשאר ברמה הזו"]);
              this.dialogStage = 'offer_level_up';
              localStorage.setItem('dialogStage', this.dialogStage);
            }, 1800);
            return;
          }

          if (this.successfulAnswers >= 3 && this.currentLevelIndex < this.levelOrder.length - 1) {
            this.currentLevelIndex++;
            this.successfulAnswers = 0;
            this.completedProblems = 0;
          }
          this.currentProblem = this.chooseRandomProblem();
          this.currentQuestionIndex = 0;
          this.dialogStage = 'asking_guiding_questions';
          localStorage.setItem('dialogStage', this.dialogStage);
          postBotMessageWithEmotion(`הנה הבעיה:<br><b>${this.currentProblem.question}</b>`, 'confident');
          setTimeout(() => this.askGuidingQuestion(), 1500);
        } else {
          postBotMessageWithEmotion("אין בעיה, נחזור כשתרצה. בהצלחה!", 'support');
          this.dialogStage = 'ended';
          localStorage.setItem('dialogStage', this.dialogStage);
          toggleInput(false); // נטרל קלט בסיום השיחה
        }
      } else if (this.dialogStage === 'offer_level_up') {
        addMessage('student', btnText); // הצג את בחירת התלמיד (כפתור)
        if (btnText === "כן, ברור!") {
          this.currentLevelIndex++;
          this.completedProblems = 0;
          this.successfulAnswers = 0;
          this.currentProblem = this.chooseRandomProblem();
          this.currentQuestionIndex = 0;
          postBotMessageWithEmotion("מעולה! עוברים לרמה הבאה 💪", 'confident');
          setTimeout(() => {
            postBotMessageWithEmotion(`הנה הבעיה:<br><b>${this.currentProblem.question}</b>`, 'confident');
            this.dialogStage = 'asking_guiding_questions';
            localStorage.setItem('dialogStage', this.dialogStage);
            setTimeout(() => this.askGuidingQuestion(), 1500);
          }, 1800);
        } else {
          postBotMessageWithEmotion("אין בעיה, נמשיך באותה רמה 😊", 'support');
          this.currentProblem = this.chooseRandomProblem();
          this.currentQuestionIndex = 0;
          this.dialogStage = 'asking_guiding_questions';
          localStorage.setItem('dialogStage', this.dialogStage);
          setTimeout(() => {
            postBotMessageWithEmotion(`הנה הבעיה:<br><b>${this.currentProblem.question}</b>`, 'confident');
            setTimeout(() => this.askGuidingQuestion(), 1500);
          }, 1500);
        }
      }
    }

    updateGuidingQuestionsByGender() {
      const isMale = this.userGender === 'male';
      const isFemale = this.userGender === 'female';
      const text = (male, female, neutral) => isMale ? male : isFemale ? female : neutral;
      this.guidingQuestions = [
        { key: 'א', text: text("מה אני צריך למצוא?", "מה אני צריכה למצוא?", "מה צריך למצוא?"), icon: "magnifying_glass.png" },
        { key: 'ב', text: text("מה אני יודע מהבעיה?", "מה אני יודעת מהבעיה?", "מה ידוע לי?"), icon: "list.png" },
        { key: 'ג', text: text("מה חסר לי לדעת כדי לפתור?", "מה חסר לי לדעת כדי לפתור?", "מה חסר לי כדי לפתור?"), icon: "Missing_puzzle.png" }
      ];
    }

    askGuidingQuestion() {
      if (this.currentQuestionIndex < this.guidingQuestions.length) {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        const html = `<div class="guided-question"><img src="./icons-leading-questions/${q.icon}" alt="icon" /> ${q.text}</div>`; // וודא עיצוב CSS ל-guided-question ולגודל התמונה
        postBotMessageWithEmotion(html, 'support');
        toggleInput(true); // הפעל קלט עבור מענה על שאלות מנחות
      } else {
        postBotMessageWithEmotion("רוצה להמשיך לפתור עוד בעיה?", 'inviting', true, ["כן", "לא"]);
        this.dialogStage = 'continue_or_stop';
        localStorage.setItem('dialogStage', this.dialogStage);
        toggleInput(false); // נטרל קלט כשיש כפתורי בחירה
      }
    }

    // מתודה לטיפול בקלט משתמש חופשי (כמו שם, או תשובות לשאלות מנחות)
    handleStudentInputLogic(input) {
      addMessage('student', input); // הצג את קלט התלמיד
      if (this.dialogStage === 'awaiting_name_input') {
        this.userName = input;
        localStorage.setItem('userName', this.userName); // שמור את השם
        postBotMessageWithEmotion(`נעים להכיר, ${this.userName}!`, 'welcoming');
        setTimeout(() => {
          postBotMessageWithEmotion("איך תרצה/תרצי שאפנה אליך?", 'inviting', true, ["זכר", "נקבה", "לא משנה לי"]);
          this.dialogStage = 'awaiting_gender_input';
          localStorage.setItem('dialogStage', this.dialogStage);
          toggleInput(false); // נטרל קלט כשיש כפתורי בחירה למגדר
        }, 1200);
      } else if (this.dialogStage === 'asking_guiding_questions') {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        this.studentGuidingAnswers[q.key] = input;

        const correctAnswersForQ = this.currentProblem.correct_answers?.[q.key] || [];
        const clarification = this.currentProblem.clarifications?.[q.key];
        const wrongFeedback = this.currentProblem.wrong_answer_feedback?.[q.key];

        // בדיקה אם התשובה נכונה לחלוטין (אחד מהביטויים הנכונים)
        const isCorrect = correctAnswersForQ.some(correctPhrase => input.includes(correctPhrase));

        // בדיקה אם התשובה חלקית (מכילה מילות מפתח אבל לא מלאה)
        // נגדיר isPartial מחדש - היא נכונה אם התשובה אינה isCorrect אבל מכילה מילות מפתח
        const keywords = this.currentProblem.keywords?.[q.key] || [];
        const isPartial = !isCorrect && keywords.some(keyword => input.includes(keyword));

        if (isCorrect) {
            const feedback = this.getRandomFeedback(q.key); // השתמש בפידבק חיובי כללי
            postBotMessageWithEmotion(feedback, 'compliment');
            this.markStar(this.currentQuestionIndex);
            this.successfulAnswers++;
            this.currentQuestionIndex++;
            setTimeout(() => this.askGuidingQuestion(), 1500);
        } else if (isPartial && clarification) {
            // אם התשובה חלקית, הצג מודלינג והתקדם
            postBotMessageWithEmotion(`נהדר, הבנת את הרעיון! תשובה נכונה נוספת היא: ${clarification}`, 'support');
            this.markStar(this.currentQuestionIndex); // עדיין מסמנים כוכב על הבנה חלקית
            this.successfulAnswers++;
            this.currentQuestionIndex++;
            setTimeout(() => this.askGuidingQuestion(), 1500);
        } else {
            // אם התשובה לא נכונה ולא חלקית, הצג פידבק שלילי
            const specificWrongFeedback = wrongFeedback || "בוא/י ננסה שוב. נסה/י לקרוא את הבעיה בעיון רב יותר.";
            postBotMessageWithEmotion(specificWrongFeedback, 'confuse');
            // במקרה של תשובה שגויה, לא מקדמים את השאלה המנחה ולא מסמנים כוכב
            // התלמיד נשאר על אותה שאלה עד שיענה נכון/חלקית
            toggleInput(true); // וודא שהקלט מופעל שוב
        }
      } else {
        // אם המשתמש מנסה להקליד כשהבוט לא מצפה לקלט בשלב זה
        console.log("הבוט לא מצפה לקלט בשלב זה.");
        // אפשר להוסיף הודעת שגיאה למשתמש
        postBotMessageWithEmotion("אני ממתינה לתשובה ספציפית או לבחירה. אנא התמקד/י בשאלה הנוכחית.", 'confuse');
      }
    }

    markStar(index) {
      if (stars[index]) {
        stars[index].src = 'icons-leading-questions/star_gold.png';
        stars[index].classList.add('earned');
        successSound.play();
      }
      if (this.successfulAnswers === 3 && largeAvatar) {
        setTimeout(() => {
          largeAvatar.src = `./avatars/${avatarExpressions.excited}`;
        }, 700);
      }
    }

    getRandomFeedback(type) {
      const emotional = {
        'א': ["איזה יופי, קלטת את השאלה המרכזית!", "נהדר! הבנת מה לבחון."],
        'ב': ["מעולה! אספת את הנתונים הנכונים.", "נהדר, את בכיוון הנכון עם מה שידוע."],
        'ג': ["כל הכבוד! סימנת את מה שעדיין חסר.", "מעולה! איתרת את החסר בתמונה."]
      };
      const neutral = {
        'א': ["נראה שהבנת מה נדרש למצוא. עבודה טובה!", "תשובה ברורה – מצאת את הדרוש."],
        'ב': ["הצלחת לזהות את הנתונים הקיימים.", "זיהית מה יש לנו – זה חשוב!"],
        'ג': ["סימנת נכון את החסר. זה חשוב!", "התייחסת למה שחסר – כל הכבוד."]
      };
      const pool = Math.random() < 0.5 ? emotional[type] : neutral[type];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  // --- אתחול האפליקציה ---
  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  // טיפול בכפתור האיפוס
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      localStorage.clear(); // נקה את כל ה-localStorage
      window.location.reload(); // רענן את העמוד
    });
  }

  // לוגיקת אתחול האפליקציה: הצג מסך פתיחה או המשך שיחה
  if (startButton) {
    startButton.addEventListener('click', () => {
      localStorage.setItem('chatStarted', 'true'); // סמן שהשיחה התחילה
      bot.initiateOrResumeConversation();
    });
  }

  // בהרצה ראשונית של העמוד (לאחר טעינת DOM וקובץ הבעיות)
  if (localStorage.getItem('chatStarted') === 'true') {
    // אם כבר התחילה שיחה בעבר, נסה לשחזר אותה
    bot.initiateOrResumeConversation();
  } else {
    // אם זו הפעלה ראשונה, הצג מסך פתיחה ונטרל קלט עד לחיצה על "נתחיל?"
    showScreen(welcomeScreen);
    toggleInput(false);
  }

  // --- מטפלים לאירועי לחיצה ושליחה ---

  sendButton.addEventListener('click', () => {
    const input = userInput.value.trim();
    if (!isBotTyping && input && !userInput.disabled) { // וודא שהקלט לא מנוטרל
      bot.handleStudentInputLogic(input);
      userInput.value = "";
    } else if (userInput.disabled) {
      console.log("Input is disabled, please wait for bot or select an option.");
      // אפשר להוסיף הודעה למשתמש
    }
  });

  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !userInput.disabled) { // וודא שהקלט לא מנוטרל
      sendButton.click();
    }
  });
});
