const express = require('express');
const { YoutubeTranscript } = require('youtube-transcript');
const dotenv = require('dotenv');
const cors = require('cors');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Extract video ID from YouTube URL
function getVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Truncate text to a specified number of words
function truncateText(text, maxWords) {
  const words = text.split(' ');
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(' ');
  }
  return text;
}

app.post('/summarize', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  try {
    // Extract video ID
    const videoId = getVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Fetch transcript
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcriptData || transcriptData.length === 0) {
      return res.status(400).json({ error: 'No transcript available for this video' });
    }
    let transcript = transcriptData.map((entry) => entry.text).join(' ');

    // Truncate transcript to 500 words to stay under token limits
    //transcript = truncateText(transcript, 500);
    console.log('transcript length (words):', transcript.split(' ').length);

    // Summarize using OpenAI API via Azure endpoint
    console.log('Sending request to OpenAI API...');
    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes text concisely in 150 words.'
          },
          {
            role: 'user',
            content: `Summarize the following transcript in 150 words, be precise and to the point:\n\n${transcript}`
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
        top_p: 1
      }),
    });

    const text = await response.text();
    console.log('OpenAI API response status:', response.status);
    console.log('OpenAI API response text:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError.message, 'Response text:', text);
      return res.status(500).json({ error: `Failed to summarize transcript: Invalid API response - ${text.slice(0, 100)}...` });
    }

    if (data.error) {
      console.error('OpenAI API error:', data.error.message);
      return res.status(500).json({ error: `Failed to summarize transcript: ${data.error.message}` });
    }

    const summary = data.choices[0]?.message.content || 'No summary generated';
    res.json({ transcript, summary });
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ error: 'Failed to process the video: ' + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
