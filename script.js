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
                    "לדניאל יש 1,200 צפיות ועוד 980 צפיות. כמה צפיות קיבל בסך הכול?"
                ],
                level2: [
                    "יש לי 200 ש\"ח. קניתי 3 מגשים ב-58 ש\"ח כל אחד ועוד עוגה ב-35 ש\"ח. כמה נשאר לי?",
                    "5 ילדים רוצים 3 פרוסות פיצה כל אחד. במגש יש 8 פרוסות. כמה מגשים צריך?"
                ],
                level3: [
                    "בכיתה יש 24 תלמידים. כל אחד מהם הביא 3 עפרונות ו-2 מחברות. כמה עפרונות ומחברות יש בסך הכול?",
                    "מתוך 300 תלמידים, 40% משתתפים בחוג. כמה תלמידים לא משתתפים?"
                ]
            };
            this.levelOrder = ['level1', 'level2', 'level3'];
            this.currentLevelIndex = 0;
            this.currentProblem = this.chooseRandomProblem();
            this.guidingQuestions = [];
            this.currentQuestionIndex = 0;
            this.studentGuidingAnswers = { 'א': "", 'ב': "", 'ג': "" };
            this.dialogStage = 'start';
            this.userGender = null;
            this.successfulAnswers = 0;
        }

        chooseRandomProblem() {
            const currentLevel = this.levelOrder[this.currentLevelIndex];
            const problems = this.wordProblems[currentLevel];
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
                this.updateGuidingQuestionsByGender();
                const greeting = this.userGender === 'male' ? "מעולה! נדבר בלשון זכר." : "נהדר! נדבר בלשון נקבה.";
                this.postBotMessageWithAvatar(greeting, "avatar_confident.png");
                setTimeout(() => {
                    this.postBotMessageWithAvatar(`הנה הבעיה שלנו:<br><b>${this.currentProblem}</b>`, "avatar_confident.png");
                    this.dialogStage = 'asking_guiding_questions';
                    setTimeout(() => this.askGuidingQuestion(), 1500);
                }, 1500);
            } else if (this.dialogStage === 'continue_or_stop') {
                if (btnText === "כן") {
                    if (this.successfulAnswers >= 2 && this.currentLevelIndex < this.levelOrder.length - 1) {
                        this.currentLevelIndex++;
                        this.successfulAnswers = 0;
                    }
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

        updateGuidingQuestionsByGender() {
            const isMale = this.userGender === 'male';
            this.guidingQuestions = [
                { key: 'א', text: isMale ? "מה אני צריך למצוא?" : "מה אני צריכה למצוא?", icon: "magnifying_glass.png" },
                { key: 'ב', text: isMale ? "מה אני יודע מהבעיה?" : "מה אני יודעת מהבעיה?", icon: "list.png" },
                { key: 'ג', text: isMale ? "מה חסר לי לדעת כדי לפתור?" : "מה חסר לי לדעת כדי לפתור?", icon: "Missing_puzzle.png" }
            ];
        }

        getRandomFeedback(type) {
            const emotional = {
                'א': ["איזה יופי, קלטת את השאלה המרכזית!", "נהדר! הבנת מה לבחון."],
                'ב': ["מעולה! אספת את הנתונים הנכונים.", "נהדר, אתה בכיוון הנכון עם מה שידוע."],
                'ג': ["כל הכבוד! סימנת את מה שעדיין חסר.", "מעולה! איתרת את החסר בתמונה."]
            };
            const neutral = {
                'א': ["נראה שהבנת מה נדרש למצוא. עבודה טובה!", "תשובה ברורה – מצאת את הדרוש."],
                'ב': ["הצלחת לזהות את הנתונים הקיימים.", "זיהית מה יש לנו – זה חשוב!"],
                'ג': ["סימנת נכון את החסר. זה חשוב!", "התייחסת למה שחסר – כל הכבוד."]
            };
            const rand = Math.random();
            const pool = rand < 0.5 ? emotional[type] : neutral[type];
            return pool[Math.floor(Math.random() * pool.length)];
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

                const feedback = this.getRandomFeedback(q.key);
                this.postBotMessageWithAvatar(feedback, "avatar_compliment.png");

                this.successfulAnswers++;
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
