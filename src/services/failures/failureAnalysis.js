export const analyzeFailureRisks = (failureStories, userProfile) => {
    // 1. Categorize Stories
    const categories = {
        Resume: { count: 0, stories: [] },
        Interview: { count: 0, stories: [] },
        'Skill Gap': { count: 0, stories: [] },
        Market: { count: 0, stories: [] },
        General: { count: 0, stories: [] }
    };

    failureStories.forEach(story => {
        const cat = story.category || 'General';
        if (categories[cat]) {
            categories[cat].count++;
            categories[cat].stories.push(story);
        }
    });

    // 2. Calculate Personalized Risk Scores
    // We compare user profile gaps against the most common failure types
    const riskAnalysis = {
        overallRisk: 'Low',
        score: 10, // 0-100 (Lower is better)
        factors: []
    };

    const resumeIncomplete = !userProfile.resumeText || userProfile.resumeText.length < 500;
    const noGithub = !userProfile.githubStats || userProfile.githubStats.repos === 0;
    const lowExperience = (userProfile.resumeData?.experienceYears || 0) < 1;

    // SCORING LOGIC

    // Risk 1: Resume Filtering (ATS)
    if (categories.Resume.count > 0) {
        if (resumeIncomplete) {
            riskAnalysis.score += 30;
            riskAnalysis.factors.push({
                type: 'Resume',
                level: 'High',
                message: 'Your resume is short. 40% of failures are due to ATS rejection for low content.',
                action: 'Expand your resume description to at least 500 words.'
            });
        }
    }

    // Risk 2: Portfolio / Verification
    if (categories['Skill Gap'].count > 0) {
        if (noGithub) {
            riskAnalysis.score += 25;
            riskAnalysis.factors.push({
                type: 'Portfolio',
                level: 'Medium',
                message: 'Lack of visible code (GitHub) is a top rejection reason for developers.',
                action: 'Link a GitHub repository with at least 1 active project.'
            });
        }
    }

    // Risk 3: Experience / Interview
    if (categories.Interview.count > 0) {
        if (lowExperience) {
            riskAnalysis.score += 20;
            riskAnalysis.factors.push({
                type: 'Experience',
                level: 'Medium',
                message: 'Junior candidates often fail "System Design" or "Behavioral" rounds due to lack of prep.',
                action: 'Prepare STAR method stories for behavioral interviews.'
            });
        }
    }

    // Normalize
    riskAnalysis.score = Math.min(riskAnalysis.score, 95);

    if (riskAnalysis.score > 60) riskAnalysis.overallRisk = 'High';
    else if (riskAnalysis.score > 30) riskAnalysis.overallRisk = 'Medium';

    return {
        categories,
        riskAnalysis
    };
};

// NEW: Analyze User's Own Story
export const analyzeUserStory = (text) => {
    if (!text || text.length < 10) return null;
    const t = text.toLowerCase();

    let type = 'General';
    let diagnosis = 'Unclear pattern. Try adding more details.';
    let actionPlan = ['Review your application strategy.', 'Networking is key.'];
    let sentiment = 'Neutral';

    // Keyword Analysis
    if (t.includes('resume') || t.includes('ats') || t.includes('cv') || t.includes('application')) {
        type = 'Resume';
        diagnosis = 'Resume Optimization Issue';
        actionPlan = [
            'Run your resume through an ATS scanner.',
            'Quantify your achievements (e.g., "Improved X by Y%").',
            'Ensure your skills section matches the job description keywords.'
        ];
    } else if (t.includes('interview') || t.includes('whiteboard') || t.includes('behavioral') || t.includes('phone screen')) {
        type = 'Interview';
        if (t.includes('technical') || t.includes('code') || t.includes('system design')) {
            diagnosis = 'Technical Interview Gap';
            actionPlan = [
                'Practice LeetCode/HackerRank problems daily.',
                'Mock interviews on Pramp or with peers.',
                'Review System Design primers (e.g., Alex Xu).'
            ];
        } else {
            diagnosis = 'Behavioral/Communication Gap';
            actionPlan = [
                'Prepare 5 core stories using the STAR method.',
                'Focus on "I" vs "We" regarding contributions.',
                'Research the company culture values beforehand.'
            ];
        }
    } else if (t.includes('ghosted') || t.includes('no response') || t.includes('reject')) {
        type = 'Market';
        diagnosis = 'Low Response Rate / Market Fit';
        actionPlan = [
            'Diversity your application channels (not just LinkedIn).',
            'Reach out to recruiters/hiring managers directly.',
            'Tailor your resume for every single application.'
        ];
    } else if (t.includes('skill') || t.includes('experience') || t.includes('qualified')) {
        type = 'Skill Gap';
        diagnosis = 'Perceived Skill/Experience Gap';
        actionPlan = [
            'Build a portfolio project demonstrating the missing skill.',
            'Contribute to open source to prove production-readiness.',
            'Obtain a recognized certification (AWS, etc.).'
        ];
    }

    // Sentiment (Simple heuristic)
    if (t.includes('sad') || t.includes('depress') || t.includes('quit') || t.includes('useless')) {
        sentiment = 'Negative';
    } else if (t.includes('hope') || t.includes('learn') || t.includes('next time')) {
        sentiment = 'Positive';
    }

    return {
        type,
        diagnosis,
        actionPlan,
        sentiment
    };
};
