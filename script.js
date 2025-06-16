// קלאס לבוט המנחה MathProblemGuidingBot
class MathProblemGuidingBot {
    constructor() {
        this.guidingQuestions = [
            "א. מהי השאלה המרכזית בבעיה? (מה צריך למצוא?)",
            "ב. אילו נתונים רלוונטיים קיימים בבעיה? (מה אני יודע?)",
            "ג. אילו נתונים או ידע חסרים לי לצורך פתרון? (מה אני לא יודע?)"
        ];
        this.currentQuestionIndex = 0;
        this.studentGuidingAnswers = { 'א': "", 'ב': "", 'ג': "" };
        this.dialogStage = 'start';
        this.currentProblem = "דוגמה: אבא קנה 5 תפוחים ואמא קנתה 3 תפוחים. כמה תפוחים יש בסך הכל?";
        this.userGender = null; // 'male', 'female', or null
    }

    startConversationLogic() {
        this.postBotMessageWithAvatar("שלום! אני מתי, כאן כדי לעזור לך להבין את השפה המתמטית.", "avatar_welcoming.png");
        this.postBotMessageWithAvatar("איך אוכל לפנות אליך? בחר/י את המגדר שלך כדי שנוכל לדבר בצורה הכי נכונה.", "avatar_inviting_action.png", true, ["זכר", "נקבה", "אחר/ת"]);

        this.dialogStage = 'awaiting_gender';
    }

    handleGenderSelection(gender) {
        this.userGender = gender;
        this.postBotMessageWithAvatar(`נעים מאוד! אני אדבר אליך בהתאם למגדר שבחרת: ${gender === 'male' ? 'זכר' : gender === 'female' ? 'נקבה' : 'מגדר אחר'}.`, "avatar_confident.png");
        setTimeout(() => {
            this.postBotMessageWithAvatar(`הנה הבעיה שעלינו לפתור:<br>'${this.currentProblem}'`, "avatar_confident.png");
            this.dialogStage = 'asking_guiding_questions';
            setTimeout(() => this.askGuidingQuestion(), 1000);
        }, 1500);
    }

    askGuidingQuestion() {
        if (this.currentQuestionIndex < this.guidingQuestions.length) {
            this.postBotMessageWithIcon(this.guidingQuestions[this.currentQuestionIndex], this.getIconForQuestion(this.currentQuestionIndex), "avatar_support.png");
        } else {
            this.postBotMessageWithAvatar("נראה שהבנת טוב את הבעיה! זה עוזר לנו להמשיך הלאה בדרך לפתרון.", "avatar_compliment.png");
            this.dialogStage = 'problem_translation_help';
            setTimeout(() => this.askForFirstStepInTranslation(), 1500);
        }
    }

    askForFirstStepInTranslation() {
        this.postBotMessageWithAvatar("איך היית מתחיל/ה לתרגם את הבעיה הזו למספרים ופעולות חשבון?", "avatar_inviting_action.png");
        this.postBotMessageWithAvatar("מה הדבר הראשון שהיית כותב/ת או מחשב/ת?", "avatar_inviting_action.png");
    }

    handleStudentInputLogic(userInput) {
        let botResponse = "";
        let nextAction = null;

        if (this.dialogStage === 'awaiting_gender') {
            // לא אמור להגיע כאן - הטיפול דרך כפתורים
            return;
        }

        if (this.dialogStage === 'asking_guiding_questions') {
            const questionKeyMap = { 0: 'א', 1: 'ב', 2: 'ג' };
            const currentKey = questionKeyMap[this.currentQuestionIndex];
            this.studentGuidingAnswers[currentKey] = userInput;

            botResponse = this.getGuidingFeedback(currentKey, userInput);

            this.currentQuestionIndex++;
            nextAction = () => this.askGuidingQuestion();

        } else if (this.dialogStage === 'problem_translation_help') {
            botResponse = this.getTranslationHelpResponse(userInput);
        } else {
            botResponse = "אני לא בטוח שהבנתי, תוכלי/ה לנסח מחדש?";
        }

        this.postBotMessageWithAvatar(botResponse, "avatar_thinking.png");

        if (nextAction) {
            setTimeout(nextAction, 1800);
        }
    }

    getGuidingFeedback(currentKey, userInput) {
        let feedback = `תודה על התשובה. בוא/י נתקדם.`;

        if (currentKey === 'א') {
            if (userInput.length < 5 || !userInput.includes("כמה")) {
                feedback += "<br>נסה/נסי לנסח את השאלה המרכזית בצורה מדויקת יותר. מה בדיוק אנחנו רוצים לגלות בסוף?";
            } else {
                feedback += "<br>מעולה, זה עוזר לנו למקד את המטרה.";
            }
        } else if (currentKey === 'ב') {
            if (!/\d/.test(userInput)) {
                feedback += "<br>האם יש מספרים או כמויות שמצוינים בבעיה? נסה/נסי למצוא את כולם.";
            } else {
                feedback += "<br>יופי, זיהית את הנתונים החשובים.";
            }
        } else if (currentKey === 'ג') {
            if (userInput.includes("אין") || userInput.includes("כלום")) {
                feedback += "<br>האם בטוח שכל המידע שאתה צריך נמצא בבעיה? אולי צריך לדעת משהו נוסף?";
            } else {
                feedback += "<br>חשוב לבדוק אם חסר משהו לפני שמתחילים לפתור.";
            }
        }

        return feedback;
    }

    getTranslationHelpResponse(userInput) {
        const userInputLower = userInput.toLowerCase();
        let response = `אתה אומר: '${userInput}'.`;

        if (userInputLower.includes('חיבור') || userInputLower.includes('+') || userInputLower.includes('ועוד') || userInputLower.includes('יותר')) {
            response += "<br>נשמע שאתה חושב על פעולת חיבור. למה דווקא חיבור במקרה הזה?";
        } else if (userInputLower.includes('חיסור') || userInputLower.includes('-') || userInputLower.includes('פחות')) {
            response += "<br>אתה מציע חיסור. מה גורם לך לחשוב שזו הפעולה הנכונה כאן?";
        } else if (userInputLower.includes("מספרים") && !(['+', '-', '*', '/'].some(op => userInputLower.includes(op)))) {
            response += "<br>השתמשת במספרים, וזה מצוין. איזו פעולה מתמטית אתה חושב שצריך לבצע איתם?";
        } else if (userInputLower.includes("לא יודע") || userInputLower.includes("קשה לי")) {
            response += "<br>זה בסדר להרגיש ככה. בוא/י ננסה לפשט: אם אבא קנה 5 תפוחים ואמא קנתה 3, ורוצים לדעת 'כמה יש בסך הכל' - איזו פעולה יכולה לאחד את הכמויות?";
        } else if (userInputLower.includes("תשובה") || userInputLower.includes("פתרון")) {
            response += "<br>אני לא נותן תשובות, אני כאן כדי לעזור לך להבין את הדרך. מה הצעד הראשון *שלך* בפתרון?";
        } else {
            response += "<br>מעניין. איך הגעת למחשבה הזו? מה עזר לך להבין את הקשר בין המילים למספרים בבעיה?";
        }

        response += "<br>מהו ההיגיון שעומד מאחורי הדרך שבה בחרת?";
        return response;
    }

    postBotMessageWithAvatar(message, avatarFilename, showButtons = false, buttons = []) {
        const chatBox = document.getElementById('chat-box');

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');

        const avatarImg = document.createElement('img');
        avatarImg.src = `images/avatars/${avatarFilename}`;
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
                        const genderMap = { "זכר": "male", "נקבה": "female", "אחר/ת": "other" };
                        this.handleGenderSelection(genderMap[btnText]);
                    } else if (this.dialogStage === 'continue_or_stop') {
                        if (btnText === "להמשיך") {
                            this.postBotMessageWithAvatar(`שמח/ה שאתה/את רוצה להמשיך! בוא/י נתקדם.`, "avatar_compliment.png");
                            this.currentQuestionIndex = 0;
                            this.dialogStage = 'asking_guiding_questions';
                            setTimeout(() => this.askGuidingQuestion(), 1800);
                        } else {
                            this.postBotMessageWithAvatar(`אני כאן בשבילך מתי שתרצה/י לחזור.`, "avatar_support.png");
                            this.dialogStage = 'ended';
                        }
                    }
                    buttonsDiv.remove(); // הסר את הכפתורים לאחר בחירה
                };
                buttonsDiv.appendChild(btn);
            });

            messageDiv.appendChild(buttonsDiv);
        }

        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    postBotMessageWithIcon(message, iconFilename, avatarFilename) {
        const chatBox = document.getElementById('chat-box');

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');

        const iconImg = document.createElement('img');
        iconImg.src = `images/icons-leading-questions/${iconFilename}`;
        iconImg.alt = "אייקון שאלה מנחה";
        iconImg.classList.add('question-icon');
        messageDiv.appendChild(iconImg);

        const avatarImg = document.createElement('img');
        avatarImg.src = `images/avatars/${avatarFilename}`;
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

    getIconForQuestion(index) {
        switch(index) {
            case 0: return 'icon_question_find.png';  // מה צריך למצוא
            case 1: return 'icon_question_know.png';  // מה אני יודע
            case 2: return 'icon_question_missing.png';  // מה חסר
            default: return 'icon_question_find.png';
        }
    }
}

// יצירת מופע של הבוט
const myGuidingBot = new MathProblemGuidingBot();

// פונקציה להפעלת הצ'אט
function startChat() {
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("chat-container").style.display = "flex";
    myGuidingBot.startConversationLogic();
}

// פונקציה לשליחת הודעה
function sendMessage() {
    const userInputElement = document.getElementById("user-input");
    const input = userInputElement.value.trim();
    if (!input) {
        myGuidingBot.postBotMessageWithAvatar("🤔 כתבי שאלה או תגובה כדי שאוכל לעזור.", "avatar_support.png");
        return;
    }
    myGuidingBot.postStudentMessage(input);
    myGuidingBot.handleStudentInputLogic(input);
    userInputElement.value = "";
}

// הצגת הודעת תלמיד בתיבת הצ'אט
MathProblemGuidingBot.prototype.postStudentMessage = function(message) {
    const chatBox = document.getElementById('chat-box');
    const studentMessageDiv = document.createElement('div');
    studentMessageDiv.classList.add('message', 'student-message');
    studentMessageDiv.textContent = message;
    chatBox.appendChild(studentMessageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// מאזיני אירועים
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    if (startButton) startButton.addEventListener('click', startChat);

    const sendButton = document.getElementById('send-button');
    if (sendButton) sendButton.addEventListener('click', sendMessage);

    const userInput = document.getElementById('user-input');
    if (userInput) userInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') sendMessage();
    });
});
