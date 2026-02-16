import { CACHED_FAILURES } from './failureDataFallback';

const CACHE_KEY = 'career_failure_data';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 Hours

export const fetchFailureStories = async () => {
    // 1. Check Local Storage Cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
            console.log('Using Cached Failure Data');
            return data;
        }
    }

    try {
        // 2. Attempt Real-Time API Fetch (Reddit)
        // Note: Client-side calls to Reddit often hit CORS. 
        // We try it, but heavily rely on the Fallback for reliability in production/demo.

        // We use 'all' to search multiple subreddits
        const subreddits = 'cscareerquestions+jobs+resumes+experienceddevs';
        const query = 'rejected OR failed OR "didn\'t get the job" OR "interview nightmare"';

        // Using 'new' to get recent stories
        const response = await fetch(`https://www.reddit.com/r/${subreddits}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&limit=25`);

        if (!response.ok) throw new Error('Reddit API Error');

        const json = await response.json();
        const posts = json.data.children.map(child => formatRedditPost(child.data));

        const combinedData = [...posts, ...CACHED_FAILURES]; // Mix real + curated
        const uniqueData = Array.from(new Map(combinedData.map(item => [item.id, item])).values()); // Dedup

        // Update Cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: uniqueData,
            timestamp: Date.now()
        }));

        return uniqueData;

    } catch (error) {
        console.warn('Live Fetch Failed (Likely CORS), using Fallback:', error);
        return CACHED_FAILURES;
    }
};

const formatRedditPost = (data) => {
    return {
        id: data.id,
        source: 'Reddit',
        subreddit: data.subreddit_name_prefixed,
        title: data.title,
        text: data.selftext?.substring(0, 500) + '...', // Truncate for preview
        url: data.url,
        score: data.score,
        date: new Date(data.created_utc * 1000).toLocaleDateString(),
        category: detectCategory(data.title + ' ' + data.selftext)
    };
};

const detectCategory = (text) => {
    const t = text.toLowerCase();
    if (t.includes('resume') || t.includes('cv') || t.includes('ats')) return 'Resume';
    if (t.includes('interview') || t.includes('whiteboard') || t.includes('behavioral')) return 'Interview';
    if (t.includes('java') || t.includes('python') || t.includes('skill') || t.includes('stack')) return 'Skill Gap';
    if (t.includes('ghosted') || t.includes('no response') || t.includes('reject')) return 'Market';
    return 'General';
};

// [NEW] Analyze User's Failure Story via Python Backend
export const analyzeFailureStory = async (story, email) => {
    try {
        const response = await fetch('http://127.0.0.1:5000/analyze-failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ story, email })
        });

        if (!response.ok) throw new Error('Analysis Service Failed');
        return await response.json();
    } catch (error) {
        console.error('Failure Analysis Error:', error);
        return null;
    }
};
