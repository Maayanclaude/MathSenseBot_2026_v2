console.log("Script Loaded: FINAL FIXED VERSION (Correct Order)");

// --- 1. הגדרת המחלקה (המוח של הבוט) חייבת להיות ראשונה ---
class MathProblemGuidingBot {
    constructor() {
        this.problems = [];
        this.currentProblem = null;
        this.currentProblemIndex = 0; 
        this.currentStep = 'intro'; 
        this.questionStep = 'א';    
        this.errorCount = 0; 
        
        // טקסטים לשלבים
        this.genderedTexts = {
            'step_A': { 
                boy: "שלב א' - זיהוי: מה עלי למצוא בשאלה?", 
                girl: "שלב א' - זיהוי: מה עלי למצוא בשאלה?", 
                icon: 'magnifying_glass.png' 
            },
            'step_B': { 
                boy: "שלב ב' - אסטרטגיה: מה הנתונים ומה התשובה?", 
                girl: "שלב ב' - אסטרטגיה: מה הנתונים ומה התשובה?", 
                icon: 'list.png' 
            },
            'step_C': { 
                boy: "שלב ג': מה אני צריך לעשות כדי לדעת?", 
                girl: "שלב ג': מה אני צריכה לעשות כדי לדעת?", 
                icon: 'Missing_puzzle.png' 
            }
        };

        // בנק תגובות מגוונות
        this.positiveResponses = ["מצוין!", "כל הכבוד!", "בדיוק!", "אלופ/ה!", "תשובה נהדרת!"];
        this.supportiveResponses = ["כיוון יפה, אבל...", "לא בדיוק, אבל...", "קרוב, בוא ננסה שוב...", "שים לב לפרטים..."];
    }

    async loadProblemsFromFile() {
        try {
            const response = await fetch('questions_data.json');
            this.problems = await response.json();
            this.currentProblemIndex = 0;
            this.currentProblem = this.problems[this.currentProblemIndex]; 
        } catch (error) { console.error("Error loading questions:", error); }
    }
    
    startConversationLogic() {
        if (problemNote) problemNote.classList.add('hidden'); 
        const introText = "היי, אני מתי!<br>יחד נפתור בעיות מילוליות בשיטת השלבים.<br>לפני שנתחיל, אשמח לדעת איך קוראים לך?";
        displayMessage(introText, 'bot', 'welcoming'); 
        this.currentStep = 'wait_for_name'; 
    }
    
    loadNextProblem() {
        if (window.sendDataToGoogleSheet) window.sendDataToGoogleSheet(`Finished Question ${this.currentProblemIndex + 1}`, currentUserID);
        this.currentProblemIndex++;
        if (this.currentProblemIndex >= this.problems.length) {
            displayMessage("כל הכבוד! סיימת את כל הבעיות להיום! 🏆", 'bot', 'excited');
            if (window.sendDataToGoogleSheet) window.sendDataToGoogleSheet("Finished All Questions", currentUserID);
            return;
        }
        this.currentProblem = this.problems[this.currentProblemIndex];
        chatWindow.innerHTML = ''; this.resetStars(); this.errorCount = 0;
        if (problemNote) problemNote.classList.add('hidden'); 
        
        this.questionStep = 'א'; // תמיד מתחילים בא

        const transitionText = (studentGender === 'boy') ? "נהדר! הנה הבעיה הבאה.<br>קרא אותה, וכשתהיה מוכן לחץ על הכפתור." : "נהדר! הנה הבעיה הבאה.<br>קראי אותה, וכשתהיי מוכנה לחצי על הכפתור.";
        displayMessage(transitionText, 'bot', 'welcoming');
        setTimeout(() => {
            displayProblemInChat(this.currentProblem.question);
            updateAvatar('inviting'); 
            setTimeout(() => {
                displayChoiceButtons([{ label: "קראתי! ✅", value: "ready_to_start" }]);
                this.currentStep = 'wait_for_button_click';
            }, 1500); 
        }, 1500); 
    }

    resetStars() {
        for (let i = 0; i < 3; i++) {
            const star = document.getElementById(`star-${i}`);
            if (star) star.src = 'icons/star_empty.png';
        }
    }

    handleGenderSelection(selection) {
        if (selection === 'ready_to_start') {
            document.querySelectorAll('.choice-btn-container').forEach(b => b.remove());
            chatWindow.innerHTML = ''; 
            problemNoteText.innerText = this.currentProblem.question;
            problemNote.classList.remove('hidden'); 
            this.currentStep = 'problem_solving';
            this._displayCurrentGuidingQuestion();
            return;
        }
        studentGender = selection; 
        document.querySelectorAll('.choice-btn-container').forEach(b => b.remove());
        const niceToMeet = `נעים להכיר, ${studentName}!`;
        displayMessage(niceToMeet, 'bot', 'welcoming'); 
        if (window.sendDataToGoogleSheet) window.sendDataToGoogleSheet(`Signup: ${studentName} (${studentGender})`, currentUserID);
        setTimeout(() => {
            const readyText = studentGender === 'boy' ? "נהדר, הנה הבעיה הראשונה!<br>קרא אותה, וכשתהיה מוכן, לחץ על הכפתור!" : "נהדר, הנה הבעיה הראשונה!<br>קראי אותה, וכשתהיי מוכנה, לחצי על הכפתור!";
            displayMessage(readyText, 'bot', 'ready'); 
            this.questionStep = 'א';
            setTimeout(() => {
                displayProblemInChat(this.currentProblem.question);
                updateAvatar('inviting'); 
                setTimeout(() => {
                    displayChoiceButtons([{ label: "קראתי! ✅", value: "ready_to_start" }]);
                    this.currentStep = 'wait_for_button_click'; 
                }, 1500);
            }, 1500);
        }, 1000);
    }

    handleUserReply(reply) {
        if (isBotTyping) return; 
        if (reply) { displayMessage(reply, 'user'); userInput.value = ''; }
        
        if (this.currentStep === 'wait_for_name') {
            studentName = reply;
            const genderText = `נעים מאוד, ${studentName}.<br>האם תעדיפ.י שאפנה אליך בלשון זכר (בן) או לשון נקבה (בת)?`;
            displayMessage(genderText, 'bot', 'hi'); 
            displayChoiceButtons([{ label: "אני בן 👦", value: "boy" }, { label: "אני בת 👧", value: "girl" }]);
            this.currentStep = 'wait_for_gender';
            return;
        }
        if (this.currentStep === 'wait_for_gender' || this.currentStep === 'wait_for_button_click') {
             displayMessage("נא להשתמש בכפתורים 👆", 'bot', 'support'); return;
        }
        if (this.currentStep === 'problem_solving') this._processAnswer(reply);
    }

    _displayCurrentGuidingQuestion() {
        this.errorCount = 0; stepStartTime = Date.now();
        let textToShow = ""; let iconName = "";
        
        if (this.questionStep === 'א') {
             const data = this.genderedTexts['step_A'];
             textToShow = (studentGender === 'girl') ? data.girl : data.boy; iconName = data.icon;
        } else if (this.questionStep === 'ב') {
             const data = this.genderedTexts['step_B'];
             textToShow = (studentGender === 'girl') ? data.girl : data.boy; iconName = data.icon;
        } else {
             // שלב ג (אם קיים)
             const data = this.genderedTexts['step_C'];
             textToShow = (studentGender === 'girl') ? data.girl : data.boy; iconName = data.icon;
        }

        const questionHtml = `<div class="guided-question"><img src="icons/${iconName}"><span>${textToShow}</span></div>`;
        displayMessage(questionHtml, 'bot', 'thinking');
    }
    
    _processAnswer(reply) {
        if (window.sendDataToGoogleSheet) window.sendDataToGoogleSheet(`Ans: ${reply} (Step: ${this.questionStep})`, currentUserID);
        
        // מיפוי חכם: אם אנחנו בשלב ג', משתמשים במילות מפתח של ב' אם אין ג'
        let jsonKey = this.questionStep;
        if (this.questionStep === 'ג' && (!this.currentProblem.keywords['ג'])) {
             jsonKey = 'ב'; 
        }

        let keywords = [];
        if (this.currentProblem.keywords && this.currentProblem.keywords[jsonKey]) {
            keywords = this.currentProblem.keywords[jsonKey];
        }
        
        const isCorrect = this._checkAnswer(reply, keywords);

        if (isCorrect) {
            playSound('success-chime');
            const randomGood = this.positiveResponses[Math.floor(Math.random() * this.positiveResponses.length)];
            
            if (this.questionStep === 'א') {
                this.updateStars('א', true);
                displayMessage(`${randomGood} זיהית נכון.`, 'bot', 'success');
                this.questionStep = 'ב';
                setTimeout(() => this._displayCurrentGuidingQuestion(), 1500);
            } 
            else if (this.questionStep === 'ב') {
                this.updateStars('ב', true);
                displayMessage(`${randomGood} עלית על הנתונים.`, 'bot', 'success');
                this.questionStep = 'ג'; 
                setTimeout(() => this._displayCurrentGuidingQuestion(), 1500);
            }
            else {
                // סיום שלב ג'
                this.updateStars('ג', true);
                this._showFinalSummary();
            }

        } else {
            this.errorCount++; playSound('error');
            
            let clarification = "נסה לקרוא שוב את השאלה...";
            if (this.currentProblem.clarifications && this.currentProblem.clarifications[jsonKey]) {
                clarification = this.currentProblem.clarifications[jsonKey];
            }
            
            const randomSupport = this.supportiveResponses[Math.floor(Math.random() * this.supportiveResponses.length)];
            displayMessage(`${randomSupport} ${clarification}`, 'bot', 'support');
        }
    }

    _showFinalSummary() {
        playSound('yeah');
        const summaryHtml = `<div class="summary-box"><h3>כל הכבוד! סיימת את כל השלבים בהצלחה! 🎉</h3><br><strong>מוכנ.ה לשאלה הבאה?</strong></div>`;
        displayMessage(summaryHtml, 'bot', 'excited');
        setTimeout(() => displayChoiceButtons([{ label: "לבעיה הבאה ⬅️", value: "next_problem" }]), 1500);
    }
    
    _checkAnswer(reply, keywords) {
        if (!keywords || keywords.length === 0) return true; 
        const normalizedReply = reply.toLowerCase().trim();
        return keywords.some(keyword => normalizedReply.includes(keyword.toLowerCase()));
    }
    
    updateStars(step, isCorrect) {
        let starIndex = 0; 
        if (step === 'ב') starIndex = 1;
        if (step === 'ג') starIndex = 2;
        const starElement = document.getElementById(`star-${starIndex}`);
        if (starElement) starElement.src = isCorrect ? 'icons/star_gold.png' : 'icons/star_empty.png'; 
    }
}

// --- 2. משתנים גלובליים וטעינת העמוד (אחרי שהמחלקה הוגדרה) ---
let startButton, welcomeScreen, loginScreen, appMainContainer, chatWindow, userInput, sendButton, largeAvatar, problemNote, problemNoteText;
let loginBtn, participantInput;
let isBotTyping = false;
let currentUserID = localStorage.getItem('mati_participant_id') || "";
let studentName = ""; 
let studentGender = ""; 
let stepStartTime = 0;

const matiExpressions = {
    ready: "Mati_ready.png", welcoming: "Mati_welcoming.png", support: "Mati_support.png",
    inviting: "Mati_inviting_action.png", confident: "Mati_confident.png", compliment: "Mati_compliment.png",
    confuse: "Mati_confuse.png", thinking: "Mati_calculates.png", empathic: "Mati_empathic.png",
    excited: "Mati_excited.png", success: "Mati_success.png", hi: "Mati_hi.png"
};

function playSound(soundName) {
    try {
        const audio = new Audio(`sounds/${soundName}.mp3`);
        audio.volume = 0.6; audio.play().catch(e => {});
    } catch (e) {}
}

document.addEventListener('DOMContentLoaded', async () => {
  // זיהוי אלמנטים
  loginBtn = document.getElementById('login-btn');
  participantInput = document.getElementById('participant-id-input');
  loginScreen = document.getElementById('login-screen');
  welcomeScreen = document.getElementById('welcome-screen');
  startButton = document.getElementById('start-button');
  appMainContainer = document.getElementById('app-main-container');
  chatWindow = document.getElementById('chat-window');
  userInput = document.getElementById('user-input');
  sendButton = document.getElementById('send-button');
  largeAvatar = document.getElementById('large-avatar');
  problemNote = document.getElementById('problem-note');
  problemNoteText = document.getElementById('problem-note-text');

  // אתחול הבוט (עכשיו זה יעבוד כי המחלקה כבר הוגדרה למעלה)
  window.bot = new MathProblemGuidingBot();
  await window.bot.loadProblemsFromFile();

  if (currentUserID && participantInput) participantInput.value = currentUserID;

  if (loginBtn) {
      loginBtn.addEventListener('click', () => {
          const idVal = participantInput.value.trim();
          if (idVal.length > 0) {
              currentUserID = idVal;
              localStorage.setItem('mati_participant_id', currentUserID);
              loginScreen.classList.add('hidden');
              welcomeScreen.classList.remove('hidden');
              if (window.sendDataToGoogleSheet) window.sendDataToGoogleSheet("Login", currentUserID);
          } else { alert("נא להזין קוד משתתף"); }
      });
  }

  if (startButton) {
    startButton.addEventListener('click', () => {
      welcomeScreen.classList.add('hidden');
      appMainContainer.classList.remove('hidden');
      window.bot.startConversationLogic();
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const reply = userInput.value.trim();
      if (reply) window.bot.handleUserReply(reply);
    });
  }
  
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendButton.click();
    });
  }
});

// פונקציות עזר ויזואליות
function updateAvatar(expressionKey) {
    if (matiExpressions[expressionKey] && largeAvatar) largeAvatar.src = `MatiCharacter/${matiExpressions[expressionKey]}`; 
}

function displayMessage(text, sender, expression = 'neutral') {
    if (!chatWindow) return;
    if (sender === 'bot') updateAvatar(expression);
    const msg = document.createElement('div');
    msg.classList.add('chat-message', sender + '-message');
    msg.innerHTML = text; 
    chatWindow.appendChild(msg);
    setTimeout(() => { chatWindow.scrollTop = chatWindow.scrollHeight; }, 50);
}

function displayProblemInChat(problemText) {
    const note = document.createElement('div');
    note.classList.add('chat-problem-note'); 
    note.style.backgroundColor = "#FFF59D"; note.style.color = "#333"; note.style.padding = "20px";
    note.style.borderRadius = "2px"; note.style.width = "85%"; note.style.margin = "15px auto";
    note.style.textAlign = "center"; note.style.alignSelf = "center"; note.style.transform = "rotate(-1deg)";
    note.innerHTML = `<div style="position:absolute; top:-15px; right:50%; font-size:24px;">📍</div>${problemText}`;
    chatWindow.appendChild(note);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function displayChoiceButtons(options) {
    const btnContainer = document.createElement('div');
    btnContainer.classList.add('choice-btn-container');
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.classList.add('choice-btn');
        btn.innerText = opt.label;
        if (opt.value === 'next_problem') {
            btn.classList.add('next-problem-btn'); 
            btn.onclick = () => window.bot.loadNextProblem();
        } else {
            btn.onclick = () => window.bot.handleGenderSelection(opt.value);
        }
        btnContainer.appendChild(btn);
    });
    chatWindow.appendChild(btnContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}