import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Newspaper, 
  AlertTriangle, 
  Bell, 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  Filter, 
  Search 
} from 'lucide-react';

import { newsApi } from '../../api/news';

const NewsAndAlertsCard = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [serverData, setServerData] = useState(null);
  const [serverTrending, setServerTrending] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [preferences, setPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('newsPreferences')) || { categories: ['crypto','stocks','carbon','market'] };
    } catch { return { categories: ['crypto','stocks','carbon','market'] }; }
  });
  const [showPrefs, setShowPrefs] = useState(false);

  const fetchNews = async (cat) => {
    setLoading(true);
    try {
      const res = await newsApi.getLatest({ category: cat });
      // Fallback: if a category returns empty, try 'all'
      const payload = res?.data;
      if (!payload || !Array.isArray(payload.news) || payload.news.length === 0) {
        const fb = await newsApi.getLatest({ category: 'all' });
        setServerData(fb?.data || null);
        setServerTrending((fb?.data?.trending) || []);
      } else {
        setServerData(payload);
        setServerTrending((payload?.trending) || []);
      }
    } catch (e) {
      setServerData({ news: [], alerts: [] });
      setServerTrending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchNews(category);
      if (!mounted) return;
      // Also fetch dedicated trending to ensure we populate chips
      try {
        const t = await newsApi.getTrending({ category });
        if (t?.data && Array.isArray(t.data)) setServerTrending(t.data);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [category]);

  const live = serverData || data;

  const {
    news: rawNews = [],
    alerts = [],
  } = live || {};

  // Normalize and enrich news
  const news = (rawNews || []).map((n) => ({
    title: n.title || n.headline || '',
    link: n.link || n.url || '#',
    description: n.description || n.summary || '',
    pubDate: n.pubDate || n.publishedAt || n.date || null,
    category: (n.category || n.section || 'market').toString().toLowerCase(),
  }));

  // Trending topics: prefer server; fallback to client-side frequency extraction
  const trendingTopics = (serverTrending && serverTrending.length > 0)
    ? serverTrending
    : (() => {
        const freq = new Map();
        const stop = new Set('the a an and or for from of to in on with by is are be as at this that it its into over about new says amid after before during market crypto stock stocks carbon credit credits price prices rally plunge surge regulation ban emission energy project projects climate'.split(/\s+/));
        (news || []).forEach((n) => {
          const text = `${n.title} ${n.description}`.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
          text.split(/\s+/).forEach((w) => {
            if (!w || w.length < 4 || stop.has(w)) return;
            freq.set(w, (freq.get(w) || 0) + 1);
          });
        });
        return Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([topic,count])=>({ topic, count }));
      })();

  const filteredNews = useMemo(() => {
    const categories = new Set(preferences.categories || []);
    return news.filter(n => categories.has((n.category || 'market').toLowerCase()))
      .filter(n => !query || (n.title?.toLowerCase().includes(query.toLowerCase()) || n.description?.toLowerCase().includes(query.toLowerCase())));
  }, [news, preferences, query]);

  const handleExport = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>News Export</title></head><body>` +
      `<h2>News Export (${new Date().toLocaleString()})</h2>` +
      `<ol>` + filteredNews.slice(0,80).map(n => `<li><strong>${n.title}</strong> <em>(${n.category})</em><br/><a href="${n.link}" target="_blank" rel="noreferrer">${n.link}</a><br/><small>${n.pubDate || ''}</small></li>`).join('') + `</ol>` +
      `</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const toggleCategoryPref = (key) => {
    const next = new Set(preferences.categories || []);
    if (next.has(key)) next.delete(key); else next.add(key);
    const updated = { ...preferences, categories: Array.from(next) };
    setPreferences(updated);
    try { localStorage.setItem('newsPreferences', JSON.stringify(updated)); } catch {}
  };

  // Alert priority color mapping
  const getAlertColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // News category color mapping
  const getNewsColor = (category) => {
    switch (category.toLowerCase()) {
      case 'stocks':
        return 'text-blue-600 bg-blue-100';
      case 'carbon':
        return 'text-green-600 bg-green-100';
      case 'market':
        return 'text-purple-600 bg-purple-100';
      case 'economy':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Market update color mapping
  const getMarketUpdateColor = (change) => {
    if (change >= 0) return 'text-green-600';
    return 'text-red-600';
  };

  // Derive simple market updates from latest filtered news (for live feel)
  const liveMarketUpdates = (filteredNews || []).slice(0, 6).map((n) => ({
    title: n.title,
    link: n.link,
    category: n.category || 'market',
    pubDate: n.pubDate || n.publishedAt,
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">News & Alerts</h3>
              <p className="text-blue-100 text-sm">
                Market updates, breaking news & important alerts
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search news..."
                  className="px-3 py-1 text-sm bg-white bg-opacity-20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  value={query}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuery(val);
                    const v = val.trim().toLowerCase();
                    if (['crypto','cryptocurrency'].includes(v)) setCategory('crypto');
                    if (['stock','stocks','equity','equities'].includes(v)) setCategory('stocks');
                    if (['carbon','carbon credits','credits'].includes(v)) setCategory('carbon');
                    if (['market','all'].includes(v)) setCategory('all');
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchNews(category); }}
                />
                <Search className="w-4 h-4 text-blue-100 absolute right-2 top-1/2 transform -translate-y-1/2" />
              </div>
              <select
                className="px-2 py-1 text-sm bg-white bg-opacity-20 rounded-lg text-white focus:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All</option>
                <option value="crypto">Crypto</option>
                <option value="stocks">Stocks</option>
                <option value="carbon">Carbon</option>
                <option value="market">Market</option>
              </select>
              <button className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all">
                <Filter className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="animate-pulse mb-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        )}
        {!loading && (filteredNews.length === 0) && (
          <div className="mb-4 text-sm text-gray-500">No news found for this filter. Try switching category or clearing search.</div>
        )}
        {/* Active Alerts */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800">Active Alerts</h4>
            <span className="text-sm text-gray-500">({alerts.length})</span>
          </div>
          
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert, index) => (
              <motion.div
                key={alert.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${getAlertColor(alert.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium uppercase">
                        {alert.priority || 'Medium'}
                      </span>
                      <span className="text-xs opacity-75">
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : '2 min ago'}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {alert.message || `Alert message ${index + 1}`}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {alert.description || 'Alert description goes here'}
                    </div>
                  </div>
                  <button className="text-xs opacity-75 hover:opacity-100">
                    Dismiss
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Market Updates */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Live Market Updates</h4>
          </div>
          
          <div className="space-y-2">
            {liveMarketUpdates.map((u, index) => (
              <motion.a
                key={u.link || index}
                href={u.link}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-2 bg-white rounded text-sm hover:shadow"
              >
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-0.5 rounded ${getNewsColor(u.category)}`}>{u.category}</div>
                  <span className="text-gray-700 font-medium line-clamp-1">
                    {u.title}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {u.pubDate ? new Date(u.pubDate).toLocaleTimeString() : ''}
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Latest News */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Newspaper className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Latest News</h4>
          </div>
          
          <div className="space-y-3">
            {filteredNews.slice(0, 8).map((article, index) => (
              <motion.div
                key={article.link || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <a className="flex items-start space-x-3" href={article.link} target="_blank" rel="noreferrer">
                  <div className="flex-shrink-0">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getNewsColor(article.category || 'market')}`}>
                      {article.category || 'Market'}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                      {article.title || `News article title ${index + 1}`}
                    </h5>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {article.description || article.summary || ''}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          {article.pubDate ? new Date(article.pubDate).toLocaleString() : (article.publishedAt ? new Date(article.publishedAt).toLocaleString() : '')}
                        </span>
                      </div>
                      
                      <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                        <span>Read more</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trending Topics */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-800">Trending Topics</h4>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(trendingTopics || []).slice(0, 12).map((topic, index) => (
              <motion.button
                key={topic.topic || topic.name || index}
                onClick={() => setQuery(topic.topic || topic.name)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-3 py-1 bg-white rounded-full text-xs font-medium text-purple-700 border border-purple-200 hover:bg-purple-100 cursor-pointer transition-colors"
              >
                #{topic.topic || topic.name || `Topic${index + 1}`}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold text-indigo-800">Quick Actions</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-white rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors text-sm font-medium text-indigo-700" onClick={() => (window.location.href = '/app/forecasts')}>
              Set Price Alert
            </button>
            <button className="p-3 bg-white rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors text-sm font-medium text-indigo-700" onClick={() => setShowPrefs(true)}>
              News Preferences
            </button>
            <button className="p-3 bg-white rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors text-sm font-medium text-indigo-700" onClick={() => { setCategory('market'); setQuery(''); }}>
              Market Watch
            </button>
            <button className="p-3 bg-white rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors text-sm font-medium text-indigo-700" onClick={handleExport}>
              Export Data
            </button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Preferences Modal */}
        {showPrefs && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">News Preferences</h4>
                <button className="text-gray-500" onClick={() => setShowPrefs(false)}>Close</button>
              </div>
              <div className="space-y-3">
                {['crypto','stocks','carbon','market'].map((c) => (
                  <label key={c} className="flex items-center space-x-2">
                    <input type="checkbox" checked={(preferences.categories || []).includes(c)} onChange={() => toggleCategoryPref(c)} />
                    <span className="capitalize">{c}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 text-right">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={() => setShowPrefs(false)}>Done</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsAndAlertsCard;
