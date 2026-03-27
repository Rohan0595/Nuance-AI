// src/services/api.js
// All backend communication lives here. Zero direct fetch() calls in components.

const BASE = import.meta.env.VITE_API_URL || "/api";

// Generate or retrieve a stable session ID for this browser
function getSessionId() {
  let id = localStorage.getItem("news_session_id");
  if (!id) {
    id = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem("news_session_id", id);
  }
  return id;
}

async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const headers = {
    "Content-Type": "application/json",
    "x-session-id": getSessionId(),
    ...options.headers,
  };

  const token = localStorage.getItem("news_auth_token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || `API error ${res.status}`);
  }
  return data;
}

// ─── Authentication ───────────────────────────────────────────────────────────
export async function registerUser(name, email, password) {
  return await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
}

export async function loginUser(email, password) {
  return await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function phoneLoginUser(idToken) {
  return await apiFetch("/auth/phone", { method: "POST", body: JSON.stringify({ idToken }) });
}

export async function forgotPasswordUser(email) {
  return await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

// ─── News ─────────────────────────────────────────────────────────────────────
export async function fetchNews(category = "All", pageSize = 20, topics = "") {
  const params = new URLSearchParams({ category, pageSize });
  if (topics && category === "All") params.append("topics", topics);
  const data = await apiFetch(`/news?${params}`);
  return data.articles;
}

export async function fetchArticle(id) {
  const data = await apiFetch(`/news/${id}`);
  return data.article;
}

export async function searchArticles(query, pageSize = 20) {
  const params = new URLSearchParams({ q: query, pageSize });
  const data = await apiFetch(`/search?${params}`);
  return data.articles;
}

// ─── AI ──────────────────────────────────────────────────────────────────────
export async function generateContext(article) {
  const data = await apiFetch("/context", {
    method: "POST",
    body: JSON.stringify({ article }),
  });
  return data.context;
}

export async function generateSummary(article) {
  const data = await apiFetch("/summary", {
    method: "POST",
    body: JSON.stringify({ article }),
  });
  return data.summary;
}

export async function generateReel(article) {
  const data = await apiFetch("/reel", {
    method: "POST",
    body: JSON.stringify({ article }),
  });
  return data.reel;
}

export async function getAnalysis(article) {
  const data = await apiFetch("/analysis", {
    method: "POST",
    body: JSON.stringify({ article }),
  });
  return data.analysis;
}

export async function getPOV(article) {
  const data = await apiFetch("/pov", {
    method: "POST",
    body: JSON.stringify({ article }),
  });
  return data.pov;
}

// ─── Saved articles ───────────────────────────────────────────────────────────
export async function toggleSaveArticle(article) {
  const data = await apiFetch("/save", {
    method: "POST",
    body: JSON.stringify({ article }),
  });
  return data.saved; // boolean
}

export async function fetchSavedArticles() {
  const data = await apiFetch("/saved");
  return data.articles;
}

// ─── Profile & Personalization ────────────────────────────────────────────────
export async function updateProfile(data) {
  return await apiFetch("/auth/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function trackArticleRead(category) {
  try {
    const data = await apiFetch("/read", {
      method: "POST",
      body: JSON.stringify({ category }),
    });
    return data;
  } catch (err) {
    console.error("Read tracking failed:", err);
    return null; // non-critical
  }
}
