// --- script.js ---
// לוגיקת "מתי" לפי הסטוריבורד

document.addEventListener('DOMContentLoaded', async () => {
  // ===== DOM =====
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

  // סאונד כוכב
  const successSound = new Audio('sounds/success-chime.mp3');

  // דגל כתיבה
  let isBotTyping = false;

  // הבעות לפי שמות הקבצים בתיקייה MatiCharacter
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

  // ------- פונקציות עזר בסיסיות -------

  function addMessage(sender, htmlText) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'bot' ? 'bot-message' : 'student-message');
    messageDiv.innerHTML = htmlText;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function setAvatar(emotion) {
    const avatarFilename = matiExpressions[emotion] || matiExpressions.support;
    if (largeAvatar) {
      largeAvatar.src = `./MatiCharacter/${avatarFilename}`;
    }
  }

  function showProblemOnNote(text) {
    if (!text) return;
    problemNoteText.textContent = text;
    problemNote.classList.remove('hidden');
  }

  // פונקציית הודעת בוט עם "הקלדה"
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

  // ===== מחלקת הבוט =====
  class MathProblemGuidingBot {
    constructor() {
      this.wordProblems = {};              // יכיל level1/2/3
      this.levelOrder = ['level1', 'level2', 'level3'];
      this.currentLevelIndex = 0;
      this.currentProblem = null;

      this.guidingQuestions = [];          // יתעדכן לפי מגדר
      this.currentQuestionIndex = 0;

      this.studentGuidingAnswers = { 'א': '', 'ב': '', 'ג': '' };

      this.dialogStage = 'start';          // start → awaiting_name → awaiting_gender → asking_guiding_questions → continue_or_stop
      this.userGender = null;
      this.userName = null;

      this.successfulAnswers = 0;
      this.completedProblems = 0;
    }

    // טעינת בעיות – עם fallback
    async loadProblemsFromFile() {
      try {
        const response = await fetch('questions_data.json');
        if (!response.ok) throw new Error('no file');
        const data = await response.json();
        this.wordProblems = {
          level1: data.filter(q => q.level === 1),
          level2: data.filter(q => q.level === 2),
          level3: data.filter(q => q.level === 3)
        };
      } catch (err) {
        // fallback – בעיה של איתי
        this.wordProblems = {
          level1: [
            {
              id: "lego-1",
              level: 1,
              question: "איתי רוצה לקנות ערכת לגו גדולה שעולה 1,850 ש\"ח. עד עכשיו חסך 760 ש\"ח. כמה כסף עליו להוסיף ולחסוך כדי לקנות את הערכה?",
              expected: {
                goal: ["מה צריך למצוא", "כמה חסר לו", "כמה עליו להוסיף"],
                known: ["1850", "760", "מחיר הערכה", "כמה חסך"],
                action: ["חיסור", "להפחית", "1850 פחות 760"]
              },
              correct_answers: {
                "א": ["כמה חסר לו", "כמה עליו להוסיף", "הסכום שחסר", "כמה כסף עליו להוסיף"],
                "ב": ["1850", "760", "מחיר הערכה", "חסך 760"],
                "ג": ["חיסור", "להפחית", "1850 פחות 760"]
              },
              partial_answers: {
                "א": ["שיישלים", "שיקנה", "מה חסר"],
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
      const levelKey = this.levelOrder[this.currentLevelIndex];
      const problems = this.wordProblems[levelKey] || [];
      if (!problems.length) return null;
      const idx = Math.floor(Math.random() * problems.length);
      return problems[idx];
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

    // שלב פתיחה
    startConversationLogic() {
      // 1) היי, אני מתי
      postBotMessageWithEmotion("היי, אני מתי.", 'welcoming');
      // 2) יחד נפתור...
      setTimeout(() => {
        postBotMessageWithEmotion("יחד נפתור בעיות מילוליות במתמטיקה בשלושה שלבים.", 'support');
      }, 1100);
      // 3) איך קוראים לך?
      setTimeout(() => {
        postBotMessageWithEmotion("אשמח לדעת איך קוראים לך?", 'inviting');
        this.dialogStage = 'awaiting_name';
      }, 2100);
    }

    // אחרי לחיצה על כפתור (מגדר, כן/לא וכו’)
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

        // עכשיו מציגים את הבעיה על הפתקית
        setTimeout(() => {
          postBotMessageWithEmotion("נהדר! נתחיל עם הבעיה הראשונה שלנו.", 'inviting');
        }, 1000);

        setTimeout(() => {
          if (this.currentProblem) {
            showProblemOnNote(this.currentProblem.question);
          }
          // עוברים לשלב הפיגום
          this.dialogStage = 'asking_guiding_questions';
          this.currentQuestionIndex = 0;
          this.askGuidingQuestion();
        }, 2000);

        return;
      }

      // כשיגיעי שלב "עוד בעיה?" נוכל לטפל פה
    }

    // התאמת הטקסטים לפי מגדר
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

    // שליחת השאלה המנחה
    askGuidingQuestion() {
      if (this.currentQuestionIndex < this.guidingQuestions.length) {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        const html = `<div class="guided-question"><img src="./icons/${q.icon}" alt="icon" /> ${q.text}</div>`;
        postBotMessageWithEmotion(html, 'support');
      } else {
        // סיימנו 3 פיגומים
        postBotMessageWithEmotion("סיימנו את שלושת השלבים. תרצה לפתור עוד בעיה?", 'inviting', true, ["כן", "לא"]);
        this.dialogStage = 'continue_or_stop';
      }
    }

    // קבלת תשובה מהתלמיד/ה
    handleStudentInputLogic(input) {
      const userText = input.trim();
      if (!userText) return;

      // הצגת מה שהמשתמש כתב
      addMessage('student', userText);

      // 1) שלב שם
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

      // 2) שלב הפיגומים
      if (this.dialogStage === 'asking_guiding_questions') {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        this.studentGuidingAnswers[q.key] = userText;

        const correct = this.currentProblem?.correct_answers?.[q.key] || [];
        const partial = this.currentProblem?.partial_answers?.[q.key] || [];
        const hints = this.currentProblem?.hints || [];

        // בדיקת דיוק
        const isExact = correct.some(ph => userText.includes(ph));
        const isPartial = !isExact && partial.some(ph => userText.includes(ph));

        // 1) תשובה מדויקת
        if (isExact) {
          postBotMessageWithEmotion(this.getPositiveFeedback(q.key), 'compliment');
          this.markStar(this.currentQuestionIndex);
          this.successfulAnswers++;
          this.currentQuestionIndex++;
          setTimeout(() => this.askGuidingQuestion(), 1100);
          return;
        }

        // 2) תשובה חלקית – מודלינג
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

        // 3) תשובה לא נכונה
        const hintText = hints[0] || "נסי לקרוא שוב את המשפט האחרון בשאלה.";
        postBotMessageWithEmotion(`לא נורא, ננסה שוב. ${hintText}`, 'empathic');
        // לא מתקדמים, מחכים לתשובה טובה יותר
      }

      // 3) אם הגענו לכאן – זה שלב אחר (נוכל להרחיב ל"עוד בעיה")
    }

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
        'א': [
          "מעולה! זיהית מה מבקשים.",
          "יפה מאוד, זה בדיוק מה שהשאלה רוצה."
        ],
        'ב': [
          "מצוין, אספת את הנתונים הנכונים.",
          "נהדר, עכשיו ברור מה ידוע לנו."
        ],
        'ג': [
          "נכון מאוד, זו פעולה שתוביל לפתרון.",
          "מצוין, זו דרך טובה לפתור."
        ]
      };
      const arr = bank[stepKey] || ["כל הכבוד!"];
      return arr[Math.floor(Math.random() * arr.length)];
    }

    modelStudentAnswer(stepKey) {
      // ניסוחים "נכונים" שהבוט יכול להחזיר
      const models = {
        'א': "כמה כסף חסר לאיתי כדי לקנות את הערכה.",
        'ב': "הערכה עולה 1,850 ש\"ח והוא חסך 760 ש\"ח.",
        'ג': "צריך לעשות חיסור: 1,850 פחות 760."
      };
      return models[stepKey] || "";
    }
  }

  // ===== יצירת הבוט =====
  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  // ===== אירועים =====

  // מעבר ממסך פתיחה לאפליקציה
  if (startButton) {
    startButton.addEventListener('click', () => {
      // מסתיר את מסך הפתיחה
      welcomeScreen.classList.add('hidden');
      // מציג את האפליקציה
      appMainContainer.classList.remove('hidden');
      // מתחיל שיחה
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

  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendButton.click();
    }
  });

});


