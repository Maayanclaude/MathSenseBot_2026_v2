// --- משתנים כלליים ---
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

  // אלמנטים חדשים שנוספו מה-HTML עבור מסכי השם והמגדר
  const nameQuestionScreen = document.getElementById('name-question');
  const userNameInput = document.getElementById('user-name');
  const submitNameButton = document.getElementById('submit-name');
  const genderQuestionScreen = document.getElementById('gender-question');
  const maleButton = document.getElementById('male');
  const femaleButton = document.getElementById('female');
  const neutralButton = document.getElementById('neutral');


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

  // פונקציית עזר להצגה/הסתרה של מסכים
  function showScreen(screenElement) {
    welcomeScreen.classList.add('hidden');
    appMainContainer.classList.add('hidden');
    nameQuestionScreen.classList.add('hidden');
    genderQuestionScreen.classList.add('hidden');
    document.body.classList.remove('app-started'); // לוודא שמוסר הקלאס

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

  // פונקציה מעודכנת לשליחת הודעת בוט עם אפשרות לכפתורים (תטפל רק בתוך חלון הצ'אט הראשי)
  function postBotMessageWithEmotion(message, emotion = 'support', showButtons = false, buttons = []) {
    const avatarFilename = avatarExpressions[emotion] || avatarExpressions['support'];
    if (largeAvatar) largeAvatar.src = `./avatars/${avatarFilename}`;
    bot.simulateBotTyping(() => {
      addMessage('bot', message);
      if (showButtons && buttons.length) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('button-group');
        buttons.forEach(btnText => {
          const btn = document.createElement('button');
          btn.textContent = btnText;
          btn.classList.add('choice-button');
          // כאן ה-Event Listener צריך לקרוא למתודה הנכונה בבוט
          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            // לוודא שזה מגיע לבוט לטיפול בלוגיקה (רק לכפתורים שמוצגים בצ'אט עצמו)
            bot.handleChatButtonChoice(e.target.textContent); // מתודה חדשה שתיצור בבוט
          });
          buttonsDiv.appendChild(btn);
        });
        chatWindow.appendChild(buttonsDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    });
  }

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
        // טיפול בשגיאה, לדוגמה הצגת הודעה למשתמש
        alert("אירעה שגיאה בטעינת הבעיות. נסה/י לרענן את העמוד.");
      }
    }

    chooseRandomProblem() {
      const currentLevel = this.levelOrder[this.currentLevelIndex];
      const problems = this.wordProblems[currentLevel];
      if (!problems || problems.length === 0) {
        console.warn(`No problems found for level: ${currentLevel}`);
        // אולי לחזור לרמה קודמת או להציג הודעה
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

    // מתודה זו תופעל לאחר לחיצה על "נתחיל?"
    promptForName() {
      showScreen(nameQuestionScreen); // הצג את מסך שאלת השם
      this.dialogStage = 'awaiting_name_input'; // שינוי שלב הדיאלוג
    }

    // מתודה זו תופעל לאחר שליחת השם
    handleNameSubmission(name) {
      this.userName = name.trim();
      if (!this.userName) {
        alert("בבקשה הזן/הזיני שם."); // או טיפול טוב יותר ב-UI
        return;
      }
      addMessage('student', this.userName); // הוסף את השם שהוזן כהודעת תלמיד
      postBotMessageWithEmotion(`נעים להכיר, ${this.userName}!`, 'welcoming');
      setTimeout(() => {
        showScreen(genderQuestionScreen); // הצג את מסך שאלת המגדר
        this.dialogStage = 'awaiting_gender_choice'; // שינוי שלב
      }, 1200);
    }

    // מתודה זו תופעל לאחר בחירת מגדר
    handleGenderChoice(gender) {
      this.userGender = gender;
      addMessage('student', gender === 'male' ? "זכר" : gender === 'female' ? "נקבה" : "לא משנה לי"); // הצג את הבחירה כהודעת תלמיד
      this.updateGuidingQuestionsByGender();
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

      setTimeout(() => {
        showScreen(appMainContainer); // עבר למסך האפליקציה הראשי (צ'אט)
        postBotMessageWithEmotion(`הנה הבעיה שלנו:<br><b>${this.currentProblem.question}</b>`, 'confident');
        this.dialogStage = 'asking_guiding_questions';
        setTimeout(() => this.askGuidingQuestion(), 1500);
      }, 5000); // עיכוב זה הותאם כך שיגיע לאחר ההודעה החדשה
    }


    // זו המתודה שתטפל בלחיצות כפתורים *בתוך* חלון הצ'אט הראשי (למשל "כן"/"לא" להמשך)
    handleChatButtonChoice(btnText) {
      if (this.dialogStage === 'continue_or_stop') {
        if (btnText === "כן") {
          this.completedProblems++;

          if (this.completedProblems >= 5 && this.currentLevelIndex < this.levelOrder.length - 1) {
            const name = this.userName ? ` ${this.userName}` : "";
            postBotMessageWithEmotion(`וואו${name}! פתרת כבר 5 בעיות ברמה הזו 🎯`, 'excited');
            setTimeout(() => {
              postBotMessageWithEmotion("רוצה לעבור לרמה מתקדמת יותר?", 'inviting', true, ["כן, ברור!", "נשאר ברמה הזו"]);
              this.dialogStage = 'offer_level_up';
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
          postBotMessageWithEmotion(`הנה הבעיה:<br><b>${this.currentProblem.question}</b>`, 'confident');
          setTimeout(() => this.askGuidingQuestion(), 1500);
        } else {
          postBotMessageWithEmotion("אין בעיה, נחזור כשתרצה. בהצלחה!", 'support');
          this.dialogStage = 'ended';
        }
      } else if (this.dialogStage === 'offer_level_up') {
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
            setTimeout(() => this.askGuidingQuestion(), 1500);
          }, 1800);
        } else {
          postBotMessageWithEmotion("אין בעיה, נמשיך באותה רמה 😊", 'support');
          this.currentProblem = this.chooseRandomProblem();
          this.currentQuestionIndex = 0;
          this.dialogStage = 'asking_guiding_questions';
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
      } else {
        postBotMessageWithEmotion("רוצה להמשיך לפתור עוד בעיה?", 'inviting', true, ["כן", "לא"]);
        this.dialogStage = 'continue_or_stop';
      }
    }

    handleStudentInputLogic(input) {
      addMessage('student', input);
      if (this.dialogStage === 'asking_guiding_questions') {
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

  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  // *** לוגיקת אתחול האפליקציה המעודכנת ***
  // תמיד מתחילים במסך הפתיחה, אלא אם כבר התחילה שיחה (נשמר ב-localStorage)
  if (localStorage.getItem('chatStarted') === 'true' && localStorage.getItem('userName') && localStorage.getItem('userGender')) {
    // אם יש מידע ב-localStorage, שחזר אותו
    bot.userName = localStorage.getItem('userName');
    bot.userGender = localStorage.getItem('userGender');
    bot.updateGuidingQuestionsByGender(); // לוודא ששאלות ההדרכה מעודכנות לפי המגדר המשוחזר
    showScreen(appMainContainer);
    // התחל את השיחה מנקודה מתקדמת יותר (לדוגמה, הצג ישר את הבעיה)
    postBotMessageWithEmotion(`היי ${bot.userName}! ברוך/ה שוב. הנה הבעיה הבאה שלנו:<br><b>${bot.currentProblem.question}</b>`, 'confident');
    bot.dialogStage = 'asking_guiding_questions';
    setTimeout(() => bot.askGuidingQuestion(), 1500);
  } else {
    showScreen(welcomeScreen); // הצג את מסך הפתיחה
    localStorage.removeItem('chatStarted'); // וודא שהסטטוס מאופס אם לא הכל קיים
    localStorage.removeItem('userName');
    localStorage.removeItem('userGender');
  }


  if (resetButton) {
    resetButton.addEventListener('click', () => {
      localStorage.removeItem('chatStarted');
      localStorage.removeItem('userName');
      localStorage.removeItem('userGender');
      window.location.reload();
    });
  }

  // --- מטפלים לאירועי לחיצה של כפתורי מסכי הפתיחה ---

  // כפתור "נתחיל?" במסך הפתיחה
  if (startButton) {
    startButton.addEventListener('click', () => {
      bot.promptForName(); // קרא למתודה שתעביר לשאלת השם
    });
  }

  // כפתור "שלח" במסך שאלת השם
  if (submitNameButton) {
    submitNameButton.addEventListener('click', () => {
      bot.handleNameSubmission(userNameInput.value);
      localStorage.setItem('userName', userNameInput.value.trim()); // שמור את השם
    });
  }

  // כפתורי מגדר במסך שאלת המגדר
  if (maleButton) {
    maleButton.addEventListener('click', () => {
      bot.handleGenderChoice('male');
      localStorage.setItem('userGender', 'male'); // שמור את המגדר
      localStorage.setItem('chatStarted', 'true'); // עכשיו ניתן לסמן שהשיחה התחילה
    });
  }
  if (femaleButton) {
    femaleButton.addEventListener('click', () => {
      bot.handleGenderChoice('female');
      localStorage.setItem('userGender', 'female'); // שמור את המגדר
      localStorage.setItem('chatStarted', 'true'); // עכשיו ניתן לסמן שהשיחה התחילה
    });
  }
  if (neutralButton) {
    neutralButton.addEventListener('click', () => {
      bot.handleGenderChoice('neutral');
      localStorage.setItem('userGender', 'neutral'); // שמור את המגדר
      localStorage.setItem('chatStarted', 'true'); // עכשיו ניתן לסמן שהשיחה התחילה
    });
  }

  // כפתור שליחת הודעה בחלון הצ'אט הראשי
  sendButton.addEventListener('click', () => {
    const input = userInput.value.trim();
    if (!isBotTyping && input) {
      // ודא ששלב הדיאלוג תואם לקבלת קלט מהמשתמש (לדוגמה, שאלות מנחות)
      if (bot.dialogStage === 'asking_guiding_questions') {
         bot.handleStudentInputLogic(input);
         userInput.value = "";
      } else {
          // אם המשתמש מנסה להקליד כשהבוט לא מצפה לקלט בשלב זה
          // ניתן להציג הודעה או פשוט להתעלם
          console.log("הבוט לא מצפה לקלט בשלב זה.");
          addMessage('student', input); // עדיין להציג את קלט התלמיד
          userInput.value = "";
      }
    }
  });

  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });
});
