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

import threading

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # verify connection early
    client.admin.command('ping')
    print("MongoDB Connected!")
except Exception as e:
    print(f"MongoDB Connection Error: {e}")
    print("Falling back to In-Memory Database (mongomock). Data will NOT persist after restart.")
    import mongomock
    client = mongomock.MongoClient()

db = client[DB_NAME]
users_collection = db["users"]
skill_gaps_collection = db["skill_gaps"]
interviews_collection = db["interviews"]
questions_collection = db["role_questions"]
smart_questions_collection = db["smart_questions"] # New: for open-ended interview questions

# -----------------------------
# AUTH & USER ROUTES
# -----------------------------

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if users_collection is None:
        return jsonify({"msg": "Database unavailable"}), 503

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
    if users_collection is None:
        return jsonify({"msg": "Database unavailable"}), 503

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

# Track roles currently being seeded to avoid duplicate threads
SEEDING_LOG = {}

def normalize_role(role_raw):
    """Normalize raw role strings to consistent bank keys."""
    r = role_raw.lower()
    if "front" in r: return "frontend"
    if "back" in r: return "backend"
    if "data" in r: return "data science"
    if "ai" in r or "ml" in r: return "ai/ml"
    if "python" in r: return "python"
    if "devops" in r: return "devops"
    return r.strip()

def generate_questions_background(role_key):
    """Background worker to fill the database with unique AI questions for a role using BATCH generation."""
    try:
        if SEEDING_LOG.get(role_key): 
            return
        SEEDING_LOG[role_key] = True
        print(f"--- Turbo Batch Seeding Started for: {role_key} ---")
        
        target_count = 100
        current_count = questions_collection.count_documents({"role": role_key})
        
        role_context = {
            "frontend": "React, JavaScript ES6+, CSS Grid/Flexbox, Redux, Browser APIs, Web Performance",
            "backend": "Node.js, Express, Python/Django, SQL/NoSQL, REST APIs, Microservices, System Design",
            "data science": "Pandas, NumPy, Scikit-learn, Statistics, Data Visualization, SQL, Feature Engineering",
            "ai/ml": "Deep Learning, Transformers, PyTorch/TensorFlow, LLMs, NLP, Computer Vision, Neural Networks"
        }
        context_str = role_context.get(role_key, "core technical concepts and industry practices")

        while current_count < target_count:
            try:
                # Request 5 questions at once for speed
                prompt = f"""
                Generate exactly 5 unique, high-quality multiple-choice technical interview questions for a professional '{role_key}' role.
                Focus area: {context_str}.
                
                The output must be strictly a JSON list of 5 objects:
                [
                  {{
                    "question": "Question text",
                    "answer": "Correct answer",
                    "options": ["A", "B", "C", "D"]
                  }},
                  ...
                ]
                No preamble, no JSON tags. Just the raw JSON list.
                """
                
                payload = {
                    "model": "phi",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.8, "num_predict": 1200}
                }
                
                resp = requests.post("http://localhost:11434/api/generate", json=payload, timeout=40)
                if resp.status_code == 200:
                    import json
                    ai_text = resp.json().get("response", "")
                    start = ai_text.find("[")
                    end = ai_text.rfind("]") + 1
                    if start != -1 and end != -1:
                        q_list = json.loads(ai_text[start:end])
                        if isinstance(q_list, list):
                            for q_obj in q_list:
                                if all(k in q_obj for k in ["question", "answer", "options"]):
                                    if not questions_collection.find_one({"role": role_key, "question": q_obj["question"]}):
                                        q_obj["role"] = role_key
                                        q_obj["date"] = datetime.datetime.utcnow()
                                        questions_collection.insert_one(q_obj)
                                        current_count += 1
                            print(f"--- Role '{role_key}' Progress: {current_count}/{target_count} ---")
            except Exception as e:
                print(f"Seeding error for {role_key}: {e}")
                break 
                
        print(f"--- Turbo Batch Seeding Finished for: {role_key} (Total: {current_count}) ---")
        SEEDING_LOG[role_key] = False
    except Exception as e:
        print(f"Critical seeder failure: {e}")
        SEEDING_LOG[role_key] = False

# -----------------------------
# SKILL INTEGRITY CHECK (Quiz)
# -----------------------------
# -----------------------------
# ROLE-BASED MCQ BANK (Curated for Speed & Accuracy)
# -----------------------------
ROLE_MCQ_BANK = {
    "frontend": [
        {"question": "What is the primary benefit of the Virtual DOM in React?", "options": ["It directly updates the browser DOM for speed", "It minimizes expensive browser DOM manipulations by diffing a copy", "It replaces the need for CSS", "It handles server-side databases"], "answer": "It minimizes expensive browser DOM manipulations by diffing a copy"},
        {"question": "In CSS, what is the 'Box Model' composed of?", "options": ["Margin, Border, Padding, Content", "Header, Footer, Main, Aside", "Color, Font, Size, Weight", "Select, Input, Button, Label"], "answer": "Margin, Border, Padding, Content"},
        {"question": "Which hook is used to handle side effects in functional React components?", "options": ["useState", "useContext", "useEffect", "useReducer"], "answer": "useEffect"},
        {"question": "What does the 'asynchronous' nature of JavaScript mean?", "options": ["Code executes line by line and waits for completion", "Multiple blocks of code can run at the exact same time on one thread", "The engine can start long-running tasks and continue executing other code while waiting", "It only works on multi-core processors"], "answer": "The engine can start long-running tasks and continue executing other code while waiting"},
        {"question": "What is 'Closure' in JavaScript?", "options": ["A function combined with its lexical environment", "A way to close the browser window", "A private class method", "The end of a loop"], "answer": "A function combined with its lexical environment"},
        {"question": "Which React prop is used to pass data to child components?", "options": ["state", "props", "ref", "context"], "answer": "props"},
        {"question": "What does 'z-index' control in CSS?", "options": ["Horizontal position", "Vertical position", "Stack order of overlapping elements", "Opacity level"], "answer": "Stack order of overlapping elements"},
        {"question": "What is the purpose of 'key' prop in React lists?", "options": ["To style the elements", "To uniquely identify items for efficient domestic re-rendering", "To sort the list automatically", "To encrypt the data"], "answer": "To uniquely identify items for efficient domestic re-rendering"}
    ],
    "backend": [
        {"question": "What is the primary purpose of a 'Middleware' in Express.js?", "options": ["To store large binary files", "To act as a database", "To execute functions between the request and response cycle", "To create CSS layouts"], "answer": "To execute functions between the request and response cycle"},
        {"question": "Which HTTP status code represents a 'Not Found' error?", "options": ["200", "400", "404", "500"], "answer": "404"},
        {"question": "What is the difference between SQL and NoSQL databases?", "options": ["SQL is faster, NoSQL is more secure", "SQL uses tables/schemas, NoSQL is often document/key-value based", "SQL is for web, NoSQL is for mobile", "There is no difference"], "answer": "SQL uses tables/schemas, NoSQL is often document/key-value based"},
        {"question": "What is 'REST' in the context of APIs?", "options": ["A data encryption standard", "An architectural style for network-based applications", "A programming language for servers", "A database management system"], "answer": "An architectural style for network-based applications"},
        {"question": "What does 'JWT' stand for in authentication?", "options": ["Java Web Token", "JSON Web Token", "Joint Web Team", "Just With Text"], "answer": "JSON Web Token"},
        {"question": "In Node.js, what is the 'Event Loop'?", "options": ["A loop that handles UI clicks", "A mechanism that allows Node.js to perform non-blocking I/O operations", "A way to iterate over database results", "A security feature for preventing loops"], "answer": "A mechanism that allows Node.js to perform non-blocking I/O operations"}
    ],
    "data science": [
        {"question": "In Python, which library is primarily used for data manipulation and analysis using DataFrames?", "options": ["NumPy", "Pandas", "Matplotlib", "Scikit-learn"], "answer": "Pandas"},
        {"question": "What is 'Overfitting' in Machine Learning?", "options": ["When a model performs well on training data but poorly on unseen data", "When a model is too simple to capture patterns", "When the training data is too small", "When the model takes too long to train"], "answer": "When a model performs well on training data but poorly on unseen data"},
        {"question": "What does 'Correlation' measure between two variables?", "options": ["The cause and effect relationship", "The linear relationship strength and direction", "The average value of both", "The total sum of variables"], "answer": "The linear relationship strength and direction"},
        {"question": "Which visualization is best for showing the distribution of a single numerical variable?", "options": ["Scatter plot", "Histogram", "Line chart", "Heatmap"], "answer": "Histogram"}
    ],
    "ai/ml": [
        {"question": "What does 'Transformer' architecture primarily depend on in NLP?", "options": ["Recurrent connections", "Convolutional layers", "Attention mechanisms", "Random forests"], "answer": "Attention mechanisms"},
        {"question": "Which activation function is most commonly used in hidden layers of Deep Neural Networks?", "options": ["Sigmoid", "Tanh", "ReLU", "Linear"], "answer": "ReLU"},
        {"question": "What is the purpose of 'Backpropagation'?", "options": ["To generate synthetic data", "To calculate gradients and update weights in a neural network", "To visualize the model architecture", "To stop the training early"], "answer": "To calculate gradients and update weights in a neural network"}
    ]
}

@app.route('/ask', methods=['POST'])
def ask_api():
    try:
        data_in = request.json or {}
        
        # 1. Save results if provided
        if "email" in data_in and "summary" in data_in:
             db["assessment_results"].insert_one({
                 "email": data_in["email"],
                 "summary": data_in["summary"],
                 "date": datetime.datetime.utcnow()
             })
             return jsonify({"msg": "Saved"})

        # 2. Identify & Normalize Role
        role_input = data_in.get("role", "").strip()
        role_key = normalize_role(role_input)
        exclude_list = data_in.get("exclude", []) # List of question texts already seen
        amount = data_in.get("amount", 1) # Support batching for "Mock Experience"
        
        results = []
        
        # --- STRATEGY A: COMPREHENSIVE DB BANK ---
        if role_key:
            db_count = questions_collection.count_documents({"role": role_key})
            if db_count < 100 and not SEEDING_LOG.get(role_key):
                threading.Thread(target=generate_questions_background, args=(role_key,), daemon=True).start()

            if db_count > 0:
                pipeline = [
                    {"$match": {"role": role_key, "question": {"$nin": exclude_list}}},
                    {"$sample": {"size": amount}}
                ]
                results = list(questions_collection.aggregate(pipeline))
                if len(results) >= amount:
                    return jsonify([{"question": q["question"], "answer": q["answer"], "options": q["options"]} for q in results] if amount > 1 else {
                        "question": results[0]["question"],
                        "answer": results[0]["answer"],
                        "options": results[0]["options"]
                    })
            
            # --- Map to Static Bank Fallback ---
            if role_key in ROLE_MCQ_BANK:
                available_bank = [q for q in ROLE_MCQ_BANK[role_key] if q["question"] not in exclude_list]
                if len(available_bank) >= amount:
                    selected = random.sample(available_bank, amount)
                    return jsonify(selected if amount > 1 else selected[0])
                elif available_bank:
                    # If not enough available, take what we have
                    return jsonify(available_bank if amount > 1 else available_bank[0])
        
        # --- STRATEGY B: AI GENERATION FOR NICHE ROLES (Priority 2) ---
        if role_input:
            try:
                ollama_url = "http://localhost:11434/api/generate"
                prompt = f"""
                Generate a single multiple-choice technical interview question for a '{role_input}' role.
                Avoid these topics: {', '.join(exclude_list[-3:])}
                Strictly Technical. Use JSON format.
                """
                
                payload = {
                    "model": "phi",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.7, "num_predict": 150}
                }
                
                resp = requests.post(ollama_url, json=payload, timeout=10)
                if resp.status_code == 200:
                    import json
                    ai_data = resp.json().get("response", "")
                    start = ai_data.find("{")
                    end = ai_data.rfind("}") + 1
                    if start != -1 and end != -1:
                        return jsonify(json.loads(ai_data[start:end]))
            except Exception as e:
                print(f"AI Fallback Failed: {e}")

        # --- STRATEGY C: PUBLIC API FALLBACK (General CS) ---
        try:
            api_url = "https://opentdb.com/api.php?amount=1&category=18&type=multiple"
            response = requests.get(api_url, timeout=5)
            data = response.json()

            if data['response_code'] == 0:
                item = data['results'][0]
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
        except:
            pass
        
        # Final Final Fallback
        return jsonify({
            "question": "What is the time complexity of Binary Search?",
            "answer": "O(log n)",
            "options": ["O(n)", "O(log n)", "O(n^2)", "O(1)"]
        })
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

def generate_ollama_response(prompt, max_tokens=400):
    """Helper for AI Smart Interview to talk to local Ollama instance."""
    ollama_url = "http://localhost:11434/api/generate"
    payload = {
        "model": "llama3.2:1b",
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": max_tokens}
    }
    try:
        response = requests.post(ollama_url, json=payload, timeout=120)
        return response.json().get("response", "").strip()
    except Exception as e:
        print(f"Ollama generation error: {e}")
        return "I'm sorry, I'm having trouble connecting to my AI core right now."

def seed_smart_questions_background(role, difficulty):
    """Background thread to pre-fill open-ended technical questions."""
    try:
        count = smart_questions_collection.count_documents({"role": role, "difficulty": difficulty})
        if count >= 20: return

        print(f"Seeding smart questions for {role} ({difficulty})...")
        prompt = f"""
Generate 10 unique technical interview questions for a {role}.
Level: {difficulty}.
Focus on real-world scenarios.
Return ONLY questions, one per line. No numbers, no explanation.
End each with a question mark.
"""
        response = generate_ollama_response(prompt, 1000)
        # Clean and filter
        questions = [q.strip() for q in response.split('\n') if q.strip() and '?' in q]
        
        new_count = 0
        for q in questions:
            # Basic sanitization: remove leading numbers like "1. "
            clean_q = re.sub(r'^\d+[\.\)]\s*', '', q)
            res = smart_questions_collection.update_one(
                {"question": clean_q},
                {"$set": {"role": role, "difficulty": difficulty, "question": clean_q, "date": datetime.datetime.utcnow()}},
                upsert=True
            )
            if res.upserted_id: new_count += 1
            
        print(f"Successfully seeded {new_count} new questions for {role}.")
    except Exception as e:
        print(f"Seeding error: {e}")


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
# MCQ_BANK Removed (Consolidated)

# Routes Removed (Consolidated)

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

# --- AI SMART INTERVIEW ROUTES ---

@app.route("/start", methods=["POST"])
def smart_interview_start():
    data = request.json or {}
    role_name = data.get("role", "Frontend Developer")
    diff = data.get("difficulty", "Easy")
    
    # 1. Try to get from DB (Instant)
    try:
        sample = list(smart_questions_collection.aggregate([
            {"$match": {"role": role_name, "difficulty": diff}},
            {"$sample": {"size": 1}}
        ]))
        
        # 2. Trigger background seeder if count is low
        threading.Thread(target=seed_smart_questions_background, args=(role_name, diff)).start()

        if sample:
            return jsonify({"question": sample[0]["question"]})
    except Exception as e:
        print(f"DB Fetch Error: {e}")

    # 3. Fallback to AI (Slow but effective)
    prompt = f"Ask ONE sharp technical interview question for a {role_name} at {diff} level. Return ONLY the question text."
    question = generate_ollama_response(prompt, 150)
    return jsonify({"question": question or "Could you explain your favorite technical project?"})

@app.route("/evaluate", methods=["POST"])
def smart_interview_evaluate():
    data = request.json or {}
    question = data.get("question")
    answer = data.get("answer")

    prompt = f"""
Evaluate this technical interview answer. Be concise and critical.
Q: {question}
A: {answer}

Format:
Logic: [Correctness/Accuracy]
Grammar: [Flow]
Corrected: [Concise improvement]
Expected: [Key points missing]
"""
    evaluation = generate_ollama_response(prompt, 400) # Smaller token limit for speed
    return jsonify({"evaluation": evaluation})

@app.route("/next", methods=["GET"])
def smart_interview_next():
    role_name = request.args.get("role", "Frontend Developer")
    diff = request.args.get("difficulty", "Easy")
    
    # 1. Try to get from DB (Instant)
    try:
        sample = list(smart_questions_collection.aggregate([
            {"$match": {"role": role_name, "difficulty": diff}},
            {"$sample": {"size": 1}}
        ]))
        
        if sample:
            return jsonify({"question": sample[0]["question"]})
    except Exception as e:
        print(f"DB Fetch Error: {e}")

    # 2. Fallback to AI
    prompt = f"Ask a new technical question for a {role_name} ({diff}). Return only question."
    question = generate_ollama_response(prompt, 150)
    return jsonify({"question": question or "What is your approach to debugging complex issues?"})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
