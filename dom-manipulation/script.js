let quote1 = {quoteText: 'Live life to the fullest',
    quoteCategory: 'Motivation'
};

let quote2 = {quoteText: 'Jesus has got you',
    quoteCategory: 'Assurance'
};

let quotes = [quote1, quote2];

function showRandomQuote() {
    let max = quotes.length;
    let randomNumber = Math.floor(Math.random() * (max));

    let randomQuote = quotes[randomNumber].quoteText;

    const displayQuote = document.getElementById('quoteDisplay');
    displayQuote.innerHTML = randomQuote;
}

const quoteDisplayer = document.getElementById('newQuote');
quoteDisplayer.addEventListener('click', showRandomQuote);

function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim();
    let quote = {
        quoteText,
        quoteCategory
    };

    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    quotes.push(quote);
}