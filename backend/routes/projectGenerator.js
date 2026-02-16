const express = require("express");
const router = express.Router();

// Curated Database of Project Templates
const PROJECT_TEMPLATES = [
    {
        tags: ["frontend", "react", "web"],
        title: "E-Commerce Dashboard with React",
        problemStatement: "Small businesses struggle to track inventory and sales in real-time.",
        techStack: "React, Chart.js, Tailwind CSS, Firebase",
        difficulty: "Intermediate",
        expectedOutcome: "A responsive dashboard showing sales trends, inventory levels, and recent orders.",
        instructions: [
            "Set up a new React project using Vite: `npm create vite@latest`.",
            "Install dependencies: `npm install chart.js react-chartjs-2 tailwindcss firebase`.",
            "Configure Firebase for real-time database and authentication.",
            "Create a mock data seeder script to populate inventory and sales data.",
            "Build the Sidebar and Layout components using Tailwind CSS.",
            "Implement the Chart.js components to visualize sales trends.",
            "Create the Inventory Table with add/edit/delete functionality.",
            "Deploy the application to Vercel or Netlify."
        ]
    },
    {
        tags: ["backend", "node", "api"],
        title: "RESTful API for Task Management",
        problemStatement: "Developers need a reliable backend for task apps with authentication.",
        techStack: "Node.js, Express, MongoDB, JWT",
        difficulty: "Beginner",
        expectedOutcome: "A secured API supporting CRUD operations for tasks and user auth.",
        instructions: [
            "Initialize a Node.js project: `npm init -y`.",
            "Install packages: `npm install express mongoose dotenv jsonwebtoken bcryptjs cors`.",
            "Set up MongoDB Atlas and connect it using Mongoose.",
            "Create User model and implement Register/Login routes with JWT.",
            "Create middleware to verify JWT tokens for protected routes.",
            "Create Task model (title, description, status) and CRUD routes.",
            "Test API endpoints using Postman or Insomnia.",
            "Add error handling and input validation."
        ]
    },
    {
        tags: ["fullstack", "mern", "web"],
        title: "Real-time Chat Application",
        problemStatement: "Remote teams need simple, instant communication tools.",
        techStack: "MongoDB, Express, React, Node.js, Socket.io",
        difficulty: "Advanced",
        expectedOutcome: "A chat app with live messaging, room creation, and user status.",
        instructions: [
            "Set up the backend with Express and Socket.io.",
            "Create the frontend using React and set up Socket.io client.",
            "Implement user connection and disconnection events.",
            "Create database schemas for Users and Messages.",
            "Build the UI for chat rooms and message bubbles.",
            "Implement 'typing...' indicators and read receipts.",
            "Deploy backend to Heroku/Render and frontend to Vercel.",
            "Test real-time functionality with multiple browser tabs."
        ]
    },
    {
        tags: ["ai", "python", "ml"],
        title: "Sentiment Analysis Tool",
        problemStatement: "Companies need to understand customer feedback from social media.",
        techStack: "Python, Flask, NLTK/TextBlob, React (Frontend)",
        difficulty: "Intermediate",
        expectedOutcome: "A web app that takes text input and visualizes sentiment (positive/negative).",
        instructions: [
            "Set up a Python virtual environment and install Flask.",
            "Install NLTK or TextBlob: `pip install textblob`.",
            "Create a Flask route that accepts text and returns sentiment score.",
            "Build a simple React frontend with a text area and submit button.",
            "Connect the frontend to the Flask API using Axios.",
            "Visualize the sentiment score using a gauge or color-coded bar.",
            "Enhance the model to handle batch processing of CSV files.",
            "Deploy the Flask app to Render or PythonAnywhere."
        ]
    },
    {
        tags: ["mobile", "flutter", "app"],
        title: "Fitness Tracker App",
        problemStatement: "Users want to track their daily workouts and diet simply.",
        techStack: "Flutter, Firebase, Provider",
        difficulty: "Intermediate",
        expectedOutcome: "A mobile app to log exercises, calculate calories, and show progress charts.",
        instructions: [
            "Install Flutter SDK and set up an emulator.",
            "Create a new Flutter project: `flutter create fitness_tracker`.",
            "Design the UI for the Dashboard, Activity Log, and Profile.",
            "Integrate Firebase Auth for user login.",
            "Use Firebase Firestore to store workout data.",
            "Implement state management using Provider.",
            "Add charts to visualize weekly progress.",
            "Test on both Android and iOS simulators."
        ]
    },
    {
        tags: ["data", "science", "python"],
        title: "House Price Prediction Model",
        problemStatement: "Real estate agents need accurate price estimates based on features.",
        techStack: "Python, Scikit-learn, Pandas, Jupyter",
        difficulty: "Beginner",
        expectedOutcome: "A trained model and a script to predict house prices from input data.",
        instructions: [
            "Download a housing dataset (e.g., from Kaggle).",
            "Load and clean the data using Pandas in a Jupyter Notebook.",
            "Perform Exploratory Data Analysis (EDA) to find correlations.",
            "Split data into training and testing sets.",
            "Train a Linear Regression model using Scikit-Learn.",
            "Evaluate the model using RMSE and R-squared metrics.",
            "Export the trained model using Joblib/Pickle.",
            "Create a CLI script to accept inputs and predict price."
        ]
    },
    {
        tags: ["devops", "cloud", "docker"],
        title: "CI/CD Pipeline for Web App",
        problemStatement: "Manual deployment is error-prone and slow.",
        techStack: "GitHub Actions, Docker, AWS/Vercel",
        difficulty: "Advanced",
        expectedOutcome: "An automated pipeline that builds and deploys code on every push.",
        instructions: [
            "Create a simple 'Hello World' Node.js app.",
            "Write a Dockerfile to containerize the application.",
            "Create a GitHub repository and push the code.",
            "Set up GitHub Actions workflow (`.github/workflows/main.yml`).",
            "Configure the workflow to run tests on every pull request.",
            "Add a step to build and push the Docker image to Docker Hub.",
            "Configure a step to deploy to a cloud provider (e.g., AWS EC2, Render).",
            "Test the pipeline by pushing a change to the repository."
        ]
    },
    {
        tags: ["blockchain", "solidity", "web3"],
        title: "Decentralized Voting System",
        problemStatement: "Traditional voting lacks transparency and trust.",
        techStack: "Solidity, Ethereum, React, Web3.js",
        difficulty: "Advanced",
        expectedOutcome: "A DApp allowing users to vote securely on the blockchain.",
        instructions: [
            "Install MetaMask wallet and set up a test network (Goerli/Sepolia).",
            "Write the Voting smart contract in Solidity (Remix IDE).",
            "Deploy the contract to the test network.",
            "Set up a React project and install `web3` or `ethers`.",
            "Connect the frontend to the user's wallet.",
            "Create UI to display candidates and vote buttons.",
            "Handle strict rules (one vote per address) in the smart contract.",
            "Verify the transaction on Etherscan."
        ]
    },
    {
        tags: ["frontend", "angular", "web"],
        title: "Personal Portfolio Website",
        problemStatement: "Developers need a professional way to showcase their work.",
        techStack: "Angular, TypeScript, SCSS",
        difficulty: "Beginner",
        expectedOutcome: "A personal portfolio site with project gallery and contact form.",
        instructions: [
            "Install Angular CLI: `npm install -g @angular/cli`.",
            "Create a new project: `ng new my-portfolio`.",
            "Generate components: Header, Hero, Projects, Contact.",
            "Style the components using SCSS and generic CSS grid/flexbox.",
            "Create a JSON file to store project data and load it dynamically.",
            "Implement a contact form (you can use Formspree for backend).",
            "Add animations using Angular Animations library.",
            "Build and deploy to GitHub Pages."
        ]
    },
    {
        tags: ["backend", "java", "spring"],
        title: "Library Management System",
        problemStatement: "Libraries need digital tracking for books and members.",
        techStack: "Java, Spring Boot, MySQL, Hibernate",
        difficulty: "Intermediate",
        expectedOutcome: "A backend system to manage book issues, returns, and inventory.",
        instructions: [
            "Initialize a Spring Boot project using Spring Initializr.",
            "Add dependencies: Spring Web, Spring Data JPA, MySQL Driver.",
            "Configure `application.properties` for MySQL connection.",
            "Create Entities: Book, Member, Transaction.",
            "Create Repositories and Services for business logic.",
            "Implement Controllers for API endpoints (Issue book, Return book).",
            "Test APIs using Postman.",
            "Add unit tests using JUnit."
        ]
    },
    // --- New Projects ---
    {
        tags: ["cybersecurity", "security", "python", "network"],
        title: "Network Packet Sniffer",
        problemStatement: "Security professionals need tools to analyze network traffic for anomalies.",
        techStack: "Python, Scapy, Wireshark",
        difficulty: "Intermediate",
        expectedOutcome: "A script that captures and analyzes network packets to detect suspicious activity.",
        instructions: [
            "Install Scapy: `pip install scapy`.",
            "Write a Python script to capture packets using `sniff()`.",
            "Parse packet headers (IP, TCP/UDP) to extract source/destination.",
            "Implement filters to capture specific traffic (e.g., HTTP only).",
            "Save captured packets to a .pcap file for analysis in Wireshark.",
            "Add logic to detect potential port scanning attempts.",
            "Create a simple CLI to start/stop sniffing and view stats."
        ]
    },
    {
        tags: ["data", "engineering", "etl", "sql"],
        title: "Automated ETL Pipeline",
        problemStatement: "Businesses struggle to consolidate data from multiple sources for analysis.",
        techStack: "Python, Pandas, Apache Airflow, PostgreSQL",
        difficulty: "Advanced",
        expectedOutcome: "An automated pipeline that extracts, transforms, and loads data daily.",
        instructions: [
            "Set up a local PostgreSQL database using Docker.",
            "Install Apache Airflow and initialize the database.",
            "Write a Python script to extract data from a public API (e.g., CoinGecko).",
            "Use Pandas to clean and transform the data (handle missing values).",
            "Create an Airflow DAG to schedule the ETL job daily.",
            "Load the transformed data into the PostgreSQL table.",
            "Add error handling and email alerts for failed jobs.",
            "Visualize the data using a simple SQL query or dashboard."
        ]
    },
    {
        tags: ["game", "unity", "c#", "development"],
        title: "2D Platformer Game",
        problemStatement: "Indie developers want to learn game physics and level design.",
        techStack: "Unity, C#, Aseprite (Art)",
        difficulty: "Intermediate",
        expectedOutcome: "A playable 3-level game with character movement, enemies, and scoring.",
        instructions: [
            "Install Unity Hub and create a 2D project.",
            "Import 2D assets (sprites) for the player and environment.",
            "Write C# scripts for player movement (jump, run) and physics.",
            "Create a Tilemap for the level design.",
            "Implement enemy AI (patrolling, chasing).",
            "Add collectibles (coins) and a scoring system.",
            "Create a Main Menu and Game Over screen.",
            "Build and export the game for WebGL (itch.io)."
        ]
    },
    {
        tags: ["cloud", "aws", "serverless", "backend"],
        title: "Serverless Image Resizer",
        problemStatement: "Applications need to optimize images for different screen sizes automatically.",
        techStack: "AWS Lambda, S3, Python/Node.js",
        difficulty: "Intermediate",
        expectedOutcome: "An S3 bucket trigger that automatically resizes uploaded images.",
        instructions: [
            "Create two S3 buckets: `source-images` and `resized-images`.",
            "Create an AWS Lambda function with Python (Boto3) or Node.js.",
            "Configure an S3 event trigger to invoke Lambda on upload.",
            "Implement image resizing logic using `Pillow` (Python) or `Sharp` (Node).",
            "Save the resized image to the destination bucket.",
            "Set up IAM roles to allow Lambda access to S3.",
            "Test by uploading an image and checking the resized bucket.",
            "Add support for multiple formats (JPEG, PNG, WebP)."
        ]
    },
    {
        tags: ["frontend", "vue", "web"],
        title: "Recipe Finder App",
        problemStatement: "Home cooks need ideas for meals based on ingredients they have.",
        techStack: "Vue.js, Vuex, Spoonacular API",
        difficulty: "Beginner",
        expectedOutcome: "A web app to search recipes by ingredients and save favorites.",
        instructions: [
            "Create a Vue 3 project: `npm init vue@latest`.",
            "Sign up for the Spoonacular API key.",
            "Build the search component to accept ingredients.",
            "Fetch recipes using Axios/Fetch API.",
            "Display recipe cards with images and details.",
            "Implement a 'Favorites' feature using local storage or Vuex.",
            "Add routing for detailed recipe views.",
            "Style the app using CSS Grid/Flexbox."
        ]
    },
    {
        tags: ["mobile", "ios", "swift"],
        title: "Expense Tracker iOS App",
        problemStatement: "Users want a native iOS experience to track spending on the go.",
        techStack: "Swift, SwiftUI, CoreData",
        difficulty: "Intermediate",
        expectedOutcome: "A native iOS app to add expenses, categorize them, and view monthly totals.",
        instructions: [
            "Install Xcode and create a new iOS App project.",
            "Design the UI for the SwiftUI (List, Form, NavigationStack).",
            "Create a CoreData model for Expense items.",
            "Implement Add/Edit/Delete functionality.",
            "Group expenses by date or category.",
            "Add a chart view using Swift Charts.",
            "Test on the iOS Simulator.",
            "Implement Dark Mode support."
        ]
    },
    {
        tags: ["scrum", "agile", "management"],
        title: "Agile Project Board",
        problemStatement: "Teams need a simple Kanban board to manage tasks.",
        techStack: "React, Drag-and-Drop (dnd-kit), Node.js",
        difficulty: "Intermediate",
        expectedOutcome: "A Trello-like board with draggable columns and tasks.",
        instructions: [
            "Set up a React project with a UI library (Chakra/MUI).",
            "Install `@dnd-kit/core` for drag-and-drop functionality.",
            "Create components for Columns (ToDo, In Progress, Done) and Cards.",
            "Implement drag handlers to move cards between columns.",
            "Persist the state to local storage or a backend.",
            "Allow users to add new cards and edit text.",
            "Add labels/tags for task priority.",
            "Deploy to Vercel."
        ]
    },
    {
        tags: ["blockchain", "nft", "web3"],
        title: "NFT Marketplace",
        problemStatement: "Artists need a platform to mint and sell digital art.",
        techStack: "Solidity, Next.js, IPFS, Hardhat",
        difficulty: "Advanced",
        expectedOutcome: "A platform to mint NFTs and list them for sale.",
        instructions: [
            "Write an ERC-721 Smart Contract in Solidity.",
            "Use Pinata/IPFS to store NFT metadata and images.",
            "Deploy the contract to a testnet using Hardhat.",
            "Build a Next.js frontend to interact with the contract.",
            "Implement wallet connection (RainbowKit/Wagmi).",
            "Create a 'Mint' page for users to upload art.",
            "Create a 'Gallery' page to view minted NFTs.",
            "Implement a 'Buy' function to transfer ownership."
        ]
    },
    {
        tags: ["qa", "testing", "automation"],
        title: "Automated Testing Framework",
        problemStatement: "Manual testing of web apps is time-consuming.",
        techStack: "Selenium/Playwright, Python/Java, PyTest",
        difficulty: "Intermediate",
        expectedOutcome: "A suite of automated tests for a demo e-commerce site.",
        instructions: [
            "Choose a target demo website (e.g., SauceDemo).",
            "Set up a Python project with Selenium or Playwright.",
            "Implement the Page Object Model (POM) design pattern.",
            "Write test cases for Login, Add directly to Cart, and Checkout.",
            "Use PyTest to run the tests and generate reports.",
            "Implement screenshots on failure.",
            "Run the tests in a headless browser mode.",
            "Integrate with a CI tool (GitHub Actions) to run on push."
        ]
    },
    {
        tags: ["system", "design", "backend"],
        title: "URL Shortener Service",
        problemStatement: "Understanding high-scale system design concepts.",
        techStack: "Go/Node.js, Redis, PostgreSQL",
        difficulty: "Advanced",
        expectedOutcome: "A scalable service to shorten URLs and track clicks.",
        instructions: [
            "Design the database schema (short code, original URL, clicks).",
            "Implement a hashing algorithm (Base62) to generate short codes.",
            "Build the API to create short URLs.",
            "Implement the redirect endpoint (GET /:code).",
            "Use Redis to cache frequent lookups for speed.",
            "Track analytics (click count, referrer, timestamp).",
            "Rate limit the API to prevent abuse.",
            "Dockerize the application."
        ]
    }
];

router.post("/generate", async (req, res) => {
    try {
        const { role, currentSkills, missingSkills } = req.body;

        // Enhanced Normalization
        let normalizedRole = role ? role.toLowerCase() : "";
        const combinedSkills = (currentSkills + " " + missingSkills).toLowerCase();

        // Role Synonyms Mapping
        const roleMappings = {
            "web": "frontend backend fullstack",
            "software engineer": "backend fullstack algorithm",
            "devops": "cloud infrastructure docker kubernetes ci/cd",
            "sre": "devops cloud reliability",
            "data scientist": "data python machine learning ai",
            "data engineer": "data etl sql pipeline",
            "cyber": "security network",
            "security": "cyber penetration",
            "game": "unity unreal c# c++",
            "mobile": "ios android flutter react native",
            "ios": "swift mobile",
            "android": "kotlin java mobile",
            "qa": "testing automation quality",
            "test": "qa automation",
            "ui": "frontend design",
            "ux": "frontend design"
        };

        // Expand role with synonyms
        for (const [key, value] of Object.entries(roleMappings)) {
            if (normalizedRole.includes(key)) {
                normalizedRole += " " + value;
            }
        }

        // Scoring System
        const scoredProjects = PROJECT_TEMPLATES.map(project => {
            let score = 0;

            // 1. Role Match (Weighted) - check if tags match expanded role
            const projectTags = project.tags.join(" ").toLowerCase();
            const roleKeywords = normalizedRole.split(" ");

            roleKeywords.forEach(word => {
                if (word.length > 2 && projectTags.includes(word)) {
                    score += 10; // High reward for role relevance
                }
            });

            // 2. Skill Match (Weighted)
            const combinedTech = project.techStack.toLowerCase();
            const skillKeywords = combinedSkills.split(/[,\s]+/).filter(s => s.length > 1);

            skillKeywords.forEach(skill => {
                if (combinedTech.includes(skill)) score += 5; // Reward for skill match
                if (projectTags.includes(skill)) score += 5;
            });

            // 3. Difficulty Bonus (Optional: prefer intermediate for most)
            if (project.difficulty === "Intermediate") score += 2;

            // 4. Randomized tie-breaker (small, just to shuffle equals)
            score += Math.random() * 2;

            return { ...project, score };
        });

        // Sort by score descending
        scoredProjects.sort((a, b) => b.score - a.score);

        // Filter out zero-score projects if possible to keep relevance high
        // but ensure we return at least something.
        let topProjects = scoredProjects.filter(p => p.score > 5);

        if (topProjects.length < 3) {
            // If strict filtering yields too few, take top 5 regardless of low score
            topProjects = scoredProjects.slice(0, 5);
        } else {
            topProjects = topProjects.slice(0, 5);
        }

        // Return formatted projects
        const responseProjects = topProjects.map(({ score, tags, ...p }) => p);

        res.json({ projects: responseProjects });

    } catch (error) {
        console.error("Local Generator Error:", error);
        res.status(500).json({ error: "Project generation failed" });
    }
});

module.exports = router;
