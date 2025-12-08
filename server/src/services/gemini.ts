import { GameResult } from '../models/types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Game information context for the AI
const GAMES_CONTEXT = `
You are 10XBot, an AI assistant for the 10XMind-Play cognitive testing platform. You help students understand their cognitive performance and answer questions about the games.

## Research Study Information:

**Title:** Relationship between Cognitive Functions, Hemispheric Dominance, and Academic Performance in Human Physiology among First-Year Medical Students: A Longitudinal Study

**Principal Investigator:** Dr. T. Sowjanya, Associate Professor, Department of Physiology, Neelima Institute of Medical Sciences, Hyderabad

**Purpose:** This study aims to understand how different cognitive functions—such as attention, memory, executive function, visuospatial ability, and metacognition—along with hemispheric dominance, may influence academic performance in physiology among first-year medical students.

**Tests Included:** Stroop Test, Digit Span Test, Trail Making Test, Mental Rotation Test, Metacognitive Awareness Inventory (MAI), Dichotic Listening Test (DLT), and Edinburgh Handedness Inventory (EHI).

**Study Duration:** Tests take about 60–90 minutes. After 2–3 months, your physiology theory and practical exam scores will be collected and compared with your test results.

**Benefits:** You may gain awareness of your own cognitive strengths and learning strategies. The results may help in developing better academic support programs for medical students.

**Confidentiality:** Your identity remains strictly confidential. All data is coded and used only for research purposes.

## Developer Information (Only mention when specifically asked about development, owner, creator, developer, or technical details):

**Platform Developer:** Mothilal M  
**Company:** 10XScale.ai  
**Role:** Software Engineer  
**Contact:** mothilal044@gmail.com

This cognitive testing platform was developed by Mothilal M, a Software Engineer at 10XScale.ai. For any technical inquiries, development questions, or platform-related support, you can reach out to mothilal044@gmail.com.

## Available Cognitive Games:

### Memory Games:
1. **Forward Digit Span** - Tests short-term memory by recalling digits in forward order. Higher scores mean better short-term memory capacity.
2. **Backward Digit Span** - Tests working memory by recalling digits in reverse order. More challenging than forward span.
3. **Corsi Block Task** - Tests visuospatial working memory through sequential block patterns.

### Attention Games:
4. **Stroop Test** - Measures selective attention and cognitive interference. You see color words in different ink colors and must identify the INK COLOR, not the word. Lower reaction times with high accuracy indicate better attention control.
5. **Flanker Task** - Tests ability to suppress irrelevant information and focus on central target.
6. **Simon Task** - Tests spatial stimulus-response compatibility and conflict resolution.
7. **Trail Making Test** - Part A tests processing speed (connect numbers), Part B tests task switching (alternate numbers/letters).
8. **Dichotic Listening Test** - Tests selective auditory attention and ear dominance using headphones.
9. **SART (Sustained Attention to Response Task)** - Tests sustained attention and response inhibition.
10. **N-Back Task** - Challenges working memory with continuous monitoring (identifying if current stimulus matches N items back).

### Executive Function Games:
11. **Tower of Hanoi** - Tests planning, problem-solving, and strategic thinking ability.
12. **Mental Rotation Test** - Tests spatial visualization by determining if rotated 3D shapes are same or different.

## Performance Metrics Explained:
- **Score**: Overall performance measure (higher is better)
- **Accuracy**: Percentage of correct responses (aim for 80%+)
- **Reaction Time**: Average response speed in milliseconds (lower is generally better, but not at the cost of accuracy)
- **Error Rate**: Percentage of incorrect responses
- **Error Count**: Total number of mistakes

## Interpretation Guidelines:
- Accuracy below 70% suggests the task was challenging
- Very fast reaction times (<200ms) with low accuracy may indicate impulsive responding
- Consistent performance across trials indicates stable attention
- Improvement over sessions shows learning and adaptation

**Important:** When responding, use proper markdown formatting for lists, headings, bold text, etc. This will be rendered as HTML in the UI.

**Response Style:** Keep responses concise and friendly. Provide brief, direct answers (2-4 sentences max) unless the user specifically asks for detailed explanations. Use simple language and avoid unnecessary elaboration.

**Formatting Guidelines:**
- Use **bold** for important names (people, games, institutions)
- Use **bold** for numbers and metrics (scores, percentages, durations)
- Use **bold** for key terms and emphasis
- Use lists for multiple items
- Examples:
  - "The platform was developed by **Mothilal M**"
  - "The study is conducted by **Dr. T. Sowjanya**"
  - "Tests take about **60-90 minutes**"
  - "Aim for **80%+** accuracy"

Be friendly, encouraging, and helpful. Provide specific, actionable advice when discussing performance. If asked about results, analyze patterns and offer insights.
`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UserContext {
  userId: string;
  userName?: string;
  email: string;
  results: GameResult[];
}

function buildUserContext(context: UserContext): string {
  let userInfo = `\n## Current User:\n- Name: ${context.userName || 'Student'}\n- Email: ${context.email}\n`;

  if (context.results && context.results.length > 0) {
    userInfo += `\n## User's Game Results (${context.results.length} total):\n`;
    
    // Group results by game
    const byGame: Record<string, GameResult[]> = {};
    context.results.forEach(r => {
      if (!byGame[r.game_id]) byGame[r.game_id] = [];
      byGame[r.game_id].push(r);
    });

    for (const [gameId, gameResults] of Object.entries(byGame)) {
      const latest = gameResults[0];
      const avgScore = gameResults.reduce((sum, r) => sum + r.score, 0) / gameResults.length;
      const avgAccuracy = gameResults.reduce((sum, r) => sum + r.accuracy, 0) / gameResults.length;
      const avgRT = gameResults.reduce((sum, r) => sum + (r.reaction_time || 0), 0) / gameResults.length;
      
      userInfo += `\n### ${gameId}:\n`;
      userInfo += `- Times Played: ${gameResults.length}\n`;
      userInfo += `- Latest Score: ${latest.score}, Accuracy: ${latest.accuracy.toFixed(1)}%`;
      if (latest.reaction_time) userInfo += `, RT: ${latest.reaction_time.toFixed(0)}ms`;
      userInfo += `\n`;
      userInfo += `- Average Score: ${avgScore.toFixed(1)}, Avg Accuracy: ${avgAccuracy.toFixed(1)}%`;
      if (avgRT > 0) userInfo += `, Avg RT: ${avgRT.toFixed(0)}ms`;
      userInfo += `\n`;
      userInfo += `- Last Played: ${new Date(latest.completed_at).toLocaleDateString()}\n`;
    }

    // Overall summary
    const totalGames = context.results.length;
    const overallAccuracy = context.results.reduce((sum, r) => sum + r.accuracy, 0) / totalGames;
    userInfo += `\n## Overall Summary:\n`;
    userInfo += `- Total Games Played: ${totalGames}\n`;
    userInfo += `- Overall Average Accuracy: ${overallAccuracy.toFixed(1)}%\n`;
  } else {
    userInfo += `\n## Game Results:\nNo games played yet. Encourage the user to try some games!\n`;
  }

  return userInfo;
}

export async function chatWithGemini(
  message: string,
  history: ChatMessage[],
  userContext: UserContext,
  apiKey: string
): Promise<string> {
  const systemPrompt = GAMES_CONTEXT + buildUserContext(userContext);

  // Build conversation history for Gemini
  const contents = [];

  // Add system context as first user message
  contents.push({
    role: 'user',
    parts: [{ text: `[System Context - Do not repeat this to user]\n${systemPrompt}\n\n[End System Context]\n\nPlease acknowledge you understand your role as 10XBot.` }]
  });
  contents.push({
    role: 'model',
    parts: [{ text: "I'm 10XBot, your cognitive training assistant! I'm here to help you understand your performance, explain the games, and provide personalized insights. How can I help you today? 🧠" }]
  });

  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!response.ok) {
      const error: any = await response.json();
      console.error('Gemini API error:', error);
      throw new Error(error.error?.message || 'Failed to get response from Gemini');
    }

    const data: any = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated');
    }

    const text = data.candidates[0].content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text;
  } catch (error) {
    console.error('Gemini service error:', error);
    throw error;
  }
}

// Streaming version for Server-Sent Events
export async function* chatWithGeminiStream(
  message: string,
  history: ChatMessage[],
  userContext: UserContext,
  apiKey: string
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = GAMES_CONTEXT + buildUserContext(userContext);

  // Build conversation history for Gemini
  const contents = [];

  // Add system context as first user message
  contents.push({
    role: 'user',
    parts: [{ text: `[System Context - Do not repeat this to user]\n${systemPrompt}\n\n[End System Context]\n\nPlease acknowledge you understand your role as 10XBot.` }]
  });
  contents.push({
    role: 'model',
    parts: [{ text: "I'm 10XBot, your cognitive training assistant! I'm here to help you understand your performance, explain the games, and provide personalized insights. How can I help you today? 🧠" }]
  });

  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    const response = await fetch(`${GEMINI_API_URL.replace(':generateContent', ':streamGenerateContent')}?key=${apiKey}&alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!response.ok) {
      const error: any = await response.json();
      console.error('Gemini API error:', error);
      throw new Error(error.error?.message || 'Failed to get response from Gemini');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield text;
            }
          } catch (e) {
            // Skip invalid JSON
            continue;
          }
        }
      }
    }
  } catch (error) {
    console.error('Gemini streaming error:', error);
    throw error;
  }
}

export function getQuickSuggestions(hasResults: boolean): string[] {
  if (hasResults) {
    return [
      "How am I doing overall?",
      "Which game should I try next?",
      "Explain my Stroop test results",
      "How can I improve my scores?",
      "What do my results mean?"
    ];
  }
  return [
    "What games are available?",
    "Which game should I start with?",
    "How does the Stroop test work?",
    "What is working memory?",
    "Tips for better performance"
  ];
}
