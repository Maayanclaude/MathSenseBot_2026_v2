document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const welcomeScreen = document.getElementById('welcome-screen');
    const appMainContainer = document.getElementById('app-main-container');
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const largeAvatar = document.getElementById('large-avatar');
    const botStatus = document.getElementById('bot-status');

    // Ensure initial state
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
    }
    if (appMainContainer) {
        appMainContainer.style.display = 'none';
    }

    let isBotTyping = false;
    let currentAvatarMood = 'welcoming'; // Default avatar mood

    // --- Helper function to add message to chat ---
    function addMessage(sender, text, avatarFileName) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'bot' ? 'bot-message' : 'student-message');

        const avatarImg = document.createElement('img');
        avatarImg.classList.add('avatar');
        // Ensure the avatar path is always .png
        avatarImg.src = `avatars/${avatarFileName}.png`; 
        avatarImg.alt = sender + ' avatar';

        const textSpan = document.createElement('span');
        textSpan.classList.add('message-text');
        textSpan.textContent = text;

        if (sender === 'bot') {
            messageDiv.appendChild(avatarImg);
            messageDiv.appendChild(textSpan);
        } else {
            messageDiv.appendChild(textSpan);
            messageDiv.appendChild(avatarImg);
        }
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
    }

    // --- Bot Logic Class (Example, can be expanded) ---
    class MathProblemGuidingBot {
        constructor() {
            this.guidingQuestions = [
                // Make sure these filenames are correct and files are PNG!
                { key: 'N', text: 'מה נתון לנו בבעיה?', icon: 'icons-leading-questions/question_given.png' },
                { key: 'B', text: 'מה אנחנו צריכים למצוא/לחשב?', icon: 'icons-leading-questions/question_find.png' },
                { key: 'R', text: 'האם יש לנו רמזים בבעיה?', icon: 'icons-leading-questions/question_clues.png' },
                { key: 'L', text: 'האם יש מילים בעייתיות או לא ברורות?', icon: 'icons-leading-questions/question_unclear_words.png' },
                { key: 'T', text: 'מהו סוג הבעיה (למשל: בעיית תנועה, אחוזים, יחס)?', icon: 'icons-leading-questions/question_type.png' },
                { key: 'P', text: 'כיצד היית מנסה לפתור את הבעיה?', icon: 'icons-leading-questions/question_solve.png' },
                { key: 'S', text: 'האם ניסית לצייר/לשרטט את הבעיה?', icon: 'icons-leading-questions/question_draw.png' }
            ];
            this.currentQuestionIndex = 0;
            this.studentGender = ''; // 'male', 'female', 'neutral'
        }

        // Helper to post bot message with current avatar mood
        postBotMessageWithAvatar(text, mood = currentAvatarMood) {
            // Pass only the filename without extension, addMessage will add .png
            addMessage('bot', text, `avatar_${mood}`);
            largeAvatar.src = `avatars/avatar_${mood}.png`;
            currentAvatarMood = mood; // Update current mood
        }

        // Helper to post student message
        postStudentMessageWithAvatar(text) {
            // Assuming a generic student avatar filename without extension
            addMessage('student', text, `avatar_student_placeholder`); // Make sure avatar_student_placeholder.png exists
        }

        startConversationLogic() {
            this.postBotMessageWithAvatar('שלום! אני מתי, כאן כדי לעזור לך להבין בעיות מתמטיות בדרך פשוטה ואינטראקטיבית. זכור/זכרי: המטרה היא להבין את הבעיה, לא רק לקבל תשובה.', 'welcoming');
            setTimeout(() => {
                this.postBotMessageWithAvatar('איך אוכל לפנות אלייך? בחר/י את המגדר שלך כדי לדבר בצורה הכי נכונה.', 'confused');
                this.displayGenderSelectionButtons();
            }, 1500);
        }

        displayGenderSelectionButtons() {
            const buttonGroupDiv = document.createElement('div');
            buttonGroupDiv.classList.add('button-group');

            const maleBtn = document.createElement('button');
            maleBtn.classList.add('choice-button');
            maleBtn.textContent = 'זכר';
            maleBtn.onclick = () => {
                this.handleGenderSelection('male');
                buttonGroupDiv.remove(); // Remove buttons after selection
            };

            const femaleBtn = document.createElement('button');
            femaleBtn.classList.add('choice-button');
            femaleBtn.textContent = 'נקבה';
            femaleBtn.onclick = () => {
                this.handleGenderSelection('female');
                buttonGroupDiv.remove();
            };

            const neutralBtn = document.createElement('button');
            neutralBtn.classList.add('choice-button');
            neutralBtn.textContent = 'אח/ות';
            neutralBtn.onclick = () => {
                this.handleGenderSelection('neutral');
                buttonGroupDiv.remove();
            };

            buttonGroupDiv.appendChild(maleBtn);
            buttonGroupDiv.appendChild(femaleBtn);
            buttonGroupDiv.appendChild(neutralBtn);
            chatWindow.appendChild(buttonGroupDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        handleGenderSelection(gender) {
            this.studentGender = gender;
            let responseText;
            switch (gender) {
                case 'male':
                    responseText = 'תודה, נפלא! אתה יכול לפנות אלי בכל שאלה. אז בוא נתחיל...';
                    break;
                case 'female':
                    responseText = 'תודה, נפלא! את יכולה לפנות אלי בכל שאלה. אז בואי נתחיל...';
                    break;
                case 'neutral':
                    responseText = 'תודה, נפלא! אתם יכולים לפנות אלי בכל שאלה. אז בואו נתחיל...';
                    break;
            }
            this.postBotMessageWithAvatar(responseText, 'confident');
            setTimeout(() => {
                this.askGuidingQuestion();
            }, 1000);
        }

        askGuidingQuestion() {
            if (this.currentQuestionIndex < this.guidingQuestions.length) {
                const question = this.guidingQuestions[this.currentQuestionIndex];
                // Display the question text directly in the chat.
                // The icon is part of the bot's message style if you want to integrate it within the message bubble,
                // or you can add it as a separate element similar to the button group.
                this.postBotMessageWithAvatar(question.text, 'thinking');
                this.currentQuestionIndex++;
            } else {
                this.postBotMessageWithAvatar('סיימנו את סבב השאלות המנחות. האם תרצה/י לחזור על משהו או שיש לך שאלות נוספות?', 'empathic');
                this.currentQuestionIndex = 0; // Reset for another round if needed
            }
        }

        handleStudentInput(input) {
            if (isBotTyping) return; // Prevent input while bot is typing

            this.postStudentMessageWithAvatar(input);
            userInput.value = ''; // Clear input

            // Simulate bot typing
            isBotTyping = true;
            if (botStatus) botStatus.textContent = 'מתי מקליד/ה...';
            // Simulate processing time
            setTimeout(() => {
                this.postBotMessageWithAvatar('תשובה למשתמש: ' + input, 'support'); // Basic response
                if (botStatus) botStatus.textContent = 'אווטאר מתי זמין/ה';
                isBotTyping = false;
                // You can add logic here to decide next question based on input
                this.askGuidingQuestion(); // For now, just ask the next question
            }, 1500);
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
            }
            document.body.classList.add('app-started'); // Add class to body for CSS
            bot.startConversationLogic();
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', () => {
            const input = userInput.value.trim();
            if (input) {
                bot.handleStudentInput(input);
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
