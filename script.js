document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const welcomeScreen = document.getElementById('welcome-screen');
    const appMainContainer = document.getElementById('app-main-container'); // מתאים ל-HTML
    const chatWindow = document.getElementById('chat-window'); // מתאים ל-HTML
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const largeAvatar = document.getElementById('large-avatar');
    const botStatus = document.getElementById('bot-status');

    let isBotTyping = false;

    // --- Helper function to add message to chat ---
    function addMessage(sender, text, avatarFileName, showButtons = false, buttons = []) {
        if (!chatWindow) {
            console.error("Chat window element not found!");
            return;
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'bot' ? 'bot-message' : 'student-message');

        const avatarImg = document.createElement('img');
        avatarImg.classList.add('avatar');
        avatarImg.src = `./avatars/${avatarFileName}`; // נתיב מתוקן
        avatarImg.alt = sender + ' avatar';

        const textSpan = document.createElement('span');
        textSpan.classList.add('message-text');
        textSpan.innerHTML = text;

        if (sender === 'bot') {
            messageDiv.appendChild(avatarImg);
            messageDiv.appendChild(textSpan);
        } else { // For student messages
            messageDiv.appendChild(textSpan);
            const studentAvatarImg = document.createElement('img');
            studentAvatarImg.classList.add('avatar');
            studentAvatarImg.src = `./avatars/student_avatar.png`; // נתיב לאווטאר תלמיד
            studentAvatarImg.alt = 'Student avatar';
            messageDiv.appendChild(studentAvatarImg);
        }

        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        if (showButtons && buttons.length > 0 && sender === 'bot') {
            const buttonsDiv = document.createElement('div');
            buttonsDiv.classList.add('button-group');
            messageDiv.classList.add('has-buttons'); // Mark message as having buttons

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

    // --- Bot Logic Class ---
    class MathProblemGuidingBot {
        constructor() {
            this.guidingQuestions = [
                { key: 'א', text: "מה אנחנו צריכים למצוא? כלומר, מה השאלה המרכזית כאן?", icon: "question_find.png" },
                { key: 'ב', text: "מה כבר יש לנו בבעיה? מה הנתונים שיכולים לעזור לנו?", icon: "question_know.png" },
                { key: 'ג', text: "יש משהו שעדיין לא ברור או חסר לנו לדעת כדי לפתור את הבעיה?", icon: "question_need.png" }
            ];
            this.currentQuestionIndex = 0;
            this.studentGuidingAnswers = { 'א': "", 'ב': "", 'ג': "" };
            this.dialogStage = 'start';
            this.currentProblem = "אבא קנה 5 תפוחים ואמא קנתה 3 תפוחים. כמה תפוחים יש בסך הכל?"; // הבעיה המתמטית
            this.userGender = null; // 'male', 'female', 'other'
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

        postBotMessageWithIcon(message, iconFilename, avatarFilename) {
            this.simulateBotTyping(() => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', 'bot-message');

                const avatarImg = document.createElement('img');
                avatarImg.src = `./avatars/${avatarFilename}`; // נתיב לאווטאר
                avatarImg.alt = "אווטאר מתי";
                avatarImg.classList.add('avatar');

                const textDiv = document.createElement('span'); // Changed to span as per addMessage
                textDiv.classList.add('message-text');
                textDiv.innerHTML = message;

                const iconImg = document.createElement('img');
                iconImg.src = `./icons-leading-questions/${iconFilename}`; // נתיב לאייקון
                iconImg.alt = "שאלה מנחה";
                iconImg.classList.add('question-icon');

                // Order of elements for bot-message with icon (icon, avatar, text) for RTL
                messageDiv.appendChild(iconImg);
                messageDiv.appendChild(avatarImg);
                messageDiv.appendChild(textDiv);

                chatWindow.appendChild(messageDiv);
                chatWindow.scrollTop = chatWindow.scrollHeight;
            });
        }

        startConversationLogic() {
            this.postBotMessageWithAvatar(
                "היי! אני מתי, ואני כאן כדי לעזור לך להבין מתמטיקה בצורה קלה וברורה. נלמד יחד, צעד אחר צעד!",
                "avatar_welcoming.png"
            );
            setTimeout(() => {
                this.postBotMessageWithAvatar(
                    "המטרה שלי היא לעזור לך להבין את הבעיה, לא רק למצוא את התשובה.",
                    "avatar_confident.png"
                );
            }, 2000);
            setTimeout(() => {
                this.postBotMessageWithAvatar(
                    "ספר לי, איך תרצה שאפנה אליך? בחר/י את המגדר שלך כדי שנדבר בצורה הכי נוחה לך.",
                    "avatar_inviting_action.png",
                    true, // showButtons = true
                    ["זכר", "נקבה", "אחר/ת"]
                );
                this.dialogStage = 'awaiting_gender';
            }, 4000);
        }

        handleChoiceButtonClick(event) {
            const button = event.target;
            const btnText = button.textContent;

            // Disable all buttons in the same group after a choice is made
            const parentButtonGroup = button.closest('.button-group');
            if (parentButtonGroup) {
                Array.from(parentButtonGroup.children).forEach(btn => {
                    btn.disabled = true;
                    btn.style.opacity = '0.7';
                    btn.style.cursor = 'default';
                });
            }

            addMessage('student', `בחרתי: ${btnText}`, 'student_avatar.png');

            if (this.dialogStage === 'awaiting_gender') {
                const genderMap = { "זכר": "male", "נקבה": "female", "אחר/ת": "other" };
                this.userGender = genderMap[btnText] || null;
                this.updateMainAvatar(this.userGender); // Update the large avatar

                let genderResponse = "";
                if (this.userGender === 'male') {
                    genderResponse = "נהדר, נפלא! אדבר אליך בלשון זכר. אתה מוכן? בוא נתחיל.";
                } else if (this.userGender === 'female') {
                    genderResponse = "נהדר, נפלא! אדבר אליך בלשון נקבה. את מוכנה? בואי נתחיל.";
                } else {
                    genderResponse = "נהדר, נפלא! אדבר אליך בלשון ניטרלית. בואו נתחיל.";
                }

                this.postBotMessageWithAvatar(genderResponse, "avatar_confident.png");

                setTimeout(() => {
                    this.postBotMessageWithAvatar(`הנה הבעיה שלנו היום:<br><b>${this.currentProblem}</b>`, "avatar_confident.png");
                }, 1500);
                setTimeout(() => {
                    this.postBotMessageWithAvatar("עכשיו, בוא/י נתחיל עם כמה שאלות שיעזרו לנו להבין טוב יותר את הבעיה:", "avatar_support.png");
                    this.dialogStage = 'asking_guiding_questions';
                    setTimeout(() => this.askGuidingQuestion(), 1500);
                }, 3000);
            } else if (this.dialogStage === 'continue_or_stop') {
                if (btnText === "להמשיך") {
                    this.postBotMessageWithAvatar(`מעולה! בוא/י נתחיל לתרגם את הבעיה למספרים ולפעולות מתמטיות.`, "avatar_compliment.png");
                    this.dialogStage = 'problem_translation_help';
                    setTimeout(() => this.askForFirstStepInTranslation(), 1500);
                } else {
                    this.postBotMessageWithAvatar(`אני פה כשתרצה/י להמשיך. בהצלחה!`, "avatar_support.png");
                    this.dialogStage = 'ended';
                    userInput.disabled = true;
                    sendButton.disabled = true;
                }
            }
        }

        updateMainAvatar(gender) {
            if (largeAvatar) {
                if (gender === 'male') {
                    largeAvatar.src = './avatars/avatar_male_default.png';
                } else if (gender === 'female') {
                    largeAvatar.src = './avatars/avatar_female_default.png';
                } else {
                    largeAvatar.src = './avatars/avatar_welcoming.png';
                }
                largeAvatar.alt = `אווטאר מתי - ${gender}`;
            }
        }

        askGuidingQuestion() {
            if (this.currentQuestionIndex < this.guidingQuestions.length) {
                const q = this.guidingQuestions[this.currentQuestionIndex];
                let currentAvatar = "avatar_support.png";
                if (this.userGender === 'male') currentAvatar = "avatar_male_support.png";
                if (this.userGender === 'female') currentAvatar = "avatar_female_support.png";

                this.postBotMessageWithIcon(q.text, q.icon, currentAvatar);
            } else {
                this.postBotMessageWithAvatar(
                    "מה תרצה/י לעשות עכשיו?",
                    "avatar_inviting_action.png",
                    true,
                    ["להמשיך", "לעצור"]
                );
                this.dialogStage = 'continue_or_stop';
            }
        }

        askForFirstStepInTranslation() {
            this.postBotMessageWithAvatar("בוא/י נסביר איך להתחיל לפתור: מה הצעד הראשון שתעשה/י?", "avatar_inviting_action.png");
            setTimeout(() => {
                this.postBotMessageWithAvatar("איך היית כותב/ת את זה במתמטיקה?", "avatar_inviting_action.png");
            }, 1500);
        }

        handleStudentInputLogic(input) {
            if (isBotTyping) return;

            // Immediately add student message
            addMessage('student', input, 'student_avatar.png');
            userInput.value = ""; // Clear input after sending

            if (input.trim() === "") {
                this.postBotMessageWithAvatar("🤔 כתוב/י משהו כדי שאוכל לעזור.", "avatar_confuse.png");
                return;
            }

            if (this.dialogStage === 'awaiting_gender') {
                this.postBotMessageWithAvatar("אנא בחר/י את המגדר שלך מהכפתורים למטה.", "avatar_confuse.png", true, ["זכר", "נקבה", "אחר/ת"]);
                return;
            }

            if (this.dialogStage === 'asking_guiding_questions') {
                const q = this.guidingQuestions[this.currentQuestionIndex];
                this.studentGuidingAnswers[q.key] = input;

                let response = "";
                let currentAvatar = "avatar_support.png";

                if (q.key === 'א') { // What to find
                    if (input.includes("כמה") || input.includes("מה")) {
                        response = "מעולה, אתה/את מתמקד/ת בשאלה החשובה!";
                        currentAvatar = "avatar_compliment.png";
                    } else {
                        response = "נסה/נסי לנסח את מה שאתה/את רוצה למצוא בצורה מדויקת יותר.";
                        currentAvatar = "avatar_confuse.png";
                    }
                } else if (q.key === 'ב') { // What we know
                    if (/\d/.test(input)) { // Check if input contains numbers
                        response = "יפה, זיהית את הנתונים החשובים!";
                        currentAvatar = "avatar_compliment.png";
                    } else {
                        response = "נסה/נסי למצוא את כל המספרים או הנתונים שבבעיה.";
                        currentAvatar = "avatar_confuse.png";
                    }
                } else if (q.key === 'ג') { // What's unclear/missing
                    if (input.includes("אין") || input.includes("לא יודע") || input.includes("ברור")) { // Check for keywords
                        response = "טוב, בוא/י נוודא שאין פרטים חסרים לפני שמתחילים לפתור.";
                        currentAvatar = "avatar_thinking.png";
                    } else {
                        response = "מעולה, נשמע שאתה/את ממוקד/ת!";
                        currentAvatar = "avatar_compliment.png";
                    }
                }

                this.postBotMessageWithAvatar(response, currentAvatar);
                this.currentQuestionIndex++;
                setTimeout(() => this.askGuidingQuestion(), 2000);

            } else if (this.dialogStage === 'problem_translation_help') {
                const inputLower = input.toLowerCase();
                let botResponse = "";
                let currentAvatar = "avatar_thinking.png";

                if (inputLower.includes("חיבור") || inputLower.includes("+") || inputLower.includes("ועוד") || inputLower.includes("יותר")) {
                    botResponse = "נשמע שאתה/את חושב/ת על חיבור, למה דווקא חיבור?";
                    currentAvatar = "avatar_thinking.png";
                } else if (inputLower.includes("חיסור") || inputLower.includes("-") || inputLower.includes("פחות")) {
                    botResponse = "חיסור זו אפשרות טובה, מה גרם לך לחשוב כך?";
                    currentAvatar = "avatar_thinking.png";
                } else if (inputLower.includes("לא יודע") || inputLower.includes("קשה לי")) {
                    botResponse = "זה בסדר אם לא בטוח/ה, בוא/י ננסה יחד.";
                    currentAvatar = "avatar_support.png";
                } else {
                    botResponse = "מעניין! ספר לי איך הגעת למחשבה הזו.";
                    currentAvatar = "avatar_thinking.png";
                }
                this.postBotMessageWithAvatar(botResponse, currentAvatar);

            } else if (this.dialogStage === 'continue_or_stop') {
                this.postBotMessageWithAvatar("אנא בחר/י אחת מהאפשרויות למטה.", "avatar_confuse.png", true, ["להמשיך", "לעצור"]);
            } else if (this.dialogStage === 'ended') {
                this.postBotMessageWithAvatar("השיחה הסתיימה. אני כאן בשבילך מתי שתרצה/י לחזור.", "avatar_support.png");
            }
        }
    }

    const bot = new MathProblemGuidingBot();

    // --- Event Listeners ---
    if (startButton) {
        startButton.addEventListener('click', () => {
            if (welcomeScreen) {
                welcomeScreen.style.display = 'none';
            }
            if (appMainContainer) {
                appMainContainer.style.display = 'grid'; // Change to grid
                document.body.classList.add('app-started'); // Add class to body for CSS
            }
            bot.startConversationLogic();
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', () => {
            const input = userInput.value.trim();
            if (!isBotTyping) { // Only process if bot is not typing
                bot.handleStudentInputLogic(input);
            }
        });
    }

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });
    }
});
