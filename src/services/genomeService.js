export const fetchGitHubData = async (username) => {
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) return null;
        const data = await response.json();

        // Fetch repos for language stats
        const reposRes = await fetch(data.repos_url);
        const repos = await reposRes.json();

        const languages = new Set();
        let starCount = 0;

        if (Array.isArray(repos)) {
            repos.forEach(repo => {
                if (repo.language) languages.add(repo.language);
                starCount += repo.stargazers_count;
            });
        }

        return {
            userData: data,
            languages: Array.from(languages),
            repos: data.public_repos,
            stars: starCount,
            bio: data.bio
        };
    } catch (error) {
        console.error("GitHub API Error:", error);
        return null;
    }
};

export const parseResumeMock = async (file) => {
    // Mock parsing - Return empty to avoid false positives in visualization
    // In a real app, this would call an OCR/NLP service
    return {
        skills: [],
        experience: 0
    };
};

export const calculateFitScore = (userProfile, job) => {
    // Default safety
    if (!job || !userProfile) return { score: 0, missing: [], match: [], eligibility: 'Unknown', tip: '', breakdown: {} };

    const jobTags = job.tags || [];
    const jobDesc = (job.description || '').toLowerCase();

    // Normalize user data
    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
    const resumeText = (userProfile.resumeText || '').toLowerCase();

    // 1. Skill Match (50% Weight)
    const match = [];
    const missing = [];
    jobTags.forEach(tag => {
        const lowerTag = tag.toLowerCase();
        if (userSkills.includes(lowerTag) || resumeText.includes(lowerTag)) {
            match.push(tag);
        } else {
            missing.push(tag);
        }
    });

    const skillScore = jobTags.length > 0 ? (match.length / jobTags.length) * 100 : 0;

    // 2. Experience Match (20% Weight)
    let experienceScore = 50; // Base
    const years = userProfile.experienceYears || 1;
    if (jobDesc.includes('senior') || jobDesc.includes('lead')) {
        if (years >= 5) experienceScore = 100;
        else if (years >= 3) experienceScore = 70;
        else experienceScore = 30;
    } else {
        // Junior/Mid match
        if (years >= 1) experienceScore = 100;
        else experienceScore = 60;
    }

    // 3. Evidence Match (GitHub) (20% Weight)
    let evidenceScore = 0;
    if (userProfile.githubStats) {
        const gh = userProfile.githubStats;
        if (gh.repos >= 5) evidenceScore += 20;
        if (gh.stars >= 10) evidenceScore += 20;
        // Check if job tags exist in GH languages
        const ghLangs = (gh.languages || []).map(l => l.toLowerCase());
        const hasLangMatch = jobTags.some(tag => ghLangs.includes(tag.toLowerCase()));
        if (hasLangMatch) evidenceScore += 60;
    } else {
        // Fallback checks if user didn't link GitHub but has strong skills
        if (match.length > 3) evidenceScore = 40;
    }
    if (evidenceScore > 100) evidenceScore = 100;

    // 4. ATS Score (Simulated) (10% Weight)
    let atsScore = 0;
    const keywords = ['communication', 'team', 'agile', 'degree', 'bachelor', 'computer science'];
    let keywordMatches = 0;
    keywords.forEach(k => {
        if (resumeText.includes(k)) keywordMatches++;
    });
    atsScore = (keywordMatches / 3) * 100;
    if (atsScore > 100) atsScore = 100;

    // Final Weighted Formula
    // FitScore = 0.5*Skill + 0.2*Exp + 0.2*Evidence + 0.1*ATS
    let totalScore = Math.round(
        (skillScore * 0.5) +
        (experienceScore * 0.2) +
        (evidenceScore * 0.2) +
        (atsScore * 0.1)
    );

    if (totalScore > 100) totalScore = 100;

    // Eligibility
    let eligibility = 'Low';
    if (totalScore > 80) eligibility = 'Excellent';
    else if (totalScore > 60) eligibility = 'High';
    else if (totalScore > 40) eligibility = 'Moderate';

    // AI Tip Generation
    let tip = "Update your profile with more skills.";
    if (missing.length > 0) {
        tip = `Adding '${missing[0]}' to your projects could boost your score significanty.`;
    } else if (evidenceScore < 50) {
        tip = "Link your GitHub or build more repos to increase your Evidence Score.";
    } else if (totalScore > 90) {
        tip = "You're a top candidate! Highlight your leadership experience.";
    }

    return {
        score: totalScore,
        match,
        missing,
        eligibility,
        tip,
        breakdown: { skillScore, experienceScore, evidenceScore, atsScore }
    };
};

export const calculateScores = (userProfile) => {
    // Destructure Safe Defaults
    const resumeData = userProfile?.resumeData || { skills: [], experienceYears: 0 };
    const githubStats = userProfile?.githubStats || { repos: 0, stars: 0, languages: [] };
    const preferences = userProfile?.preferences || { roles: [], locations: [] };
    const education = userProfile?.education || {};

    // --- 1. SKILL STRENGTH SCORE ---
    // Formula: (Diversity of Skills * 3) + (GitHub Languages * 5) + (Project Depth)
    const uniqueSkills = new Set([...(resumeData.skills || []), ...(githubStats.languages || [])]);
    let skillStrength = (uniqueSkills.size * 5) + (githubStats.repos * 2);

    // Bonus for robust stack (Front + Back)
    const hasFrontend = uniqueSkills.has('react') || uniqueSkills.has('javascript') || uniqueSkills.has('html');
    const hasBackend = uniqueSkills.has('node.js') || uniqueSkills.has('python') || uniqueSkills.has('java');
    if (hasFrontend && hasBackend) skillStrength += 15;

    // Cap at 98 (nobody is perfect)
    skillStrength = Math.min(Math.round(skillStrength), 98);
    // Floor at 20 (everyone starts somewhere)
    skillStrength = Math.max(skillStrength, 20);


    // --- 2. INDUSTRY READINESS SCORE ---
    // Formula: (Experience Years * 15) + (Education Level Bonus) + (Completeness)
    let experienceScore = (resumeData.experienceYears || 0) * 20;

    // Education Bonus
    if (education.level === 'Masters' || education.level === 'PhD') experienceScore += 15;
    if (education.college) experienceScore += 10;

    // Artifacts Bonus (Docs, links, etc)
    if (userProfile.linkedinUrl) experienceScore += 10;
    if (userProfile.resumeText && userProfile.resumeText.length > 500) experienceScore += 15;

    let industryReadiness = Math.min(Math.round(experienceScore), 95);
    industryReadiness = Math.max(industryReadiness, 15);


    // --- 3. CAREER PROBABILITY SCORE ---
    // Formula: Weighted Average of above + Market Activity Proxy
    // We assume if they have a target role, they are active.
    let probability = (skillStrength * 0.4) + (industryReadiness * 0.4);

    // GitHub Activity Bonus (Real proof of work)
    if (githubStats.repos > 10) probability += 10;
    if (githubStats.stars > 50) probability += 10;

    // Location Flexibility Bonus
    if (preferences.locations?.includes('Remote') || preferences.locations?.length > 2) probability += 5;

    let careerProbability = Math.min(Math.round(probability), 99);
    careerProbability = Math.max(careerProbability, 30);

    // --- 4. ADVANCED INSIGHT GENERATION ---
    const strengths = [];
    const gaps = [];
    const tips = [];

    // Role-Based Expectations (Mini Knowledge Base)
    const ROLE_STACKS = {
        'Software Engineer': { required: ['javascript', 'python', 'java', 'git'], recommended: ['react', 'node.js', 'sql', 'docker'] },
        'Data Scientist': { required: ['python', 'sql', 'pandas'], recommended: ['tensorflow', 'scikit-learn', 'pytorch', 'tableau'] },
        'Frontend Developer': { required: ['html', 'css', 'javascript', 'react'], recommended: ['typescript', 'tailwind', 'next.js', 'figma'] },
        'Backend Developer': { required: ['node.js', 'python', 'sql', 'api'], recommended: ['docker', 'kubernetes', 'aws', 'mongodb'] },
        'Product Manager': { required: ['agile', 'jira', 'communication'], recommended: ['sql', 'analytics', 'figma', 'user research'] }
    };

    // Determine target role (default to Software Engineer if vague)
    const targetRole = preferences.domain || 'Software Engineer';
    const roleexpectations = ROLE_STACKS[targetRole] || ROLE_STACKS['Software Engineer'];

    // --- STRENGTHS ---
    if (skillStrength > 80) strengths.push("Top 10% Technical Proficiency");
    if (githubStats.stars > 20) strengths.push("Valid Community Recognition");
    if (uniqueSkills.size > 10) strengths.push("Versatile Polyglot Specialist");

    // Check for "Premium" skills
    const premiumSkills = ['kubernetes', 'graphql', 'rust', 'blockchain', 'aws', 'terraform', 'ci/cd'];
    const userPremiumSkills = [...uniqueSkills].filter(s => premiumSkills.includes(s.toLowerCase()));
    if (userPremiumSkills.length > 0) strengths.push(`High-Value Skills: ${userPremiumSkills.slice(0, 2).join(', ')}`);

    // Education Strength
    if (education.level === 'Masters' || education.level === 'PhD') strengths.push("Advanced Academic Background");


    // --- GAPS ---
    // Check against Role Stack
    const missingRequired = roleexpectations.required.filter(s => !uniqueSkills.has(s));
    const missingRecommended = roleexpectations.recommended.filter(s => !uniqueSkills.has(s));

    if (missingRequired.length > 0) {
        gaps.push(`Missing Core ${targetRole} Skills: ${missingRequired.slice(0, 2).join(', ')}`);
    } else if (missingRecommended.length > 2) {
        gaps.push(`Missing Modern Tools: ${missingRecommended.slice(0, 2).join(', ')}`);
    }

    if (githubStats.repos === 0 && targetRole.includes('Developer')) gaps.push("Zero Code Visibility (Critical)");
    if (resumeData.experienceYears < 1 && education.year > 2024) gaps.push("Lack of Real-World Internships");


    // --- PRECISE TIPS ---
    // 1. Skill Tips
    if (missingRequired.length > 0) {
        tips.push(`Prioritize learning **${missingRequired[0]}** - it is essential for ${targetRole} roles.`);
    } else if (missingRecommended.length > 0) {
        tips.push(`Level up by adding **${missingRecommended[0]}** to your stack to stand out.`);
    }

    // 2. Project Tips (Context Aware)
    if (githubStats.repos < 3) {
        if (targetRole === 'Data Scientist') tips.push("Upload a Jupyter Notebook analyzing a Kaggle dataset.");
        else if (targetRole === 'Frontend Developer') tips.push("Build and deploy a responsive portfolio site using React/Next.js.");
        else tips.push("Create a full-stack CRUD application to demonstrate end-to-end skills.");
    }

    // 3. Experience Tips
    if (resumeData.experienceYears === 0) {
        tips.push("Contribute to open-source projects (e.g., 'Good First Issues') to gain recognized experience.");
    } else if (resumeData.experienceYears < 2) {
        tips.push("Seek leadership in your current verified projects to prepare for Senior roles.");
    }

    // Fallback
    if (tips.length === 0) tips.push("Your profile is solid! Focus on networking and mock interviews.");

    // --- 5. SKILL CONFIDENCE ENGINE (Precise Data for Visualization) ---
    // Aggregates evidence from all sources to build a weighted skill profile
    const skillMap = new Map();

    const addSkillEvidence = (skillName, weight, source) => {
        if (!skillName) return;
        const key = skillName.toLowerCase();
        const existing = skillMap.get(key) || {
            name: skillName, // Keep original casing of first occurrence
            score: 0,
            sources: []
        };

        // Cap score per source to prevent inflation
        if (!existing.sources.includes(source)) {
            existing.score += weight;
            existing.sources.push(source);
        }

        skillMap.set(key, existing);
    };

    // 1. Resume Evidence (Base Weight: 1)
    (resumeData.skills || []).forEach(s => addSkillEvidence(s, 1, 'Resume'));

    // 2. GitHub Evidence (High Weight: 2 - Proof of Code)
    (githubStats.languages || []).forEach(l => addSkillEvidence(l, 2, 'GitHub'));

    // 3. User Manual Claims (Base Weight: 1)
    (userProfile.skills || []).forEach(s => addSkillEvidence(s, 1, 'Manual'));

    // 4. Transform to List & Categorize
    const confidenceSkills = Array.from(skillMap.values()).map(item => {
        let status = 'developing'; // Default (Yellow)

        if (item.score >= 3) status = 'strong'; // Green (e.g. Resume + GitHub)
        else if (item.score === 1) status = 'weak'; // Red (Single source)

        // Normalize Score for Visual Size (1-5 range)
        const size = Math.min(item.score + 0.5, 4);

        return {
            name: item.name,
            score: item.score,
            status: status, // strong | developing | weak
            size: size
        };
    }).sort((a, b) => b.score - a.score); // Best skills first

    // Return Final Analysis
    return {
        skillStrength,
        industryReadiness,
        careerProbability,
        analysis: {
            strengths: strengths.slice(0, 4),
            gaps: gaps.slice(0, 3),
            tips: tips.slice(0, 3),
            confidenceSkills: confidenceSkills // STRICT DATA: Only real, scored skills
        }
    };
};
