// script.js

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const welcomeScreen = document.getElementById('welcome-screen');
    const appMainContainer = document.getElementById('app-main-container');
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const largeAvatar = document.getElementById('large-avatar');
    const botStatus = document.getElementById('bot-status');

    let isBotTyping = false;

    function addMessage(sender, text, avatarFileName, showButtons = false, buttons = []) {
        if (!chatWindow) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'bot' ? 'bot-message' : 'student-message');

        const avatarImg = document.createElement('img');
        avatarImg.classList.add('avatar');
        avatarImg.src = `./avatars/${avatarFileName}`;
        avatarImg.alt = sender + ' avatar';

        const textSpan = document.createElement('span');
        textSpan.classList.add('message-text');
        textSpan.innerHTML = text;

        if (sender === 'bot') {
            messageDiv.append(avatarImg, textSpan);
        } else {
            messageDiv.append(textSpan);
            const studentAvatarImg = document.createElement('img');
            studentAvatarImg.classList.add('avatar');
            studentAvatarImg.src = `./avatars/student_avatar.png`;
            studentAvatarImg.alt = 'Student avatar';
            messageDiv.appendChild(studentAvatarImg);
        }

        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        if (showButtons && buttons.length && sender === 'bot') {
            const buttonsDiv = document.createElement('div');
            buttonsDiv.classList.add('button-group');
            messageDiv.classList.add('has-buttons');

            buttons.forEach(btnText => {
                const btn = document.createElement('button');
                btn.textContent = btnText;
                btn.classList.add('choice-button');
                btn.addEventListener('click', (e) => bot.handleChoiceButtonClick(e));
                buttonsDiv.appendChild(btn);
            });
            messageDiv.appendChild(buttonsDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    }

    class MathProblemGuidingBot {
        constructor() {
            this.wordProblems = {
                level1: [
                    "חבילת חטיפים עולה 9 ש\"ח. כמה עולות 4 חבילות כאלה?",
                    "בקבוק שתייה עולה 6 ש\"ח. כמה תשלם על 5 בקבוקים?",
                    "לשיר יש 850 עוקבים. נוספו לה עוד 175. כמה עוקבים יש לה עכשיו?",
                    "לדניאל יש 1,200 צפיות ועוד 980 צפיות. כמה צפיות קיבל בסך הכול?",
                    "חולצה עולה 45 ש\"ח. כמה תעלה רכישה של 3 חולצות?",
                    "מכנסיים עולים 120 ש\"ח, וסוודר 150 ש\"ח. כמה אשלם יחד?",
                    "כל מיץ עולה 7 ש\"ח. כמה משלמים על 4 מיצים?",
                    "מגש פיצה עולה 64 ש\"ח. כמה יעלה לקנות 2 מגשים?"
                ],
                level2: [
                    "יש לי 200 ש\"ח. קניתי 3 מגשים ב-58 ש\"ח כל אחד ועוד עוגה ב-35 ש\"ח. כמה נשאר לי?",
                    "5 ילדים רוצים 3 פרוסות פיצה כל אחד. במגש יש 8 פרוסות. כמה מגשים צריך?",
                    "קניתי פריטים ב-395 ש\"ח ונתתי שטר של 500 ש\"ח. כמה עודף אקבל?"
                ]
            };
            this.currentLevel = 'level1';
            this.currentProblem = this.chooseRandomProblem();
            this.guidingQuestions = [
                { key: 'א', text: "מה אנחנו צריכים למצוא?", icon: "magnifying_glass.png" },
                { key: 'ב', text: "מה כבר יש לנו בבעיה?", icon: "list.png" },
                { key: 'ג', text: "מה חסר לנו לדעת כדי לפתור את הבעיה?", icon: "Missing_puzzle.png" }
            ];
            this.currentQuestionIndex = 0;
            this.studentGuidingAnswers = { 'א': "", 'ב': "", 'ג': "" };
            this.dialogStage = 'start';
            this.userGender = null;
            this.successfulAnswers = 0;
            this.lastQuestionTime = null;
        }

        chooseRandomProblem() {
            const problems = this.wordProblems[this.currentLevel];
            return problems[Math.floor(Math.random() * problems.length)];
        }

        simulateBotTyping(callback, delay = 1000) {
            isBotTyping = true;
            if (botStatus) botStatus.textContent = 'מתי מקליד/ה...';
            setTimeout(() => {
                callback();
                isBotTyping = false;
                if (botStatus) botStatus.textContent = 'אווטאר מתי זמין/ה';
            }, delay);
        }

        postBotMessageWithAvatar(message, avatarFilename, showButtons = false, buttons = []) {
            this.simulateBotTyping(() => {
                addMessage('bot', message, avatarFilename, showButtons, buttons);
                this.lastQuestionTime = Date.now();
            });
        }

        startConversationLogic() {
            this.postBotMessageWithAvatar("שלום! אני מתי. נפתור יחד בעיות מילוליות במתמטיקה.", "avatar_welcoming.png");
            setTimeout(() => {
                this.postBotMessageWithAvatar("איך תרצה שאפנה אליך?", "avatar_inviting_action.png", true, ["זכר", "נקבה"]);
                this.dialogStage = 'awaiting_gender';
            }, 2000);
        }

        handleChoiceButtonClick(event) {
            const btnText = event.target.textContent;
            addMessage('student', `בחרתי: ${btnText}`, 'student_avatar.png');

            if (this.dialogStage === 'awaiting_gender') {
                this.userGender = btnText === "זכר" ? 'male' : 'female';
                this.postBotMessageWithAvatar(
                    this.userGender === 'male' ? "מעולה! נדבר בלשון זכר." : "נהדר! נדבר בלשון נקבה.",
                    "avatar_confident.png"
                );
                setTimeout(() => {
                    this.postBotMessageWithAvatar(`הנה הבעיה שלנו:<br><b>${this.currentProblem}</b>`, "avatar_confident.png");
                    this.dialogStage = 'asking_guiding_questions';
                    setTimeout(() => this.askGuidingQuestion(), 1500);
                }, 1500);
            } else if (this.dialogStage === 'continue_or_stop') {
                if (btnText === "כן") {
                    this.currentLevel = this.successfulAnswers >= 2 ? 'level2' : 'level1';
                    this.currentProblem = this.chooseRandomProblem();
                    this.currentQuestionIndex = 0;
                    this.dialogStage = 'asking_guiding_questions';
                    this.postBotMessageWithAvatar(`הנה הבעיה:<br><b>${this.currentProblem}</b>`, "avatar_confident.png");
                    setTimeout(() => this.askGuidingQuestion(), 1500);
                } else {
                    this.postBotMessageWithAvatar("אין בעיה, נחזור מתי שתרצה. בהצלחה!", "avatar_support.png");
                    this.dialogStage = 'ended';
                }
            }
        }

        askGuidingQuestion() {
            if (this.currentQuestionIndex < this.guidingQuestions.length) {
                const q = this.guidingQuestions[this.currentQuestionIndex];
                this.postBotMessageWithAvatar(q.text, "avatar_support.png");
            } else {
                this.postBotMessageWithAvatar("רוצה להמשיך לפתור את הבעיה?", "avatar_inviting_action.png", true, ["כן", "לא"]);
                this.dialogStage = 'continue_or_stop';
            }
        }

        handleStudentInputLogic(input) {
            addMessage('student', input, 'student_avatar.png');
            if (this.dialogStage === 'asking_guiding_questions') {
                const q = this.guidingQuestions[this.currentQuestionIndex];
                this.studentGuidingAnswers[q.key] = input;

                let feedback = "תודה על התשובה!";
                if (q.key === 'א' && /(כמה|מה)/.test(input)) {
                    feedback = "יפה מאוד! הצלחת לזהות מה צריך למצוא.";
                } else if (q.key === 'ב' && /\d/.test(input)) {
                    feedback = "מעולה! הצלחת למצוא את הנתונים שיש לנו.";
                } else if (q.key === 'ג' && /(לא ברור|חסר|צריך לדעת)/.test(input)) {
                    feedback = "יופי! הצלחת לזהות מה חסר לפתרון.";
                }

                const reactionTime = Date.now() - (this.lastQuestionTime || Date.now());
                if (reactionTime < 10000 && feedback.includes("הצלחת")) {
                    this.successfulAnswers++;
                }

                this.postBotMessageWithAvatar(feedback, "avatar_compliment.png");
                this.currentQuestionIndex++;
                setTimeout(() => this.askGuidingQuestion(), 1500);
            }
        }
    }

    const bot = new MathProblemGuidingBot();

    if (startButton) {
        startButton.addEventListener('click', () => {
            welcomeScreen.style.display = 'none';
            appMainContainer.style.display = 'grid';
            document.body.classList.add('app-started');
            bot.startConversationLogic();
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', () => {
            const input = userInput.value.trim();
            if (!isBotTyping && input) {
                bot.handleStudentInputLogic(input);
                userInput.value = "";
            }
        });
    }

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendButton.click();
        });
    }
});

