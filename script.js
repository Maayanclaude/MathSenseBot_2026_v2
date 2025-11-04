// script.js
// לוגיקה מלאה לפי הסטוריבורד

document.addEventListener('DOMContentLoaded', async () => {
  // ===== אחיזות ב-DOM =====
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

  // סאונד
  const successSound = new Audio('sounds/success-chime.mp3');

  // דגל "מקלידה"
  let isBotTyping = false;

  // שמות הקבצים של מתי (כמו בתיקייה שלך)
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

  // =========================
  // פונקציות עזר
  // =========================
  function addMessage(sender, htmlText) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'bot' ? 'bot-message' : 'student-message');
    messageDiv.innerHTML = htmlText;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function setAvatar(emotion) {
    const file = matiExpressions[emotion] || matiExpressions.support;
    if (largeAvatar) {
      largeAvatar.src = `./MatiCharacter/${file}`;
    }
  }

  function showProblemOnNote(text) {
    if (!text) return;
    problemNoteText.textContent = text;
    problemNote.classList.remove('hidden');
  }

  // הודעת בוט עם "מקלידה..."
  function postBotMessageWithEmotion(message, emotion = 'support', showButtons = false, buttons = []) {
    setAvatar(emotion);
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

  // =========================
  // מחלקת הבוט
  // =========================
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

      this.successfulAnswers = 0;
      this.completedProblems = 0;
    }

    // ניסיון לטעון מקובץ, ואם לא – בעיית איתי
    async loadProblemsFromFile() {
      try {
        const resp = await fetch('questions_data.json');
        if (!resp.ok) throw new Error('no file');
        const data = await resp.json();
        this.wordProblems = {
          level1: data.filter(q => q.level === 1),
          level2: data.filter(q => q.level === 2),
          level3: data.filter(q => q.level === 3)
        };
      } catch (e) {
        // fallback – איתי והלגו
        this.wordProblems = {
          level1: [
            {
              id: "lego-1",
              level: 1,
              question: "איתי רוצה לקנות ערכת לגו גדולה שעולה 1,850 ש\"ח. עד עכשיו חסך 760 ש\"ח. כמה כסף עליו להוסיף ולחסוך כדי לקנות את הערכה?",
              correct_answers: {
                "א": ["כמה חסר לו", "כמה עליו להוסיף", "הסכום שחסר", "כמה כסף עליו להוסיף"],
                "ב": ["1850", "760", "מחיר הערכה", "חסך 760"],
                "ג": ["חיסור", "להפחית", "1850 פחות 760"]
              },
              partial_answers: {
                "א": ["מה חסר", "הכסף שחסר", "שישלים", "שיקנה"],
                "ב": [],
                "ג": []
              },
              hints: [
                "שימי לב למשפט האחרון – מה מבקשים?",
                "נסי לכתוב במילים שלך מה חסר לאיתי.",
                "אחרי שנבין מה חסר – נדע איזו פעולה מתאימה."
              ]
            }
          ],
          level2: [],
          level3: []
        };
      }

      this.currentProblem = this.chooseRandomProblem();
    }

    chooseRandomProblem() {
      const key = this.levelOrder[this.currentLevelIndex];
      const arr = this.wordProblems[key] || [];
      if (!arr.length) return null;
      return arr[Math.floor(Math.random() * arr.length)];
    }

    simulateBotTyping(callback, delay = 850) {
      isBotTyping = true;
      if (botStatus) botStatus.textContent = 'מתי מקלידה...';
      setTimeout(() => {
        callback();
        isBotTyping = false;
        if (botStatus) botStatus.textContent = 'מתי ממתינה...';
      }, delay);
    }

    // ===== פתיחת השיחה =====
    startConversationLogic() {
      postBotMessageWithEmotion("היי, אני מתי.", 'welcoming');
      setTimeout(() => {
        postBotMessageWithEmotion("יחד נפתור בעיות מילוליות במתמטיקה בשלושה שלבים.", 'support');
      }, 1000);
      setTimeout(() => {
        postBotMessageWithEmotion("אשמח לדעת איך קוראים לך?", 'inviting');
        this.dialogStage = 'awaiting_name';
      }, 1900);
    }

    // ===== לחיצה על כפתור (מגדר / מוכנה) =====
    handleChoiceButtonClick(event) {
      const choice = event.target.textContent;

      // בחירת מגדר
      if (this.dialogStage === 'awaiting_gender') {
        this.userGender =
          choice === "בן" ? 'male' :
          choice === "בת" ? 'female' : 'neutral';

        this.updateGuidingQuestionsByGender();

        const greeting =
          this.userGender === 'male'
            ? "נהדר, אדבר איתך בלשון זכר."
            : this.userGender === 'female'
              ? "נהדר, אדבר איתך בלשון נקבה."
              : "מצוין, אדבר בצורה ניטרלית.";

        postBotMessageWithEmotion(greeting, 'confident');

        // עכשיו ההנחיה לפני הבעיה + כפתור "מוכנה"
        setTimeout(() => {
          postBotMessageWithEmotion(
            "נהדר! בואי נתחיל.<br>הנה הבעיה המילולית הראשונה שלנו. קראי אותה טוב־טוב, וכשתהיי מוכנה נפתור אותה ב-3 שלבים.",
            'inviting',
            true,
            ["מוכנה"]
          );
          this.dialogStage = 'awaiting_ready';
        }, 1100);

        return;
      }

      // לחיצה על "מוכנה" – להציג את הבעיה בפתקית ולהתחיל פיגום
      if (this.dialogStage === 'awaiting_ready' && choice === "מוכנה") {
        postBotMessageWithEmotion("מעולה. הנה הבעיה שלך:", 'ready');

        setTimeout(() => {
          if (this.currentProblem) {
            showProblemOnNote(this.currentProblem.question);
          }
          this.dialogStage = 'asking_guiding_questions';
          this.currentQuestionIndex = 0;
          this.askGuidingQuestion();
        }, 900);
        return;
      }

      // כאן אפשר בהמשך לטפל ב"כן/לא" של עוד בעיה
    }

    // ===== התאמת שאלות הפיגום למגדר =====
    updateGuidingQuestionsByGender() {
      const isMale = this.userGender === 'male';
      const isFemale = this.userGender === 'female';
      const t = (m, f, n) => isMale ? m : isFemale ? f : n;

      this.guidingQuestions = [
        { key: 'א', text: t("שלב 1: מה אני צריך למצוא?", "שלב 1: מה אני צריכה למצוא?", "שלב 1: מה צריך למצוא?"), icon: "magnifying_glass.png" },
        { key: 'ב', text: t("שלב 2: מה אני יודע מהבעיה?", "שלב 2: מה אני יודעת מהבעיה?", "שלב 2: מה ידוע לנו?"), icon: "list.png" },
        { key: 'ג', text: t("שלב 3: מה עליי לעשות כדי לפתור?", "שלב 3: מה עליי לעשות כדי לפתור?", "שלב 3: מה עלינו לעשות כדי לפתור?"), icon: "Missing_puzzle.png" }
      ];
    }

    // ===== שליחת שאלה מנחה =====
    askGuidingQuestion() {
      if (this.currentQuestionIndex < this.guidingQuestions.length) {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        const html = `<div class="guided-question"><img src="./icons/${q.icon}" alt="icon" /> ${q.text}</div>`;
        postBotMessageWithEmotion(html, 'support');
      } else {
        postBotMessageWithEmotion("סיימנו את שלושת השלבים. תרצה לפתור עוד בעיה?", 'inviting', true, ["כן", "לא"]);
        this.dialogStage = 'continue_or_stop';
      }
    }

    // ===== קבלת תשובה חופשית מהלומד/ת =====
    handleStudentInputLogic(input) {
      const userText = input.trim();
      if (!userText) return;

      // נציג בצ'אט מה שהמשתמש כתב
      addMessage('student', userText);

      // שלב: שם
      if (this.dialogStage === 'awaiting_name') {
        this.userName = userText;
        postBotMessageWithEmotion(`נעים מאוד, ${this.userName}.`, 'compliment');

        setTimeout(() => {
          postBotMessageWithEmotion(
            "אני רוצה לוודא שאני פונה אליך נכון. איך תרצה שאפנה אליך?",
            'inviting',
            true,
            ["בן", "בת", "לא משנה"]
          );
          this.dialogStage = 'awaiting_gender';
        }, 900);

        return;
      }

      // שלב: פיגומים
      if (this.dialogStage === 'asking_guiding_questions') {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        this.studentGuidingAnswers[q.key] = userText;

        const correct = this.currentProblem?.correct_answers?.[q.key] || [];
        const partial = this.currentProblem?.partial_answers?.[q.key] || [];
        const hints = this.currentProblem?.hints || [];

        const isExact = correct.some(ph => userText.includes(ph));
        const isPartial = !isExact && partial.some(ph => userText.includes(ph));

        // 1) תשובה מדויקת
        if (isExact) {
          postBotMessageWithEmotion(this.getPositiveFeedback(q.key), 'compliment');
          this.markStar(this.currentQuestionIndex);
          this.successfulAnswers++;
          this.currentQuestionIndex++;
          setTimeout(() => this.askGuidingQuestion(), 1000);
          return;
        }

        // 2) תשובה חלקית → מודלינג
        if (isPartial) {
          const modeled = this.modelStudentAnswer(q.key);
          postBotMessageWithEmotion(
            `את בכיוון. אפשר לנסח את זה כך: <b>${modeled}</b>`,
            'support'
          );
          this.markStar(this.currentQuestionIndex);
          this.successfulAnswers++;
          this.currentQuestionIndex++;
          setTimeout(() => this.askGuidingQuestion(), 1200);
          return;
        }

        // 3) תשובה לא נכונה → רמז
        const hintText = hints[0] || "נסי לקרוא שוב את המשפט האחרון בשאלה.";
        postBotMessageWithEmotion(
          `לא נורא, ננסה שוב. ${hintText}`,
          'empathic'
        );
        return;
      }

      // אם הגענו לכאן – מצבים אחרים (עוד בעיה וכו') אפשר להרחיב אחר כך
    }

    // ===== כוכבים =====
    markStar(index) {
      if (stars[index]) {
        stars[index].src = 'icons/star_gold.png';
        stars[index].classList.add('earned');
        successSound.currentTime = 0;
        successSound.play();
      }
    }

    getPositiveFeedback(stepKey) {
      const bank = {
        'א': ["מעולה! זיהית מה מבקשים.", "יפה מאוד, זו המטרה של השאלה."],
        'ב': ["מצוין, אספת את הנתונים הנכונים.", "טוב מאוד, עכשיו ברור מה ידוע לנו."],
        'ג': ["נכון מאוד, זו פעולה שתוביל לפתרון.", "מעולה, בחרת דרך מתאימה."]
      };
      const arr = bank[stepKey] || ["כל הכבוד!"];
      return arr[Math.floor(Math.random() * arr.length)];
    }

    modelStudentAnswer(stepKey) {
      const models = {
        'א': "כמה כסף חסר לאיתי כדי לקנות את הערכה.",
        'ב': "הערכה עולה 1,850 ש\"ח והוא חסך 760 ש\"ח.",
        'ג': "צריך לעשות חיסור: 1,850 פחות 760."
      };
      return models[stepKey] || "";
    }
  }

  // ===== יצירת הבוט וטעינת הבעיות =====
  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  // ===== אירועים =====

  // מסך פתיחה → אפליקציה
  if (startButton) {
    startButton.addEventListener('click', () => {
      welcomeScreen.classList.add('hidden');
      appMainContainer.classList.remove('hidden');
      bot.startConversationLogic();
    });
  }

  // שליחת תשובה
  sendButton.addEventListener('click', () => {
    const txt = userInput.value.trim();
    if (!isBotTyping && txt) {
      bot.handleStudentInputLogic(txt);
      userInput.value = "";
    }
  });

  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendButton.click();
    }
  });

});



