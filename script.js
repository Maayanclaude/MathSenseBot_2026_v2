document.addEventListener('DOMContentLoaded', async () => {
  // DOM
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

  let isBotTyping = false;

  // הבעות
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

  function postBotMessageWithEmotion(text, emotion = 'support', showButtons = false, buttons = []) {
    const avatarFilename = matiExpressions[emotion] || matiExpressions.support;
    if (largeAvatar) {
      largeAvatar.src = `./MatiCharacter/${avatarFilename}`;
    }
    bot.simulateBotTyping(() => {
      addMessage('bot', text);
      if (showButtons && buttons.length) {
        const btnDiv = document.createElement('div');
        btnDiv.classList.add('button-group');
        buttons.forEach((btxt) => {
          const btn = document.createElement('button');
          btn.textContent = btxt;
          btn.classList.add('choice-button');
          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            bot.handleChoiceButtonClick(e);
          });
          btnDiv.appendChild(btn);
        });
        chatWindow.appendChild(btnDiv);
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
      const response = await fetch('questions_data.json');
      const data = await response.json();
      this.wordProblems = {
        level1: data.filter(q => q.level === 1),
        level2: data.filter(q => q.level === 2),
        level3: data.filter(q => q.level === 3),
      };
      this.currentProblem = this.chooseRandomProblem();
    }

    chooseRandomProblem() {
      const levelKey = this.levelOrder[this.currentLevelIndex];
      const list = this.wordProblems[levelKey];
      return list[Math.floor(Math.random() * list.length)];
    }

    simulateBotTyping(cb, delay = 900) {
      isBotTyping = true;
      botStatus.textContent = 'מתי מקלידה...';
      setTimeout(() => {
        cb();
        isBotTyping = false;
        botStatus.textContent = 'מתי ממתינה...';
      }, delay);
    }

    startConversationLogic() {
      postBotMessageWithEmotion("היי, אני מתי.", 'welcoming');
      setTimeout(() => {
        postBotMessageWithEmotion("יחד נפתור בעיות מילוליות בשלושה שלבים.", 'support');
      }, 1000);
      setTimeout(() => {
        postBotMessageWithEmotion("אשמח לדעת איך קוראים לך?", 'inviting');
        this.dialogStage = 'awaiting_name';
      }, 2000);
    }

    handleChoiceButtonClick(e) {
      const btnText = e.target.textContent;

      if (this.dialogStage === 'awaiting_gender') {
        this.userGender =
          btnText === 'בן' ? 'male' :
          btnText === 'בת' ? 'female' : 'neutral';
        this.updateGuidingQuestionsByGender();

        const greet =
          this.userGender === 'male'
            ? "נהדר! נדבר בלשון זכר."
            : this.userGender === 'female'
            ? "נהדר! נדבר בלשון נקבה."
            : "נשתמש בלשון ניטרלית כדי שיהיה לך נוח.";
        postBotMessageWithEmotion(greet, 'confident');

        setTimeout(() => {
          // כאן מציגה את הבעיה
          const txt = this.currentProblem?.question || "לא נטענה בעיה.";
          problemNoteText.textContent = txt;
          problemNote.classList.remove('hidden');
          postBotMessageWithEmotion(
            "נהדר! בואי נתחיל. הנה הבעיה המילולית הראשונה שלנו. קראי אותה היטב, וכשתהיי מוכנה נפתור אותה ב-3 שלבים.",
            'ready'
          );
          this.dialogStage = 'asking_guiding_questions';
          setTimeout(() => this.askGuidingQuestion(), 1400);
        }, 1200);

        return;
      }

      if (this.dialogStage === 'continue_or_stop') {
        if (btnText === 'כן') {
          this.currentProblem = this.chooseRandomProblem();
          this.currentQuestionIndex = 0;
          problemNoteText.textContent = this.currentProblem.question;
          postBotMessageWithEmotion("מעולה, נמשיך לבעיה נוספת.", 'confident');
          setTimeout(() => this.askGuidingQuestion(), 1000);
        } else {
          postBotMessageWithEmotion("תודה שעבדת איתי היום. נתראה בפעם הבאה.", 'support');
          this.dialogStage = 'ended';
        }
      }
    }

    updateGuidingQuestionsByGender() {
      const isMale = this.userGender === 'male';
      const isFemale = this.userGender === 'female';
      const text = (m, f, n) => (isMale ? m : isFemale ? f : n);
      this.guidingQuestions = [
        { key: 'א', text: text("מה צריך למצוא?", "מה צריך למצוא?", "מה צריך למצוא?"), icon: "magnifying_glass.png" },
        { key: 'ב', text: text("מה ידוע לנו מהבעיה?", "מה ידוע לנו מהבעיה?", "מה ידוע לנו מהבעיה?"), icon: "list.png" },
        { key: 'ג', text: text("מה נעשה כדי לפתור?", "מה נעשה כדי לפתור?", "מה נעשה כדי לפתור?"), icon: "Missing_puzzle.png" },
      ];
    }

    askGuidingQuestion() {
      if (this.currentQuestionIndex < this.guidingQuestions.length) {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        const html = `<div class="guided-question"><img src="./icons/${q.icon}" alt="${q.text}" style="width:32px;vertical-align:middle;margin-left:6px;">${q.text}</div>`;
        postBotMessageWithEmotion(html, 'support');
      } else {
        postBotMessageWithEmotion("רוצה לפתור עוד בעיה?", 'inviting', true, ['כן', 'לא']);
        this.dialogStage = 'continue_or_stop';
      }
    }

    handleStudentInputLogic(input) {
      addMessage('student', input);

      if (this.dialogStage === 'awaiting_name') {
        this.userName = input;
        postBotMessageWithEmotion(`נעים מאוד, ${this.userName}.`, 'compliment');
        setTimeout(() => {
          postBotMessageWithEmotion(
            "ואיך תרצה שאפנה אליך? בחרי לשון פנייה:",
            'inviting',
            true,
            ['בן', 'בת', 'לא משנה']
          );
          this.dialogStage = 'awaiting_gender';
        }, 900);
        return;
      }

      if (this.dialogStage === 'asking_guiding_questions') {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        this.studentGuidingAnswers[q.key] = input;

        // בדיקה בסיסית לפי הקובץ
        const correctAnswers = this.currentProblem.correct_answers?.[q.key] || [];
        const isExact = correctAnswers.some(ans => input.includes(ans));

        if (isExact) {
          postBotMessageWithEmotion("נכון. זה מה שהיה צריך לזהות בשלב הזה.", 'compliment');
          this.markStar(this.currentQuestionIndex);
          this.successfulAnswers++;
          this.currentQuestionIndex++;
          setTimeout(() => this.askGuidingQuestion(), 1000);
        } else {
          // תשובה לא מדויקת
          const modelText =
            q.key === 'א'
              ? "כאן רציתי שתכתבי מה בדיוק שואלים בסוף הבעיה. נסי לנסח שוב."
              : q.key === 'ב'
              ? "כאן אנחנו כותבים את כל הנתונים מהטקסט. נסי שוב לציין את המספרים והמידע."
              : "כאן אנחנו כותבים איך פותרים – פעולה חשבונית או כמה שלבים. נסי שוב.";
          postBotMessageWithEmotion(modelText, 'confuse');
        }
      }
    }

    markStar(index) {
      if (stars[index]) {
        stars[index].src = 'icons/star_gold.png';
        successSound.currentTime = 0;
        successSound.play();
      }
    }
  }

  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  // כפתור התחלה
  if (startButton) {
    startButton.addEventListener('click', () => {
      // להסתיר את מסך הפתיחה
      welcomeScreen.classList.add('fade-out');
      setTimeout(() => {
        welcomeScreen.classList.add('hidden');
        appMainContainer.classList.remove('hidden');
        bot.startConversationLogic();
      }, 500);
    });
  }

  // שליחת תשובה
  sendButton.addEventListener('click', () => {
    const val = userInput.value.trim();
    if (!val || isBotTyping) return;
    bot.handleStudentInputLogic(val);
    userInput.value = '';
  });
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });

});




