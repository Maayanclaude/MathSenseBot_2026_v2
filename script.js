אוקיי, קיבלתי את קוד ה-script.js הנוכחי שלך. יש בו כמה אי-התאמות ל-index.html החדש שנתתי לך, ולכן השיחה לא עובדת.

הדבר העיקרי הוא שינוי ה-ID-ים של האלמנטים ב-HTML, שמשפיע על איך ה-JavaScript מוצא אותם. במבנה החדש יש לנו:

#app-main-container במקום #chat-container.
#chat-window במקום #chat-box.
בואי נתקן את script.js כדי שיתאים ל-HTML.

הנה קוד ה-script.js המתוקן והמלא. העתיקי והדביקי את כל הקוד הזה לקובץ script.js שלך, החל מהשורה הראשונה ועד האחרונה, תוך החלפה של כל התוכן הקיים בקובץ:

JavaScript

class MathProblemGuidingBot {
    constructor() {
        this.guidingQuestions = [
            // נתיבי האייקונים - תואם למבנה התיקיות שלך: icons-leading-questions/
            // וודאי שקובצי האווטר (avatar) כאן הם כולם .png
            { key: 'א', text: "מה צריך למצוא?", icon: "icons-leading-questions/question_find.png", avatar: "avatar_thinking.png" },
            { key: 'ב', text: "מה אתה כבר יודע שיכול לעזור?", icon: "icons-leading-questions/question_know.png", avatar: "avatar_confuse.png" },
            { key: 'ג', text: "מה אתה צריך לדעת או להבין כדי לפתור?", icon: "icons-leading-questions/question_need.png", avatar: "avatar_support.png" }
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
        const q = this.guidingQuestions[this.currentQuestionIndex]; // הגדרה של q
        
        // יש צורך גם ב-avatar עבור postBotMessageWithIcon
        if (this.currentQuestionIndex < this.guidingQuestions.length) {
            // נתיב אווטר - תואם למבנה התיקיות שלך: avatars/ (ושונה ל-.png)
            this.postBotMessageWithIcon(q.text, q.icon, q.avatar); // העבר את q.avatar
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
        // ... (הקוד הזה נראה תקין, אין צורך בשינוי בחיפוש אווטרים, רק לוודא שהם .png)
        if (userInput.trim() === "") {
            this.postBotMessageWithAvatar("🤔 כתוב/י משהו כדי שאוכל לעזור.", "avatar_support.png");
            return;
        }

        if (this.dialogStage === 'awaiting_gender') {
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
            this.postBotMessageWithAvatar(botResponse, "avatar_thinking.png");
        }
    }

    postBotMessageWithAvatar(message, avatarFilename, showButtons = false, buttons = []) {
        const chatWindow = document.getElementById('chat-window'); // שינוי מ-'chat-box' ל-'chat-window'
        const largeAvatar = document.getElementById('large-avatar'); // קבלת האלמנט של האווטר הגדול

        // עדכון האווטר הגדול
        if (largeAvatar) {
            largeAvatar.src = `avatars/${avatarFilename}`;
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');

        const avatarImg = document.createElement('img');
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
                btn.dataset.value = btnText; // שמירת הערך של הכפתור
                // event listener צריך להיות על ה-chatWindow האב, לא על הכפתור ישירות
                buttonsDiv.appendChild(btn);
            });
            messageDiv.appendChild(buttonsDiv);
        }

        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    postBotMessageWithIcon(message, iconPath, avatarFilename) {
        const chatWindow = document.getElementById('chat-window'); // שינוי מ-'chat-box' ל-'chat-window'
        const largeAvatar = document.getElementById('large-avatar'); // קבלת האלמנט של האווטר הגדול

        // עדכון האווטר הגדול
        if (largeAvatar) {
            largeAvatar.src = `avatars/${avatarFilename}`;
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');

        const iconImg = document.createElement('img');
        iconImg.src = iconPath;
        iconImg.alt = "שאלה מנחה";
        iconImg.classList.add('question-icon');
        messageDiv.appendChild(iconImg);

        const avatarImg = document.createElement('img');
        avatarImg.src = `avatars/${avatarFilename}`;
        avatarImg.alt = "אווטאר מתי";
        avatarImg.classList.add('avatar');
        messageDiv.appendChild(avatarImg);

        const textDiv = document.createElement('div');
        textDiv.classList.add('message-text');
        textDiv.innerHTML = message;
        messageDiv.appendChild(textDiv);

        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // פונקציה חדשה לטיפול בלחיצה על כפתורי הבחירה (במקום ה-onclick הישיר)
    handleChoiceSelection(value) {
        // הוספת הודעת המשתמש עבור הכפתור שלחץ עליו
        this.postStudentMessage(value); // הוספה זו תציג את בחירת המשתמש
        if (this.dialogStage === 'awaiting_gender') {
            this.handleGenderSelection(value);
        } else if (this.dialogStage === 'continue_or_stop') {
            if (value === "להמשיך") {
                this.postBotMessageWithAvatar(`שמח/ה שאתה/את רוצה להמשיך! בוא/י נתקדם.`, "avatar_compliment.png");
                this.currentQuestionIndex = 0;
                this.dialogStage = 'asking_guiding_questions';
                setTimeout(() => this.askGuidingQuestion(), 1800);
            } else {
                this.postBotMessageWithAvatar(`אני כאן בשבילך מתי שתרצה/י לחזור.`, "avatar_support.png");
                this.dialogStage = 'ended';
            }
        }
    }

    // הצגת הודעת תלמיד (כבר הייתה קיימת, רק לוודא שהיא מתייחסת ל-chatWindow)
    postStudentMessage(message) {
        const chatWindow = document.getElementById('chat-window'); // שינוי מ-'chat-box' ל-'chat-window'
        const studentMessageDiv = document.createElement('div');
        studentMessageDiv.classList.add('message', 'student-message');
        studentMessageDiv.textContent = message;
        chatWindow.appendChild(studentMessageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

// יצירת מופע של הבוט
const myGuidingBot = new MathProblemGuidingBot();

// פונקציות להפעלה ושליחה
// את הפונקציות האלה אנחנו מנגישים גלובלית
const startButton = document.getElementById("start-button");
const welcomeScreen = document.getElementById("welcome-screen");
const appMainContainer = document.getElementById("app-main-container");
const chatWindow = document.getElementById("chat-window"); // קישור ל-chat-window
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
// const largeAvatar = document.getElementById('large-avatar'); // כבר נמצא בפונקציות של הבוט

function startChat() {
    welcomeScreen.style.display = "none";
    appMainContainer.classList.remove("hidden"); // הסרת הקלאס hidden
    appMainContainer.style.display = "grid"; // ודא שזה "grid" כדי להפעיל את פריסת ה-CSS Grid

    // ודא ש-CSS ל-body מתעדכן כדי שהגריד יעבוד נכון
    document.body.classList.add('app-started');

    myGuidingBot.startConversationLogic();
}

function sendMessage() {
    const input = userInput.value.trim();
    if (!input) {
        return; // לא לשלוח הודעה ריקה
    }
    myGuidingBot.postStudentMessage(input);
    myGuidingBot.handleStudentInputLogic(input);
    userInput.value = "";
}

// מאזינים לאירועים - כעת הם עובדים על ה-ID-ים הנכונים
document.addEventListener('DOMContentLoaded', () => {
    // מאזין לכפתור ההתחלה
    if (startButton) {
        startButton.addEventListener('click', startChat);
    }

    // מאזינים לכפתור השליחה ולשדה הקלט
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    if (userInput) {
        userInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // מאזין כללי לכפתורי הבחירה בתוך חלון הצ'אט
    if (chatWindow) {
        chatWindow.addEventListener("click", (event) => {
            if (event.target.classList.contains("choice-button")) {
                myGuidingBot.handleChoiceSelection(event.target.dataset.value);
            }
        });
    }
});
