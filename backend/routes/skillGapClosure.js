const express = require("express");
const router = express.Router();

const roleRequirements = require("../data/roleRequirements");
const skillKnowledgeBase = require("../data/skillKnowledgeBase");

router.post("/generate", (req, res) => {
    try {
        const { role, currentSkills } = req.body;

        if (!role) {
            return res.status(400).json({ error: "Role is required" });
        }

        // Normalize input role for case-insensitive lookup
        const roleKey = Object.keys(roleRequirements).find(
            r => r.toLowerCase() === role.trim().toLowerCase()
        );

        const requiredSkills = roleRequirements[roleKey];

        if (!requiredSkills) {
            return res.status(400).json({ error: `Role '${role}' not supported. Please try roles like 'Data Analyst', 'Full Stack Developer', etc.` });
        }

        const currentArray = (currentSkills || "")
            .split(",")
            .map(skill => skill.trim().toLowerCase())
            .filter(skill => skill.length > 0);

        const missingSkills = requiredSkills.filter(
            skill => !currentArray.includes(skill.toLowerCase())
        );

        const closurePlan = missingSkills.map(skill => ({
            skill,
            roadmap: skillKnowledgeBase[skill] || "No roadmap available"
        }));

        res.json({
            role,
            missingSkills,
            closurePlan
        });

    } catch (error) {
        console.error("Skill Gap Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
