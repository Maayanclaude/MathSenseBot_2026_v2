// script.js
// ----------------------------------------------------
// בוט מתי – גרסה עם דיאלוג מדויק ופתקית
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // אלמנטים מה-DOM
  const welcomeScreen      = document.getElementById('welcome-screen');
  const startButton        = document.getElementById('start-button');
  const appMainContainer   = document.getElementById('app-main-container');
  const chatWindow         = document.getElementById('chat-window');
  const userInput          = document.getElementById('user-input');
  const sendButton         = document.getElementById('send-button');
  const botStatus          = document.getElementById('bot-status');
  const largeAvatar        = document.getElementById('large-avatar');
  const problemNote        = document.getElementById('problem-note');
  const problemNoteText    = document.getElementById('problem-note-text');
  const stars              = document.querySelectorAll('.star');

  // סאונד כוכב (אם יש)
  const successSound = new Audio('sounds/success-chime.mp3');

  // דגל – האם הבוט "מקליד"
  let isBotTyping = false;

  // כל הבעות מתי – לפי השמות שבתיקייה שלך
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

  // הבעיה הראשונה – כמו שכתבת
  const firstProblem = {
    id: "lego-1",
    grade: 5,
    level: 1,
    text: "איתי רוצה לקנות ערכת לגו גדולה שעולה 1,850 ש\"ח. עד עכשיו חסך 760 ש\"ח. כמה כסף עליו להוסיף ולחסוך כדי לקנות את הערכה?",
    expected: {
      goal:   ["כמה כסף עליו להוסיף", "כמה חסר", "כמה צריך להוסיף", "הפער"],
      known:  ["1850", "1,850", "760", "חסך", "עולה"],
      action: ["חיסור", "להפחית", "1850 פחות 760", "1850-760"]
    },
    solution: 1090
  };

  // מצב השיחה
  const bot = {
    dialogStage: 'welcome',   // welcome -> awaiting_name -> awaiting_gender -> asking_guiding_questions
    userName: null,
    userGender: null,         // male / female / neutral
    currentProblem: firstProblem,
    currentQuestionIndex: 0,
    guidingQuestions: []
  };

  // ---------------- פונקציות עזר ----------------

  function setAvatar(emotionName) {
    if (!largeAvatar) return;
    const file = matiExpressions[emotionName] || matiExpressions.support;
    largeAvatar.src = `./MatiCharacter/${file}`;
  }

  function addMessage(sender, text) {
    const div = document.createElement('div');
    div.classList.add('message', sender === 'bot' ? 'bot-message' : 'student-message');
    const span = document.createElement('span');
    span.classList.add('message-text');
    span.innerHTML = text;
    div.appendChild(span);
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // סימולציית "מתי מקלידה..."
  function botType(callback, delay = 850) {
    isBotTyping = true;
    botStatus.textContent = 'מתי מקלידה...';
    setTimeout(() => {
      callback();
      isBotTyping = false;
      botStatus.textContent = 'מתי ממתינה...';
    }, delay);
  }

  // הודעה של מתי + אפשרות לכפתורים
  function postBotMessage(message, emotion = 'support', buttons = null) {
    setAvatar(emotion);
    botType(() => {
      addMessage('bot', message);
      if (buttons && Array.isArray(buttons)) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('button-group');
        buttons.forEach(txt => {
          const btn = document.createElement('button');
          btn.textContent = txt;
          btn.classList.add('choice-button');
          btn.addEventListener('click', () => handleButtonChoice(txt));
          buttonsDiv.appendChild(btn);
        });
        chatWindow.appendChild(buttonsDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    });
  }

  // הצגת הפתקית
  function showProblemNote(text) {
    if (!problemNote) return;
    problemNoteText.textContent = text;
    problemNote.classList.remove('hidden');
  }

  // סימון כוכב
  function markStar(index) {
    if (stars[index]) {
      stars[index].src = 'icons/star_gold.png';
      stars[index].classList.add('earned');
      successSound.currentTime = 0;
      successSound.play();
    }
  }

  // ---------------- לוגיקת דיאלוג ----------------

  function startConversation() {
    // 1) היי, אני מתי
    postBotMessage("היי, אני מתי.", 'welcoming');
    // 2) יחד נפתור...
    setTimeout(() => {
      postBotMessage("יחד נפתור בעיות מילוליות בשלושה שלבים.", 'inviting');
    }, 1400);
    // 3) אשמח לדעת איך קוראים לך?
    setTimeout(() => {
      postBotMessage("אשמח לדעת איך קוראים לך?", 'inviting');
      bot.dialogStage = 'awaiting_name';
    }, 2800);
  }

  // אחרי שהמשתמש כתב שם
  function askGender() {
    const name = bot.userName ? `, ${bot.userName}` : "";
    postBotMessage(
      `נעים מאוד${name}! אני רוצה לוודא שאני פונה אליך נכון. האם תעדיפ.י שאפנה אליך בלשון זכר (בן), לשון נקבה (בת) או שלא משנה לך?`,
      'inviting',
      ["בן", "בת", "לא משנה"]
    );
    bot.dialogStage = 'awaiting_gender';
  }

  // אחרי בחירת מגדר – להציג את הבעיה
  function showProblemAndFirstScaffold() {
    // ניסוח לפי מגדר
    const gender = bot.userGender;
    const startText =
      gender === 'female'
        ? "נהדר! בואי נתחיל."
        : gender === 'male'
          ? "נהדר! בוא נתחיל."
          : "נהדר! בוא/י נתחיל.";
    postBotMessage(startText, 'confident');

    setTimeout(() => {
      postBotMessage(
        "הנה הבעיה המילולית הראשונה שלנו! קרא/י אותה טוב-טוב, וכשתהיי מוכנה – נפתור אותה ב-3 שלבים.",
        'ready'
      );
      // הפתקית עצמה – שתופיע מיד אחרי שמתי אמרה "הנה הבעיה…"
      setTimeout(() => {
        showProblemNote(bot.currentProblem.text);
        // ואז שאלה 1 עם האייקון
        setTimeout(() => {
          askNextGuidingQuestion();
        }, 900);
      }, 600);
    }, 1200);

    bot.dialogStage = 'asking_guiding_questions';
  }

  // השאלה המנחה הבאה
  function askNextGuidingQuestion() {
    const g = makeGuidingQuestionsForGender(bot.userGender);
    bot.guidingQuestions = g; // לוודא שיש
    const index = bot.currentQuestionIndex;

    if (index >= g.length) {
      // סיימנו את שלושת השלבים
      postBotMessage("כל הכבוד! סיימנו את שלושת השלבים. רוצה שאלה נוספת?", 'excited', ["כן", "לא"]);
      bot.dialogStage = 'continue_or_stop';
      return;
    }

    const q = g[index];
    const html = `<div class="guided-question"><img src="./icons/${q.icon}" alt=""> ${q.text}</div>`;
    postBotMessage(html, 'support');
  }

  // יצירת השאלות לפי מגדר
  function makeGuidingQuestionsForGender(gender) {
    const isMale = gender === 'male';
    const isFemale = gender === 'female';
    const t = (m, f, n) => isMale ? m : isFemale ? f : n;
    return [
      {
        key: 'goal',
        text: t("שלב 1: מה אני צריך למצוא?", "שלב 1: מה אני צריכה למצוא?", "שלב 1: מה צריך למצוא?"),
        icon: "magnifying_glass.png"
      },
      {
        key: 'known',
        text: t("שלב 2: מה אני יודע מהבעיה?", "שלב 2: מה אני יודעת מהבעיה?", "שלב 2: מה ידוע לי?"),
        icon: "list.png"
      },
      {
        key: 'action',
        text: t("שלב 3: מה עליי לעשות כדי לפתור?", "שלב 3: מה עליי לעשות כדי לפתור?", "שלב 3: מה עלינו לעשות כדי לפתור?"),
        icon: "Missing_puzzle.png"
      }
    ];
  }

  // ---------------- קלט מהתלמיד/ה ----------------

  function handleStudentInput(text) {
    addMessage('student', text);

    // שם
    if (bot.dialogStage === 'awaiting_name') {
      bot.userName = text.trim();
      askGender();
      return;
    }

    // שלבי הפיגום
    if (bot.dialogStage === 'asking_guiding_questions') {
      const g = bot.guidingQuestions;
      const index = bot.currentQuestionIndex;
      const currentStep = g[index]; // goal / known / action

      // נבדוק אם התלמיד/ה הזכיר/ה אחת ממילות המפתח
      const stepKey = currentStep.key; // 'goal' / 'known' / 'action'
      const expectedList = bot.currentProblem.expected[stepKey] || [];
      const userText = text.trim();

      const isMatch = expectedList.some(exp => userText.includes(exp));

      if (isMatch) {
        // תשובה טובה – נחזק ונעבור לשלב הבא
        postBotMessage("מעולה! זיהית את החלק הזה.", 'compliment');
        markStar(index);
        bot.currentQuestionIndex += 1;
        setTimeout(() => {
          askNextGuidingQuestion();
        }, 900);
      } else {
        // תשובה לא מדויקת – מודלינג עדין
        if (stepKey === 'goal') {
          postBotMessage("את בכיוון. אנחנו רוצות למצוא *כמה כסף עוד חסר לאיתי* כדי לקנות את הערכה.", 'thinking');
        } else if (stepKey === 'known') {
          postBotMessage("נסי לכתוב מה כבר כתוב לנו: המחיר הכולל (1,850) וכמה הוא חסך (760).", 'thinking');
        } else {
          postBotMessage("בואי נחשוב: איזו פעולה תעזור לנו לדעת כמה חסר? 🤔", 'thinking');
        }
      }
    }

    // המשך/עצירה
    if (bot.dialogStage === 'continue_or_stop') {
      if (text === "כן" || text === "כן.") {
        // כאן אפשר להטעין בעיה נוספת בעתיד
        postBotMessage("בשלב הזה הגדרנו רק בעיה אחת לדוגמה 🙂", 'support');
      } else {
        postBotMessage("תודה שהיית איתי 💜", 'support');
      }
    }
  }

  // ---------------- בחירת כפתור (בן/בת/לא משנה) ----------------

  function handleButtonChoice(choiceText) {
    if (bot.dialogStage === 'awaiting_gender') {
      if (choiceText === 'בן') bot.userGender = 'male';
      else if (choiceText === 'בת') bot.userGender = 'female';
      else bot.userGender = 'neutral';

      showProblemAndFirstScaffold();
      return;
    }

    if (bot.dialogStage === 'continue_or_stop') {
      handleStudentInput(choiceText);
    }
  }

  // ---------------- האזנות ----------------

  // כפתור "נתחיל?"
  if (startButton) {
    startButton.addEventListener('click', () => {
      // אנימציה להיעלמות מסך הפתיחה
      welcomeScreen.classList.add('fade-out');
      setTimeout(() => {
        welcomeScreen.classList.add('hidden');
        appMainContainer.classList.remove('hidden');
        // מתחילים דיאלוג
        startConversation();
      }, 600);
    });
  }

  // כפתור שליחה
  sendButton.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (!text) return;
    handleStudentInput(text);
    userInput.value = "";
  });

  // אנטר
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendButton.click();
    }
  });
});


