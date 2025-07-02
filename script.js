// --- משתנים כלליים ---
document.addEventListener('DOMContentLoaded', async () => {
    const startButton = document.getElementById('start-button');
    const welcomeScreen = document.getElementById('welcome-screen');
    const appMainContainer = document.getElementById('app-main-container');
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const botStatus = document.getElementById('bot-status');
    const stars = document.querySelectorAll('.star');
    const largeAvatar = document.getElementById('large-avatar');
    const resetButton = document.getElementById('reset-button');

    const successSound = new Audio('sounds/success-chime.mp3');
    let isBotTyping = false;

    const avatarExpressions = {
        welcoming: "avatar_welcoming.png",
        inviting: "avatar_inviting_action.png",
        confident: "avatar_confident.png",
        compliment: "avatar_compliment.png",
        thinking: "avatar_thinking.png",
        support: "avatar_support.png",
        confuse: "avatar_confuse.png",
        empathic: "avatar_Empathic.png",
        excited: "avatar_excited.png",
        ready: "avatar_ready.png"
    };

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'bot' ? 'bot-message' : 'student-message');
        const textSpan = document.createElement('span');
        textSpan.classList.add('message-text');
        textSpan.innerHTML = text;
        messageDiv.appendChild(textSpan);
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // פונקציה לשליחת הודעת בוט עם אפשרות לכפתורים
    function postBotMessageWithEmotion(message, emotion = 'support', showButtons = false, buttons = []) {
        const avatarFilename = avatarExpressions[emotion] || avatarExpressions['support'];
        if (largeAvatar) largeAvatar.src = `./avatars/${avatarFilename}`;
        bot.simulateBotTyping(() => {
            addMessage('bot', message);
            if (showButtons && buttons.length) {
                const buttonsDiv = document.createElement('div');
                buttonsDiv.classList.add('button-group');
                buttons.forEach(btnText => {
                    const btn = document.createElement('button');
                    btn.textContent = btnText;
                    btn.classList.add('choice-button');
                    btn.addEventListener('click', (e) => {
                        // הסר סימון מכל הכפתורים ובחר את הכפתור הנוכחי
                        document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
                        e.target.classList.add('selected');
                        // העבר את הבחירה לטיפול בבוט
                        bot.handleChoiceButtonClick(e.target.textContent); // קורא למתודה בתוך הבוט
                    });
                    buttonsDiv.appendChild(btn);
                });
                chatWindow.appendChild(buttonsDiv);
                chatWindow.scrollTop = chatWindow.scrollHeight;
            }
        });
    }

    class MathProblemGuidingBot {
        constructor() {
            this.wordProblems = {};
            this.levelOrder = ['level1', 'level2', 'level3'];
            this.currentLevelIndex = 0;
            this.currentProblem = null;
            this.guidingQuestions = [];
            this.currentQuestionIndex = 0;
            this.studentGuidingAnswers = { 'א': '', 'ב': '', 'ג': '' };
            this.dialogStage = 'start'; // שלב התחלתי
            this.userGender = null;
            this.userName = null;
            this.completedProblems = 0; // מונה בעיות שהושלמו
            this.successfulAnswers = 0; // מונה תשובות נכונות ברצף
        }

        async loadProblemsFromFile() {
            try {
                const response = await fetch('questions_data.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                this.wordProblems = {
                    level1: data.filter(q => q.level === 1),
                    level2: data.filter(q => q.level === 2),
                    level3: data.filter(q => q.level === 3)
                };
                this.currentProblem = this.chooseRandomProblem();
            } catch (error) {
                console.error("Failed to load problems:", error);
                alert("אירעה שגיאה בטעינת הבעיות. נסה/י לרענן את העמוד.");
            }
        }

        chooseRandomProblem() {
            const currentLevel = this.levelOrder[this.currentLevelIndex];
            const problems = this.wordProblems[currentLevel];
            if (!problems || problems.length === 0) {
                console.warn(`No problems found for level: ${currentLevel}`);
                return { question: "אין כרגע בעיות ברמה זו. נסה/י שוב מאוחר יותר.", keywords: {}, clarifications: {} };
            }
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

        // --- הוספת הפונקציה startConversationLogic ---
        startConversationLogic() {
            postBotMessageWithEmotion(`שלום! אני מתי. איך קוראים לך?`, 'welcoming');
            this.dialogStage = 'awaiting_name'; // נגדיר שהבוט ממתין לשם
        }
        // --- סוף הפונקציה שנוספה ---

        // פונקציה לטיפול בלחיצות כפתור מהבוט (למשל, זכר/נקבה, כן/לא)
        handleChoiceButtonClick(choice) {
            addMessage('student', choice); // הצג את בחירת התלמיד כהודעה

            if (this.dialogStage === 'awaiting_gender') {
                if (choice === "זכר" || choice === "נקבה" || choice === "לא משנה לי") {
                    this.userGender = (choice === "זכר") ? "male" : (choice === "נקבה") ? "female" : "neutral";
                    this.updateGuidingQuestionsByGender(); // עדכן שאלות מנחות לפי מגדר
                    const greeting = this.userGender === 'male'
                        ? "נהדר! נדבר בלשון זכר."
                        : this.userGender === 'female'
                            ? "נהדר! נדבר בלשון נקבה."
                            : "נשתמש בלשון ניטרלית כדי שתרגיש/י בנוח.";
                    postBotMessageWithEmotion(greeting, 'confident');

                    // שמור מידע ב-LocalStorage
                    localStorage.setItem('userGender', this.userGender);
                    localStorage.setItem('chatStarted', 'true');

                    // הבעיה הראשונה תופיע לאחר ברכה ופרטי התחלה
                    setTimeout(() => {
                        postBotMessageWithEmotion(`היי ${this.userName}! נעים להכיר, אני מתי ואנחנו נלמד ביחד איך מילים הופכות למספרים בשלושה שלבים.`, 'confident');
                    }, 1500);
                    setTimeout(() => {
                        postBotMessageWithEmotion(`הנה הבעיה שלנו:<br><b>${this.currentProblem.question}</b>`, 'confident');
                        this.dialogStage = 'asking_guiding_questions';
                        setTimeout(() => this.askGuidingQuestion(), 1500);
                    }, 3000);

                } else {
                    postBotMessageWithEmotion("בבקשה בחר/י מבין האפשרויות: 'זכר', 'נקבה' או 'לא משנה לי'.", 'confuse');
                }
            } else if (this.dialogStage === 'continue_or_stop') {
                if (choice === "כן") {
                    this.completedProblems++;

                    // בדיקה אם לעבור רמה (5 בעיות שהושלמו)
                    if (this.completedProblems >= 5 && this.currentLevelIndex < this.levelOrder.length - 1) {
                        const name = this.userName ? ` ${this.userName}` : "";
                        postBotMessageWithEmotion(`וואו${name}! פתרת כבר 5 בעיות ברמה הזו 🎯`, 'excited');
                        setTimeout(() => {
                            postBotMessageWithEmotion("רוצה לעבור לרמה מתקדמת יותר?", 'inviting', true, ["כן, ברור!", "נשאר ברמה הזו"]);
                            this.dialogStage = 'offer_level_up';
                        }, 1800);
                        return; // חשוב לצאת כדי לא להמשיך ללוגיקה הרגילה
                    }
                    
                    // קידום רמה אוטומטי (3 תשובות נכונות ברצף)
                    if (this.successfulAnswers >= 3 && this.currentLevelIndex < this.levelOrder.length - 1) {
                        this.currentLevelIndex++;
                        this.successfulAnswers = 0; // איפוס מונה תשובות נכונות ברצף
                        this.completedProblems = 0; // איפוס מונה בעיות שהושלמו (לרמה החדשה)
                        postBotMessageWithEmotion(`נהדר ${this.userName}! עברנו לרמה הבאה.`, 'confident');
                        setTimeout(() => {
                            this.currentProblem = this.chooseRandomProblem();
                            this.currentQuestionIndex = 0;
                            this.dialogStage = 'asking_guiding_questions';
                            postBotMessageWithEmotion(`הנה הבעיה הבאה:<br><b>${this.currentProblem.question}</b>`, 'confident');
                            setTimeout(() => this.askGuidingQuestion(), 1500);
                        }, 1000);
                        return; // חשוב לצאת כאן
                    }
                    
                    // אם לא עברנו רמה, פשוט נמשיך לבעיה הבאה באותה רמה
                    this.currentProblem = this.chooseRandomProblem();
                    this.currentQuestionIndex = 0;
                    this.dialogStage = 'asking_guiding_questions';
                    postBotMessageWithEmotion(`הנה הבעיה:<br><b>${this.currentProblem.question}</b>`, 'confident');
                    setTimeout(() => this.askGuidingQuestion(), 1500);

                } else {
                    postBotMessageWithEmotion("אין בעיה, נחזור כשתרצה/י. בהצלחה!", 'support');
                    this.dialogStage = 'ended'; // הגדרת שלב הסיום
                }
            } else if (this.dialogStage === 'offer_level_up') {
                if (choice === "כן, ברור!") {
                    this.currentLevelIndex++;
                    this.completedProblems = 0; // איפוס מונה בעיות לרמה החדשה
                    this.successfulAnswers = 0; // איפוס מונה הצלחות לרמה החדשה
                    postBotMessageWithEmotion("מעולה! עוברים לרמה הבאה 💪", 'confident');
                    setTimeout(() => {
                        this.currentProblem = this.chooseRandomProblem();
                        this.currentQuestionIndex = 0;
                        this.dialogStage = 'asking_guiding_questions';
                        postBotMessageWithEmotion(`הנה הבעיה:<br><b>${this.currentProblem.question}</b>`, 'confident');
                        setTimeout(() => this.askGuidingQuestion(), 1500);
                    }, 1800);
                } else {
                    postBotMessageWithEmotion("אין בעיה, נמשיך באותה רמה 😊", 'support');
                    // נשארים באותה רמה, טוענים בעיה חדשה
                    this.currentProblem = this.chooseRandomProblem();
                    this.currentQuestionIndex = 0;
                    this.dialogStage = 'asking_guiding_questions';
                    setTimeout(() => {
                        postBotMessageWithEmotion(`הנה הבעיה:<br><b>${this.currentProblem.question}</b>`, 'confident');
                        setTimeout(() => this.askGuidingQuestion(), 1500);
                    }, 1500);
                }
            }
        }

        updateGuidingQuestionsByGender() {
            const isMale = this.userGender === 'male';
            const isFemale = this.userGender === 'female';
            const text = (male, female, neutral) => isMale ? male : isFemale ? female : neutral;
            this.guidingQuestions = [
                { key: 'א', text: text("מה אני צריך למצוא?", "מה אני צריכה למצוא?", "מה צריך למצוא?"), icon: "magnifying_glass.png" },
                { key: 'ב', text: text("מה אני יודע מהבעיה?", "מה אני יודעת מהבעיה?", "מה ידוע לי?"), icon: "list.png" },
                { key: 'ג', text: text("מה חסר לי לדעת כדי לפתור?", "מה חסר לי לדעת כדי לפתור?", "מה חסר לי כדי לפתור?"), icon: "Missing_puzzle.png" }
            ];
        }

        askGuidingQuestion() {
            if (this.currentQuestionIndex < this.guidingQuestions.length) {
                const q = this.guidingQuestions[this.currentQuestionIndex];
                const html = `<div class="guided-question"><img src="./icons-leading-questions/${q.icon}" alt="icon" /> ${q.text}</div>`;
                postBotMessageWithEmotion(html, 'support');
            } else {
                // כל השאלות המנחות נענו
                postBotMessageWithEmotion("רוצה להמשיך לפתור עוד בעיה?", 'inviting', true, ["כן", "לא"]);
                this.dialogStage = 'continue_or_stop';
            }
        }

        handleStudentInputLogic(input) {
            addMessage('student', input);
            if (this.dialogStage === 'awaiting_name') {
                this.userName = input.trim();
                if (!this.userName) {
                    postBotMessageWithEmotion("בבקשה הזן/הזיני שם.", 'confuse');
                    return;
                }
                postBotMessageWithEmotion(`נעים להכיר, ${this.userName}!`, 'welcoming');
                setTimeout(() => {
                    postBotMessageWithEmotion("איך תרצה/י שאפנה אליך?", 'inviting', true, ["זכר", "נקבה", "לא משנה לי"]);
                    this.dialogStage = 'awaiting_gender';
                }, 1200);
                localStorage.setItem('userName', this.userName); // שמירה ב-LocalStorage
            } else if (this.dialogStage === 'asking_guiding_questions') {
                const q = this.guidingQuestions[this.currentQuestionIndex];
                this.studentGuidingAnswers[q.key] = input;
                const keywords = this.currentProblem.keywords?.[q.key] || [];
                const clarification = this.currentProblem.clarifications?.[q.key];

                // בדיקה אם התשובה חלקית וקצרה, ואם יש הבהרה
                const isPartialAndShort = keywords.some(keyword => input.includes(keyword)) && input.length <= 14;

                if (isPartialAndShort && clarification) {
                    postBotMessageWithEmotion(clarification, 'support');
                } else {
                    const feedback = this.getRandomFeedback(q.key);
                    postBotMessageWithEmotion(feedback, 'compliment');
                    this.markStar(this.currentQuestionIndex);
                    this.successfulAnswers++; // מונה הצלחות רצופות
                    this.currentQuestionIndex++;
                    setTimeout(() => this.askGuidingQuestion(), 1500);
                }
            } else {
                // טיפול בקלט בשלבים אחרים אם נדרש (למשל, תגובות כלליות)
                postBotMessageWithEmotion("אני לא בטוח/ה שהבנתי. אנחנו כרגע בשלב אחר של השיחה.", 'confuse');
            }
        }

        markStar(index) {
            if (stars[index]) {
                stars[index].src = 'icons-leading-questions/star_gold.png';
                stars[index].classList.add('earned');
                successSound.play();
            }
            // שנה הבעת אווטאר לאחר 3 כוכבים
            if (this.successfulAnswers === 3 && largeAvatar) {
                setTimeout(() => {
                    largeAvatar.src = `./avatars/${avatarExpressions.excited}`;
                }, 700); // השהייה קלה כדי לאפשר לכוכב להופיע
            }
        }

        getRandomFeedback(type) {
            const emotional = {
                'א': ["איזה יופי, קלטת את השאלה המרכזית!", "נהדר! הבנת מה לבחון."],
                'ב': ["מעולה! אספת את הנתונים הנכונים.", "נהדר, את/ה בכיוון הנכון עם מה שידוע."],
                'ג': ["כל הכבוד! סימנת את מה שעדיין חסר.", "מעולה! איתרת את החסר בתמונה."]
            };
            const neutral = {
                'א': ["נראה שהבנת מה נדרש למצוא. עבודה טובה!", "תשובה ברורה – מצאת את הדרוש."],
                'ב': ["הצלחת לזהות את הנתונים הקיימים.", "זיהית מה יש לנו – זה חשוב!"],
                'ג': ["סימנת נכון את החסר. זה חשוב!", "התייחסת למה שחסר – כל הכבוד."]
            };
            const pool = Math.random() < 0.5 ? emotional[type] : neutral[type];
            return pool[Math.floor(Math.random() * pool.length)];
        }
    }

    const bot = new MathProblemGuidingBot();
    await bot.loadProblemsFromFile();

    // שמירה של מצב השיחה באמצעות LocalStorage
    if (localStorage.getItem('chatStarted') === 'true' && localStorage.getItem('userName') && localStorage.getItem('userGender')) {
        // אם הצ'אט כבר התחיל ויש שם ומגדר שמורים
        welcomeScreen.style.display = 'none';
        appMainContainer.style.display = 'grid';
        document.body.classList.add('app-started');
        bot.userName = localStorage.getItem('userName');
        bot.userGender = localStorage.getItem('userGender');
        bot.updateGuidingQuestionsByGender();
        // הצג הודעת ברוכים הבאים ומיד את הבעיה הבאה
        postBotMessageWithEmotion(`היי ${bot.userName}! ברוך/ה שוב. הנה הבעיה הבאה שלנו:<br><b>${bot.currentProblem.question}</b>`, 'confident');
        bot.dialogStage = 'asking_guiding_questions';
        setTimeout(() => bot.askGuidingQuestion(), 1500);
    } else {
        // אם זו הפעם הראשונה, הצג מסך פתיחה
        welcomeScreen.style.display = 'flex';
        appMainContainer.style.display = 'none';
        document.body.classList.remove('app-started');
        // נקה LocalStorage למקרה שהייתה התחלה לא מלאה
        localStorage.removeItem('chatStarted');
        localStorage.removeItem('userName');
        localStorage.removeItem('userGender');
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            localStorage.removeItem('chatStarted');
            localStorage.removeItem('userName');
            localStorage.removeItem('userGender');
            window.location.reload();
        });
    }

    if (startButton) {
        startButton.addEventListener('click', () => {
            localStorage.setItem('chatStarted', 'true'); // סמן שהצ'אט התחיל
            welcomeScreen.style.display = 'none'; // הסתר את מסך הפתיחה
            appMainContainer.style.display = 'grid'; // הצג את המסך הראשי (חלון הצ'אט)
            document.body.classList.add('app-started'); // הוסף קלאס לגוף לשליטה בפריסה
            bot.startConversationLogic(); // התחל את לוגיקת השיחה של הבוט
        });
    }

    sendButton.addEventListener('click', () => {
        const input = userInput.value.trim();
        if (input) {
            bot.handleStudentInputLogic(input);
            userInput.value = ''; // נקה את שדה הקלט
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
});
