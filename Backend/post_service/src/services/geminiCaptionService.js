const { GoogleGenerativeAI } = require('@google/generative-ai')

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set — AI caption generation will be unavailable')
}

/**
 * Generate a meaningful caption for an orphanage post using Google Gemini.
 * @param {string} imageDescription - A short description of the image content
 * @returns {Promise<string>} Generated caption
 */
async function generateCaption(imageDescription) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are a social media caption writer for an orphanage welfare platform called SoulConnect. 
Generate a warm, heartfelt, and engaging caption for an orphanage post based on this image description:

"${imageDescription}"

Requirements:
- Keep it under 200 characters
- Make it emotional and inspiring
- Include 1-2 relevant emojis
- Do not use hashtags
- Return ONLY the caption text, nothing else`

  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      const response = result.response
      return response.text().trim()
    } catch (err) {
      if (err.status === 429 && attempt < maxRetries) {
        // Wait before retrying on rate limit
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
        continue
      }
      if (err.status === 429) {
        throw new Error('Gemini API quota exceeded. Please try again later or upgrade your plan.')
      }
      throw err
    }
  }
}

module.exports = { generateCaption }
