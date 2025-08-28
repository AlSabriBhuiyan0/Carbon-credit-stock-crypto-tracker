const express = require('express');
const asyncHandler = require('express-async-handler');

// Node 18+ fetch polyfill guard
// eslint-disable-next-line no-undef
const fetchFn = (typeof fetch !== 'undefined') ? fetch : require('node-fetch');

const router = express.Router();

// Public RSS sources without API keys
const SOURCES = {
  crypto: [
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://cointelegraph.com/rss'
  ],
  stocks: [
    'https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL,MSFT,GOOGL,AMZN,TSLA&region=US&lang=en-US',
    'https://www.marketwatch.com/feeds/topstories'
  ],
  carbon: [
    'https://unfccc.int/rss.xml',
    'https://verra.org/feed/'
  ],
  market: [
    'https://www.ft.com/markets?format=rss',
    'https://www.reuters.com/markets/rss'
  ]
};

function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Minimal RSS parser (no external deps)
function parseRss(xml) {
  const items = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) || [];
  for (const raw of matches) {
    const pick = (tag) => {
      const re = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i');
      const m = raw.match(re);
      return m ? sanitize(m[1]) : '';
    };
    const title = pick('title');
    const link = pick('link');
    const description = pick('description') || pick('content:encoded');
    const pubDate = pick('pubDate') || pick('updated') || pick('dc:date');
    const category = pick('category');
    items.push({ title, link, description, pubDate, category });
  }
  return items;
}

function deriveAlertsFromNews(items) {
  const alerts = [];
  const highKeywords = ['hack', 'breach', 'ban', 'halt', 'scam', 'plunge', 'crash'];
  const mediumKeywords = ['regulation', 'lawsuit', 'investigation', 'downgrade'];
  for (const item of items.slice(0, 50)) {
    const text = `${item.title} ${item.description}`.toLowerCase();
    let priority = null;
    if (highKeywords.some(k => text.includes(k))) priority = 'high';
    else if (mediumKeywords.some(k => text.includes(k))) priority = 'medium';
    if (priority) {
      alerts.push({
        id: item.link,
        priority,
        message: item.title,
        description: item.description?.slice(0, 240),
        timestamp: item.pubDate
      });
    }
  }
  return alerts;
}

function extractTrendingTopics(items) {
  const freq = new Map();
  const stop = new Set('the a an and or for from of to in on with by is are be as at this that it its into over about new says says: amid after before during market crypto stock stocks carbon credit credits price prices rally plunge surge regulation ban emission emissions energy project projects climate'.split(/\s+/));
  for (const item of items) {
    const text = `${item.title} ${item.description}`.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    for (const w of text.split(/\s+/)) {
      if (!w || w.length < 4 || stop.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  return Array.from(freq.entries())
    .sort((a,b)=>b[1]-a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ topic: word, count }));
}

async function fetchCategory(category, limit = 50) {
  const urls = SOURCES[category] || [];
  const all = [];
  for (const url of urls) {
    try {
      const res = await fetchFn(url, { headers: { 'User-Agent': 'CarbonTrackerBot/1.0' } });
      const xml = await res.text();
      const items = parseRss(xml).map(x => ({ ...x, source: url, category }));
      all.push(...items);
    } catch (err) {
      // continue
    }
  }
  // Sort by pubDate if present
  all.sort((a,b)=> new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  return all.slice(0, limit);
}

router.get('/latest', asyncHandler(async (req, res) => {
  const { category = 'market', limit = '50' } = req.query;
  const n = Math.max(1, Math.min(parseInt(limit, 10) || 50, 100));
  const categories = category === 'all' ? Object.keys(SOURCES) : [category];
  const results = [];
  for (const c of categories) {
    // eslint-disable-next-line no-await-in-loop
    const items = await fetchCategory(c, n);
    results.push(...items);
  }
  const alerts = deriveAlertsFromNews(results);
  const trending = extractTrendingTopics(results);
  res.json({ success: true, data: { news: results, alerts, trending } });
}));

router.get('/trending', asyncHandler(async (req, res) => {
  const { category = 'market' } = req.query;
  const items = await fetchCategory(category, 100);
  const trending = extractTrendingTopics(items);
  res.json({ success: true, data: trending });
}));

module.exports = router;


