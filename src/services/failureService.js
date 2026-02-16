// Simulated data from Reddit (r/cscareerquestions, r/resumes)
const failureStories = [
    {
        id: 1,
        title: "The 'Generic Resume' Trap",
        context: "Applying to 500+ jobs with the same resume.",
        outcome: "0 Interviews in 6 months.",
        pattern: "Lack of keyword optimization and tailoring.",
        prevention: "Tailor your resume for every single role. Use the JSearch keywords.",
        source: "r/cscareerquestions",
        category: "Resume"
    },
    {
        id: 2,
        title: "Silent Reject: The 'Behavioral' Bomb",
        context: "Passed LeetCode Hard but failed the culture fit round.",
        outcome: "Rejected from FAANG.",
        pattern: "Arrogance or lack of STAR method structure.",
        prevention: "Practice 'Tell me about a time you failed' using STAR method.",
        source: "Glassdoor",
        category: "Interview"
    },
    {
        id: 3,
        title: "Ghosted after Final Round",
        context: "Great technical interview, but didn't ask questions.",
        outcome: "No offer.",
        pattern: "Lack of enthusiasm/curiosity.",
        prevention: "Always have 3-5 insightful questions prepared for the interviewers.",
        source: "LinkedIn",
        category: "Soft Skills"
    },
    {
        id: 4,
        title: "Tutorial Hell Stagnation",
        context: "Built 10 clones following YouTube tutorials perfectly.",
        outcome: "Failed system design and practical coding rounds.",
        pattern: "Lack of independent problem solving.",
        prevention: "Build one ugly, broken project completely on your own.",
        source: "r/learnprogramming",
        category: "Portfolio"
    }
];

export const fetchFailureIntelligence = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return failureStories;
};
