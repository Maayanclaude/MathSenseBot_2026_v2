// --- משתנים כלליים ---
document.addEventListener('DOMContentLoaded', async () => {

  // אלמנטים מה-DOM
  const startButton = document.getElementById('start-button');
  const welcomeScreen = document.getElementById('welcome-screen');
  const appMainContainer = document.getElementById('app-main-container');
  const chatWindow = document.getElementById('chat-window');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const botStatus = document.getElementById('bot-status');
  const stars = document.querySelectorAll('.star');
  const largeAvatar = document.getElementById('large-avatar');

  // סאונד חיזוק
  const successSound = new Audio('sounds/success-chime.mp3');

  // דגל כדי שלא נשלח הודעה בזמן שמתי "מקלידה"
  let isBotTyping = false;

  // הבעות הדמות - לפי שמות הקבצים שיש לך בתיקיית MatiCharacter
  const matiExpressions = {
    welcoming: "Mati_welcoming.png",
    inviting: "Mati_inviting_action.png",
    confident: "Mati_confident.png",
    compliment: "Mati_compliment.png",
    thinking: "Mati_thinking.png",
    support: "Mati_support.png",
    confuse: "Mati_confuse.png",
    empathic: "Mati_Empathic.png",
    excited: "Mati_excited.png",
    ready: "Mati_ready.png"
  };

  // ----------------------------------------------------
  // פונקציות עזר בסיסיות
  // ----------------------------------------------------

  function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'bot' ? 'bot-message' : 'student-message');

    const textSpan = document.createElement('span');
    textSpan.classList.add('message-text');
    textSpan.innerHTML = text;

    messageDiv.appendChild(textSpan);
    chatWindow.appendChild(messageDiv);

    // גלילה לסוף
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function postBotMessageWithEmotion(message, emotion = 'support', showButtons = false, buttons = []) {
    const avatarFilename = matiExpressions[emotion] || matiExpressions['support'];

    if (largeAvatar) {
      largeAvatar.src = `./MatiCharacter/${avatarFilename}`;
    }

    bot.simulateBotTyping(() => {
      addMessage('bot', message);

      if (showButtons && buttons.length) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('button-group');

        buttons.forEach(btnText => {
          const btn = document.createElement('button');
          btn.textContent = btnText;
          btn.classList.add('choice-button');

          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            bot.handleChoiceButtonClick(e);
          });

          buttonsDiv.appendChild(btn);
        });

        chatWindow.appendChild(buttonsDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    });
  }

  // ----------------------------------------------------
  // מחלקת הבוט
  // ----------------------------------------------------
  class MathProblemGuidingBot {

    constructor() {
      this.wordProblems = {};
      this.levelOrder = ['level1', 'level2', 'level3'];
      this.currentLevelIndex = 0;
      this.currentProblem = null;
      this.guidingQuestions = [];
      this.currentQuestionIndex = 0;
      this.studentGuidingAnswers = { 'א': '', 'ב': '', 'ג': '' };
      this.dialogStage = 'start';
      this.userGender = null;
      this.userName = null;
      this.completedProblems = 0;
      this.successfulAnswers = 0;
    }

    async loadProblemsFromFile() {
      const response = await fetch('questions_data.json');
      const data = await response.json();
      this.wordProblems = {
        level1: data.filter(q => q.level === 1),
        level2: data.filter(q => q.level === 2),
        level3: data.filter(q => q.level === 3)
      };
      this.currentProblem = this.chooseRandomProblem();
    }

    chooseRandomProblem() {
      const currentLevel = this.levelOrder[this.currentLevelIndex];
      const problems = this.wordProblems[currentLevel];
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

    startConversationLogic() {
      postBotMessageWithEmotion("שלום! אני מתי. נפתור יחד בעיות מילוליות במתמטיקה.", 'welcoming');
      setTimeout(() => {
        postBotMessageWithEmotion("איך קוראים לך?", 'inviting');
        this.dialogStage = 'awaiting_name';
      }, 1500);
    }

    handleChoiceButtonClick(event) {
      const btnText = event.target.textContent;

      // בחירת מגדר
      if (this.dialogStage === 'awaiting_gender') {
        this.userGender = btnText === "זכר" ? 'male' : btnText === "נקבה" ? 'female' : 'neutral';
        this.updateGuidingQuestionsByGender();

        const greeting = this.userGender === 'male'
          ? "נהדר! נדבר בלשון זכר."
          : this.userGender === 'female'
            ? "נהדר! נדבר בלשון נקבה."
            : "נשתמש בלשון ניטרלית כדי שתרגיש/י בנוח.";

        postBotMessageWithEmotion(greeting, 'confident');

        setTimeout(() => {
          postBotMessageWithEmotion("מוכנ/ה? בוא/י נתחיל! 💪", 'inviting');
        }, 1500);

        setTimeout(() => {
          postBotMessageWithEmotion(`הנה הבעיה שלנו:<br><b>${this.currentProblem.question}</b>`, 'confident');
          this.dialogStage = 'asking_guiding_questions';
          setTimeout(() => this.askGuidingQuestion(), 1500);
        }, 3500);

        return;
      }

      // אחרי שסיימנו 3 פיגומים – לשאול אם להמשיך
      if (this.dialogStage === 'continue_or_stop') {
        if (btnText === "כן") {
          this.completedProblems++;

          // הצעת עליה רמה אם פתרו מספיק
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
          // 🟣 כאן מוסיפים איפוס אוטומטי
          postBotMessageWithEmotion("אין בעיה, נחזור כשתרצה. בהצלחה!", 'support');
          this.dialogStage = 'ended';

          setTimeout(() => {
            localStorage.removeItem('chatStarted');
            window.location.reload();
          }, 4000); // מספיק זמן לקרוא את ההודעה
        }
        return;
      }

      // הצעת עליה רמה
      if (this.dialogStage === 'offer_level_up') {
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
        { key: 'ג', text: text("מה עליי לעשות כדי לפתור?", "מה עליי לעשות כדי לפתור?", "מה עלינו לעשות כדי לפתור?"), icon: "Missing_puzzle.png" }
      ];
    }

    askGuidingQuestion() {
      if (this.currentQuestionIndex < this.guidingQuestions.length) {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        const html = `<div class="guided-question"><img src="./icons/${q.icon}" alt="icon" /> ${q.text}</div>`;
        postBotMessageWithEmotion(html, 'support');
      } else {
        postBotMessageWithEmotion("רוצה להמשיך לפתור עוד בעיה?", 'inviting', true, ["כן", "לא"]);
        this.dialogStage = 'continue_or_stop';
      }
    }

    handleStudentInputLogic(input) {
      addMessage('student', input);

      if (this.dialogStage === 'awaiting_name') {
        this.userName = input;
        postBotMessageWithEmotion(`נעים להכיר, ${this.userName}!`);
        setTimeout(() => {
          postBotMessageWithEmotion("איך תרצה שאפנה אליך?", 'inviting', true, ["זכר", "נקבה", "לא משנה לי"]);
          this.dialogStage = 'awaiting_gender';
        }, 1200);
        return;
      }

      if (this.dialogStage === 'asking_guiding_questions') {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        this.studentGuidingAnswers[q.key] = input;

        const correctAnswers = this.currentProblem.correct_answers?.[q.key] || [];
        const isCorrect = correctAnswers.some(correctPhrase => input.includes(correctPhrase));

        if (isCorrect) {
          const feedback = this.getRandomFeedback(q.key);
          postBotMessageWithEmotion(feedback, 'compliment');
          this.markStar(this.currentQuestionIndex);
          this.successfulAnswers++;
          this.currentQuestionIndex++;
          setTimeout(() => this.askGuidingQuestion(), 1500);
        } else {
          const tryAgainMessage = this.userGender === 'male'
            ? "בוא ננסה שוב. נסה לקרוא את הבעיה בעיון רב יותר."
            : this.userGender === 'female'
              ? "בואי ננסה שוב. נסי לקרוא את הבעיה בעיון רב יותר."
              : "בוא/י ננסה שוב. נסה/י לקרוא את הבעיה בעיון רב יותר.";
          postBotMessageWithEmotion(tryAgainMessage, 'confuse');
        }
      }
    }

    markStar(index) {
      if (stars[index]) {
        stars[index].src = 'icons/star_gold.png';
        stars[index].classList.add('earned');
        successSound.currentTime = 0;
        successSound.play();
      }
      if (this.successfulAnswers === 3 && largeAvatar) {
        setTimeout(() => {
          largeAvatar.src = `./MatiCharacter/${matiExpressions.excited}`;
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

  // יצירת מופע בוט וטעינת שאלות
  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  // אם כבר התחילו בעבר – להיכנס ישר לאפליקציה
  if (localStorage.getItem('chatStarted') === 'true') {
    welcomeScreen.style.display = 'none';
    appMainContainer.style.display = 'grid';
    document.body.classList.add('app-started');
    bot.startConversationLogic();
  } else {
    welcomeScreen.style.display = 'flex';
    appMainContainer.style.display = 'none';
    document.body.classList.remove('app-started');
  }

  // כפתור התחלה
  if (startButton) {
    startButton.addEventListener('click', () => {
      localStorage.setItem('chatStarted', 'true');
      welcomeScreen.style.display = 'none';
      appMainContainer.style.display = 'grid';
      document.body.classList.add('app-started');
      bot.startConversationLogic();
    });
  }

  // שליחת תשובה
  sendButton.addEventListener('click', () => {
    const input = userInput.value.trim();
    if (!isBotTyping && input) {
      bot.handleStudentInputLogic(input);
      userInput.value = "";
    }
  });

  // שליחה עם אנטר
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });

});
