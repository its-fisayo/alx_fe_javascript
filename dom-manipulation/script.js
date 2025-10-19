const LS_KEY = 'dynamic_quotes_v1';
const SS_LAST_QUOTE_KEY = 'dynamic_quotes_last_viewed';

let quote1 = {text: 'Live life to the fullest',
    category: 'Motivation'
};

let quote2 = {text: 'Jesus has got you',
    category: 'Assurance'
};

let quotes = [quote1, quote2];

const SAMPLE_QUOTES = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" },
    { text: "Life is what happens when you’re busy making other plans.", category: "Life" }
];

const quoteDisplayer = document.getElementById('newQuote');
const categorySelect = document.getElementById('categoryFilter');
const displayQuote = document.getElementById('quoteDisplay');
const quoteParagraph = document.createElement('p');
displayQuote.appendChild(quoteParagraph);

function saveQuotes() {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(quotes));
    } catch (err) {
        console.error('Failed saving to localStorage', err);
        alert('Error: Could not save quotes to local storage.');
    }
}

function loadQuotesFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      quotes = [...SAMPLE_QUOTES];
      saveQuotes();
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Basic validation: keep only well-formed entries
      quotes = parsed.filter(q => q && typeof q.text === 'string' && typeof q.category === 'string');
    } else {
      // If data invalid, reset to sample
      quotes = [...SAMPLE_QUOTES];
      saveQuotes();
    }
  } catch (err) {
    console.error('Failed loading from localStorage', err);
    quotes = [...SAMPLE_QUOTES];
    saveQuotes();
  }
}

function populateCategories() {
    const categories = Array.from(new Set(quotes.map(q => q.category))).sort((a,b)=>a.localeCompare(b));
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });

    // Restore last selected category if it exists
    const lastFilter = localStorage.getItem('last_selected_category');
    if (lastFilter && [...categorySelect.options].some(opt => opt.value === lastFilter)) {
        categorySelect.value = lastFilter;
    }
}

function filterQuotes() {
    const selectedCategory = categorySelect.value;
    localStorage.setItem('last_selected_category', selectedCategory); // save last selected category
}

function showRandomQuote() {
    let filtered = quotes;
    const sel = categorySelect.value;
    if (sel !== 'all') filtered = quotes.filter(q => q.category === sel);

    if (filtered.length === 0) {
        quoteDisplay.textContent = 'No quotes available in this category yet!';
        sessionStorage.removeItem(SS_LAST_QUOTE_KEY);
        updateLastViewedInfo();
        return;
    }

    let max = filtered.length;
    let randomNumber = Math.floor(Math.random() * (max));
    let randomQuote = `"${filtered[randomNumber].text}" - (${filtered[randomNumber].category})`;
    let q = filtered[randomNumber];

    quoteParagraph.innerHTML = randomQuote;

    try {
        sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(q));
    } catch (err) {
        console.warn('sessionStorage unavailable', err);
    }
    updateLastViewedInfo();
}

const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const clearStorageBtn = document.getElementById('clearStorageBtn');
const lastViewedInfo = document.getElementById('lastViewedInfo');

function updateLastViewedInfo() {
  try {
    const raw = sessionStorage.getItem(SS_LAST_QUOTE_KEY);
    if (!raw) {
      lastViewedInfo.textContent = '';
      return;
    }
    const last = JSON.parse(raw);
    lastViewedInfo.textContent = `Last viewed (session): "${last.text}" — (${last.category})`;
  } catch {
    lastViewedInfo.textContent = '';
  }
}

quoteDisplayer.addEventListener('click', showRandomQuote);

function createAddQuoteForm() {
    const text = document.getElementById('newQuoteText').value.trim();
    const category = document.getElementById('newQuoteCategory').value.trim();
    let quote = {
        text,
        category
    };

    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    quotes.push(quote);

    saveQuotes();
    populateCategories();
}

function exportQuotesToJson() {
  try {
    const payload = JSON.stringify(quotes, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const filename = `quotes-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export failed', err);
    alert('Failed to export quotes.');
  }
}

// Import JSON file and merge (with validation). Called on file input change.
function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        throw new Error('JSON must be an array of quote objects.');
      }

      // Validate items and collect only valid ones
      const valid = imported.filter(item =>
        item && typeof item.text === 'string' && typeof item.category === 'string'
      );

      if (valid.length === 0) {
        alert('No valid quote objects found in file. Each item must have "text" and "category" strings.');
        importFile.value = '';
        return;
      }

      // Merge while avoiding exact duplicates
      let added = 0;
      const existingSet = new Set(quotes.map(q => q.text + '||' + q.category));
      valid.forEach(q => {
        const key = q.text + '||' + q.category;
        if (!existingSet.has(key)) {
          quotes.push({ text: q.text, category: q.category });
          existingSet.add(key);
          added++;
        }
      });

      saveQuotes();
      populateCategories();
      importFile.value = '';

      alert(`Imported ${valid.length} items. ${added} new quotes added (duplicates skipped).`);
    } catch (err) {
      console.error('Import failed', err);
      alert('Invalid JSON file or format. Make sure the file contains an array of objects with "text" and "category".');
      importFile.value = '';
    }
  };

  reader.onerror = function () {
    alert('Failed to read file.');
    importFile.value = '';
  };

  reader.readAsText(file);
}

// Clear saved quotes (localStorage) and reset to sample quotes
function clearSavedQuotes() {
  if (!confirm('This will delete all saved quotes and reset to defaults. Proceed?')) return;
  localStorage.removeItem(LS_KEY);
  loadQuotesFromStorage();
  populateCategories();
  quoteDisplay.textContent = 'Quotes reset to defaults.';
  sessionStorage.removeItem(SS_LAST_QUOTE_KEY);
  updateLastViewedInfo();
}

// ---------- Initialization ----------
document.addEventListener('DOMContentLoaded', () => {
  // Load saved quotes (or sample)
  loadQuotesFromStorage();

  // Wire UI events
  populateCategories();
  exportBtn.addEventListener('click', exportQuotesToJson);
  importFile.addEventListener('change', importFromJsonFile);
  clearStorageBtn.addEventListener('click', clearSavedQuotes);

  // Show last viewed if session contains one
  updateLastViewedInfo();

  // Optionally, show a random quote immediately (comment out if undesired)
  // showRandomQuote();
});