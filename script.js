



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
  const problemNote = document.getElementById('problem-note');
  const problemNoteText = document.getElementById('problem-note-text');

  // סאונד חיזוק
  const successSound = new Audio('sounds/success-chime.mp3');

  // דגל כדי שלא נשלח הודעה בזמן שמתי "מקלידה"
  let isBotTyping = false;

  // הבעות הדמות
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

  // --------- פונקציות עזר ---------
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

  // --------- מחלקת הבוט ---------
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

    // פתיחת שיחה
    startConversationLogic() {
      postBotMessageWithEmotion("היי, אני מתי.", 'welcoming');
      setTimeout(() => {
        postBotMessageWithEmotion("יחד נפתור בעיות מילוליות בשלושה שלבים.", 'support');
      }, 900);
      setTimeout(() => {
        postBotMessageWithEmotion("אשמח לדעת איך קוראים לך?", 'inviting');
        this.dialogStage = 'awaiting_name';
      }, 1700);
    }

    handleChoiceButtonClick(event) {
      const btnText = event.target.textContent;

      // בחירת מגדר
      if (this.dialogStage === 'awaiting_gender') {
        this.userGender = btnText === "בן" ? 'male' : btnText === "בת" ? 'female' : 'neutral';
        this.updateGuidingQuestionsByGender();

        const greeting = this.userGender === 'male'
          ? `נעים מאוד, ${this.userName}. נדבר בלשון זכר.`
          : this.userGender === 'female'
            ? `נעים מאוד, ${this.userName}. נדבר בלשון נקבה.`
            : `נעים מאוד, ${this.userName}. נדבר בלשון ניטרלית.`;

        postBotMessageWithEmotion(greeting, 'confident');

        // הסבר + כפתור מוכנה
        setTimeout(() => {
          postBotMessageWithEmotion(
            "נהדר! בואי נתחיל. הנה הבעיה המילולית הראשונה שלנו! קראי אותה טוב-טוב, וכשתהיי מוכנה – לחצי 'אני מוכנ/ה' ונפתור אותה ב-3 שלבים.",
            'ready',
            true,
            ["אני מוכנ/ה"]
          );
          this.dialogStage = 'waiting_ready_click';
        }, 1300);

        return;
      }

      // לחיצה על "אני מוכנ/ה"
      if (this.dialogStage === 'waiting_ready_click') {
        if (problemNote && this.currentProblem) {
          problemNote.classList.remove('hidden');
          problemNoteText.textContent = this.currentProblem.question;
        }
        this.dialogStage = 'asking_guiding_questions';
        this.currentQuestionIndex = 0;
        this.askGuidingQuestion();
        return;
      }

      // האם להמשיך לעוד בעיה
      if (this.dialogStage === 'continue_or_stop') {
        if (btnText === "כן") {
          this.currentProblem = this.chooseRandomProblem();
          this.currentQuestionIndex = 0;
          this.successfulAnswers = 0;

          if (problemNote && this.currentProblem) {
            problemNote.classList.remove('hidden');
            problemNoteText.textContent = this.currentProblem.question;
          }

          postBotMessageWithEmotion("שלב 1: מה צריך למצוא?", 'support');
          this.dialogStage = 'asking_guiding_questions';
        } else {
          postBotMessageWithEmotion("אין בעיה, נתראה בהמשך 💜", 'support');
          this.dialogStage = 'ended';
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

          if (problemNote && this.currentProblem) {
            problemNote.classList.remove('hidden');
            problemNoteText.textContent = this.currentProblem.question;
          }

          postBotMessageWithEmotion("מעולה! עוברים לרמה הבאה 💪", 'confident');
          setTimeout(() => {
            postBotMessageWithEmotion("שלב 1: מה צריך למצוא?", 'support');
            this.dialogStage = 'asking_guiding_questions';
          }, 1000);
        } else {
          // נשארים ברמה
          this.currentProblem = this.chooseRandomProblem();
          this.currentQuestionIndex = 0;
          if (problemNote && this.currentProblem) {
            problemNote.classList.remove('hidden');
            problemNoteText.textContent = this.currentProblem.question;
          }
          postBotMessageWithEmotion("אין בעיה, נמשיך באותה רמה 😊", 'support');
          setTimeout(() => {
            postBotMessageWithEmotion("שלב 1: מה צריך למצוא?", 'support');
            this.dialogStage = 'asking_guiding_questions';
          }, 900);
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
        postBotMessageWithEmotion(`נעים מאוד, ${this.userName}!`, 'compliment');
        setTimeout(() => {
          postBotMessageWithEmotion("ואיך תרצה שאפנה אליך?", 'inviting', true, ["בן", "בת", "לא משנה"]);
          this.dialogStage = 'awaiting_gender';
        }, 900);
        return;
      }

      if (this.dialogStage === 'asking_guiding_questions') {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        this.studentGuidingAnswers[q.key] = input;

        const correctAnswers = this.currentProblem.correct_answers?.[q.key] || [];
        const isCorrect = correctAnswers.some(correctPhrase => input.includes(correctPhrase));

        if (isCorrect) {
          postBotMessageWithEmotion(this.getRandomFeedback(q.key), 'compliment');
          this.markStar(this.currentQuestionIndex);
          this.successfulAnswers++;
          this.currentQuestionIndex++;
          setTimeout(() => this.askGuidingQuestion(), 1100);
        } else {
          const tryAgainMessage = this.userGender === 'male'
            ? "לא בדיוק. נסה לקרוא שוב את הבעיה בעיון."
            : this.userGender === 'female'
              ? "לא בדיוק. נסי לקרוא שוב את הבעיה בעיון."
              : "לא בדיוק. נסה/י לקרוא שוב את הבעיה בעיון.";
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

  // יצירת מופע בוט
  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  // אם כבר התחילו בעבר
  if (localStorage.getItem('chatStarted') === 'true') {
    welcomeScreen.style.display = 'none';
    appMainContainer.style.display = 'flex';
    bot.startConversationLogic();
  } else {
    welcomeScreen.style.display = 'block';
    appMainContainer.style.display = 'none';
  }

  // כפתור התחלה
  if (startButton) {
    startButton.addEventListener('click', () => {
      localStorage.setItem('chatStarted', 'true');
      welcomeScreen.style.display = 'none';
      appMainContainer.style.display = 'flex';
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
