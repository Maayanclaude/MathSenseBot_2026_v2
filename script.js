
const OPENAI_API_KEY = 'כאן_מדביקים_את_המפתח_של_sk-proj-uUzbMDu_ZLhx3fF52oU9pkOmsx0uFlZnO9TnrLZ1Nq-_mVvw46DqYGUOnd4P4VaJzB6jXCqcJzT3BlbkFJo9s0p5DrtJ1Q0If535wEW4s0JgYuJgO_Ttqw_vxnDbGQaAXBA7rXlArqwIkgpZKmUSbDfzGR0A'; 

console.log("Script Loaded: AI AGENT VERSION 🤖");

// --- 1. המוח של הבוט (מבוסס AI) ---
class MathProblemGuidingBot {
    constructor() {
        this.problems = [];
        this.currentProblem = null;
        this.currentProblemIndex = 0; 
        this.currentStep = 'intro'; 
        this.questionStep = 'א';    
        
        // טקסטים לשלבים (עיצוב וניסוח)
        this.genderedTexts = {
            'step_A': { 
                boy: "אחרי שקראת את השאלה, <b>מה אני צריך למצוא?</b>", 
                girl: "אחרי שקראת את השאלה, <b>מה אני צריכה למצוא?</b>", 
                icon: 'magnifying_glass.png' 
            },
            'step_B': { 
                boy: "נציץ בשאלה ונמצא: <b>מה אני כבר יודע? (אילו נתונים יש לי?)</b>", 
                girl: "נציץ בשאלה ונמצא: <b>מה אני כבר יודעת? (אילו נתונים יש לי?)</b>", 
                icon: 'list.png' 
            },
            'step_C': { 
                boy: "ועכשיו נחשוב: <b>מה עליי לעשות כדי למצוא את הפתרון?</b>", 
                girl: "ועכשיו נחשוב: <b>מה עליי לעשות כדי למצוא את הפתרון?</b>", 
                icon: 'Missing_puzzle.png' 
            }
        };
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
        const introText = "היי, אני מתי!<br>יחד נפתור בעיות מילוליות ב-<b>3 שלבים</b>.<br>לפני שנתחיל, אשמח לדעת איך קוראים לך?";
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
        chatWindow.innerHTML = ''; this.resetStars();
        if (problemNote) problemNote.classList.add('hidden'); 
        this.questionStep = 'א'; 

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
            problemNoteText.innerHTML = this.currentProblem.question;
            problemNote.classList.remove('hidden'); 
            this.currentStep = 'problem_solving';
            this._displayCurrentGuidingQuestion();
            return;
        }

        studentGender = selection; 
        document.querySelectorAll('.choice-btn-container').forEach(b => b.remove());
        if (window.sendDataToGoogleSheet) window.sendDataToGoogleSheet(`Signup: ${studentName} (${studentGender})`, currentUserID);

        let goalText = "";
        if (studentGender === 'boy') {
            goalText = `נעים להכיר, ${studentName}!<br><br>לפני שנתחיל, חשוב לזכור:<br>המטרה שלנו היא תרגול <b>דרך הפתרון</b>, ולא התוצאה.<br><br>אציג לפניך את הבעיה הראשונה.<br>קרא אותה, וכשתהיה מוכן, לחץ "קראתי!".`;
        } else {
            goalText = `נעים להכיר, ${studentName}!<br><br>לפני שנתחיל, חשוב לזכור:<br>המטרה שלנו היא תרגול <b>דרך הפתרון</b>, ולא התוצאה.<br><br>אציג לפנייך את הבעיה הראשונה.<br>קראי אותה, וכשתהיי מוכנה, לחצי "קראתי!".`;
        }

        displayMessage(goalText, 'bot', 'welcoming'); 
        setTimeout(() => {
            displayProblemInChat(this.currentProblem.question);
            updateAvatar('inviting'); 
            setTimeout(() => {
                displayChoiceButtons([{ label: "קראתי! ✅", value: "ready_to_start" }]);
                this.currentStep = 'wait_for_button_click'; 
            }, 2000); 
        }, 1500);
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
        if (this.currentStep === 'problem_solving') this._processAnswerAI(reply);
    }

    _displayCurrentGuidingQuestion() {
        let textToShow = ""; let iconName = "";
        
        if (this.questionStep === 'א') {
             const data = this.genderedTexts['step_A'];
             textToShow = (studentGender === 'girl') ? data.girl : data.boy; iconName = data.icon;
        } else if (this.questionStep === 'ב') {
             const data = this.genderedTexts['step_B'];
             textToShow = (studentGender === 'girl') ? data.girl : data.boy; iconName = data.icon;
        } else {
             const data = this.genderedTexts['step_C'];
             textToShow = (studentGender === 'girl') ? data.girl : data.boy; iconName = data.icon;
        }

        const questionHtml = `<div class="guided-question"><img src="icons/${iconName}"><span>${textToShow}</span></div>`;
        displayMessage(questionHtml, 'bot', 'thinking');
    }
    
    // --- 🤖 הפונקציה החדשה: פנייה ל-ChatGPT ---
    async _processAnswerAI(userReply) {
        if (window.sendDataToGoogleSheet) window.sendDataToGoogleSheet(`Ans: ${userReply} (Step: ${this.questionStep})`, currentUserID);
        
        // מציג חיווי שהבוט חושב
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-message bot-message';
        typingIndicator.innerText = 'מתי מקליד... 🤖';
        typingIndicator.id = 'temp-typing';
        chatWindow.appendChild(typingIndicator);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        isBotTyping = true;

        try {
            // בניית הפרומפט הפדגוגי ל-AI
            const problemText = this.currentProblem.question;
            const correctData = JSON.stringify(this.currentProblem.keywords[this.questionStep]); // הנתונים מה-JSON עוזרים ל-AI לדעת מה התשובה
            
            let stepGoal = "";
            if(this.questionStep === 'א') stepGoal = "לזהות מה השאלה מבקשת למצוא";
            if(this.questionStep === 'ב') stepGoal = "לזהות את הנתונים המספריים והמילוליים בשאלה";
            if(this.questionStep === 'ג') stepGoal = "לזהות את הפעולה המתמטית (חיבור/חיסור/כפל/חילוק) ואת התרגיל";

            const systemPrompt = `
                אתה "מתי", סוכן פדגוגי למתמטיקה לכיתה ה'.
                התלמיד (${studentName}, ${studentGender === 'boy' ? 'בן' : 'בת'}) פותר בעיה מילולית בשלבים.
                
                הבעיה הנוכחית: "${problemText}"
                השלב הנוכחי: ${this.questionStep} (המטרה: ${stepGoal}).
                מידע אמת (התשובה הנכונה) לשלב זה: ${correctData}.

                תפקידך:
                1. נתח את תשובת התלמיד: "${userReply}".
                2. אם התשובה נכונה (מבחינת משמעות, גם אם הניסוח שונה):
                   - תחזיר JSON עם: {"isCorrect": true, "feedback": "משפט חיזוק קצר"}.
                3. אם התשובה שגויה או חלקית:
                   - תחזיר JSON עם: {"isCorrect": false, "feedback": "רמז מכוון או הסבר קצר (בלי לגלות את התשובה!)"}.
                   - אם הילד כתב "לא יודע", תן רמז עדין.
                   - אם חסר נתון (בשלב ב'), כתוב שחסר משהו.
                
                התשובה שלך חייבת להיות בפורמט JSON בלבד.
                דבר בעברית, בגובה העיניים, מעודד וסבלני.
            `;

            // שליחה ל-OpenAI
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini", // מודל מהיר וזול
                    messages: [{ role: "system", content: systemPrompt }],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            const aiContent = data.choices[0].message.content;
            
            // ניקוי ה-JSON (לפעמים ה-AI מוסיף ```json)
            const cleanJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleanJson);

            // הסרת חיווי הקלדה
            document.getElementById('temp-typing').remove();
            isBotTyping = false;

            // --- טיפול בתשובה מה-AI ---
            if (result.isCorrect) {
                playSound('success-chime');
                
                if (this.questionStep === 'א') {
                    this.updateStars('א', true);
                    displayMessage(result.feedback, 'bot', 'success');
                    this.questionStep = 'ב';
                    setTimeout(() => this._displayCurrentGuidingQuestion(), 1500);
                } 
                else if (this.questionStep === 'ב') {
                    this.updateStars('ב', true);
                    displayMessage(result.feedback, 'bot', 'success');
                    this.questionStep = 'ג'; 
                    setTimeout(() => this._displayCurrentGuidingQuestion(), 1500);
                }
                else {
                    this.updateStars('ג', true);
                    this._showFinalSummary();
                }
            } else {
                this.errorCount++;
                playSound('error');
                displayMessage(result.feedback, 'bot', 'support'); // ה-AI מייצר את הרמז בעצמו!
            }

        } catch (error) {
            console.error("AI Error:", error);
            document.getElementById('temp-typing').remove();
            isBotTyping = false;
            displayMessage("אופס, הייתה לי בעיה בתקשורת. בוא ננסה שוב.", 'bot', 'confuse');
        }
    }

    _showFinalSummary() {
        playSound('yeah');
        const summaryHtml = `
            <div class="summary-box">
                <h3>כל הכבוד! פתרת את הבעיה בשלושה צעדים:</h3>
                <ul style="list-style: none; padding: 0; text-align: right;">
                    <li style="margin-bottom: 8px;">🔍 ${studentGender === 'girl' ? 'מה אני צריכה למצוא?' : 'מה אני צריך למצוא?'}</li>
                    <li style="margin-bottom: 8px;">📋 ${studentGender === 'girl' ? 'מה אני יודעת? (נתונים)' : 'מה אני יודע? (נתונים)'}</li>
                    <li style="margin-bottom: 8px;">🧩 מה עליי לעשות כדי למצוא את הפתרון?</li>
                </ul>
                <br>
                <strong>${studentGender === 'girl' ? 'שמרי' : 'שמור'} על השגרה הזו – היא תעזור לך גם בשאלות הבאות!</strong>
            </div>
        `;
        displayMessage(summaryHtml, 'bot', 'excited');
        setTimeout(() => displayChoiceButtons([{ label: "לבעיה הבאה ⬅️", value: "next_problem" }]), 2500);
    }
    
    updateStars(step, isCorrect) {
        let starIndex = 0; 
        if (step === 'ב') starIndex = 1;
        if (step === 'ג') starIndex = 2;
        const starElement = document.getElementById(`star-${starIndex}`);
        if (starElement) starElement.src = isCorrect ? 'icons/star_gold.png' : 'icons/star_empty.png'; 
    }
}

// --- 2. אתחול והפעלה ---
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