const axios = require("axios");
const apiKey = "af9017dfc3d94d7cb6581f104850e60e";
const url = "https://newsapi.org/v2/top-headlines";
const params = { apiKey, pageSize: 20, language: "en", country: "us" };
axios.get(url, { params })
  .then(r => console.log("success", r.data.articles.length))
  .catch(e => console.error("error", e.response?.data || e.message));
