// --- script.js ---
document.addEventListener('DOMContentLoaded', async () => {
  // אלמנטים
  const welcomeScreen = document.getElementById('welcome-screen');
  const startButton = document.getElementById('start-button');
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

  let isBotTyping = false;

  // קבצי דמות מתי
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

  function addMessage(sender, text) {
    const div = document.createElement('div');
    div.classList.add('message', sender === 'bot' ? 'bot-message' : 'student-message');
    div.innerHTML = text;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function postBotMessageWithEmotion(message, emotion = 'support', showButtons = false, buttons = []) {
    const avatarFilename = matiExpressions[emotion] || matiExpressions.support;
    if (largeAvatar) {
      largeAvatar.src = `./MatiCharacter/${avatarFilename}`;
    }
    bot.simulateBotTyping(() => {
      addMessage('bot', message);
      if (showButtons && buttons.length) {
        const group = document.createElement('div');
        group.classList.add('button-group');
        buttons.forEach(txt => {
          const b = document.createElement('button');
          b.classList.add('choice-button');
          b.textContent = txt;
          b.addEventListener('click', e => {
            document.querySelectorAll('.choice-button').forEach(x => x.classList.remove('selected'));
            e.target.classList.add('selected');
            bot.handleChoiceButtonClick(e);
          });
          group.appendChild(b);
        });
        chatWindow.appendChild(group);
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
      this.dialogStage = 'start';
      this.userGender = null;
      this.userName = null;
      this.completedProblems = 0;
      this.successfulAnswers = 0;
    }

    async loadProblemsFromFile() {
      const res = await fetch('questions_data.json');
      const data = await res.json();
      this.wordProblems = {
        level1: data.filter(q => q.level === 1),
        level2: data.filter(q => q.level === 2),
        level3: data.filter(q => q.level === 3)
      };
      this.currentProblem = this.chooseRandomProblem();
    }

    chooseRandomProblem() {
      const levelKey = this.levelOrder[this.currentLevelIndex];
      const arr = this.wordProblems[levelKey];
      return arr[Math.floor(Math.random() * arr.length)];
    }

    simulateBotTyping(cb, delay = 850) {
      isBotTyping = true;
      botStatus.textContent = 'מתי מקלידה...';
      setTimeout(() => {
        cb();
        isBotTyping = false;
        botStatus.textContent = 'מתי ממתינה...';
      }, delay);
    }

    startConversationLogic() {
      postBotMessageWithEmotion("שלום, אני מתי. נפתור יחד בעיות מילוליות במתמטיקה.", 'welcoming');
      setTimeout(() => {
        postBotMessageWithEmotion("איך קוראים לך?", 'inviting');
        this.dialogStage = 'awaiting_name';
      }, 1200);
    }

    // מציג את הבעיה על הפתקית בלבד
    showCurrentProblemOnNote() {
      if (problemNote && problemNoteText && this.currentProblem) {
        problemNote.classList.remove('hidden');
        problemNoteText.textContent = this.currentProblem.question;
      }
    }

    handleChoiceButtonClick(event) {
      const txt = event.target.textContent;

      if (this.dialogStage === 'awaiting_gender') {
        this.userGender = txt === "זכר" ? 'male' : txt === "נקבה" ? 'female' : 'neutral';
        this.updateGuidingQuestionsByGender();

        const g = this.userGender === 'male'
          ? "נשתמש בלשון זכר."
          : this.userGender === 'female'
            ? "נשתמש בלשון נקבה."
            : "נשתמש בלשון שמתאימה לכולם.";

        postBotMessageWithEmotion(g, 'confident');

        setTimeout(() => {
          // כאן מציגים את הבעיה על הפתקית
          this.showCurrentProblemOnNote();
          this.dialogStage = 'asking_guiding_questions';
          setTimeout(() => this.askGuidingQuestion(), 1000);
        }, 1200);

        return;
      }

      if (this.dialogStage === 'continue_or_stop') {
        if (txt === 'כן') {
          this.completedProblems++;
          // אם עבר מספיק – אפשר להציע רמה
          if (this.completedProblems >= 5 && this.currentLevelIndex < this.levelOrder.length - 1) {
            postBotMessageWithEmotion("פתרת כבר 5 בעיות ברמה הזאת. לעבור לרמה הבאה?", 'inviting', true, ["כן, ברור", "נשאר ברמה הזו"]);
            this.dialogStage = 'offer_level_up';
            return;
          }
          // אחרת – בעיה חדשה
          this.currentProblem = this.chooseRandomProblem();
          this.currentQuestionIndex = 0;
          this.showCurrentProblemOnNote();
          this.dialogStage = 'asking_guiding_questions';
          setTimeout(() => this.askGuidingQuestion(), 800);
        } else {
          postBotMessageWithEmotion("תודה שהתרגלת איתי. נתראה בפעם הבאה.");
          this.dialogStage = 'ended';
          setTimeout(() => {
            localStorage.removeItem('chatStarted');
            window.location.reload();
          }, 3500);
        }
        return;
      }

      if (this.dialogStage === 'offer_level_up') {
        if (txt.startsWith("כן")) {
          this.currentLevelIndex++;
        }
        this.completedProblems = 0;
        this.successfulAnswers = 0;
        this.currentProblem = this.chooseRandomProblem();
        this.currentQuestionIndex = 0;
        this.showCurrentProblemOnNote();
        this.dialogStage = 'asking_guiding_questions';
        setTimeout(() => this.askGuidingQuestion(), 900);
      }
    }

    updateGuidingQuestionsByGender() {
      const isM = this.userGender === 'male';
      const isF = this.userGender === 'female';
      const t = (m, f, n) => isM ? m : isF ? f : n;
      this.guidingQuestions = [
        { key: 'א', text: t("מה אני צריך למצוא?", "מה אני צריכה למצוא?", "מה צריך למצוא?"), icon: "magnifying_glass.png" },
        { key: 'ב', text: t("מה ידוע לי מהבעיה?", "מה ידוע לי מהבעיה?", "מה ידוע לנו?"), icon: "list.png" },
        { key: 'ג', text: t("מה עליי לעשות כדי לפתור?", "מה עליי לעשות כדי לפתור?", "מה צריך לעשות כדי לפתור?"), icon: "Missing_puzzle.png" }
      ];
    }

    askGuidingQuestion() {
      if (this.currentQuestionIndex < this.guidingQuestions.length) {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        const html = `<div class="guided-question">
          <img src="./icons/${q.icon}" alt="">
          <span>${q.text}</span>
        </div>`;
        postBotMessageWithEmotion(html, 'support');
      } else {
        postBotMessageWithEmotion("רוצה לפתור בעיה נוספת?", 'inviting', true, ["כן", "לא"]);
        this.dialogStage = 'continue_or_stop';
      }
    }

    handleStudentInputLogic(input) {
      addMessage('student', input);

      if (this.dialogStage === 'awaiting_name') {
        this.userName = input;
        postBotMessageWithEmotion(`נעים מאוד, ${this.userName}.`, 'compliment');
        setTimeout(() => {
          postBotMessageWithEmotion("איך תרצה שאפנה אליך?", 'inviting', true, ["זכר", "נקבה", "לא משנה לי"]);
          this.dialogStage = 'awaiting_gender';
        }, 900);
        return;
      }

      if (this.dialogStage === 'asking_guiding_questions') {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        this.studentGuidingAnswers[q.key] = input;

        const correctArr = this.currentProblem.correct_answers?.[q.key] || [];
        const isCorrect = correctArr.some(phrase => input.includes(phrase));

        if (isCorrect) {
          postBotMessageWithEmotion("מעולה. נתקדם.", 'compliment');
          this.markStar(this.currentQuestionIndex);
          this.successfulAnswers++;
          this.currentQuestionIndex++;
          setTimeout(() => this.askGuidingQuestion(), 1000);
        } else {
          const msg = this.userGender === 'female'
            ? "לא בטוחה שזה מה שהיה כתוב. נסי לקרוא שוב את הבעיה."
            : this.userGender === 'male'
              ? "לא בטוח שזה מה שהיה כתוב. נסה לקרוא שוב את הבעיה."
              : "לא בטוח שזה היה כתוב. בואו נקרא שוב את הבעיה.";
          postBotMessageWithEmotion(msg, 'confuse');
        }
      }
    }

    markStar(i) {
      if (stars[i]) {
        stars[i].src = 'icons/star_gold.png';
        stars[i].classList.add('earned');
        successSound.currentTime = 0;
        successSound.play();
      }
      if (this.successfulAnswers === 3 && largeAvatar) {
        largeAvatar.src = `./MatiCharacter/${matiExpressions.excited}`;
      }
    }
  }

  // ───────────────────────────────
  // יצירת הבוט
  // ───────────────────────────────
  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  // אם התחילו כבר בעבר
  if (localStorage.getItem('chatStarted') === 'true') {
    welcomeScreen.classList.add('hidden');
    appMainContainer.classList.remove('hidden');
    bot.startConversationLogic();
  }

  // כפתור התחלה
  startButton.addEventListener('click', () => {
    localStorage.setItem('chatStarted', 'true');
    welcomeScreen.classList.add('fade-out');
    setTimeout(() => {
      welcomeScreen.classList.add('hidden');
      appMainContainer.classList.remove('hidden');
      bot.startConversationLogic();
    }, 500);
  });

  // שליחה
  sendButton.addEventListener('click', () => {
    const val = userInput.value.trim();
    if (!val || isBotTyping) return;
    bot.handleStudentInputLogic(val);
    userInput.value = '';
  });

  userInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendButton.click();
  });

});
