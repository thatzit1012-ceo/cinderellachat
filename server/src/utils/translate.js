const SUPPORTED_LANGS = ['en', 'ja', 'zh-CN', 'es', 'th'];

async function translateTo(text, target, key) {
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target, format: 'text' }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data?.translations?.[0]?.translatedText || text;
}

async function translateToAll(text) {
  const key = process.env.TRANSLATE_API_KEY;
  if (!key) return {};

  const results = await Promise.all(
    SUPPORTED_LANGS.map((lang) => translateTo(text, lang, key))
  );
  return Object.fromEntries(SUPPORTED_LANGS.map((lang, i) => [lang, results[i]]));
}

module.exports = { translateToAll };
