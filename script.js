class MathProblemGuidingBot {
  constructor() {
    this.guidingQuestions = [
      // נתיבי האייקונים - תואם למבנה התיקיות שלך: icons-leading-questions/
      { key: 'א', text: "מה צריך למצוא?", icon: "icons-leading-questions/question_find.png" },
      { key: 'ב', text: "מה אתה כבר יודע שיכול לעזור?", icon: "icons-leading-questions/question_know.png" },
      { key: 'ג', text: "מה אתה צריך לדעת או להבין כדי לפתור?", icon: "icons-leading-questions/question_need.png" }
    ];
    this.currentQuestionIndex = 0;
    this.studentGuidingAnswers = { 'א': "", 'ב': "", 'ג': "" };
    this.dialogStage = 'start';
    this.currentProblem = "דוגמה: אבא קנה 5 תפוחים ואמא קנתה 3 תפוחים. כמה תפוחים יש בסך הכל?";
    this.userGender = null; // 'male', 'female', 'other'
  }

  startConversationLogic() {
    // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
    this.postBotMessageWithAvatar("שלום! אני מתי, כאן כדי לעזור לך להבין בעיות מתמטיות בדרך פשוטה ואינטראקטיבית.<br>זכור/י: המטרה היא להבין את הבעיה, לא רק לקבל תשובה.", "avatar_welcoming.png");
    setTimeout(() => {
      // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
      this.postBotMessageWithAvatar("איך אוכל לפנות אליך? בחר/י את המגדר שלך כדי לדבר בצורה הכי נכונה.", "avatar_inviting_action.png", true, ["זכר", "נקבה", "אחר/ת"]);
      this.dialogStage = 'awaiting_gender';
    }, 2000);
  }

  handleGenderSelection(genderText) {
    const genderMap = { "זכר": "male", "נקבה": "female", "אחר/ת": "other" };
    this.userGender = genderMap[genderText] || null;
    // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
    this.postBotMessageWithAvatar(`נעים מאוד! אדבר אליך בהתאם למגדר שבחרת: ${genderText}.`, "avatar_confident.png");
    setTimeout(() => {
      // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
      this.postBotMessageWithAvatar(`הבעיה שלנו היום היא:<br><b>${this.currentProblem}</b>`, "avatar_confident.png");
      this.dialogStage = 'asking_guiding_questions';
      setTimeout(() => this.askGuidingQuestion(), 1500);
    }, 1500);
  }

  askGuidingQuestion() {
    // קוד זה נותן שגיאה כי 'q' אינו מוגדר כאן. צריך להשתמש ב-this.guidingQuestions[this.currentQuestionIndex]
    // אני משנה את זה חזרה למה שהיה הגיוני קודם, עם q מוגדר בתוך הלולאה (או כאן).
    const q = this.guidingQuestions[this.currentQuestionIndex]; // הוספתי הגדרה של q

    if (this.currentQuestionIndex < this.guidingQuestions.length) {
      // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
      this.postBotMessageWithIcon(q.text, q.icon, "avatar_support.png");
    } else {
      // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
      this.postBotMessageWithAvatar("נראה שהבנת טוב את הבעיה! זה עוזר לנו להמשיך בדרך לפתרון.", "avatar_compliment.png");
      this.dialogStage = 'problem_translation_help';
      setTimeout(() => this.askForFirstStepInTranslation(), 1500);
    }
  }

  askForFirstStepInTranslation() {
    // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
    this.postBotMessageWithAvatar("איך היית מתחיל/ה לתרגם את הבעיה הזו למספרים ופעולות חשבון?", "avatar_inviting_action.png");
    // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
    this.postBotMessageWithAvatar("מה הדבר הראשון שהיית כותב/ת או מחשב/ת?", "avatar_inviting_action.png");
  }

  handleStudentInputLogic(userInput) {
    if (userInput.trim() === "") {
      // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
      this.postBotMessageWithAvatar("🤔 כתוב/י משהו כדי שאוכל לעזור.", "avatar_support.png");
      return;
    }

    if (this.dialogStage === 'awaiting_gender') {
      // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
      this.postBotMessageWithAvatar("אנא בחר/י את המגדר שלך מהכפתורים למטה.", "avatar_confuse.png", true, ["זכר", "נקבה", "אחר/ת"]);
      return;
    }

    if (this.dialogStage === 'asking_guiding_questions') {
      const q = this.guidingQuestions[this.currentQuestionIndex];
      this.studentGuidingAnswers[q.key] = userInput;

      let response = `תודה על התשובה שלך. נמשיך לשאלה הבאה.`;

      // משוב מותאם לשאלות
      if (q.key === 'א') {
        if (!userInput.includes("כמה") && !userInput.includes("מה")) {
          response += "<br>נסה/נסי לנסח את מה שאתה רוצה למצוא בצורה מדויקת יותר.";
        } else {
          response += "<br>מעולה, זה עוזר למקד את המטרה.";
        }
      } else if (q.key === 'ב') {
        if (!/\d/.test(userInput)) {
          response += "<br>נסה/נסי למצוא את כל המספרים או הנתונים שבבעיה.";
        } else {
          response += "<br>יופי, זיהית נתונים חשובים.";
        }
      } else if (q.key === 'ג') {
        if (userInput.includes("אין") || userInput.includes("לא יודע")) {
          response += "<br>חשוב לבדוק אם חסר מידע לפני שמתחילים.";
        } else {
          response += "<br>טוב, כדאי לוודא שהכל ברור לפני הפתרון.";
        }
      }

      // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
      this.postBotMessageWithAvatar(response, "avatar_support.png");
      this.currentQuestionIndex++;
      setTimeout(() => this.askGuidingQuestion(), 2000);

    } else if (this.dialogStage === 'problem_translation_help') {
      const inputLower = userInput.toLowerCase();
      let botResponse = `אתה כתבת: '${userInput}'.`;

      if (inputLower.includes("חיבור") || inputLower.includes("+") || inputLower.includes("ועוד") || inputLower.includes("יותר")) {
        botResponse += "<br>נשמע שאתה חושב על חיבור. למה דווקא חיבור במקרה הזה?";
      } else if (inputLower.includes("חיסור") || inputLower.includes("-") || inputLower.includes("פחות")) {
        botResponse += "<br>חיסור זה רעיון טוב, מה גרם לך לחשוב כך?";
      } else if (inputLower.includes("לא יודע") || inputLower.includes("קשה לי")) {
        botResponse += "<br>זה בסדר להרגיש ככה, ננסה לפשט ביחד.";
      } else {
        botResponse += "<br>מעניין! ספר לי איך הגעת למחשבה הזו.";
      }

      botResponse += "<br>מה הסיבה שבחרת בדרך הזו לפתור את הבעיה?";
      // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
      this.postBotMessageWithAvatar(botResponse, "avatar_thinking.png");
    }
  }

  postBotMessageWithAvatar(message, avatarFilename, showButtons = false, buttons = []) {
    const chatBox = document.getElementById('chat-box');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot-message');

    const avatarImg = document.createElement('img');
    // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/
    avatarImg.src = `avatars/${avatarFilename}`;
    avatarImg.alt = "אווטאר מתי";
    avatarImg.classList.add('avatar');
    messageDiv.appendChild(avatarImg);

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    textDiv.innerHTML = message;
    messageDiv.appendChild(textDiv);

    if (showButtons && buttons.length > 0) {
      const buttonsDiv = document.createElement('div');
      buttonsDiv.classList.add('button-group');

      buttons.forEach(btnText => {
        const btn = document.createElement('button');
        btn.textContent = btnText;
        btn.classList.add('choice-button');
        btn.onclick = () => {
          if (this.dialogStage === 'awaiting_gender') {
            this.handleGenderSelection(btnText);
          } else if (this.dialogStage === 'continue_or_stop') {
            if (btnText === "להמשיך") {
              // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
              this.postBotMessageWithAvatar(`שמח/ה שאתה/את רוצה להמשיך! בוא/י נתקדם.`, "avatar_compliment.png");
              this.currentQuestionIndex = 0;
              this.dialogStage = 'asking_guiding_questions';
              setTimeout(() => this.askGuidingQuestion(), 1800);
            } else {
              // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
              this.postBotMessageWithAvatar(`אני כאן בשבילך מתי שתרצה/י לחזור.`, "avatar_support.png");
              this.dialogStage = 'ended';
            }
          }
          buttonsDiv.remove();
        };
        buttonsDiv.appendChild(btn);
      });

      messageDiv.appendChild(buttonsDiv);
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  postBotMessageWithIcon(message, iconPath, avatarFilename) {
    const chatBox = document.getElementById('chat-box');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot-message');

    const iconImg = document.createElement('img');
    iconImg.src = iconPath; // הנתיב כאן הוא כבר "icons-leading-questions/..." כפי שתוקן ב-guidingQuestions
    iconImg.alt = "שאלה מנחה";
    iconImg.classList.add('question-icon');
    messageDiv.appendChild(iconImg);

    const avatarImg = document.createElement('img');
    // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/
    avatarImg.src = `avatars/${avatarFilename}`;
    avatarImg.alt = "אווטאר מתי";
    avatarImg.classList.add('avatar');
    messageDiv.appendChild(avatarImg);

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    textDiv.innerHTML = message;
    messageDiv.appendChild(textDiv);

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// יצירת מופע של הבוט
const myGuidingBot = new MathProblemGuidingBot();

// פונקציות להפעלה ושליחה
function startChat() {
  document.getElementById("welcome-screen").style.display = "none";
  document.getElementById("chat-container").style.display = "flex";
  myGuidingBot.startConversationLogic();
}

function sendMessage() {
  const userInputElement = document.getElementById("user-input");
  const input = userInputElement.value.trim();
  if (!input) {
    // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
    myGuidingBot.postBotMessageWithAvatar("🤔 כתוב/י משהו כדי שאוכל לעזור.", "avatar_support.png");
    return;
  }
  myGuidingBot.postStudentMessage(input);
  myGuidingBot.handleStudentInputLogic(input);
  userInputElement.value = "";
}

// הצגת הודעת תלמיד
MathProblemGuidingBot.prototype.postStudentMessage = function(message) {
  const chatBox = document.getElementById('chat-box');
  const studentMessageDiv = document.createElement('div');
  studentMessageDiv.classList.add('message', 'student-message');
  studentMessageDiv.textContent = message;
  chatBox.appendChild(studentMessageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
};

// מאזינים לאירועים
document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-button');
  if (startButton) startButton.addEventListener('click', startChat);

  const sendButton = document.getElementById('send-button');
  if (sendButton) sendButton.addEventListener('click', sendMessage);

  const userInput = document.getElementById('user-input');
  if (userInput) {
    userInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendMessage();
    });
  }
});
