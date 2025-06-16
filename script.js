class MathSenseBot {
    constructor() {
        this.guidingQuestions = [
            {
                id: 'א',
                text: "מהי השאלה המרכזית בבעיה? כלומר, מה אנחנו צריכים למצוא?",
                icon: "icons-leading-questions/question.svg"
            },
            {
                id: 'ב',
                text: "אילו נתונים או מידע כבר ידועים לך מתוך הבעיה? (מה אני יודע)",
                icon: "icons-leading-questions/clipboard.svg"
            },
            {
                id: 'ג',
                text: "מהם הנתונים או המידע שחסרים לך כדי לפתור את הבעיה? (מה אני לא יודע או צריך להבין)",
                icon: "icons-leading-questions/brain.svg"
            }
        ];

        this.currentQuestionIndex = 0;
        this.studentAnswers = { 'א': "", 'ב': "", 'ג': "" };
        this.dialogStage = 'start';
        this.currentProblem = "אבא קנה 5 תפוחים ואמא קנתה 3 תפוחים. כמה תפוחים יש בסך הכל?";
    }

    startConversation() {
        const welcomeMsg = 
            "שלום! אני מתי, כאן כדי לעזור לך להבין בעיות מתמטיות במילים ולהפוך אותן למספרים ופעולות. " +
            "אני לא אתן לך תשובות, אלא אכוון אותך לחשוב ולגלות את הדרך בעצמך.";
        this.postBotMessage(welcomeMsg);

        setTimeout(() => {
            this.postBotMessage(`הבעיה שלנו היום היא:<br><b>${this.currentProblem}</b>`);
            this.dialogStage = 'asking_questions';
            setTimeout(() => this.askNextQuestion(), 1200);
        }, 1500);
    }

    askNextQuestion() {
        if (this.currentQuestionIndex < this.guidingQuestions.length) {
            const q = this.guidingQuestions[this.currentQuestionIndex];
            this.postBotMessageWithIcon(q.text, q.icon);
        } else {
            this.postBotMessage("נראה שהבנת טוב את הבעיה! זה עוזר לנו להמשיך הלאה בדרך לפתרון.");
            this.dialogStage = 'translation_help';
            setTimeout(() => this.askForTranslationStep(), 1500);
        }
    }

    askForTranslationStep() {
        this.postBotMessage(
            "עכשיו בוא/י ננסה לחשוב איך לתרגם את המילים למספרים ופעולות מתמטיות. " + 
            "איך היית מתחיל/ה? מהו הצעד הראשון שאת/ה חושב/ת לעשות?"
        );
    }

    handleUserInput(input) {
        input = input.trim();
        if (!input) {
            this.postBotMessage("אני כאן בשבילך, כתוב/י לי כדי שנמשיך.");
            return;
        }

        // הצגת ההודעה של המשתמש
        this.postStudentMessage(input);

        if (this.dialogStage === 'asking_questions') {
            const currentKey = this.guidingQuestions[this.currentQuestionIndex].id;
            this.studentAnswers[currentKey] = input;

            // תגובה מותאמת לפי השאלה ותוכן התשובה
            let response = `תודה על התשובה שלך. בוא/י נתקדם.`;

            if (currentKey === 'א') {
                if (input.length < 5 || !input.includes("כמה")) {
                    response += "<br>נסה/נסי לנסח את השאלה המרכזית בצורה ברורה יותר. מה בדיוק אנחנו רוצים לדעת?";
                } else {
                    response += "<br>יפה מאוד, זה עוזר למקד את המטרה.";
                }
            } else if (currentKey === 'ב') {
                if (!/\d/.test(input)) {
                    response += "<br>האם את/ה מזהה מספרים או כמויות בבעיה? נסה/נסי לאתר את כל הנתונים המספריים.";
                } else {
                    response += "<br>מעולה, זיהית את הנתונים החשובים.";
                }
            } else if (currentKey === 'ג') {
                if (input.match(/אין|כלום|לא יודע/)) {
                    response += "<br>האם את/ה בטוח/ה שכל המידע שאת/ה צריך נמצא בבעיה? אולי צריך לחשוב על משהו נוסף?";
                } else {
                    response += "<br>חשוב לוודא אם חסר משהו לפני שמתחילים לפתור.";
                }
            }

            this.currentQuestionIndex++;
            this.postBotMessage(response);

            setTimeout(() => this.askNextQuestion(), 1600);

        } else if (this.dialogStage === 'translation_help') {
            // ניתוח תשובת המשתמש ומענה מותאם
            const lowerInput = input.toLowerCase();
            let response = `אתה אומר: '${input}'. `;

            if (lowerInput.includes('חיבור') || lowerInput.includes('+') || lowerInput.includes('ועוד') || lowerInput.includes('יותר')) {
                response += "<br>נשמע שאת/ה חושב/ת על חיבור. למה את/ה חושב/ת שזה נכון פה?";
            } else if (lowerInput.includes('חיסור') || lowerInput.includes('-') || lowerInput.includes('פחות')) {
                response += "<br>חיסור נשמע כמו אפשרות. מה גורם לך לחשוב כך?";
            } else if (lowerInput.includes('לא יודע') || lowerInput.includes('קשה לי')) {
                response += "<br>זה בסדר להרגיש ככה. בוא/י ננסה יחד לפשט את הבעיה.";
            } else {
                response += "<br>מעניין! ספר/י לי איך הגעת למחשבה הזו.";
            }

            response += "<br>מה הצעד הראשון שלך בדרך לפתרון?";

            this.postBotMessage(response);

        } else if (this.dialogStage === 'end') {
            this.postBotMessage("תודה שהיית איתי! כשתרצה/י, אני כאן לעזור לך שוב.");
        }
    }

    postBotMessage(message) {
        const chatBox = document.getElementById('chat-box');
        const botMsg = document.createElement('div');
        botMsg.classList.add('message', 'bot-message');
        botMsg.innerHTML = message;
        chatBox.appendChild(botMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    postBotMessageWithIcon(message, iconPath) {
        const chatBox = document.getElementById('chat-box');
        const botMsg = document.createElement('div');
        botMsg.classList.add('message', 'bot-message');

        const icon = document.createElement('img');
        icon.src = iconPath;
        icon.alt = "Icon";
        icon.classList.add('icon-question');

        const text = document.createElement('span');
        text.innerHTML = message;

        botMsg.appendChild(icon);
        botMsg.appendChild(text);

        chatBox.appendChild(botMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    postStudentMessage(message) {
        const chatBox = document.getElementById('chat-box');
        const studentMsg = document.createElement('div');
        studentMsg.classList.add('message', 'student-message');
        studentMsg.textContent = message;
        chatBox.appendChild(studentMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// יצירת אינסטנס של הבוט
const mathSenseBot = new MathSenseBot();

function startChat() {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('chat-container').style.display = 'block';
    mathSenseBot.startConversation();
}

function sendMessage() {
    const userInput = document.getElementById('user-input');
    const input = userInput.value;
    if (!input.trim()) {
        mathSenseBot.postBotMessage("אני כאן בשבילך, כתוב/י לי כדי שנמשיך.");
        return;
    }
    mathSenseBot.handleUserInput(input);
    userInput.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-button').addEventListener('click', startChat);
    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('user-input').addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage();
    });
});
