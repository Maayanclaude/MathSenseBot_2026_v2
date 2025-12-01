console.log("Script Loaded: FINAL VERSION - Verified");

// משתנים גלובליים
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

class MathProblemGuidingBot {
    constructor() {
        this.problems = [];
        this.currentProblem = null;
        this.currentProblemIndex = 0; 
        this.currentStep = 'intro'; 
        this.questionStep = 'א';    
        this.errorCount = 0; 
        this.genderedTexts = {
            'step_A': { boy: "בוא נתחיל מההתחלה: מה אנחנו צריכים למצוא?", girl: "בואי נתחיל מההתחלה: מה אנחנו צריכות למצוא?", icon: 'magnifying_glass.png' },
            'step_B': { boy: "מעולה. עכשיו, מה התשובה הסופית?", girl: "מעולה. עכשיו, מה התשובה הסופית?", icon: 'list.png' }
        };
    }

    async loadProblemsFromFile() {
        try {
            const response = await fetch('questions_data.json');
            this.problems = await response.json();
            this.currentProblemIndex = 0;
            this.currentProblem = this.problems[this.currentProblemIndex]; 
        } catch (error) { console.error(error); }
    }
    
    startConversationLogic() {
        if (problemNote) problemNote.classList.add('hidden'); 
        const introText = "היי, אני מתי!<br>יחד נפתור בעיות מילוליות במתמטיקה.<br>לפני שנתחיל, אשמח לדעת איך קוראים לך?";
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
        
        if (this.currentProblem.keywords && this.currentProblem.keywords['א']) this.questionStep = 'א';
        else this.questionStep = 'ב';

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
            if (this.currentProblem.keywords && this.currentProblem.keywords['א']) this.questionStep = 'א';
            else this.questionStep = 'ב';
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
        } else {
             if (this.currentProblem.level === "רמה 1") textToShow = "מה התשובה לשאלה?";
             else {
                 const data = this.genderedTexts['step_B'];
                 textToShow = (studentGender === 'girl') ? data.girl : data.boy;
             }
             iconName = 'list.png';
        }
        const questionHtml = `<div class="guided-question"><img src="icons/${iconName}"><span>${textToShow}</span></div>`;
        displayMessage(questionHtml, 'bot', 'thinking');
    }
    
    _processAnswer(reply) {
        if (window.sendDataToGoogleSheet) window.sendDataToGoogleSheet(`Ans: ${reply} (Step: ${this.questionStep})`, currentUserID);
        let keywords = [];
        if (this.currentProblem.keywords && this.currentProblem.keywords[this.questionStep]) keywords = this.currentProblem.keywords[this.questionStep];
        
        const isCorrect = this._checkAnswer(reply, keywords);

        if (isCorrect) {
            this.updateStars(this.questionStep, true); playSound('success-chime');
            if (this.questionStep === 'א') {
                const goodJob = (studentGender === 'girl') ? "מצוינת! זיהית נכון." : "מצוין! זיהית נכון.";
                displayMessage(goodJob, 'bot', 'success');
                this.questionStep = 'ב';
                setTimeout(() => this._displayCurrentGuidingQuestion(), 1500);
            } else this._showFinalSummary();
        } else {
            this.errorCount++; playSound('error');
            let clarification = "נסה שוב...";
            if (this.currentProblem.clarifications && this.currentProblem.clarifications[this.questionStep]) clarification = this.currentProblem.clarifications[this.questionStep];
            const startPrefix = "כיוון יפה, אבל...";
            displayMessage(`${startPrefix} ${clarification}`, 'bot', 'support');
        }
    }

    _showFinalSummary() {
        playSound('yeah');
        const summaryHtml = `<div class="summary-box"><h3>כל הכבוד! התשובה נכונה! 🎉</h3><br><strong>מוכנ.ה לשאלה הבאה?</strong></div>`;
        displayMessage(summaryHtml, 'bot', 'excited');
        setTimeout(() => displayChoiceButtons([{ label: "לבעיה הבאה ⬅️", value: "next_problem" }]), 1500);
    }
    
    _checkAnswer(reply, keywords) {
        if (!keywords || keywords.length === 0) return true; 
        const normalizedReply = reply.toLowerCase().trim();
        return keywords.some(keyword => normalizedReply.includes(keyword.toLowerCase()));
    }
    
    updateStars(step, isCorrect) {
        let starIndex = 0; if (step === 'ב') starIndex = 1;
        const starElement = document.getElementById(`star-${starIndex}`);
        if (starElement) starElement.src = isCorrect ? 'icons/star_gold.png' : 'icons/star_empty.png'; 
    }
}