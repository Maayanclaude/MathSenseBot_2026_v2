console.log("Script Loaded: PRESENTATION FINAL (Exact Phrasing + 'Dont Know' Support + Summary)");

// --- 1. הגדרת הבוט ---
class MathProblemGuidingBot {
    constructor() {
        this.problems = [];
        this.currentProblem = null;
        this.currentProblemIndex = 0; 
        this.currentStep = 'intro'; 
        this.questionStep = 'א';    
        this.errorCount = 0; 
        
        // הטקסטים המדויקים שביקשת (בגוף ראשון של הילד)
        this.genderedTexts = {
            'step_A': { 
                boy: "מה אני צריך למצוא?", 
                girl: "מה אני צריכה למצוא?", 
                icon: 'magnifying_glass.png' 
            },
            'step_B': { 
                boy: "מה אני כבר יודע? (אילו נתונים יש לי?)", 
                girl: "מה אני כבר יודעת? (אילו נתונים יש לי?)", 
                icon: 'list.png' 
            },
            'step_C': { 
                boy: "מה עליי לעשות כדי למצוא את הפתרון?", 
                girl: "מה עליי לעשות כדי למצוא את הפתרון?", 
                icon: 'Missing_puzzle.png' 
            }
        };

        this.positiveResponses = ["מצוין!", "כל הכבוד!", "בדיוק!", "אלופ/ה!", "תשובה נהדרת!"];
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
             // שלב ג
             const data = this.genderedTexts['step_C'];
             textToShow = (studentGender === 'girl') ? data.girl : data.boy; iconName = data.icon;
        }

        const questionHtml = `<div class="guided-question"><img src="icons/${iconName}"><span>${textToShow}</span></div>`;
        displayMessage(questionHtml, 'bot', 'thinking');
    }
    
    _processAnswer(reply) {
        if (window.sendDataToGoogleSheet) window.sendDataToGoogleSheet(`Ans: ${reply} (Step: ${this.questionStep})`, currentUserID);
        
        // 1. טיפול ב"לא יודע"
        if (reply.includes("לא יודע") || reply.includes("לא מבין") || reply.includes("אין לי מושג")) {
            this.errorCount++;
            let clarification = "בוא ננסה לקרוא שוב את השאלה...";
            
            // מציאת הרמז הנכון
            let jsonKey = this.questionStep;
            if (this.questionStep === 'ג' && (!this.currentProblem.keywords['ג'])) jsonKey = 'ב';
            
            if (this.currentProblem.clarifications && this.currentProblem.clarifications[jsonKey]) {
                clarification = this.currentProblem.clarifications[jsonKey];
            }
            
            const supportText = (studentGender === 'boy') ? 
                `זה בסדר גמור לא לדעת. בוא נחשוב יחד: ${clarification}` : 
                `זה בסדר גמור לא לדעת. בואי נחשוב יחד: ${clarification}`;
                
            displayMessage(supportText, 'bot', 'support');
            return;
        }

        // 2. בדיקה רגילה
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
                this.updateStars('ג', true);
                this._showFinalSummary();
            }

        } else {
            this.errorCount++; playSound('error');
            
            let clarification = "נסה לקרוא שוב את השאלה...";
            if (this.currentProblem.clarifications && this.currentProblem.clarifications[jsonKey]) {
                clarification = this.currentProblem.clarifications[jsonKey];
            }
            
            const startPrefix = (studentGender === 'boy') ? "כיוון יפה, אבל" : "כיוון יפה, אבל";
            displayMessage(`${startPrefix} ${clarification}`, 'bot', 'support');
        }
    }

    _showFinalSummary() {
        playSound('yeah');
        
        // הסיכום היפה והמקורי שביקשת
        const summaryHtml = `
            <div class="summary-box">
                <h3>כל הכבוד! פתרת את