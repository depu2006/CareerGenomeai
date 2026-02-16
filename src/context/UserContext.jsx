import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    // Initialize from localStorage if available
    // Initialize with default structure
    const [userProfile, setUserProfile] = useState({
        // Identity
        name: "User", // Default to "User"
        email: "",

        // Education
        education: {
            level: '',      // e.g. Undergraduate, Masters
            college: '',    // e.g. IIT Madras
            year: '',       // e.g. 2026
            major: ''       // e.g. Computer Science
        },

        // Career Preferences
        preferences: {
            roles: [],      // e.g. ['Frontend Dev', 'Product Manager']
            locations: [],  // e.g. ['Remote', 'Bangalore']
            targetSkills: [] // Skills they want to learn
        },

        // Digital Footprint
        githubUsername: '',
        githubStats: null, // { repos, stars, followers, languages, topRepos, bio }
        linkedinUrl: '',
        linkedinData: null, // Manual entry buffer if no API

        // Resume Intelligence
        resumeText: '',
        resumeData: {
            skills: [],
            experienceYears: 0,
            projects: [],
            rawText: ''
        },

        // Derived
        domain: 'Software Engineer', // Default to allow access
        skills: [], // Consolidated skills (Resume + GitHub + Manual)
        isProfileComplete: true // Default to true to show content
    });

    // Fetch profile on load if token exists
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('http://127.0.0.1:5000/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data && Object.keys(data).length > 0) {
                        setUserProfile(prev => ({ ...prev, ...data }));
                    }
                })
                .catch(err => console.error("Failed to load profile:", err));
        }
    }, []);

    const updateProfile = async (data) => {
        setUserProfile(prev => {
            const updated = { ...prev, ...data };
            // Auto-calculate completeness
            const hasIdentity = updated.name && updated.email;
            const hasEdu = updated.education?.college;
            const hasResume = updated.resumeText && updated.resumeText.length > 50;
            const hasTarget = updated.domain || (updated.preferences?.roles?.length > 0);

            updated.isProfileComplete = Boolean(hasIdentity && hasEdu && hasResume && hasTarget);

            // Save to Backend
            const token = localStorage.getItem('token');
            if (token) {
                fetch('http://127.0.0.1:5000/api/user/profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updated)
                }).catch(err => console.error("Failed to save profile:", err));
            }

            return updated;
        });
    };

    const extractSkillsFromResume = (text) => {
        if (!text) return [];
        const lowerText = text.toLowerCase();

        // 1. Skill Extraction (Expanded Keyword List)
        const skillKeywords = [
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
            'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring boot',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'firebase', 'supabase',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd',
            'machine learning', 'deep learning', 'nlp', 'computer vision', 'pytorch', 'tensorflow', 'scikit-learn',
            'data analysis', 'pandas', 'numpy', 'matplotlib', 'tableau', 'power bi',
            'agile', 'scrum', 'jira', 'communication', 'leadership', 'teamwork'
        ];

        const foundSkills = skillKeywords.filter(skill => lowerText.includes(skill));

        // 2. Experience Extraction (Heuristic)
        // Look for patterns like "3 years", "2020 - 2024", etc.
        let years = 0;
        const yearRegex = /(\d+)\+?\s*years?/gi;
        const match = yearRegex.exec(lowerText);
        if (match && match[1]) {
            years = parseInt(match[1]);
        } else {
            // Fallback: Count year ranges like 2020-2022
            const dateRangeRegex = /(20\d{2})\s*-\s*(20\d{2}|present)/g;
            let ranges = 0;
            while (dateRangeRegex.exec(lowerText)) {
                ranges++;
            }
            if (ranges > 0) years = Math.max(1, ranges); // Approx 1 year per listed role
        }

        // Update Context with extracted data
        updateProfile({
            resumeData: {
                ...userProfile.resumeData,
                skills: [...new Set(foundSkills)],
                experienceYears: years,
                rawText: text
            },
            skills: [...new Set([...userProfile.skills, ...foundSkills])]
        });

        return { skills: foundSkills, experience: years };
    };

    return (
        <UserContext.Provider value={{ userProfile, updateProfile, extractSkillsFromResume }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
