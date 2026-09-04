from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader
import pandas as pd
import re
import numpy as np
import os
import requests
import html
import random
import jwt
import bcrypt
import datetime
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

# -----------------------------
# MONGODB CONFIG
# -----------------------------
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "career_genome"
SECRET_KEY = "supersecretkey" # Change for production

try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    users_collection = db["users"]
    skill_gaps_collection = db["skill_gaps"]
    interviews_collection = db["interviews"]
    print("MongoDB Connected!")
except Exception as e:
    print(f"MongoDB Connection Error: {e}")

# -----------------------------
# AUTH & USER ROUTES
# -----------------------------

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({"msg": "Missing fields"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"msg": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    user_id = users_collection.insert_one({
        "name": name,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.datetime.utcnow(),
        "profile": {} # Empty profile initially
    }).inserted_id

    token = jwt.encode({
        "user_id": str(user_id),
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {"id": str(user_id), "name": name, "email": email}
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"msg": "Invalid credentials"}), 401

    if bcrypt.checkpw(password.encode('utf-8'), user['password']):
        token = jwt.encode({
            "user_id": str(user['_id']),
            "email": email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            "token": token,
            "user": {"id": str(user['_id']), "name": user['name'], "email": email}
        })
    
    return jsonify({"msg": "Invalid credentials"}), 401

@app.route('/api/user/profile', methods=['GET', 'POST'])
def user_profile():
    # Expect 'Authorization' header: Bearer <token>
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"msg": "Missing token"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = decoded['user_id']
    except Exception:
        return jsonify({"msg": "Invalid token"}), 401

    if request.method == 'GET':
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        return jsonify(user.get("profile", {}))

    if request.method == 'POST':
        profile_data = request.json
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"profile": profile_data}}
        )
        return jsonify({"msg": "Profile updated"})

# -----------------------------

# -----------------------------
# SKILL INTEGRITY CHECK (Quiz)
# -----------------------------
@app.route('/ask', methods=['POST'])
def ask_api():
    try:
        # Save previous result if provided
        data_in = request.json
        if data_in and "email" in data_in and "summary" in data_in:
             db["assessment_results"].insert_one({
                 "email": data_in["email"],
                 "summary": data_in["summary"],
                 "date": datetime.datetime.utcnow()
             })
             return jsonify({"msg": "Saved"})

        # Normal Queston Fetch
        # We use a public, keyless API locked to 'Science: Computers' (Category 18)
        api_url = "https://opentdb.com/api.php?amount=1&category=18&type=multiple"
        
        response = requests.get(api_url, timeout=10)
        data = response.json()

        if data['response_code'] == 0:
            item = data['results'][0]
            
            # Use html.unescape to fix symbols like &quot;
            question = html.unescape(item['question'])
            answer = html.unescape(item['correct_answer'])
            options = [html.unescape(opt) for opt in item['incorrect_answers']]
            
            options.append(answer)
            random.shuffle(options)

            return jsonify({
                "question": question,
                "answer": answer,
                "options": options
            })
        
        return jsonify({"error": "Failed to fetch question from public database"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# CLEAN TEXT
# -----------------------------
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9 ]', ' ', text)
    return text

# -----------------------------
# LOAD O*NET SKILLS
# -----------------------------
# Initialize skills_df as global but load safely
skills_df = None

def load_skills():
    global skills_df
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(current_dir, "data", "Skills.txt")
        
        skills_df = pd.read_csv(
            data_path,
            sep="\t",
            low_memory=False
        )
        skills_df = skills_df[skills_df["Scale ID"] == "IM"]
        skills_df = skills_df[["Element Name", "Data Value"]]
        skills_df = skills_df.groupby("Element Name").mean().reset_index()
        print(f"Loaded {len(skills_df)} skills from Skills.txt")
    except Exception as e:
        print(f"Error loading skills: {e}")
        # Fallback empty dataframe to prevent crash
        skills_df = pd.DataFrame(columns=["Element Name", "Data Value"])

# Load on startup
load_skills()

# -----------------------------
# PDF EXTRACTION
# -----------------------------
def extract_text_from_pdf(file):
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        content = page.extract_text()
        if content:
            text += content
    return text

# -----------------------------
# SKILL MATCH CHECK
# -----------------------------
def skill_matches(skill, text):
    # Basic word matching - can be improved with NLP
    words = skill.lower().split()
    text = text.lower()
    
    # Exact phrase match first
    if skill.lower() in text:
        return True
    
    # Check if all words in multi-word skill exist (loose match)
    # Only if skill has >1 word
    if len(words) > 1:
        return all(word in text for word in words)
        
    return False

# -----------------------------
# MAIN ROUTE
# -----------------------------
@app.route("/career-readiness", methods=["POST"])
def career_readiness():
    try:
        if 'resume_file' not in request.files:
            return jsonify({"error": "No resume file uploaded"}), 400
            
        resume_file = request.files["resume_file"]
        job_description = request.form.get("job_description", "")

        if not resume_file or not job_description:
             # If JD is empty but resume is there, we can still analyze resume skills?
             # For now, require both as per logic
             pass

        resume_text = clean_text(extract_text_from_pdf(resume_file))
        jd_text = clean_text(job_description)

        required_skills = []
        matched_skills = []

        # Step 1: Identify required skills from JD using O*NET list
        # Scan O*NET skills to see which ones appear in the JD
        if skills_df is not None and not skills_df.empty:
            for _, row in skills_df.iterrows():
                skill = row["Element Name"]
                if skill_matches(skill, jd_text):
                    required_skills.append(skill)
        
        # Fallback: if no O*NET skills found in JD (maybe JD is short or uses different terms), 
        # we might want to extract *something*. 
        # For this implementation, we stick to the O*NET list as the source of truth for "Skills".
        
        # Step 2: Check resume match against REQUIRED skills
        for skill in required_skills:
            if skill_matches(skill, resume_text):
                matched_skills.append(skill)

        total_required = len(required_skills)
        total_matched = len(matched_skills)

        readiness_score = 0
        if total_required > 0:
            readiness_score = round((total_matched / total_required) * 100, 2)
        elif len(jd_text) > 10:
             # If JD was provided but no skills matched our DB, score is ambiguous.
             # Let's default to 0 to avoid undefined behavior, or handle gracefully.
             readiness_score = 0

        # -----------------------------
        # REALISTIC PEER BENCHMARKING
        # -----------------------------
        np.random.seed(42)
        peer_scores = np.random.normal(loc=55, scale=15, size=1000)
        peer_scores = np.clip(peer_scores, 0, 100)

        percentile = round(
            (np.sum(peer_scores < readiness_score) / len(peer_scores)) * 100,
            2
        )

        # -----------------------------
        # PERSISTENCE
        # -----------------------------
        # Check for 'email' in form data
        user_email = request.form.get("email")
        
        result_payload = {
            "readiness_score": readiness_score,
            "peer_percentile": percentile,
            "required_skills_count": total_required,
            "matched_skills_count": total_matched,
            "required_skills": required_skills[:15], # Top 15
            "matched_skills": matched_skills[:15]
        }

        if user_email:
             db["readiness_scans"].insert_one({
                 "email": user_email,
                 "job_description": job_description[:500], # Truncate for storage efficiency
                 "result": result_payload,
                 "date": datetime.datetime.utcnow()
             })

        return jsonify(result_payload)

    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(f"Error processing request: {error_msg}")
        with open("server_error.log", "w") as f:
            f.write(error_msg)
        return jsonify({"error": str(e)}), 500

# -----------------------------
# FAILURE INTELLIGENCE ENGINE
# -----------------------------
@app.route("/analyze-failure", methods=["POST"])
def analyze_failure():
    try:
        data = request.json
        story = data.get("story", "")
        
        if not story or len(story) < 10:
            return jsonify({"error": "Story too short"}), 400

        text = story.lower()
        
        # Heuristic Analysis
        diagnosis = "General Career Setback"
        failure_type = "General"
        sentiment = "Neutral"
        action_plan = ["Reflect on your career goals.", "Network with peers in your industry."]

        # 1. Detect Type & Diagnosis
        # INTERVIEW / ASSESSMENT (Broader Keywords)
        if any(w in text for w in ["interview", "call", "meeting", "hr", "screen", "round", "coding", "whiteboard", "live", "assessment", "test", "challenge", "explained", "nervous", "froze", "anxiety"]):
            failure_type = "Interview"
            
            # Sub-diagnosis: Technical vs Behavioral vs Anxiety
            if any(w in text for w in ["nervous", "anxiety", "froze", "scared", "blank", "panic", "shaking"]):
                 diagnosis = "Performance Anxiety / Nerves"
                 action_plan = [
                     "Practice 'Mock Interviews' to desensitize the fear response.",
                     "Use breathing techniques (4-7-8 method) before checking in.",
                     "Focus on 'thinking out loud' even if you are stuck, rather than staying silent."
                 ]
            elif any(w in text for w in ["code", "coding", "technical", "system design", "whiteboard", "algorithm", "datastructure", "live", "syntax"]):
                diagnosis = "Technical Proficiency Gap"
                action_plan = [
                    "Practice 1 LeetCode Medium problem daily under a timer.",
                    "Review 'System Design' concepts (Scalability, CAP Theorem).",
                    "Do a mock technical interview on Pramp or with a peer."
                ]
            else:
                diagnosis = "Communication / Behavioral Gap"
                action_plan = [
                    "Prepare 5 'STAR' method stories (Situation, Task, Action, Result).",
                    "Research the company's core values to align your answers.",
                    "Practice speaking slowly and clearly using the Pyramid Principle."
                ]

        # RESUME / APPLICATION
        elif any(w in text for w in ["resume", "cv", "application", "applied", "ats", "apply", "submitted"]):
            failure_type = "Resume"
            if "content" in text or "short" in text or "empty" in text:
                 diagnosis = "Lack of Resume Depth"
                 action_plan = [
                     "Expand your resume to at least 500 words.",
                     "Use the 'XYZ' formula for bullet points (Accomplished [X] as measured by [Y] doing [Z]).",
                     "Run your resume through an ATS scanner."
                 ]
            else:
                 diagnosis = "Resume Optimization Issue"
                 action_plan = [
                     "Quantify your achievements with metrics (%, $, time saved).",
                     "Tailor keywords to the specific job description.",
                     "Ensure your formatting is ATS-friendly (single column, standard fonts)."
                 ]

        # MARKET / RESPONSET
        elif any(w in text for w in ["ghosted", "no reply", "ignored", "silence", "reject", "callbacks", "response"]):
            failure_type = "Market"
            diagnosis = "Low Response Rate / Market Fit"
            # ... rest same
            action_plan = [
                "Reach out directly to hiring managers on LinkedIn/Email.",
                "Apply within the first 24 hours of a job posting.",
                "Get a referral from an employee (boosts chances by 10x)."
            ]

        # SKILL GAP
        elif any(w in text for w in ["skill", "stack", "learn", "experience", "qualified", "requirements", "knowledge"]):
            failure_type = "Skill Gap"
            # ... rest same
            diagnosis = "Perceived Skill or Experience Gap"
            action_plan = [
                "Build a portfolio project using the required tech stack.",
                "Contribute to Open Source to prove real-world skills.",
                "Obtain a certification to validate your knowledge."
            ]
        
        # 2. Detect Sentiment
        if any(w in text for w in ["depressed", "sad", "hate", "quit", "useless", "stupid"]):
            sentiment = "Negative"
        elif any(w in text for w in ["hope", "learn", "better", "next", "improve"]):
            sentiment = "Positive"

        result = {
            "diagnosis": diagnosis,
            "type": failure_type,
            "sentiment": sentiment,
            "actionPlan": action_plan
        }

        # Save to DB
        # Expect 'email' in payload for persistence
        user_email = data.get("email")
        if user_email:
             db["failure_stories"].insert_one({
                 "email": user_email,
                 "story": story,
                 "result": result,
                 "date": datetime.datetime.utcnow()
             })

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
import os
import pandas as pd
import requests

# Load O*NET Data
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    occupations = pd.read_csv(
        os.path.join(BASE_DIR, "Occupation Data.txt"),
        sep="\t",
        dtype=str
    )
    tech_data = pd.read_csv(
        os.path.join(BASE_DIR, "Technology Skills.txt"),
        sep="\t",
        dtype=str
    )
    occupations.columns = occupations.columns.str.strip()
    tech_data.columns = tech_data.columns.str.strip()
    print("O*NET Data Loaded Successfully")
except Exception as e:
    print(f"Error loading O*NET data: {e}")
    occupations = pd.DataFrame(columns=["Title", "O*NET-SOC Code"])
    tech_data = pd.DataFrame(columns=["O*NET-SOC Code", "Example"])

WIKI_API = "https://en.wikipedia.org/w/api.php"
headers = {"User-Agent": "RoadmapGenerator/1.0"}

# ---------------- ROLE BASED ---------------- #

@app.route("/api/roles", methods=["GET"])
def get_roles():
    titles = occupations["Title"].dropna().unique().tolist()
    titles.sort()
    return jsonify(titles)


@app.route("/api/role", methods=["POST"])
def role_info():
    role_input = request.json.get("role", "").strip()
    matched = occupations[occupations["Title"] == role_input]

    if matched.empty:
        return jsonify({"error": "Role not found"}), 404

    occupation_code = matched.iloc[0]["O*NET-SOC Code"]
    role_skills = tech_data[tech_data["O*NET-SOC Code"] == occupation_code]

    skills_list = (
        role_skills["Example"]
        .dropna()
        .unique()
        .tolist()
    )[:15]

    resources = [
        {
            "skill": skill,
            "documentation": f"https://www.google.com/search?q={skill}+official+documentation",
            "video": f"https://www.youtube.com/results?search_query={skill}+full+course"
        }
        for skill in skills_list
    ]

    return jsonify({
        "role": role_input,
        "resources": resources
    })


# ---------------- TOPIC BASED ---------------- #

@app.route("/api/topic", methods=["POST"])
def topic_roadmap():
    topic = request.json.get("topic", "").strip()

    if not topic:
        return jsonify({"error": "Topic required"}), 400

    search_params = {
        "action": "query",
        "list": "search",
        "srsearch": f"{topic} programming",
        "format": "json"
    }

    try:
        search_response = requests.get(WIKI_API, params=search_params, headers=headers)
        search_data = search_response.json()

        if not search_data.get("query", {}).get("search"):
            return jsonify({"error": "Topic not found"}), 404

        page_title = search_data["query"]["search"][0]["title"]

        parse_params = {
            "action": "parse",
            "page": page_title,
            "format": "json",
            "prop": "sections"
        }

        parse_response = requests.get(WIKI_API, params=parse_params, headers=headers)
        parse_data = parse_response.json()

        sections = parse_data.get("parse", {}).get("sections", [])

        children = []
        for sec in sections[:12]:
            title = sec.get("line")
            if title.lower() not in ["references", "external links", "see also"]:
                children.append({"title": title})

        structure = {
            "title": page_title,
            "children": children
        }

        return jsonify({
            "topic": topic,
            "documentation": f"https://www.google.com/search?q={topic}+official+documentation",
            "video": f"https://www.youtube.com/results?search_query={topic}+full+course",
            "structure": structure
        })
        return jsonify({
            "topic": topic,
            "documentation": f"https://www.google.com/search?q={topic}+official+documentation",
            "video": f"https://www.youtube.com/results?search_query={topic}+full+course",
            "structure": structure
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- SKILL GAP ENGINE ---------------- #

@app.route("/api/skill-gap/generate", methods=["POST"])
def generate_skill_gap():
    try:
        data = request.json
        target_role = data.get("role", "").strip()
        current_skills_input = data.get("currentSkills", "")

        if not target_role:
            return jsonify({"error": "Target role is required"}), 400

        # Parse current skills
        current_skills_list = [
            s.strip().lower() for s in current_skills_input.split(",") if s.strip()
        ]

        # 1. Finding required skills for the role from O*NET data
        matched_role = occupations[occupations["Title"].str.contains(target_role, case=False, regex=False)]
        
        required_skills = []
        if not matched_role.empty:
            occupation_code = matched_role.iloc[0]["O*NET-SOC Code"]
            role_skills_df = tech_data[tech_data["O*NET-SOC Code"] == occupation_code]
            # Get top 20 example skills
            required_skills = (
                role_skills_df["Example"]
                .dropna()
                .unique()
                .tolist()
            )[:20]
        else:
            # Fallback if specific O*NET role not found: return generic dev skills or empty
            # Extended fallback list
            role_lower = target_role.lower()
            if any(x in role_lower for x in ["developer", "engineer", "programmer", "coder", "architect"]):
                required_skills = ["Python", "JavaScript", "SQL", "Git", "Rest API", "React", "Docker", "AWS", "System Design", "CI/CD"]
            elif any(x in role_lower for x in ["data", "analyst", "scientist", "ai", "ml"]):
                required_skills = ["Python", "SQL", "Pandas", "Machine Learning", "Data Visualization", "Statistics", "Tableau", "Big Data"]
            elif any(x in role_lower for x in ["manager", "lead", "director", "exec"]):
                required_skills = ["Project Management", "Agile", "Communication", "Leadership", "Strategic Planning", "Stakeholder Management"]
            else:
                 # Ultimate fallback - don't error out, just give general tech skills
                 required_skills = ["Computer Literacy", "Problem Solving", "Communication", "Time Management", "Project Management"]
                 # Optionally append the role name to the error message if we really want to signal it
                 # return jsonify({"error": f"Role '{target_role}' not found. Try 'Software Developer' or 'Data Scientist'."}), 404

        # 2. Identify Missing Skills
        missing_skills = []
        for skill in required_skills:
            # Simple substring match
            is_present = False
            for user_skill in current_skills_list:
                if user_skill in skill.lower() or skill.lower() in user_skill:
                    is_present = True
                    break
            
            if not is_present:
                missing_skills.append(skill)

        # Limit to top 10 missing to avoid overwhelming
        missing_skills = missing_skills[:10]

        # --- PREDEFINED ROADMAPS (To speed up common roles) ---
        PREDEFINED_ROADMAPS = {
            "frontend": {
                "skills": ["React", "JavaScript", "HTML/CSS", "Git", "Testing"],
                "plan": [
                    {"skill": "React", "completed": False, "roadmap": {"topics": ["Hooks & Context", "State Management", "Performance"], "miniProject": "Task Dashboard", "duration": "3 weeks", "certification": "Meta Frontend Dev"}},
                    {"skill": "JavaScript", "completed": False, "roadmap": {"topics": ["ES6+", "Async/Await", "DOM"], "miniProject": "Weather App", "duration": "2 weeks", "certification": "JSE Certified"}},
                    {"skill": "CSS", "completed": False, "roadmap": {"topics": ["Flexbox/Grid", "Tailwind", "Responsive"], "miniProject": "Landing Page Clone", "duration": "2 weeks", "certification": "None"}},
                    {"skill": "Git", "completed": False, "roadmap": {"topics": ["Branching", "PRs", "Conflicts"], "miniProject": "Open Source Contrib", "duration": "1 week", "certification": "None"}}
                ]
            },
            "full stack": {
                "skills": ["React", "Node.js", "MongoDB", "Express", "API Design"],
                "plan": [
                    {"skill": "React", "completed": False, "roadmap": {"topics": ["Advanced Hooks", "Patterns", "Optimization"], "miniProject": "E-commerce Site", "duration": "3 weeks", "certification": "Meta Frontend"}},
                    {"skill": "Node.js", "completed": False, "roadmap": {"topics": ["Event Loop", "Streams", "Scalability"], "miniProject": "CLI Tool", "duration": "2 weeks", "certification": "OpenJS Node Services"}},
                    {"skill": "MongoDB", "completed": False, "roadmap": {"topics": ["Aggregation", "Indexing", "Schema Design"], "miniProject": "Blog Backend", "duration": "2 weeks", "certification": "MongoDB Associate"}},
                    {"skill": "API Design", "completed": False, "roadmap": {"topics": ["REST", "Auth/JWT", "Security"], "miniProject": "Secure Task API", "duration": "1 week", "certification": "None"}}
                ]
            },
            "devops": {
                 "skills": ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux"],
                 "plan": [
                    {"skill": "Docker", "completed": False, "roadmap": {"topics": ["Containers", "Dockerfiles", "Compose"], "miniProject": "MERN Stack Containerization", "duration": "2 weeks", "certification": "Docker Certified"}},
                    {"skill": "Kubernetes", "completed": False, "roadmap": {"topics": ["Pods", "Deployments", "Helm"], "miniProject": "Microservice Cluster", "duration": "3 weeks", "certification": "CKA (Kubernetes Admin)"}},
                    {"skill": "CI/CD", "completed": False, "roadmap": {"topics": ["GitHub Actions", "Pipelines", "Testing"], "miniProject": "Web App Pipeline", "duration": "2 weeks", "certification": "None"}},
                    {"skill": "AWS", "completed": False, "roadmap": {"topics": ["EC2/S3", "IAM", "VPC"], "miniProject": "Static Site Hosting", "duration": "2 weeks", "certification": "AWS Cloud Practitioner"}}
                 ]
            }
        }
        
        target_lower = target_role.lower()
        matched_predefined = None
        for key in PREDEFINED_ROADMAPS:
             if key in target_lower:
                 matched_predefined = PREDEFINED_ROADMAPS[key]
                 break

        # 3. Generate Closure Plan (Roadmap)
        closure_plan = []
        
        if matched_predefined:
            print(f"Using PREDEFINED roadmap for {target_role}")
            closure_plan = matched_predefined["plan"]
            # Optimization: Update missing skills to match plan for UI consistency
            missing_skills = matched_predefined["skills"]
        else:
            # 3. Generate Closure Plan (Dynamic AI Roadmap)
            # Try to get AI response first
            try:
                if not missing_skills:
                    pass
                else:
                    ollama_url = "http://localhost:11434/api/generate"
                    prompt = f"""
                    Act as a senior technical mentor. Create a learning roadmap for a '{target_role}' who is missing these skills: {', '.join(missing_skills)}.
                    
                    For EACH missing skill, provide a structured plan in strict JSON format.
                    The output must be a JSON object with a key "plan" containing a list of objects.
                    
                    Format:
                    {{
                        "plan": [
                            {{
                                "skill": "Skill Name",
                                "roadmap": {{
                                    "topics": ["Topic 1", "Topic 2", "Topic 3"],
                                    "miniProject": "Description of a practical project",
                                    "duration": "Time to learn (e.g. 2 weeks)",
                                    "certification": "Recommended certification or 'None'"
                                }}
                            }}
                        ]
                    }}
                    
                    Do not include any text outside the JSON.
                    """
                    
                    headers = {"Content-Type": "application/json"}
                    payload = {
                        "model": "phi", # Lightweight model
                        "prompt": prompt,
                        "stream": False,
                        "format": "json", # Force JSON mode if supported or just prompt engineering
                        "options": {"temperature": 0.3}
                    }
                    
                    print("Requesting AI roadmap...")
                    response = requests.post(ollama_url, json=payload, timeout=45)
                    
                    if response.status_code == 200:
                        ai_text = response.json().get("response", "")
                        # Clean up json if needed (sometimes models chatter)
                        # Find first { and last }
                        start = ai_text.find("{")
                        end = ai_text.rfind("}") + 1
                        if start != -1 and end != -1:
                            json_str = ai_text[start:end]
                            data = json.loads(json_str)
                            if "plan" in data and isinstance(data["plan"], list):
                                # Map to our format (add 'completed' flag)
                                for item in data["plan"]:
                                    item["completed"] = False
                                closure_plan = data["plan"]
                                print(f"AI Roadmap generated with {len(closure_plan)} items.")
                            else:
                                print("AI response format incorrect, using fallback.")
                        else:
                             print("Could not find JSON in AI response.")
                    else:
                        print(f"Ollama error: {response.status_code}")

            except Exception as e:
                print(f"AI Roadmap Generation failed: {e}. Falling back to template.")

        # Fallback if AI failed or returned empty
        if not closure_plan and missing_skills:
            print("Using static fallback roadmap.")
            for skill in missing_skills:
                closure_plan.append({
                    "skill": skill,
                    "completed": False, 
                    "roadmap": {
                        "topics": [
                            f"{skill} Fundamentals",
                            f"Advanced {skill} Concepts",
                            f"{skill} Best Practices"
                        ],
                        "miniProject": f"Build a simple application using {skill}",
                        "duration": "2 weeks",
                        "certification": f"{skill} Certified Associate (Optional)"
                    }
                })

        result = {
            "role": target_role,
            "missingSkills": missing_skills,
            "closurePlan": closure_plan
        }

        # Save to DB if user_id provided (or just allow anonymous)
        # For now, let's just log it or save if we had auth middleware here.
        # Ideally, frontend sends a token and we extract user_id.
        # But to be simple, we receive 'email' optional body param
        
        user_email = data.get("email")
        if user_email:
             skill_gaps_collection.update_one(
                 {"email": user_email, "role": target_role},
                 {"$set": {"result": result, "updated_at": datetime.datetime.utcnow()}},
                 upsert=True
             )

        return jsonify(result)

    except Exception as e:
        print(f"Error in skill gap generation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/skill-gap/roadmap', methods=['GET'])
def get_roadmap():
    email = request.args.get('email')
    if not email:
        return jsonify(None) # Return nothing if no email
    
    # Find most recent or specific active roadmap
    # For now, we just find one. You might want to sort by date.
    data = skill_gaps_collection.find_one({"email": email}, sort=[("updated_at", -1)])
    
    if data and "result" in data:
        # Convert ObjectId if nested (though result usually isn't)
        return jsonify(data["result"])
    return jsonify(None)

@app.route('/api/skill-gap/roadmap', methods=['DELETE'])
def delete_roadmap():
    email = request.args.get('email')
    if not email:
        return jsonify({"msg": "Email required"}), 400
    
    skill_gaps_collection.delete_many({"email": email})
    return jsonify({"msg": "Roadmap cleared"})

# ---------------- AI CHATBOT (Ollama Proxy) ---------------- #

@app.route("/api/chat", methods=["POST"])
def chat_ai():
    try:
        data = request.json
        user_message = data.get("message", "")
        
        if not user_message:
            return jsonify({"reply": "Please ask something."})

        # Proxy to local Ollama instance
        ollama_url = "http://localhost:11434/api/generate"
        payload = {
            "model": "phi", # Ensure user has this model or make it configurable
            "prompt": f"""
You are a professional career mentor and coding assistant.

User Question:
{user_message}

Rules:
- Give clear and helpful answer
- Use simple English
- Be professional
- If technical question, explain properly
            """,
            "stream": False,
            "options": {"num_predict": 200}
        }
        
        try:
            response = requests.post(ollama_url, json=payload, timeout=120)
            response_json = response.json()
            return jsonify({"reply": response_json.get("response", "")})
        except requests.exceptions.ConnectionError:
            return jsonify({
                "reply": "AI server is not running. Please start Ollama locally using: ollama run phi"
            })

    except Exception as e:
        print(f"Chatbot error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------- INTERVIEW AVATAR ENGINE ---------------- #

# In-memory session storage (Single user for MVP)
interview_session = {
    "role": None,
    "index": 0,
    "scores": []
}

QUESTION_BANK = {
  "developer": [
    {"question": "Explain REST API.", "keywords": ["http", "get", "post", "client", "server"]},
    {"question": "What is the difference between TCP and UDP?", "keywords": ["connection", "reliable", "speed", "packet"]},
    {"question": "Explain the concept of threading.", "keywords": ["process", "parallel", "concurrency", "cpu"]}
  ],
  "python": [
    {"question": "Explain list vs tuple.", "keywords": ["mutable", "immutable", "change", "fast"]},
    {"question": "What is a decorator?", "keywords": ["function", "wrap", "modify", "behavior"]},
    {"question": "How is memory managed in Python?", "keywords": ["heap", "garbage", "collection", "private"]}
  ],
  "frontend": [
    {"question": "What is Virtual DOM?", "keywords": ["dom", "copy", "diff", "update", "performance"]},
    {"question": "Explain closure in JavaScript.", "keywords": ["function", "scope", "outer", "access"]},
    {"question": "What is the box model?", "keywords": ["margin", "border", "padding", "content"]}
  ],
  "backend": [
    {"question": "What is middleware?", "keywords": ["request", "response", "pipeline", "function"]},
    {"question": "Horizontal vs Vertical scaling?", "keywords": ["add", "machines", "power", "resource"]},
    {"question": "SQL vs NoSQL?", "keywords": ["relational", "schema", "document", "table"]}
  ],
  "sql": [
    {"question": "What is normalization?", "keywords": ["redundancy", "organized", "table", "data"]},
    {"question": "Explain ACID properties.", "keywords": ["atomicity", "consistency", "isolation", "durability"]},
    {"question": "Left Join vs Inner Join?", "keywords": ["match", "all", "rows", "common"]}
  ],
  "hr": [
    {"question": "Tell me about yourself.", "keywords": ["experience", "bio", "background", "passionate"]},
    {"question": "What are your strengths?", "keywords": ["fast", "learner", "team", "detail"]},
    {"question": "Why do you want to join us?", "keywords": ["company", "values", "growth", "challenge"]}
  ]
}

@app.route("/api/interview/start", methods=["POST"])
def start_interview():
    try:
        data = request.json
        role = data.get("role", "developer").lower() # Default to developer if missing
        
        # Fuzzy match role or find closest
        selected_role = "developer" # Fallback
        
        # Check explicit keys
        if role in QUESTION_BANK:
            selected_role = role
        else:
            # Keyword search
            for key in QUESTION_BANK.keys():
                if key in role:
                    selected_role = key
                    break

        interview_session["role"] = selected_role
        interview_session["index"] = 0
        interview_session["scores"] = []

        first_q = QUESTION_BANK[selected_role][0]["question"]
        
        return jsonify({
            "question": first_q,
            "role": selected_role
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/interview/answer", methods=["POST"])
def answer_interview():
    try:
        if not interview_session["role"]:
            return jsonify({"error": "Interview not started"}), 400

        data = request.json
        user_answer = data.get("answer", "").lower()
        
        role = interview_session["role"]
        idx = interview_session["index"]
        
        if idx >= len(QUESTION_BANK[role]):
             return jsonify({"finished": True})

        current_q_data = QUESTION_BANK[role][idx]
        keywords = current_q_data["keywords"]
        
        # Scoring logic
        matched_count = 0
        for kw in keywords:
            if kw in user_answer:
                matched_count += 1
        
        percentage = matched_count / len(keywords) if keywords else 0
        
        score = 0
        if percentage >= 0.6: score = 10
        elif percentage >= 0.3: score = 6
        else: score = 3
        
        interview_session["scores"].append(score)
        interview_session["index"] += 1
        
        next_idx = interview_session["index"]
        next_q = None
        finished = False
        
        if next_idx < len(QUESTION_BANK[role]):
            next_q = QUESTION_BANK[role][next_idx]["question"]
        else:
            finished = True
            
        # Save to DB on finish
        if finished:
             # Basic persistence - just saving the completed session
             # In a real app, we'd link this to a specific user ID/Email
             interviews_collection.insert_one({
                 "role": role,
                 "scores": interview_session["scores"],
                 "total_score": sum(interview_session["scores"]),
                 "date": datetime.datetime.utcnow()
             })

        return jsonify({
            "score": score,
            "nextQuestion": next_q,
            "finished": finished,
            "totalScore": sum(interview_session["scores"])
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# PROJECT GENERATOR
# -----------------------------
@app.route("/api/projects/generate", methods=["POST"])
def generate_projects():
    try:
        data = request.json
        role = data.get("role", "")
        current_skills = data.get("currentSkills", "")
        missing_skills = data.get("missingSkills", "")
        user_email = data.get("email")

        # Use Ollama to generate projects
        prompt = f"""
        Generate 3 unique, impressive project ideas for a {role} to build their portfolio.
        User has these skills: {current_skills}.
        User wants to learn: {missing_skills}.
        
        For each project provide:
        - Title
        - Description (2 sentences)
        - Tech Stack (list)
        - Difficulty (Beginner/Intermediate/Advanced)
        
        Return ONLY valid JSON in this format:
        {{
            "projects": [
                {{
                    "title": "...",
                    "description": "...",
                    "techStack": ["..."],
                    "difficulty": "..."
                }}
            ]
        }}
        """

        ollama_url = "http://localhost:11434/api/generate"
        payload = {
            "model": "phi", 
            "prompt": prompt,
            "stream": False,
            "format": "json", # Force JSON mode if supported or parse manually
            "options": {"num_predict": 1000}
        }

        try:
            response = requests.post(ollama_url, json=payload, timeout=60)
            ai_text = response.json().get("response", "")
            
            # Simple cleanup to ensure we get JSON
            # In a real app, use a robust parser or stricter prompting
            import json
            try:
                # Find the first { and last }
                start = ai_text.find('{')
                end = ai_text.rfind('}') + 1
                json_str = ai_text[start:end]
                project_data = json.loads(json_str)
            except:
                 # Fallback mock data if AI fails to return proper JSON
                 project_data = {
                     "projects": [
                         {
                             "title": f"AI-Powered {role} Dashboard",
                             "description": "Build a dashboard that visualizes data using the requested tech stack.",
                             "techStack": ["React", "Python", "MongoDB"],
                             "difficulty": "Intermediate"
                         },
                         {
                             "title": f"Real-time {role} Collaboration Tool",
                             "description": "A tool for teams to collaborate in real-time.",
                             "techStack": ["Socket.io", "Node.js", "Redis"],
                             "difficulty": "Advanced"
                         }
                     ]
                 }

            # Persist
            if user_email:
                db["generated_projects"].insert_one({
                    "email": user_email,
                    "role": role,
                    "projects": project_data.get("projects", []),
                     "date": datetime.datetime.utcnow()
                })

            return jsonify(project_data)

        except Exception as e:
            print(f"Ollama Error: {e}")
            return jsonify({"error": "AI Generation failed"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# ADMIN ROUTES
# -----------------------------
@app.route('/api/collections', methods=['GET'])
def get_collections():
    cols = db.list_collection_names()
    return jsonify(cols)

@app.route('/api/collection/<name>', methods=['GET'])
def get_collection_data(name):
    try:
        data = list(db[name].find().sort("date", -1).limit(50))
        # Convert ObjectId and Date for JSON serialization
        for doc in data:
            doc['_id'] = str(doc['_id'])
            for k, v in doc.items():
                if isinstance(v, datetime.datetime):
                    doc[k] = v.isoformat()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# INTEGRITY / SKILL ASSESSMENT (MCQ)
# -----------------------------
MCQ_BANK = [
    {"question": "What is the time complexity of binary search?", "options": ["O(n)", "O(log n)", "O(n^2)", "O(1)"], "answer": "O(log n)"},
    {"question": "Which of these is NOT a primitive type in JavaScript?", "options": ["String", "Number", "Object", "Boolean"], "answer": "Object"},
    {"question": "What does SQL stand for?", "options": ["Structured Query Language", "Simple Query Logic", "Standard Question List", "System Query Level"], "answer": "Structured Query Language"},
    {"question": "What is the purpose of Docker?", "options": ["To compile code", "To containerize applications", "To manage databases", "To host websites"], "answer": "To containerize applications"},
    {"question": "In Python, which keyword is used to define a function?", "options": ["func", "def", "define", "function"], "answer": "def"},
    {"question": "Which HTTP method is idempotent?", "options": ["POST", "PUT", "PATCH", "CONNECT"], "answer": "PUT"}, 
    {"question": "What is React mainly used for?", "options": ["Backend Logic", "Database Management", "Building User Interfaces", "Machine Learning"], "answer": "Building User Interfaces"},
    {"question": "What is the capital of France?", "options": ["Berlin", "London", "Madrid", "Paris"], "answer": "Paris"}, # Test Q
    {"question": "Which data struct follows LIFO?", "options": ["Queue", "Stack", "Array", "Tree"], "answer": "Stack"},
    {"question": "What is 2 + 2?", "options": ["3", "4", "5", "22"], "answer": "4"}
]

@app.route('/ask', methods=['POST'])
def ask_question():
    try:
        # get_json(silent=True) returns None if parsing fails or body is empty
        data = request.get_json(silent=True)
        
        if not data:
             # Random Question
             import random
             question = random.choice(MCQ_BANK)
             return jsonify(question)

        # Check if saving results
        if 'summary' in data:
            # Persist results
            email = data.get('email')
            summary = data.get('summary')
            if email:
                db['assessment_results'].insert_one({
                    "email": email,
                    "summary": summary,
                    "date": datetime.datetime.utcnow()
                })
            return jsonify({"status": "saved"})

        # Default: Random Question
        import random
        question = random.choice(MCQ_BANK)
        return jsonify(question)

    except Exception as e:
        print(f"Error in /ask: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------- CAREER SHOCK ALERTS ENGINE ---------------- #
# Note: Ensure feedparser is installed: pip install feedparser
import feedparser

# 1. Fetch Layoff News (Google News RSS)
def fetch_layoff_news():
    try:
        # Google News RSS for "layoffs tech"
        rss_url = "https://news.google.com/rss/search?q=layoffs+tech+when:7d&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(rss_url)
        
        alerts = []
        for entry in feed.entries[:10]:
            alerts.append({
                "type": "Layoff Shock",
                "message": f"🚨 {entry.title}",
                "url": entry.link,
                "date": entry.published
            })
        return alerts
    except Exception as e:
        print(f"Error fetching layoff news: {e}")
        return []

# 2. Fetch Jobs (Remotive API) & Analyze Trends
def fetch_and_analyze_jobs():
    try:
        # Remotive API for software dev jobs
        url = "https://remotive.com/api/remote-jobs?category=software-dev&limit=50"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        jobs = response.json().get("jobs", [])
        
        alerts = []
        
        # Analysis Configuration
        skills_list = ["React", "Python", "GenAI", "AWS", "Docker", "Node.js", "AI", "Kubernetes"]
        skill_counts = {s: 0 for s in skills_list}
        company_hiring = {}
        company_urls = {}
        
        for job in jobs:
            desc = job.get("description", "").lower()
            company = job.get("company_name")
            
            # Count Skills
            for skill in skills_list:
                if skill.lower() in desc:
                    skill_counts[skill] += 1
            
            # Track Hiring
            if company:
                company_hiring[company] = company_hiring.get(company, 0) + 1
                if company not in company_urls:
                    company_urls[company] = job.get("url")

        # Generate Alerts
        
        # A. Emerging Skills (> 2 mentions in sample)
        for skill, count in skill_counts.items():
            if count > 2:
                alerts.append({
                    "type": "Emerging Skill",
                    "message": f"🚀 {skill} appears in {count} recent job listings",
                    "count": count, 
                    "url": f"https://remotive.com/remote-jobs/software-dev?search={skill}"
                })
        
        # B. Hiring Surge (> 1 role in sample)
        # Sort by count desc
        sorted_companies = sorted(company_hiring.items(), key=lambda x: x[1], reverse=True)[:5]
        for company, count in sorted_companies:
            if count > 1:
                alerts.append({
                    "type": "Hiring Surge",
                    "message": f"📢 {company} is hiring ({count} open roles)",
                    "count": count,
                    "url": company_urls.get(company)
                })
        
        # C. General Trend
        alerts.append({
            "type": "Hiring Trend",
            "message": f"📈 Analyzed {len(jobs)} recent remote software jobs for trends",
            "count": len(jobs)
        })
        
        return alerts

    except Exception as e:
        print(f"Error fetching/analyzing jobs: {e}")
        return []

@app.route("/api/shocks", methods=["GET"])
def get_shocks():
    try:
        print("Gathering Career Shock Alerts...")
        # Run in parallel ideally, but sequential is fine for MVP
        layoff_alerts = fetch_layoff_news()
        job_alerts = fetch_and_analyze_jobs()
        
        all_alerts = layoff_alerts + job_alerts
        return jsonify(all_alerts)
    except Exception as e:
        print(f"Error generating shocks: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
