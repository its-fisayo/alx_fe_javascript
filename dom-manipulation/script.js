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

    const newId = 'l-' + Date.now();
    const newQ = { id: newId, text, category, updatedAt: new Date().toISOString() };

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

const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';

const SYNC_INTERVAL = 30_000; // 30 seconds

const LAST_SYNC_AT_KEY = 'dynamic_quotes_last_sync_at';

let lastSyncAt = null;

const syncNotification = document.getElementById('syncNotification');
const syncMessage = document.getElementById('syncMessage');
const openConflictsBtn = document.getElementById('openConflictsBtn');
const dismissSyncBtn = document.getElementById('dismissSyncBtn');
const conflictModal = document.getElementById('conflictModal');
const conflictList = document.getElementById('conflictList');
const applyResolutionsBtn = document.getElementById('applyResolutionsBtn');
const closeConflictsBtn = document.getElementById('closeConflictsBtn');

async function fetchQuotesFromServer() {
  try {
    const res = await fetch(SERVER_URL);
    if (!res.ok) throw new Error('Server returned ' + res.status);
    const data = await res.json();

    // Normalize depending on server shape.
    // JSONPlaceholder /posts have { id, title, body, userId } — we'll map:
    // text -> title, category -> "user-{userId}"
    // If your server already returns {id, text, category}, adapt accordingly.
    const normalized = data.map(item => {
      if (typeof item === 'object' && item !== null) {
        // handle JSONPlaceholder shape
        if ('title' in item && 'body' in item) {
          return {
            id: 's-' + String(item.id),               // server-id prefix 's-'
            text: item.title || item.body || '',
            category: item.userId ? `user-${item.userId}` : 'Server',
            updatedAt: new Date().toISOString()
          };
        }
        // if already in quote shape:
        if ('text' in item && 'category' in item) {
          return {
            id: item.id != null ? item.id : ('s-' + Math.random()),
            text: item.text,
            category: item.category,
            updatedAt: item.updatedAt || new Date().toISOString()
          };
        }
      }
      return null;
    }).filter(Boolean);

    return normalized;
  } catch (err) {
    console.warn('fetchServerQuotes failed', err);
    return null; // signal failure
  }
}

/* merge: server -> local (server wins). Collect conflicts for user review.
   conflict definition here: same id exists locally + server, but text/category differ.
   If server item has id not present locally -> add it.
*/
function mergeServerData(serverQuotes) {
  if (!Array.isArray(serverQuotes)) return;

  const localById = new Map(quotes.map(q => [String(q.id), q]));
  const newLocal = [...quotes]; // will modify

  pendingConflicts = [];

  serverQuotes.forEach(sq => {
    const id = String(sq.id);
    if (localById.has(id)) {
      const local = localById.get(id);
      // If different content, register conflict and by default accept server version (server-wins)
      if (local.text !== sq.text || local.category !== sq.category) {
        pendingConflicts.push({ local, server: sq });
        // server-wins: replace local item in newLocal
        const idx = newLocal.findIndex(x => String(x.id) === id);
        if (idx !== -1) newLocal[idx] = { ...sq, updatedAt: new Date().toISOString() };
      } // else identical -> nothing
    } else {
      // server item new -> add to local store
      newLocal.push({ ...sq, updatedAt: sq.updatedAt || new Date().toISOString() });
    }
  });

  // Optionally remove local items that server deleted? Here we keep local-only items.
  quotes = newLocal;
  saveQuotes();

  // update last sync time
  lastSyncAt = new Date().toISOString();
  try { localStorage.setItem(LAST_SYNC_AT_KEY, lastSyncAt); } catch {}

  // Notify user if there were conflicts or new items
  if (pendingConflicts.length > 0) {
    showSyncNotification(`${pendingConflicts.length} conflict(s) detected. Server versions applied (default).`);
  } else {
    showSyncNotification('Synced with server. No conflicts.');
  }

  populateCategories();
}

/* ---------- Notification & conflict UI ---------- */
function showSyncNotification(msg) {
  if (!syncNotification) return;
  syncMessage.textContent = `${msg} (Last sync: ${lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'now'})`;
  syncNotification.style.display = 'block';
}

function hideSyncNotification() {
  if (!syncNotification) return;
  syncNotification.style.display = 'none';
}

// Build conflict list inside modal and let user choose keep-server / keep-local for each conflict
function openConflictModal() {
  if (!conflictModal || !conflictList) return;
  conflictList.innerHTML = '';

  if (pendingConflicts.length === 0) {
    conflictList.textContent = 'No conflicts to resolve.';
  } else {
    pendingConflicts.forEach((c, idx) => {
      const wrapper = document.createElement('div');
      wrapper.style.borderBottom = '1px solid #eee';
      wrapper.style.padding = '8px 0';

      const heading = document.createElement('div');
      heading.innerHTML = `<strong>Conflict #${idx+1}</strong>`;
      wrapper.appendChild(heading);

      const serverBlock = document.createElement('div');
      serverBlock.innerHTML = `<em>Server:</em> "${escapeHtml(c.server.text)}" — (${escapeHtml(c.server.category)})`;
      wrapper.appendChild(serverBlock);

      const localBlock = document.createElement('div');
      localBlock.innerHTML = `<em>Local:</em> "${escapeHtml(c.local.text)}" — (${escapeHtml(c.local.category)})`;
      wrapper.appendChild(localBlock);

      const radioKeep = document.createElement('div');
      radioKeep.innerHTML = `
        <label><input type="radio" name="conf-${idx}" value="server" checked> Keep server</label>
        <label style="margin-left:12px;"><input type="radio" name="conf-${idx}" value="local"> Keep local</label>
      `;
      wrapper.appendChild(radioKeep);

      conflictList.appendChild(wrapper);
    });
  }

  conflictModal.style.display = 'block';
}

function closeConflictModal() {
  if (!conflictModal) return;
  conflictModal.style.display = 'none';
}

// When user applies manual resolutions, modify local quotes according to choices
function applyConflictResolutions() {
  if (!pendingConflicts.length) { closeConflictModal(); return; }

  const resolutions = pendingConflicts.map((c, idx) => {
    const chosen = document.querySelector(`input[name="conf-${idx}"]:checked`);
    return chosen ? chosen.value : 'server';
  });

  resolutions.forEach((choice, idx) => {
    const c = pendingConflicts[idx];
    const id = String(c.server.id);
    const localIndex = quotes.findIndex(q => String(q.id) === id);
    if (choice === 'local') {
      // keep local (do nothing because earlier merge applied server already),
      // so we must re-instate local contents
      if (localIndex !== -1) {
        quotes[localIndex] = { ...c.local, updatedAt: new Date().toISOString() };
      } else {
        quotes.push({ ...c.local, updatedAt: new Date().toISOString() });
      }
    } else {
      // keep server — already applied by merge, but ensure timestamp
      if (localIndex !== -1) quotes[localIndex] = { ...c.server, updatedAt: new Date().toISOString() };
      else quotes.push({ ...c.server, updatedAt: new Date().toISOString() });
    }
  });

  // clear pending
  pendingConflicts = [];
  saveQuotes();
  populateCategories();
  closeConflictModal();
  hideSyncNotification();
  alert('Resolutions applied.');
}

/* ---------- Sync runner ---------- */
async function syncQuotes() {
  const serverData = await fetchQuotesFromServer();

  if (!serverData) {
    // network error — optionally notify
    console.log('Server fetch failed; skipping this cycle.');
    return;
  }

  // merge server data into local state
  mergeServerData(serverData);
}

/* start periodic polling */
let syncIntervalHandle = null;
function startAutoSync() {
  // run immediately then interval
  syncQuotes();
  syncIntervalHandle = setInterval(syncQuotes, SYNC_INTERVAL);
}
function stopAutoSync() {
  if (syncIntervalHandle) clearInterval(syncIntervalHandle);
}

/* ---------- Utilities ---------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// POST new quote to mock server
async function postQuoteToServer(quote) {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quote)
    });

    const data = await response.json();
    console.log('✅ Quote posted to server:', data);
  } catch (error) {
    console.error('❌ Failed to post quote to server:', error);
  }
}


/* ---------- Wire UI ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadQuotesFromStorage();
  populateCategories();
  updateLastViewedInfo();

  if (openConflictsBtn) openConflictsBtn.addEventListener('click', openConflictModal);
  if (dismissSyncBtn) dismissSyncBtn.addEventListener('click', hideSyncNotification);
  if (applyResolutionsBtn) applyResolutionsBtn.addEventListener('click', applyConflictResolutions);
  if (closeConflictsBtn) closeConflictsBtn.addEventListener('click', closeConflictModal);

  // start automatic syncing
  startAutoSync();
});