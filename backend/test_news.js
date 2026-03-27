const axios = require("axios");

async function test() {
  const apiKey = "af9017dfc3d94d7cb6581f104850e60e";
  
  try {
    console.log("Testing everything endpoint with q=AI");
    const r1 = await axios.get("https://newsapi.org/v2/everything", {
      params: { q: "AI", language: "en", sortBy: "publishedAt", pageSize: 5, apiKey }
    });
    console.log(`Everything AI: ${r1.data.articles.length} articles found.`);
  } catch (e) {
    console.error("Error 1:", e.response?.data || e.message);
  }

  try {
    console.log("Testing search query 'bitcoin'");
    const r2 = await axios.get("https://newsapi.org/v2/everything", {
      params: { q: "bitcoin", language: "en", sortBy: "publishedAt", pageSize: 5, apiKey }
    });
    console.log(`Everything bitcoin: ${r2.data.articles.length} articles found.`);
    if (r2.data.articles.length > 0) {
      console.log(r2.data.articles[0].title);
    }
  } catch (e) {
    console.error("Error 2:", e.response?.data || e.message);
  }
}

test();
