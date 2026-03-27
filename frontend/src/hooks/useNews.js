// src/hooks/useNews.js
import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchNews,
  searchArticles,
  generateContext,
  generateReel,
  toggleSaveArticle,
  fetchSavedArticles,
  getAnalysis,
  getPOV,
} from "../services/api";

// ─── Main news feed hook ──────────────────────────────────────────────────────
export function useNewsFeed(category = "All", topicsStr = "") {
  const [articles, setArticles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchNews(category, 20, topicsStr);
      setArticles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, topicsStr]);

  useEffect(() => { load(); }, [load]);

  const toggleSave = useCallback(async (articleId) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    // Optimistic update
    setArticles(prev => prev.map(a => a.id === articleId ? { ...a, saved: !a.saved } : a));
    try {
      await toggleSaveArticle(article);
    } catch {
      // Rollback on error
      setArticles(prev => prev.map(a => a.id === articleId ? { ...a, saved: !a.saved } : a));
    }
  }, [articles]);

  return { articles, loading, error, refreshing, refresh: () => load(true), toggleSave };
}

// ─── Search hook ──────────────────────────────────────────────────────────────
export function useSearch() {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef(null);

  const search = useCallback(async (query) => {
    if (!query?.trim()) return;
    if (abortRef.current) abortRef.current = false; // cancel previous

    setLoading(true);
    setSearched(true);
    setError(null);
    let active = true;
    abortRef.current = () => { active = false; };

    try {
      const data = await searchArticles(query);
      if (active) setResults(data);
    } catch (err) {
      if (active) setError(err.message);
    } finally {
      if (active) setLoading(false);
    }
  }, []);

  return { results, loading, error, searched, search };
}

// ─── Article context (AI) hook ────────────────────────────────────────────────
export function useArticleContext(article, enabled = true) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!article || !enabled) return;
    if (context) return; // avoid refetch
    let active = true;
    setLoading(true);
    setError(null);

    generateContext(article)
      .then(ctx => { if (active) setContext(ctx); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [article?.id, enabled, context]);

  return { context, loading, error };
}

// ─── Article analysis hook ──────────────────────────────────────────────────
export function useArticleAnalysis(article, enabled = true) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!article || !enabled) return;
    if (analysis) return; // avoid refetch
    let active = true;
    setLoading(true);
    setError(null);

    getAnalysis(article)
      .then(res => { if (active) setAnalysis(res); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [article?.id, enabled, analysis]);

  return { analysis, loading, error };
}

// ─── Article POV Engine hook ──────────────────────────────────────────────────
export function useArticlePOV(article, enabled = true) {
  const [pov, setPov] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!article || !enabled) return;
    if (pov) return; // avoid refetch
    let active = true;
    setLoading(true);
    setError(null);

    getPOV(article)
      .then(res => { if (active) setPov(res); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [article?.id, enabled, pov]);

  return { pov, loading, error };
}

// ─── Reel context hook ────────────────────────────────────────────────────────
export function useReel(article) {
  const [reel, setReel]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!article) return;
    let active = true;
    setLoading(true);
    generateReel(article)
      .then(r => { if (active) setReel(r); })
      .catch(() => { if (active) setReel({ reelScript: article.summary }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [article?.id]);

  return { reel, loading };
}

// ─── Saved articles hook ──────────────────────────────────────────────────────
export function useSavedArticles() {
  const [saved, setSaved]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedArticles()
      .then(setSaved)
      .catch(() => setSaved([]))
      .finally(() => setLoading(false));
  }, []);

  return { saved, loading };
}
