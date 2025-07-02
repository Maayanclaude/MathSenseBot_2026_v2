// --- משתנים גלובליים ואלמנטים מה-DOM ---
document.addEventListener('DOMContentLoaded', async () => {
  const startButton = document.getElementById('start-button');
  const welcomeScreen = document.getElementById('welcome-screen');
  const appMainContainer = document.getElementById('app-main-container');
  const chatWindow = document.getElementById('chat-window');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const botStatus = document.getElementById('bot-status');
  const stars = document.querySelectorAll('.star');
  const largeAvatar = document.getElementById('large-avatar');
  const resetButton = document.getElementById('reset-button');

  const successSound = new Audio('sounds/success-chime.mp3');
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

  // פונקציית עזר להצגה/הסתרה של מסכים (שונתה להתאים לזרימה החדשה)
  function showScreen(screenElement) {
    welcomeScreen.classList.add('hidden');
    appMainContainer.classList.add('hidden');
    // אם היו מסכים נפרדים לשם/מגדר, הם היו מוסתרים כאן
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
        buttonsDiv.classList.add('button-group');
        buttons.forEach(btnText => {
          const btn = document.createElement('button');
          btn.textContent = btnText;
          btn.classList.add('choice-button');
          btn.addEventListener('click', (e) => {
            // הסר בחירה מכפתורים קודמים באותה קבוצה
            document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected'); // סמן את הכפתור שנבחר
            bot.handleChoiceButtonClick(e); // טפל בלחיצת הכפתור בלוגיקת הבוט
          });
          buttonsDiv.appendChild(btn);
        });
        chatWindow.appendChild(buttonsDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      } else {
        // אם אין כפתורים, וודא שהקלט וכפתור השליחה מופעלים
        toggleInput(true);
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
        const response = await fetch('questions_data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.wordProblems = {
          level1: data.filter(q => q.level === 1),
          level2: data.filter(q => q.level === 2),
          level3: data.filter(q => q.level === 3)
        };
        this.currentProblem = this.chooseRandomProblem();
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
        return { question: "אין כרגע בעיות ברמה זו. נסה/י שוב מאוחר יותר.", keywords: {}, clarifications: {} };
      }
      return problems[Math.floor(Math.random() * problems.length)];
    }

    simulateBotTyping(callback, delay = 900) {
      isBotTyping = true;
      botStatus.textContent = 'מתי מקלידה...';
      setTimeout(() => {
        callback();
        isBotTyping = false;
        botStatus.textContent = 'מתי ממתינה...';
      }, delay);
    }

    // מתודה חדשה לאתחול שיחה או המשך מ-localStorage
    initiateOrResumeConversation() {
      if (localStorage.getItem('userName') && localStorage.getItem('userGender') && localStorage.getItem('dialogStage')) {
        this.userName = localStorage.getItem('userName');
        this.userGender = localStorage.getItem('userGender');
        this.dialogStage = localStorage.getItem('dialogStage');
        this.updateGuidingQuestionsByGender(); // לוודא ששאלות ההדרכה מעודכנות לפי המגדר המשוחזר

        showScreen(appMainContainer); // מעבר ישיר למסך הצ'אט
        toggleInput(true); // הפעלת קלט כי כבר אמורים להיות באמצע שיחה

        // המשך מאיפה שהפסקנו
        if (this.dialogStage === 'asking_guiding_questions') {
            postBotMessageWithEmotion(`היי ${this.userName}! ברוך/ה שוב. הנה הבעיה הנוכחית שלנו:<br><b>${this.currentProblem.question}</b>`, 'confident');
            setTimeout(() => this.askGuidingQuestion(), 1500);
        } else if (this.dialogStage === 'continue_or_stop' || this.dialogStage === 'offer_level_up') {
            // אם המשתמש היה בשלב סיום בעיה או הצעה לרמה הבאה
            postBotMessageWithEmotion(`היי ${this.userName}! רוצה להמשיך?`, 'inviting', true, ["כן", "לא"]);
        } else {
            // אם מצב לא צפוי, נתחיל מחדש
            this.startConversationLogic();
        }

      } else {
        // אם אין מידע שמור, נתחיל את השיחה מההתחלה
        this.startConversationLogic();
      }
    }


    // מתודה זו תופעל להתחלת השיחה (שאלת שם)
    startConversationLogic() {
      showScreen(appMainContainer); // עובר למסך הצ'אט הראשי
      postBotMessageWithEmotion("שלום! אני מתי. נפתור יחד בעיות מילוליות במתמטיקה.", 'welcoming');
      setTimeout(() => {
        postBotMessageWithEmotion("איך קוראים לך?", 'inviting');
        this.dialogStage = 'awaiting_name_input'; // שינוי שלב הדיאלוג
        toggleInput(true); // הפעל קלט עבור השם
      }, 1500);
      localStorage.setItem('dialogStage', this.dialogStage);
    }

    // זו המתודה שתטפל בלחיצות כפתורים *בתוך* חלון הצ'אט הראשי (למשל כפתורי מגדר, או "כן"/"לא" להמשך)
    handleChoiceButtonClick(event) {
      const btnText = event.target.textContent;

      // שלב שואל מגדר - מטופל רק באמצעות כפתורים
      if (this.dialogStage === 'awaiting_gender_input') {
        this.userGender = btnText === "זכר" ? 'male' : btnText === "נקבה" ? 'female' : 'neutral';
        addMessage('student', btnText); // הצג את בחירת המגדר כהודעת תלמיד
        localStorage.setItem('userGender', this.userGender); // שמור את המגדר
        this.updateGuidingQuestionsByGender(); // עדכן את השאלות המנחות לפי המגדר

        const greeting = this.userGender === 'male'
          ? "נהדר! נדבר בלשון זכר."
          : this.userGender === 'female'
            ? "נהדר! נדבר בלשון נקבה."
            : "נשתמש בלשון ניטרלית כדי שתרגיש/י בנוח.";
        postBotMessageWithEmotion(greeting, 'confident');

        // הודעת הכנה לפני התחלה
        setTimeout(() => {
          postBotMessageWithEmotion("מוכנ/ה? בוא/י נתחיל! 💪", 'inviting');
        }, 1500);

        // *** ההודעה החדשה שהתבקשה ***
        setTimeout(() => {
          postBotMessageWithEmotion(`נעים להכיר ${this.userName}, כעת נלמד איך הופכים מילים למספרים בשלושה שלבים.`, 'confident');
        }, 3000); // הודעה זו תוצג כ-3 שניות לאחר בחירת המגדר

        // הצגת הבעיה המילולית הראשונה ומעבר לשלב שאלות מנחות
        setTimeout(() => {
          postBotMessageWithEmotion(`הנה הבעיה שלנו:<br><b>${this.currentProblem.question}</b>`, 'confident');
          this.dialogStage = 'asking_guiding_questions';
          localStorage.setItem('dialogStage', this.dialogStage);
          setTimeout(() => this.askGuidingQuestion(), 1500);
        }, 5000); // עיכוב זה הותאם כך שיגיע לאחר ההודעה החדשה
        toggleInput(true); // הפעל קלט חופשי כשאנחנו בשלב הבעיות

      } else if (this.dialogStage === 'continue_or_stop') {
        addMessage('student', btnText); // הצג את בחירת התלמיד (כן/לא)
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
            return; // עצור כאן כדי לא להמשיך לבעיה הבאה מיד
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
          toggleInput(false); // נטרל קלט בסיום
        }
      } else if (this.dialogStage === 'offer_level_up') {
        addMessage('student', btnText); // הצג את בחירת התלמיד (כן/לא)
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
        const html = `<div class="guided-question"><img src="./icons-leading-questions/${q.icon}" alt="icon" /> ${q.text}</div>`;
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
      addMessage('student', input);
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
        const keywords = this.currentProblem.keywords?.[q.key] || [];
        const clarification = this.currentProblem.clarifications?.[q.key];
        const isPartial = keywords.some(keyword => input.includes(keyword)) && input.length <= 14;
        if (isPartial && clarification) {
          postBotMessageWithEmotion(clarification, 'support');
        } else {
          const feedback = this.getRandomFeedback(q.key);
          postBotMessageWithEmotion(feedback, 'compliment');
          this.markStar(this.currentQuestionIndex);
          this.successfulAnswers++;
          this.currentQuestionIndex++;
          setTimeout(() => this.askGuidingQuestion(), 1500);
        }
      } else {
        // אם המשתמש מנסה להקליד כשהבוט לא מצפה לקלט בשלב זה
        console.log("הבוט לא מצפה לקלט בשלב זה.");
        // אפשר להוסיף הודעת שגיאה למשתמש
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
      // אם לוחצים על התחל, נתחיל את תהליך השיחה (כולל שם ומגדר)
      localStorage.setItem('chatStarted', 'true'); // סמן שהשיחה התחילה
      bot.initiateOrResumeConversation();
    });
  }

  // בהרצה ראשונית של העמוד
  if (localStorage.getItem('chatStarted') === 'true') {
    // אם כבר התחילה שיחה בעבר, נסה לשחזר אותה
    bot.initiateOrResumeConversation();
  } else {
    // אם זו הפעלה ראשונה, הצג מסך פתיחה ונטרל קלט
    showScreen(welcomeScreen);
    toggleInput(false); // נטרל קלט לפני שהשיחה מתחילה
  }


  // --- מטפלים לאירועי לחיצה ושליחה ---

  sendButton.addEventListener('click', () => {
    const input = userInput.value.trim();
    if (!isBotTyping && input) {
      bot.handleStudentInputLogic(input);
      userInput.value = "";
    }
  });

  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });
});
