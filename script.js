const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCBK0u-gNPO_zWGG8y7YDrKIRJMmi-mVgA';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('topicForm');
    const input = document.getElementById('topicInput');
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const filterBar = document.getElementById('filterBar');
    const priceFilter = document.getElementById('priceFilter');
    const reviewFilter = document.getElementById('reviewFilter');

    let currentItems = [];

    function setTheme(isLight) {
        if (isLight) {
            document.body.classList.add('light-theme');
            themeToggleBtn.textContent = '☀️';
        } else {
            document.body.classList.remove('light-theme');
            themeToggleBtn.textContent = '🌙';
        }
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    (function() {
        const savedTheme = localStorage.getItem('theme');
        setTheme(savedTheme === 'light');
    })();

    themeToggleBtn.addEventListener('click', () => {
        const isLight = !document.body.classList.contains('light-theme');
        setTheme(isLight);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const topic = input.value.trim();
        if (!topic) return;
        resultsDiv.innerHTML = '';
        loadingDiv.style.display = 'block';
        filterBar.style.display = 'none';
        priceFilter.value = 'none';
        reviewFilter.value = 'none';
        const prompt = `Generate a list of 20 items for the topic: "${topic}". For each item, provide:\n- Title\n- brief Description (2-4 lines)\n- Price and Source (if applicable)\n- Review (number, if available)\n- Link (if available)\nReturn the result as a JSON array of objects with keys: title, description, price, review, link.`;
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!generatedText) throw new Error('No response from Gemini.');
            let items = [];
            try {
                const match = generatedText.match(/```json([\s\S]*?)```/);
                const jsonString = match ? match[1] : generatedText;
                items = JSON.parse(jsonString);
            }
            catch (err) {
                try {
                    items = JSON.parse(generatedText);
                } 
                catch (e) {
                    throw new Error('Could not parse Gemini response as JSON.');
                }
            }
            currentItems = items;
            filterBar.style.display = 'flex';
            showResults(applyFilters(currentItems));
        } catch (err) {
            resultsDiv.innerHTML = `<div style=\"color:red;\">Error: ${err.message}</div>`;
        } finally {
            loadingDiv.style.display = 'none';
        }
    });

    priceFilter.addEventListener('change', () => {
        showResults(applyFilters(currentItems));
    });
    reviewFilter.addEventListener('change', () => {
        showResults(applyFilters(currentItems));
    });

    function applyFilters(items) {
        let filtered = [...items];
        // Price filter
        if (priceFilter.value === 'price-asc') {
            filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        } else if (priceFilter.value === 'price-desc') {
            filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        }
        // Review filter
        if (reviewFilter.value === 'review-desc') {
            filtered.sort((a, b) => parseReview(b.review) - parseReview(a.review));
        }
        return filtered;
    }

    function parsePrice(price) {
        if (typeof price === 'number') return price;
        if (typeof price === 'string') {
            // Extract number from string (e.g., '₹12,000' or '$99')
            const num = price.replace(/[^\d.]/g, '');
            return parseFloat(num) || 0;
        }
        return 0;
    }

    function parseReview(review) {
        if (typeof review === 'number') return review;
        if (typeof review === 'string') {
            const num = review.replace(/[^\d.]/g, '');
            return parseFloat(num) || 0;
        }
        return 0;
    }

    function showResults(items) {
        if (!Array.isArray(items) || items.length === 0) {
            resultsDiv.innerHTML = '<div>No results found.</div>';
            return;
        }
        resultsDiv.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <div class="result-title">${item.title || ''}</div>
                <div class="result-desc">${item.description || ''}</div>
                <div class="result-meta">${item.price ? 'Price/Source: ' + item.price : ''}</div>
                <div class="result-meta">${item.review ? 'Review: ' + item.review : ''}</div>
                ${item.link ? `<a class="result-link" href="${item.link}" target="_blank">View More</a>` : ''}
            `;
            resultsDiv.appendChild(card);
        });
    }
}); 