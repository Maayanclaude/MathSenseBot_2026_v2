// script.js
document.addEventListener('DOMContentLoaded', async () => {
  // אלמנטים
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
  const problemText = document.getElementById('problem-text');

  const successSound = new Audio('sounds/success-chime.mp3');
  let isBotTyping = false;

  // הבעות מתי
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

  // בוט
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
      // מתי מציגה את עצמה
      postBotMessageWithEmotion("שלום, אני מתי. נפתור יחד בעיות מילוליות במתמטיקה בשלושה צעדים.", 'welcoming');
      setTimeout(() => {
        postBotMessageWithEmotion("איך קוראים לך?", 'inviting');
        this.dialogStage = 'awaiting_name';
      }, 1200);
    }

    // הצגת הבעיה על הפתקית בלבד
    showProblemOnNote() {
      if (!this.currentProblem) return;
      problemText.textContent = this.currentProblem.question;
      problemNote.classList.remove('hidden');
    }

    handleChoiceButtonClick(e) {
      const choice = e.target.textContent;

      // בחירת מגדר
      if (this.dialogStage === 'awaiting_gender') {
        this.userGender =
          choice === "בן" || choice === "זכר" ? 'male' :
          choice === "בת" || choice === "נקבה" ? 'female' : 'neutral';

        this.updateGuidingQuestionsByGender();

        const genderMsg =
          this.userGender === 'male' ? "נהדר, נדבר בלשון זכר." :
          this.userGender === 'female' ? "נהדר, נדבר בלשון נקבה." :
          "מצוין, נשתמש בלשון ניטרלית.";

        postBotMessageWithEmotion(genderMsg, 'confident');

        // הצגת הבעיה – רק על הפתקית
        setTimeout(() => {
          postBotMessageWithEmotion("הנה הבעיה הראשונה שלנו. היא מופיעה עכשיו על הפתקית למעלה.", 'ready');
          this.showProblemOnNote();
          this.dialogStage = 'asking_guiding_questions';
          setTimeout(() => this.askGuidingQuestion(), 1300);
        }, 1300);

        return;
      }

      // המשך / עצירה
      if (this.dialogStage === 'continue_or_stop') {
        if (choice === "כן") {
          this.currentProblem = this.chooseRandomProblem();
          this.currentQuestionIndex = 0;
          this.successfulAnswers = 0;
          this.showProblemOnNote();
          this.dialogStage = 'asking_guiding_questions';
          postBotMessageWithEmotion("הנה הבעיה הבאה. נעבוד שוב לפי שלושת הצעדים.", 'ready');
          setTimeout(() => this.askGuidingQuestion(), 1300);
        } else {
          postBotMessageWithEmotion("תודה שפתרת איתי. כשתרצי אפשר להתחיל שוב.", 'support');
          this.dialogStage = 'ended';
        }
      }
    }

    updateGuidingQuestionsByGender() {
      const isMale = this.userGender === 'male';
      const isFemale = this.userGender === 'female';
      const txt = (m, f, n) => isMale ? m : isFemale ? f : n;

      this.guidingQuestions = [
        { key: 'א', text: txt("מה אני צריך למצוא?", "מה אני צריכה למצוא?", "מה צריך למצוא?"), icon: "magnifying_glass.png" },
        { key: 'ב', text: txt("מה אני יודע מהבעיה?", "מה אני יודעת מהבעיה?", "מה ידוע לי מהבעיה?"), icon: "list.png" },
        { key: 'ג', text: txt("מה עליי לעשות כדי לפתור?", "מה עליי לעשות כדי לפתור?", "מה צריך לעשות כדי לפתור?"), icon: "Missing_puzzle.png" }
      ];
    }

    askGuidingQuestion() {
      if (this.currentQuestionIndex < this.guidingQuestions.length) {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        const html = `<div class="guided-question">
            <img src="icons/${q.icon}" alt="">
            <span>${q.text}</span>
          </div>`;
        postBotMessageWithEmotion(html, 'support');
      } else {
        postBotMessageWithEmotion("רוצה לפתור עוד בעיה?", 'inviting', true, ["כן", "לא"]);
        this.dialogStage = 'continue_or_stop';
      }
    }

    handleStudentInputLogic(input) {
      addMessage('student', input);

      // שם
      if (this.dialogStage === 'awaiting_name') {
        this.userName = input.trim();
        postBotMessageWithEmotion(`נעים מאוד, ${this.userName}.`, 'compliment');
        setTimeout(() => {
          postBotMessageWithEmotion("איך תרצה שאפנה אליך?", 'inviting', true, ["בן", "בת", "לא משנה לי"]);
          this.dialogStage = 'awaiting_gender';
        }, 1100);
        return;
      }

      // תשובה לפיגום
      if (this.dialogStage === 'asking_guiding_questions') {
        const q = this.guidingQuestions[this.currentQuestionIndex];
        this.studentGuidingAnswers[q.key] = input;

        const correct = this.currentProblem.correct_answers?.[q.key] || [];
        const isCorrect = correct.some(c => input.includes(c));

        if (isCorrect) {
          postBotMessageWithEmotion(this.getRandomFeedback(q.key), 'compliment');
          this.markStar(this.currentQuestionIndex);
          this.successfulAnswers++;
          this.currentQuestionIndex++;
          setTimeout(() => this.askGuidingQuestion(), 1100);
        } else {
          const tryAgain =
            this.userGender === 'male' ? "לא בדיוק. נסה לקרוא שוב את הבעיה." :
            this.userGender === 'female' ? "לא בדיוק. נסי לקרוא שוב את הבעיה." :
            "לא בדיוק. נסה/י לקרוא שוב את הבעיה.";
          postBotMessageWithEmotion(tryAgain, 'confuse');
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
    }

    getRandomFeedback(step) {
      const messages = {
        'א': ["מעולה, איתרת את מה שמחפשים.", "כן, זו המטרה המרכזית."],
        'ב': ["יפה, רשמת את הנתונים החשובים.", "נכון, זה מה שידוע לנו."],
        'ג': ["מצוין, זה מה שצריך לעשות כדי לפתור.", "בדיוק, עכשיו אפשר לחשב."]
      };
      const arr = messages[step] || ["טוב מאוד."];
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }

  // פונקציות עזר
  function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'bot' ? 'bot-message' : 'student-message');
    const span = document.createElement('span');
    span.innerHTML = text;
    messageDiv.appendChild(span);
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function postBotMessageWithEmotion(message, emotion = 'support', showButtons = false, buttons = []) {
    if (largeAvatar && matiExpressions[emotion]) {
      largeAvatar.src = `MatiCharacter/${matiExpressions[emotion]}`;
    }
    bot.simulateBotTyping(() => {
      addMessage('bot', message);
      if (showButtons) {
        const div = document.createElement('div');
        div.classList.add('button-group');
        buttons.forEach(t => {
          const b = document.createElement('button');
          b.textContent = t;
          b.classList.add('choice-button');
          b.addEventListener('click', (e) => {
            document.querySelectorAll('.choice-button').forEach(x => x.classList.remove('selected'));
            e.target.classList.add('selected');
            bot.handleChoiceButtonClick(e);
          });
          div.appendChild(b);
        });
        chatWindow.appendChild(div);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    });
  }

  // יצירת בוט
  const bot = new MathProblemGuidingBot();
  await bot.loadProblemsFromFile();

  // כפתור התחלה – מעבר מהמסך היפה לצ'אט
  startButton.addEventListener('click', () => {
    welcomeScreen.classList.add('fade-out');
    setTimeout(() => {
      welcomeScreen.classList.add('hidden');
      appMainContainer.classList.remove('hidden');
      bot.startConversationLogic();
    }, 500);
  });

  // כפתור שליחה
  sendButton.addEventListener('click', () => {
    const val = userInput.value.trim();
    if (!val || isBotTyping) return;
    bot.handleStudentInputLogic(val);
    userInput.value = '';
  });

  // אנטר
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });
});

