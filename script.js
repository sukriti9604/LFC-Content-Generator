const platformMeta = {
  'Facebook':  { icon: '📘', cls: 'fb', limit: '63,206 chars', label: 'Facebook'  },
  'Instagram': { icon: '📸', cls: 'ig', limit: '2,200 chars',  label: 'Instagram'  },
  'LinkedIn':  { icon: '💼', cls: 'li', limit: '3,000 chars',  label: 'LinkedIn'   },
  'Twitter/X': { icon: '🐦', cls: 'tw', limit: '280 chars',    label: 'Twitter / X' },
};

const platformGuide = {
  'Facebook': `
    - Tone: conversational, warm, community-driven. Stories work best.
    - Structure: Hook (1 arresting line) → Story (context, real details, emotion over 4-6 lines) → Reflection (1-2 lines of broader significance) → CTA
    - The story must add REAL value — explain why this matters, what changed, what was at stake.
    - Emojis: maximum 2, only where they genuinely add warmth.
    - Caption length: 150-250 words.
    - CTA: one line, no emoji. e.g. "Share this if you believe every child deserves to be heard."`,
  'Instagram': `
    - Tone: direct, human, emotionally resonant. Not performative or hype-y.
    - Structure: First line = hook (standalone sentence in the feed) → 3-4 lines of specific story → CTA
    - First line examples: "A 10-year-old just wrote to the Chief Minister. Here's what she said." or "This letter changed something."
    - Emojis: maximum 3 total. Only when replacing a word naturally.
    - Caption length: 80-120 words.
    - CTA: short, one line. e.g. "Read the full letter — link in bio."`,
  'LinkedIn': `
    - Tone: thoughtful, professional, impact-focused. For educators, policymakers, NGO leaders, donors.
    - Structure: Opening insight or surprising fact → Story with specific detail → Larger systemic point → What LFC is doing → CTA
    - Add depth: connect the story to policy gaps, civic education, or systemic issues.
    - Emojis: zero, or at most 1 used very deliberately.
    - Caption length: 180-220 words.
    - CTA: professional and specific. e.g. "If your school wants to run a letter-writing workshop, reach out."`,
  'Twitter/X': `
    - Tone: sharp, honest, no fluff.
    - Structure: 1 bold or surprising statement → 1 line of context → CTA or question
    - Write it like a tweet you'd actually stop scrolling for.
    - Emojis: 0 or 1 maximum.
    - Caption length: 220-260 chars (leave room for a link).
    - CTA: punchy. e.g. "Read the letter." or "What would you write about?"`,
};

function getSelectedPlatforms() {
  return [...document.querySelectorAll('#platformGrid .chip.active')].map(b => b.dataset.platform);
}

function getSelectedTone() {
  const active = document.querySelector('#toneGrid .chip.active');
  return active ? active.dataset.tone : 'Inspiring & warm';
}

// Maps whatever platform string the model returned back to one of our
// canonical platform keys, so we can match it against what the user
// actually selected (models sometimes rename/duplicate platforms).
function normalizePlatformName(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('twitter') || n.includes('/x') || n.trim() === 'x') return 'Twitter/X';
  if (n.includes('facebook')) return 'Facebook';
  if (n.includes('instagram')) return 'Instagram';
  if (n.includes('linkedin')) return 'LinkedIn';
  return null;
}

// Keeps only the items that correspond to a selected platform, in the
// order the user selected them, and at most one item per platform.
// This is what prevents "generate for all platforms" and "duplicate
// carousel for the same platform" even if the model over-generates.
function reconcileItems(items, platforms) {
  const used = new Set();
  const result = [];
  platforms.forEach(p => {
    const match = (items || []).find(it => !used.has(it) && normalizePlatformName(it.platform) === p);
    if (match) {
      match.platform = p; // canonicalize label so ids/tabs are consistent
      used.add(match);
      result.push(match);
    }
  });
  return result;
}

async function generate() {
  const topic = document.getElementById('topic').value.trim();
  if (!topic) { showError('Please enter a topic or pick one from the quick picks above.'); return; }

  const platforms = getSelectedPlatforms();
  if (!platforms.length) { showError('Please select at least one platform.'); return; }

  const tone    = getSelectedTone();
  const context = document.getElementById('context').value.trim();

  hideError();

  const btn   = document.getElementById('generateBtn');
  const regen = document.getElementById('regenBtn');
  btn.disabled = true;
  btn.textContent = '⟳ Generating…';
  if (regen) regen.disabled = true;

  document.getElementById('envelopeCelebration').classList.remove('show');
  document.getElementById('carouselWrap').style.display = 'none';

  // Show loading inside carousel area immediately
  document.getElementById('platformTabs').innerHTML = '';
  document.getElementById('carouselSlides').innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Crafting content for ${platforms.join(', ')}…</p>
      <p class="loading-steps">Headlines · Hook → Story → CTA · Hashtags · Engagement ideas</p>
    </div>`;
  document.getElementById('carouselWrap').style.display = 'block';

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
- Sound like a real person — warm, specific, human. NO AI-sounding phrases.
- Banned openers: "In a world where...", "We are excited to announce...", "It's time to...", "Together we can...", "Join us on our journey..."
- Use contractions naturally. Confidence over corporate enthusiasm.
- Vary sentence length — short for punch, longer for story.
- NEVER pad with filler. Every sentence must earn its place.
- Emojis are a LAST resort. If in doubt, leave them out.
- Follow Hook → Story → CTA. The story is where most captions are weak — push for specificity and emotional truth.
- CTAs must feel like a real invitation. Banned: "Apply Now", "Click here", "Learn more", "Join us".
  Good: "Tell us what you'd write about.", "Share this if it moved you.", "Help us carry this letter further."

POST REQUEST:
Topic: ${topic}
${context ? `Details / context: ${context}` : ''}
Tone: ${tone}

PLATFORM-SPECIFIC GUIDELINES:
${platformSections}

STRICT PLATFORM SCOPE:
- Generate content ONLY for these ${platforms.length} platform(s), in this exact order: ${platforms.join(', ')}.
- Do NOT generate content for any other platform, even if you think it would help.
- Return an array with EXACTLY ${platforms.length} object(s) - one per listed platform, no more, no fewer, no duplicates.

FOR EACH PLATFORM return exactly this JSON structure:
{
  "platform": "...",
  "headlines": ["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"],
  "caption": "...",
  "cta": "...",
  "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6"],
  "hashtags": ["#LettersForChange", "#AmplifyChildrensVoices", "...8-10 more platform-specific tags"],
  "engagement": ["Engagement idea 1", "Engagement idea 2"]
}

HEADLINE RULES:
- Exactly 5 per platform, each a genuinely different angle.
- Types: (1) Specific fact/number, (2) Emotional moment, (3) Curiosity gap, (4) Bold/counterintuitive take, (5) Direct question.
- Max 10 words. No ellipses. No exclamation marks. No quotes inside the headline.
- Bad: "Letters for Change Is Making a Difference!", "Children's Voices Matter — Here's Why"
- Good: "A 12-year-old wrote to the Prime Minister. He listened.", "What does a child's letter actually change?", "639 letters. One mission. Still going."

HASHTAG RULES:
- Platform-specific and topic-relevant.
- Instagram: trending/discovery. LinkedIn: professional niche. Twitter/X: max 5 concise tags.
- Always include: #LettersForChange #AmplifyChildrensVoices

ENGAGEMENT IDEAS:
- 2 short, specific ideas. e.g. "Ask: What would YOU write a letter about?" or "Poll: Should schools teach children their rights? Yes / No"

Return ONLY a valid JSON array, no markdown, no backticks:
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
    if (!res.ok) throw new Error(data.error?.message || "API Error");

    const rawText = data.choices?.[0]?.message?.content || "";
    const match   = rawText.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Model did not return valid JSON");

    let parsed = JSON.parse(match[0]);
    parsed = reconcileItems(parsed, platforms);
    if (!parsed.length) throw new Error("The model didn't return content for the platform(s) you selected. Please try again.");
    renderCarousel(parsed);

    const cel = document.getElementById('envelopeCelebration');
    cel.classList.remove('show');
    void cel.offsetWidth;
    cel.classList.add('show');
    cel.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (err) {
    console.error(err);
    showError(err.message || 'Something went wrong. Please try again.');
    document.getElementById('carouselWrap').style.display = 'none';
  }

  btn.disabled = false;
  btn.textContent = '✦ Generate Content for LFC';
  if (regen) regen.disabled = false;
}

function renderCarousel(items) {
  // Store items in a module-level map keyed by index — no JSON in HTML attrs
  window._lfcItems = {};
  items.forEach((item, i) => { window._lfcItems[i] = item; });

  const tabsHtml = items.map((item, i) => {
    const meta = platformMeta[item.platform] || { icon: '📣', label: item.platform };
    return `<button class="platform-tab ${i === 0 ? 'active' : ''}" data-p="${item.platform}" onclick="showSlide('${item.platform}')">${meta.icon} ${meta.label}</button>`;
  }).join('');

  const slidesHtml = items.map((item, i) => {
    const meta = platformMeta[item.platform] || { icon: '📣', cls: '', limit: '', label: item.platform };

    const headlines = (item.headlines || []).map((hl, idx) => `
      <div class="headline-option" onclick="selectHeadline(this)">
        <div class="hl-num">${idx + 1}</div>
        <div class="hl-text">${hl}</div>
      </div>`).join('');

    const keywords   = (item.keywords   || []).map(k => `<span class="keyword-tag">${k}</span>`).join('');
    const hashtags   = (item.hashtags   || []).map(h => `<span class="hashtag-tag">${h}</span>`).join('');
    const engagement = (item.engagement || []).map(e => `<div class="engagement-idea"><span>💡</span><span>${e}</span></div>`).join('');

    return `
      <div class="carousel-slide ${i === 0 ? 'active' : ''}" id="slide-${item.platform.replace('/','_')}" data-idx="${i}">
        <div class="result-card">
          <div class="result-header ${meta.cls}">
            <div class="platform-label">
              <span>${meta.icon}</span>
              <span>${meta.label}</span>
              ${meta.limit ? `<span class="char-badge">${meta.limit}</span>` : ''}
            </div>
            <button class="copy-btn primary" onclick="copyAll(this)">⎘ Copy all</button>
          </div>
          <div class="result-body">
            <div class="content-block">
              <div class="content-label">Headlines — pick your favourite</div>
              <div class="headlines-list">${headlines}</div>
            </div>
            <div class="content-block">
              <div class="content-label">Caption (Hook → Story → CTA)</div>
              <div class="content-text">${item.caption}</div>
            </div>
            <div class="content-block">
              <div class="content-label">Call to Action</div>
              <div class="content-text">${item.cta}</div>
            </div>
            <div class="content-block">
              <div class="content-label">Engagement Ideas</div>
              <div class="engagement-box">${engagement || '<div class="engagement-idea"><span>💡</span><span>Ask your audience what issue they would write a letter about.</span></div>'}</div>
            </div>
            <div class="content-block">
              <div class="content-label">Keywords <span style="font-weight:500;text-transform:none;letter-spacing:0;color:var(--muted);font-size:10px">(SEO)</span></div>
              <div class="tags-wrap">${keywords}</div>
            </div>
            <div class="content-block">
              <div class="content-label">Hashtags</div>
              <div class="tags-wrap">${hashtags}</div>
            </div>
            <div class="card-actions">
              <button class="copy-btn" onclick="copyCaption(this)">Copy caption</button>
              <button class="copy-btn" onclick="copyHashtags(this)">Copy hashtags</button>
              <button class="copy-btn" onclick="copyKeywords(this)">Copy keywords</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('platformTabs').innerHTML   = tabsHtml;
  document.getElementById('carouselSlides').innerHTML = slidesHtml;
  document.getElementById('timeSaved').textContent    = `~${items.length * 30} mins saved`;
  document.getElementById('carouselWrap').style.display = 'block';
}

function getItemForBtn(btn) {
  const slide = btn.closest('.carousel-slide');
  const idx   = parseInt(slide.dataset.idx, 10);
  return window._lfcItems[idx];
}

function selectHeadline(el) {
  el.closest('.headlines-list').querySelectorAll('.headline-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}

// ── COPY HELPERS ──
function flash(btn, label) {
  const orig = btn.textContent;
  btn.textContent = '✓ ' + label;
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2200);
}

function copyAll(btn) {
  const item = getItemForBtn(btn);
  const selectedEl = btn.closest('.result-card').querySelector('.headline-option.selected .hl-text');
  const headlineBlock = selectedEl
    ? `Headline: ${selectedEl.textContent}`
    : (item.headlines || []).map((h, i) => `Headline ${i+1}: ${h}`).join('\n');
  const text = [headlineBlock, '', item.caption, '', item.cta, '', 'Keywords: ' + (item.keywords || []).join(', '), '', (item.hashtags || []).join(' ')].join('\n');
  navigator.clipboard.writeText(text).then(() => flash(btn, 'Copied!'));
}

function copyCaption(btn) {
  const item     = getItemForBtn(btn);
  const selected = btn.closest('.result-card').querySelector('.headline-option.selected .hl-text');
  const headline = selected ? selected.textContent : (item.headlines?.[0] || '');
  navigator.clipboard.writeText(`${headline}\n\n${item.caption}\n\n${item.cta}`).then(() => flash(btn, 'Copied!'));
}

function copyHashtags(btn) {
  const item = getItemForBtn(btn);
  navigator.clipboard.writeText((item.hashtags || []).join(' ')).then(() => flash(btn, 'Copied!'));
}

function copyKeywords(btn) {
  const item = getItemForBtn(btn);
  navigator.clipboard.writeText((item.keywords || []).join(', ')).then(() => flash(btn, 'Copied!'));
}

function showError(msg) {
  const b = document.getElementById('errorBox');
  b.textContent = '⚠️ ' + msg; b.style.display = 'block';
}
function hideError() {
  document.getElementById('errorBox').style.display = 'none';
}
