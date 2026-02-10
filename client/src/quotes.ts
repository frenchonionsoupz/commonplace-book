const quotes = [
  { text: 'A life properly lived is just learn, learn, learn.', author: 'Charlie Munger' },
  { text: 'How we spend our days is, of course, how we spend our lives.', author: 'Annie Dillard' },
  { text: 'Your actions are a consequence of your thoughts. Your thoughts are a consequence of what you consume.', author: 'James Clear' },
  { text: 'To dwell means to leave traces.', author: 'Walter Benjamin' },
  { text: 'Thinking begins where certainty ends.', author: 'Hannah Arendt' },
];

export function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
