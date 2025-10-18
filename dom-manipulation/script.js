let quote1 = {text: 'Live life to the fullest',
    category: 'Motivation'
};

let quote2 = {text: 'Jesus has got you',
    category: 'Assurance'
};

let quotes = [quote1, quote2];

function showRandomQuote() {
    let max = quotes.length;
    let randomNumber = Math.floor(Math.random() * (max));

    let randomQuote = quotes[randomNumber].text;

    const displayQuote = document.getElementById('quoteDisplay');
    displayQuote.innerHTML = randomQuote;
}

const quoteDisplayer = document.getElementById('newQuote');
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
}
