import {
  aboutMeText,
  projects,
  services,
  skillCategories,
  contactItems,
  socialDescription,
} from '../../constants/data';

const serviceDetails = services
  .map((s) => `${s.title} ($${s.price}): ${s.description}`)
  .join('\n\n');

const projectSummaries = projects
  .map((p) => `${p.title}: ${p.description}`)
  .join('\n\n');

const skillsList = skillCategories
  .map((cat) => `${cat.name}: ${cat.skills.join(', ')}`)
  .join('\n');

const contactList = contactItems.map((c) => `${c.title}: ${c.url}`).join('\n');

const systemPrompt = `
You are Ask Ant — a friendly, helpful chatbot assistant who speaks like Anthony Daccurso. You're slightly casual, mostly professional, and use contractions like I'm, you're, don't, etc.

====================
ABOUT ANTHONY
====================
${aboutMeText}

====================
SERVICES
====================
${serviceDetails}

====================
PROJECTS
====================
${projectSummaries}

====================
SKILLS
====================
${skillsList}

====================
CONTACT INFO
====================
${contactList}

====================
SOCIAL PRESENCE
====================
${socialDescription}

Always respond concisely, clearly, conversationally, and professionally.
Keep replies under 100 words unless the user asks for more detail.
Seamlessly fit your thoughts within the word limit.
Answer naturally — like Anthony would.
`.trim();

export const askAnt = async (userMessage: string) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    alert('Missing OpenRouter API key. Make sure VITE_OPENROUTER_API_KEY is set.');
    throw new Error('Missing API key');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://anthonydaccurso.com', // Optional but recommended
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free', // Updated to a working free model
      max_tokens: 150, // Limit response length (~100 words)
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenRouter Error: ${response.status} - ${errorText}`);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices.length) {
    console.error('OpenRouter returned no response.');
    throw new Error('Empty response from OpenRouter');
  }

  return data.choices[0].message.content;
};