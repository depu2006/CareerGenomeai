import axios from 'axios';

// --- AUTHENTIC LIVE DATA SOURCES ---
const JOBICY_API = "https://jobicy.com/api/v2/remote-jobs";
const DEV_TO_API = "https://dev.to/api/articles";

// --- CURATED OPPORTUNITIES (Legacy / Premium Listings) ---
const CURATED_OPPORTUNITIES = [
    {
        id: 'job-meta-1',
        title: 'Frontend Engineer (React)',
        company: 'Meta',
        location: 'Remote / London',
        type: 'Full-time',
        posted: 'Feb 14, 2026',
        tags: ['React', 'JavaScript', 'Tailwind', 'Frontend'],
        category: 'jobs',
        applyLink: 'https://www.metacareers.com/jobs/',
        description: 'Build immersive social experiences using React and modern JavaScript. Optimize frontend performance at scale.',
        salary: '£95k - £160k'
    },
    {
        id: 'job-openai-1',
        title: 'AI Software Engineer',
        company: 'OpenAI',
        location: 'San Francisco / Remote',
        type: 'Full-time',
        posted: 'Feb 13, 2026',
        tags: ['Python', 'AI', 'Node.js', 'LLM'],
        category: 'jobs',
        applyLink: 'https://openai.com/careers',
        description: 'Integrate state-of-the-art AI models into production systems. Scale our developer platform and API.',
        salary: '$180k - $300k'
    },
    {
        id: 'job-vercel-1',
        title: 'Fullstack Engineer',
        company: 'Vercel',
        location: 'Remote',
        type: 'Full-time',
        posted: 'Feb 14, 2026',
        tags: ['Next.js', 'React', 'Node.js', 'TypeScript'],
        category: 'jobs',
        applyLink: 'https://vercel.com/careers',
        description: 'Shape the future of the web. Work on Next.js core and our global edge network.',
        salary: '$140k - $220k'
    },
    {
        id: 'job-sf-1',
        title: 'Software Engineering LMTS Fullstack',
        company: 'Salesforce',
        location: 'Hyderabad / Bangalore',
        type: 'Full-time',
        posted: 'Feb 11, 2026',
        tags: ['Java', 'Python', 'Fullstack', 'Cloud'],
        category: 'jobs',
        applyLink: 'https://careers.salesforce.com/en/jobs/',
        description: 'Work on revolutionary analytic capabilities and next-gen analytics platform on Data Cloud.',
        salary: '₹28L - ₹48L'
    },
    {
        id: 'job-goog-1',
        title: 'Product Manager, AI',
        company: 'Google',
        location: 'Bangalore',
        type: 'Full-time',
        posted: 'Feb 10, 2026',
        tags: ['AI', 'Product', 'Strategy'],
        category: 'jobs',
        applyLink: 'https://careers.google.com/jobs/results/',
        description: 'Shape the future of AI products at Google. Drive strategy and execution.',
        salary: '₹40L - ₹70L'
    },
    {
        id: 'hack-mit-1',
        title: 'MIT Hackathon 2026',
        company: 'MIT',
        location: 'Hybrid / Boston',
        type: 'Hackathon',
        posted: 'Feb 2026',
        tags: ['Innovation', 'Hardware', 'AI'],
        category: 'hackathons',
        applyLink: 'https://hackmit.org/',
        description: 'Premier student hackathon hosted at MIT.',
        deadline: 'Mar 15, 2026'
    },
    {
        id: 'hack-eth-1',
        title: 'ETHGlobal Scaling',
        company: 'ETHGlobal',
        location: 'Online',
        type: 'Hackathon',
        posted: 'Feb 2026',
        tags: ['Blockchain', 'Web3', 'Ethereum'],
        category: 'hackathons',
        applyLink: 'https://ethglobal.com/',
        description: 'Build the future of Web3 scaling solutions.',
        deadline: 'Apr 2026'
    },
    {
        id: 'intern-mse-1',
        title: 'Data Science Intern',
        company: 'Microsoft',
        location: 'Bangalore',
        type: 'Internship',
        posted: 'Feb 12, 2026',
        tags: ['Python', 'ML', 'Azure'],
        category: 'internships',
        applyLink: 'https://careers.microsoft.com/students',
        description: 'Work with the Azure Data team on large scale ML problems.',
        salary: 'Stipend'
    }
];

export const fetchOpportunities = async (category = 'all', domain = 'Software Engineer') => {
    let jobs = [];
    let interns = [];
    let hacks = [];

    // --- 1. FETCH JOBS & INTERNSHIPS (Jobicy) ---
    if (category === 'jobs' || category === 'internships' || category === 'all') {
        try {
            // Map domain
            let tag = 'dev';
            if (domain && domain.toLowerCase().includes('data')) tag = 'data-science';
            if (domain && domain.toLowerCase().includes('product')) tag = 'product';

            // Fetch for Jobs
            if (category !== 'internships') {
                const res = await axios.get(`https://jobicy.com/api/v2/remote-jobs?count=15&tag=${tag}`);
                if (res.data?.jobs) {
                    jobs = res.data.jobs.map(job => ({
                        id: `jobicy-${job.id}`,
                        title: job.jobTitle,
                        company: job.companyName,
                        location: job.jobGeo || 'Remote',
                        type: job.jobType || 'Full-time',
                        posted: job.pubDate.split(' ')[0],
                        tags: [tag, 'Remote'],
                        category: 'jobs',
                        applyLink: job.url,
                        description: (job.jobDescription || '').replace(/<[^>]*>/g, '').slice(0, 150) + '...',
                        salary: job.annualSalaryMin ? `${job.annualSalaryMin}-${job.annualSalaryMax} ${job.salaryCurrency}` : 'Competitive'
                    }));
                }
            }

            // Fetch Specifically for Internships
            if (category === 'internships' || category === 'all') {
                const resIntern = await axios.get(`https://jobicy.com/api/v2/remote-jobs?count=15&tag=internship`);
                if (resIntern.data?.jobs) {
                    interns = resIntern.data.jobs.map(job => ({
                        id: `jobicy-intern-${job.id}`,
                        title: job.jobTitle,
                        company: job.companyName,
                        location: job.jobGeo || 'Remote',
                        type: 'Internship',
                        posted: job.pubDate.split(' ')[0],
                        tags: ['Internship', 'Remote'],
                        category: 'internships',
                        applyLink: job.url,
                        description: (job.jobDescription || '').replace(/<[^>]*>/g, '').slice(0, 150) + '...',
                        salary: 'Competitive Stipend'
                    }));
                }
            }
        } catch (e) {
            console.warn("Job/Intern API Fetch Error:", e);
        }
    }

    // --- 2. FETCH HACKATHONS (Dev.to) ---
    if (category === 'hackathons' || category === 'all') {
        try {
            const resHacks = await axios.get(`${DEV_TO_API}?tag=hackathon&per_page=10`);
            if (resHacks.data) {
                hacks = resHacks.data.map(article => ({
                    id: `devto-${article.id}`,
                    title: article.title,
                    company: article.user.name + ' (via Dev.to)',
                    location: 'Online',
                    type: 'Hackathon',
                    posted: article.published_at.split('T')[0],
                    tags: article.tag_list,
                    category: 'hackathons',
                    applyLink: article.url,
                    description: article.description,
                    deadline: 'Check Details'
                }));
            }
        } catch (e) {
            console.warn("Hackathon API Fetch Error:", e);
        }
    }

    // Combine: Curated First (High Quality), then Live API
    const liveOpportunities = [
        ...CURATED_OPPORTUNITIES,
        ...jobs,
        ...interns,
        ...hacks
    ];

    // Filter by category
    if (category !== 'all') {
        return liveOpportunities.filter(op => op.category === category);
    }

    return liveOpportunities;
};
