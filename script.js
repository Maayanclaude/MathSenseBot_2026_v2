class MathProblemGuidingBot {
  constructor() {
    this.guidingQuestions = [
      { key: 'א', text: "מה צריך למצוא?" , icon: "icons-leading-questions/question_find.png" },
      { key: 'ב', text: "מה אתה כבר יודע שיכול לעזור?" , icon: "icons-leading-questions/question_know.png" },
      { key: 'ג', text: "מה אתה צריך לדעת או להבין כדי לפתור?" , icon: "icons-leading-questions/question_need.png" }
    ];
    this.currentQuestionIndex = 0;
    this.studentGuidingAnswers = { 'א': "", 'ב': "", 'ג': "" };
    this.dialogStage = 'start';
    this.currentProblem = "דוגמה: אבא קנה 5 תפוחים ואמא קנתה 3 תפוחים. כמה תפוחים יש בסך הכל?";
  }

  startConversationLogic() {
    this.postBotMessage("שלום! אני מתי, כאן כדי לעזור לך להבין בעיות מתמטיות בדרך פשוטה ואינטראקטיבית. <br>זכור/י: המטרה היא להבין את הבעיה, לא רק לקבל תשובה.");
    setTimeout(() => {
      this.postBotMessage(`הבעיה שלנו היום היא:<br><b>${this.currentProblem}</b>`);
      this.dialogStage = 'asking_guiding_questions';
      setTimeout(() => {
        this.askGuidingQuestion();
      }, 1000);
    }, 2000);
  }

  askGuidingQuestion() {
    if (this.currentQuestionIndex < this.guidingQuestions.length) {
      const q = this.guidingQuestions[this.currentQuestionIndex];
      this.postBotMessageWithIcon(q.text, q.icon);
    } else {
      this.postBotMessage("נראה שהבנת טוב את הבעיה! זה עוזר לנו להמשיך בדרך לפתרון.");
      this.dialogStage = 'problem_translation_help';
      setTimeout(() => {
        this.askForFirstStepInTranslation();
      }, 1500);
    }
  }

  askForFirstStepInTranslation() {
    this.postBotMessage("איך היית מתחיל/ה לתרגם את הבעיה הזו למספרים ופעולות חשבון?");
    this.postBotMessage("מה הדבר הראשון שהיית כותב/ת או מחשב/ת?");
  }

  handleStudentInputLogic(userInput) {
    if (userInput.trim() === "") {
      this.postBotMessage("🤔 כתוב/י משהו כדי שאוכל לעזור.");
      return;
    }

    if (this.dialogStage === 'asking_guiding_questions') {
      const qKey = this.guidingQuestions[this.currentQuestionIndex].key;
      this.studentGuidingAnswers[qKey] = userInput;

      let response = `תודה על התשובה שלך. נמשיך לשאלה הבאה.`;

      // דגשים לפי שאלה
      if (qKey === 'א') {
        if (!userInput.includes("כמה") && !userInput.includes("מה")) {
          response += "<br>נסה/נסי לנסח את מה שאתה רוצה למצוא בצורה מדויקת יותר.";
        } else {
          response += "<br>מעולה, זה עוזר למקד את המטרה.";
        }
      }
      if (qKey === 'ב') {
        if (!/\d/.test(userInput)) {
          response += "<br>נסה/נסי למצוא את כל המספרים או הנתונים שבבעיה.";
        } else {
          response += "<br>יופי, זיהית נתונים חשובים.";
        }
      }
      if (qKey === 'ג') {
        if (userInput.includes("אין") || userInput.includes("לא יודע")) {
          response += "<br>חשוב לבדוק אם חסר מידע לפני שמתחילים.";
        } else {
          response += "<br>טוב, כדאי לוודא שהכל ברור לפני הפתרון.";
        }
      }

      this.postBotMessage(response);

      this.currentQuestionIndex++;
      setTimeout(() => this.askGuidingQuestion(), 1800);

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
      this.postBotMessage(botResponse);
    }
  }

  postBotMessage(message) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot-message');
    msgDiv.innerHTML = message;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  postBotMessageWithIcon(message, iconPath) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot-message');

    const iconImg = document.createElement('img');
    iconImg.src = iconPath;
    iconImg.alt = "שאלה מנחה";
    iconImg.classList.add('question-icon');

    const textSpan = document.createElement('span');
    textSpan.innerHTML = message;

    msgDiv.appendChild(iconImg);
    msgDiv.appendChild(textSpan);

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  postStudentMessage(message) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'student-message');
    msgDiv.textContent = message;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

const myGuidingBot = new MathProblemGuidingBot();

function startChat() {
  document.getElementById("welcome-screen").style.display = "none";
  document.getElementById("chat-container").style.display = "block";
  myGuidingBot.startConversationLogic();
}

function sendMessage() {
  const userInput = document.getElementById("user-input");
  const input = userInput.value;

  if (!input.trim()) {
    myGuidingBot.postBotMessage("🤔 כתוב/י משהו כדי שאוכל לעזור.");
    return;
  }

  myGuidingBot.postStudentMessage(input);
  myGuidingBot.handleStudentInputLogic(input);
  userInput.value = "";
}

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
