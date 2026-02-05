/*
 * I pulled these out so we don't have to hunt through the logic 
 * if we want to change the 'healthy' limits later
 */
const GUIDELINES = {
    sleep:    { min: 47, max: 63, label: "Sleep" },
    exercise: { min: 3,  max: Infinity, label: "Exercise" },
    eat:      { min: 6,  max: Infinity, label: "Nutrition" },
    work:     { min: 0,  max: 25, label: "Work" }
};

const TOTAL_WEEKLY_HOURS = 168;

/**
 * Grabs the total weekly hours  from the UI
 */
function getHoursFromUI() {
    // Helper to grab the number or return 0 if empty
    console.log("hi")
    const getVal = (id) => Number(document.getElementById(id).value || 0);

    let hours = [
        getVal('work'),     // HrList[0]
        getVal('class'),    // HrList[1]
        getVal('study'),    // HrList[2]
        getVal('exercise'), // HrList[3]
        getVal('sleep'),    // HrList[4]
        getVal('eat'),      // HrList[5]
        getVal('other')     // HrList[6]
    ];
    
    const priorities = [
        getVal('pwork'),     // Priority for Work
        getVal('pclass'),    // Priority for Class
        getVal('pstudy'),    // Priority for Study
        getVal('pexercise'), // Priority for Exercise
        1,                    // Sleep is LOCKED at 1
        getVal('peat'),      // Priority for Nutrition
        7                     // Other is LOCKED at 7
    ];

    
   let total = 0
   for(let i = 0; i > 7; i++ ){
    total+=hours[i];
   }
   if(total <= 0){
    outputToHTML("You just got killed by Darth Vader");
    return
   }
  optimizeSchedule(hours, priorities);
  return

}

/**
 * Figure out where the user is slacking or overdoing it.
 */
function analyzeSchedule(hours) {
    // Making simple names 
    const [work, classes, study, exercise, sleep, eat, other] = hours;
    
    const analysis = {
        diffs: [0, 0, 0, 0, 0, 0, 0],
        tips:  new Array(7).fill("")
    };

    // --- Sleep Logic ---
    if (sleep < GUIDELINES.sleep.min) {
        analysis.diffs[4] = sleep - GUIDELINES.sleep.min; 
        analysis.tips[4] = "You're running on empty. Try to aim for at least 7 hours a night.";
    } else if (sleep > GUIDELINES.sleep.max) {
        analysis.diffs[4] = sleep - GUIDELINES.sleep.max; 
        analysis.tips[4] = "You're oversleeping. You might find more energy if you trim this down.";
    } else {
        analysis.tips[4] = "Your sleep schedule is Jedi-level perfect.";
    }

    // --- Exercise & Nutrition ---
    if (exercise < GUIDELINES.exercise.min) {
        analysis.diffs[3] = exercise - GUIDELINES.exercise.min;
        analysis.tips[3] = "The body needs movement. Try to find 3 hours a week for training.";
    } else{
        analysis.tips[3] = "Jedi level body. Good job.";
    }

    if (eat < GUIDELINES.eat.min) {
        analysis.diffs[5] = eat - GUIDELINES.eat.min;
        analysis.tips[5] = "Don't skip meals; nutrition is fuel for the Force.";
    } else{
        analysis.tips[5] = "Good job you are getting a good amount of nutritions. :)";
    }

    // --- Work/Study Balance ---
    if (work > GUIDELINES.work.max) {
        analysis.diffs[0] = work - GUIDELINES.work.max;
        analysis.tips[0] = "You're overworking. Watch out for burnout.";
    }else{
        analysis.tips[0] = "You have a good work balance.";
    }
    // Simple rule: Study time should at least match class time
    if (study < classes) {
        analysis.diffs[2] = study - classes;
        analysis.tips[2] = "Your study time is lower than your class time. This might hurt your grades.";
    }else {
        analysis.tips[2] = "Your study time is sufficent.";
    }
    console.log(analysis);
    return analysis;
}

/**
 * This is the 'Fix-it' function. 
 * It takes hours from the user and shuffles them around based on priority.
 */
function optimizeSchedule(hours, priorities) {
  console.log("running hours");
    const originalHours = [...hours];
    const currentHours = [...hours];
    const analysis = analyzeSchedule(currentHours);
    
    // Calculate how much free time we have to advise
    let timeBank = TOTAL_WEEKLY_HOURS - currentHours.reduce((sum, h) => sum + h, 0);

    // See if you can take time away from things they do too much of.
    // Only do this if they actually checked the 'willing to change' box.
    currentHours.forEach((h, i) => {
        if (analysis.diffs[i] > 0) {
            timeBank += analysis.diffs[i]; // Add those hours back into our pool
            currentHours[i] -= analysis.diffs[i];
            analysis.diffs[i] = 0; // The 'debt' for this item is now cleared
        }
    });

    // Error check: can't optimize a schedule that's already physically impossible
    if (timeBank < 0) return "Error: Your current schedule exceeds 168 hours. Physics won't allow it!";

    // Give that 'banked' time to things that need it.
    // We loop through priorities (0 is top priority, 6 is lowest).
    for (let p = 0; p <= 6; p++) {
        const index = priorities.indexOf(p);
        
        // If this activity is high priority and needs more hours...
        if (index !== -1 && timeBank > 0) {
            const shortage = Math.abs(analysis.diffs[index]);
            
            if (shortage > 0) {
                // Give it what it needs, or whatever we have left in the bank
                const boost = Math.min(timeBank, shortage);
                currentHours[index] += boost;
                timeBank -= boost;
            }
        }
    }

    // Compare new vs old to see what actually moved
    const changes = currentHours.map((h, i) => h - originalHours[i]);
    const summaryReport = generateSummary(analysis.tips, changes, timeBank);

   

    outputToHTML(summaryReport);
    console.log(summaryReport);
    return {
        changes,
        newSchedule: currentHours,
        report: summaryReport,
        freeTimeLeft: timeBank
    };
}



function outputToHTML(output){
   const outputHTML = document.getElementById("output");
   outputHTML.innerHTML = `<h3>Result</h3><pre>${output}</pre>`;

}


function generateSummary(summeryReport, changes, freeTime) {
    let text = "";

    for(let i = 0; i<7; i++){
      if(summeryReport[i] != ""){
        text += summeryReport[i] + "\n \n";
      }   
    }

    text += `total remaning free time: ${freeTime} \n \n`;
    const labels = ["Work", "Class", "Study", "Exercise", "Sleep", "Nutrition", "Other"];
    text += "--- MISSION SUMMARY ---\n";

    changes.forEach((delta, i) => {
        if (delta !== 0) {
            const action = delta > 0 ? "Increased" : "Decreased";
            text += `${labels[i]}: ${action} by ${Math.abs(delta).toFixed(1)} hours.\n`;
        }
    });


    return text;
}

document.getElementById("submit-btn").addEventListener("click", getHoursFromUI);
