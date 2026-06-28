document.getElementById('platformGrid').addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (btn) btn.classList.toggle('active');
});

document.getElementById('toneGrid').addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  document.querySelectorAll('#toneGrid .chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

function getSelected(gridId, attr) {
  return [...document.querySelectorAll(`#${gridId} .chip.active`)].map(b => b.dataset[attr]);
}

const platformMeta = {
  'Facebook':  { icon: '📘', cls: 'fb', limit: '63,206 chars' },
  'Instagram': { icon: '📸', cls: 'ig', limit: '2,200 chars'  },
  'LinkedIn':  { icon: '💼', cls: 'li', limit: '3,000 chars'  },
  'Twitter/X': { icon: '🐦', cls: 'tw', limit: '280 chars'    },
};

// Platform-specific writing guidelines injected into the prompt
const platformGuide = {
  'Facebook': `
    - Tone: conversational, warm, community-driven. Stories work best.
    - Structure: Hook (1 line) → Story (3-5 lines) → Reflection → CTA
    - Use line breaks generously for readability.
    - Emojis: 3-5, used naturally.
    - Caption length: 150-300 words.
    - CTA examples: "Share this story with someone who needs to see it 💛", "Drop a ❤️ if you believe every child's voice matters", "Tag a young changemaker you know!"`,
  'Instagram': `
    - Tone: visual, energetic, youth-friendly. Lead with emotion.
    - Structure: Bold hook line → 3-4 punchy lines → Hashtags on new lines
    - First line must grab attention in the feed before "more" cutoff.
    - Emojis: 5-8, expressive and fun.
    - Caption length: 80-130 words.
    - CTA examples: "Save this post 📌", "Tag a friend who should join us 👇", "Link in bio to read the full letter 💌"`,
  'LinkedIn': `
    - Tone: professional, thought-leadership, impact-focused.
    - Structure: Insight/statistic hook → Story → Takeaway → CTA
    - No excessive emojis — 2-3 max, used purposefully.
    - Speak to changemakers, educators, policy professionals, donors.
    - Caption length: 150-200 words.
    - CTA examples: "Join the Change — apply at lettersforchange.ngo", "Become a Part of the Impact", "If your organisation wants to partner with us, DM or comment below."`,
  'Twitter/X': `
    - Tone: sharp, punchy, conversational.
    - Structure: Hook (1 bold statement) → 1-2 lines of context → CTA
    - Max 280 chars total — count carefully.
    - Emojis: 1-2 only.
    - Caption length: 25-40 words.
    - CTA examples: "RT if you agree 🔁", "Thread below 🧵", "Read more → lettersforchange.ngo"`,
};

async function generate() {
  const topic = document.getElementById('topic').value.trim();
  if (!topic) { showError('Please enter a topic or pick one from the quick picks above.'); return; }

  const platforms = getSelected('platformGrid', 'platform');
  if (!platforms.length) { showError('Please select at least one platform.'); return; }

  const tone    = getSelected('toneGrid', 'tone')[0] || 'Inspiring & warm';
  const context = document.getElementById('context').value.trim();

  hideError();

  const btn   = document.getElementById('generateBtn');
  const regen = document.getElementById('regenBtn');
  btn.disabled = true;
  btn.textContent = '⟳ Generating content…';
  if (regen) regen.disabled = true;

  // Hide celebration while generating
  document.getElementById('envelopeCelebration').classList.remove('show');

  document.getElementById('results').innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Crafting platform-ready content for ${platforms.join(', ')}…</p>
      <p class="loading-steps">Headlines · Hook → Story → CTA · Hashtags · Engagement ideas</p>
    </div>`;

  const platformSections = platforms.map(p => `
=== ${p.toUpperCase()} ===
${platformGuide[p] || ''}`).join('\n');

  const prompt = `You are a youth-friendly, warm, and creative social media content writer for "Letters for Change" (LFC).

ABOUT LFC:
- Mission: Amplify children's voices — "You voice it, we amplify it"
- Children (up to age 17) write letters on climate, rights, education, gender, poverty. LFC sends them to lawmakers, NGOs, and policymakers.
- Founded 2019 by 12-year-old Mahika Mishra. 100% student-run under Mahika Mishra Foundation (Section 8 NGO).
- 639+ letters received from children across India.
- Runs letter-writing workshops at schools. Open to interns, volunteers, donors.
- Partners: DLF Public School, Udaan Foundation, St. Jude India Childcare Centre, SAMPARC.
- Website: lettersforchange.ngo

WRITING STYLE RULES:
- Sound HUMAN, warm, and youth-friendly. Absolutely NO robotic or AI-sounding phrases.
- Never start with "In a world where..." or "We are excited to announce..."
- Use contractions (we're, you've, it's). Write like a passionate young person who cares.
- Vary sentence length. Short punchy sentences for impact. Longer ones for story.
- Always follow Hook → Story → CTA structure.
- CTAs must be SPECIFIC and IMPACTFUL — not generic "Click here" or "Apply Now".
  Good CTA examples: "Join the Change", "Become Part of the Impact", "Add your voice", "Help us carry this letter further", "Be the reason a child is heard."

POST REQUEST:
Topic: ${topic}
${context ? `Details / context: ${context}` : ''}
Tone: ${tone}

PLATFORM-SPECIFIC GUIDELINES:
${platformSections}

FOR EACH PLATFORM, return exactly this JSON structure:
{
  "platform": "...",
  "headlines": ["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"],
  "caption": "...",
  "cta": "...",
  "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6"],
  "hashtags": ["#LettersForChange", "#AmplifyChildrensVoices", ...8-10 more platform-specific tags],
  "engagement": ["Poll or comment prompt idea 1", "Engagement idea 2"]
}

HEADLINE RULES:
- Generate exactly 5 different headlines per platform.
- Each must feel different: one factual, one emotional, one curiosity-driven, one bold claim, one question.
- Max 12 words each. No clickbait. No ellipses.

HASHTAGS RULES:
- Make hashtags platform-specific and relevant to the topic.
- Instagram: more trending/discovery tags.
- LinkedIn: professional niche tags.
- Twitter/X: concise, popular tags only (max 5).
- Always include: #LettersForChange #AmplifyChildrensVoices

ENGAGEMENT IDEAS:
- 2 short, specific ideas to spark comments/shares/polls.
- e.g. "Ask followers: What would YOU write a letter about? Drop it below 👇"
- e.g. "Run a poll: Should school curricula teach children about their rights? Yes / No"

Return ONLY a valid JSON array with no markdown, no backticks, no explanation:
[{...}, {...}]`;

  try {
    const res = await fetch("https://lfc-content.sukriti7936.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: "You are an expert social media content writer for a children's NGO. Return ONLY valid JSON array. No markdown, no backticks, no preamble." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2500
      })
    });

    const data = await res.json();
    if (!res.ok) { console.error(data); throw new Error(data.error?.message || "API Error"); }

    const rawText = data.choices?.[0]?.message?.content || "";
    const match = rawText.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Model did not return valid JSON");

    const parsed = JSON.parse(match[0]);
    renderResults(parsed);

    // Show envelope celebration
    const cel = document.getElementById('envelopeCelebration');
    cel.classList.remove('show');
    void cel.offsetWidth; // force reflow to restart animation
    cel.classList.add('show');
    cel.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (err) {
    console.error(err);
    showError(err.message || 'Something went wrong. Please try again.');
    document.getElementById('results').innerHTML = '';
  }

  btn.disabled = false;
  btn.textContent = '✦ Generate Content for LFC';
  if (regen) regen.disabled = false;
}

function renderResults(items) {
  const cards = items.map(item => {
    const meta = platformMeta[item.platform] || { icon: '📣', cls: '', limit: '' };
    const safe = JSON.stringify(item).replace(/`/g, '\\`').replace(/\\/g, '\\\\').replace(/"/g, '&quot;');

    // Headlines
    const headlines = (item.headlines || [item.title]).map((hl, i) => `
      <div class="headline-option" onclick="selectHeadline(this)">
        <div class="hl-num">${i + 1}</div>
        <div class="hl-text">${hl}</div>
      </div>`).join('');

    const keywords   = (item.keywords  || []).map(k => `<span class="keyword-tag">${k}</span>`).join('');
    const hashtags   = (item.hashtags  || []).map(h => `<span class="hashtag-tag">${h}</span>`).join('');
    const engagement = (item.engagement || []).map(e => `
      <div class="engagement-idea"><span>💡</span><span>${e}</span></div>`).join('');

    return `
      <div class="result-card">
        <div class="result-header ${meta.cls}">
          <div class="platform-label">
            <span>${meta.icon}</span>
            <span>${item.platform}</span>
            ${meta.limit ? `<span class="char-badge">${meta.limit}</span>` : ''}
          </div>
          <button class="copy-btn primary" onclick="copyAll(this, \`${safe}\`)">⎘ Copy all</button>
        </div>

        <div class="result-body">

          <div class="content-block">
            <div class="content-label">📌 Headlines — pick your favourite</div>
            <div class="headlines-list">${headlines}</div>
          </div>

          <div class="content-block">
            <div class="content-label">✍️ Caption (Hook → Story → CTA)</div>
            <div class="content-text">${item.caption}</div>
          </div>

          <div class="content-block">
            <div class="content-label">🚀 Call to Action</div>
            <div class="content-text">${item.cta}</div>
          </div>

          <div class="content-block">
            <div class="content-label">💛 Engagement Ideas</div>
            <div class="engagement-box">${engagement || '<div class="engagement-idea"><span>💡</span><span>Ask your audience what issue they would write a letter about.</span></div>'}</div>
          </div>

          <div class="content-block">
            <div class="content-label">🔑 Keywords <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--muted);font-size:10px">(SEO & discoverability)</span></div>
            <div class="tags-wrap">${keywords}</div>
          </div>

          <div class="content-block">
            <div class="content-label">🏷️ Hashtags</div>
            <div class="tags-wrap">${hashtags}</div>
          </div>

          <div class="card-actions">
            <button class="copy-btn" onclick="copyCaption(this, \`${safe}\`)">Copy caption</button>
            <button class="copy-btn" onclick="copyHashtags(this, \`${safe}\`)">Copy hashtags</button>
            <button class="copy-btn" onclick="copyKeywords(this, \`${safe}\`)">Copy keywords</button>
          </div>

        </div>
      </div>`;
  }).join('');

  document.getElementById('results').innerHTML = `
    <hr class="divider">
    <div class="results-header">
      <div class="section-label" style="margin-bottom:0">Generated — ${items.length} platform${items.length > 1 ? 's' : ''}</div>
      <div class="time-saved">⏱ ~${items.length * 30} mins saved</div>
    </div>
    ${cards}`;
}

function selectHeadline(el) {
  const list = el.closest('.headlines-list');
  list.querySelectorAll('.headline-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}

// ── COPY HELPERS ──
function flash(btn, label) {
  const orig = btn.textContent;
  btn.textContent = '✓ ' + label;
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2200);
}

function parseItem(raw) {
  // raw arrives as HTML-entity-encoded JSON string from the data-attr
  const txt = raw.replace(/&quot;/g, '"');
  return JSON.parse(txt);
}

function copyAll(btn, rawJson) {
  const item = JSON.parse(rawJson.replace(/&quot;/g, '"'));
  const headlineBlock = (item.headlines || [item.title || '']).map((h, i) => `Headline ${i+1}: ${h}`).join('\n');
  const text = [
    headlineBlock, '',
    item.caption, '',
    item.cta, '',
    'Keywords: ' + (item.keywords || []).join(', '), '',
    (item.hashtags || []).join(' ')
  ].join('\n');
  navigator.clipboard.writeText(text).then(() => flash(btn, 'Copied!'));
}

function copyCaption(btn, rawJson) {
  const item = JSON.parse(rawJson.replace(/&quot;/g, '"'));
  const selected = document.querySelector('.headline-option.selected .hl-text');
  const headline = selected ? selected.textContent : (item.headlines ? item.headlines[0] : item.title || '');
  navigator.clipboard.writeText(`${headline}\n\n${item.caption}\n\n${item.cta}`).then(() => flash(btn, 'Copied!'));
}

function copyHashtags(btn, rawJson) {
  const item = JSON.parse(rawJson.replace(/&quot;/g, '"'));
  navigator.clipboard.writeText((item.hashtags || []).join(' ')).then(() => flash(btn, 'Copied!'));
}

function copyKeywords(btn, rawJson) {
  const item = JSON.parse(rawJson.replace(/&quot;/g, '"'));
  navigator.clipboard.writeText((item.keywords || []).join(', ')).then(() => flash(btn, 'Copied!'));
}

function showError(msg) {
  const b = document.getElementById('errorBox');
  b.textContent = '⚠️ ' + msg; b.style.display = 'block';
}
function hideError() {
  document.getElementById('errorBox').style.display = 'none';
}
