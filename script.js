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

function fillTopic(text) {
  document.getElementById('topic').value = text;
  document.getElementById('topic').focus();
}

function getSelected(gridId, attr) {
  return [...document.querySelectorAll(`#${gridId} .chip.active`)].map(b => b.dataset[attr]);
}

const platformMeta = {
  'Facebook':  { icon: '📘', cls: 'fb', limit: '63,206 chars', captionNote: 'Can be longer & story-driven.' },
  'Instagram': { icon: '📸', cls: 'ig', limit: '2,200 chars',  captionNote: 'Visually driven; emojis work well.' },
  'LinkedIn':  { icon: '💼', cls: 'li', limit: '3,000 chars',  captionNote: 'Professional; thought-leadership tone.' },
  'Twitter/X': { icon: '🐦', cls: 'tw', limit: '280 chars',    captionNote: 'Keep it punchy & short.' },
};

async function generate() {
  const topic = document.getElementById('topic').value.trim();
  if (!topic) { showError('Please enter a topic or pick one from the quick picks above.'); return; }

  const platforms = getSelected('platformGrid', 'platform');
  if (!platforms.length) { showError('Please select at least one platform.'); return; }

  const tone = getSelected('toneGrid', 'tone')[0] || 'Inspiring & warm';
  const context = document.getElementById('context').value.trim();

  hideError();
  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.textContent = '⟳ Generating content…';

  document.getElementById('results').innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Writing content for ${platforms.join(', ')}…</p>
      <p class="loading-steps">Titles · Captions · Keywords · Hashtags</p>
    </div>`;

  const platformDetails = platforms.map(p => {
    const m = platformMeta[p] || {};
    return `- ${p}: ${m.captionNote || ''}`;
  }).join('\n');

  const prompt = `You are a social media content specialist for "Letters for Change" (LFC), a student-run non-profit based in Mumbai, India.

ABOUT LFC:
- Mission: Amplify children's voices and inspire change — "You voice it, we amplify it"
- Vision: A world where every child can speak up
- Children write letters on issues affecting them (climate, gender, rights, education, poverty). LFC amplifies these to lawmakers, policymakers, NGO leaders, and the public.
- Founded 2019 by 12-year-old Mahika Mishra. Completely student-run under Mahika Mishra Foundation (Section 8 non-profit).
- 639+ letters received from children up to age 17.
- Runs letter-writing workshops at schools; open to interns, volunteers, and donors.
- Partners: DLF Public School, Udaan Foundation, St. Jude India Childcare Centre, SAMPARC.
- Website: lettersforchange.ngo

POST REQUEST:
Topic: ${topic}
${context ? `Details: ${context}` : ''}
Tone: ${tone}
Platforms: ${platforms.join(', ')}

Platform guidance:
${platformDetails}

For EACH platform generate:
1. TITLE: Scroll-stopping headline, max 12 words
2. CAPTION: Platform-length caption with line breaks. LFC voice — warm, child-empowerment focused, mission-driven.
3. KEYWORDS: 6–8 SEO/discoverability keywords (plain words, no #)
4. HASHTAGS: 10–12 hashtags (always include #LettersForChange #AmplifyChildrensVoices)
5. CTA: One short call-to-action line

Return ONLY a valid JSON array, no markdown, no backticks:
[{"platform":"Facebook","title":"...","caption":"...","keywords":["..."],"hashtags":["#LettersForChange","..."],"cta":"..."}]`;

  try {
    const res = await fetch("https://lfc-content.sukriti7936.workers.dev/", {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: "You are an expert social media content writer. Return ONLY valid JSON array. No markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });
    const data = await res.json();
    if (!res.ok) { console.error(data); throw new Error(data.error?.message || "API Error"); }
    const rawText = data.choices?.[0]?.message?.content || "";
    const match = rawText.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Model did not return valid JSON");
    const parsed = JSON.parse(match[0]);
    renderResults(parsed);
  } catch (err) {
    console.error(err); showError(err.message || 'Something went wrong.');
    document.getElementById('results').innerHTML = '';
  }

  btn.disabled = false;
  btn.textContent = '✦ Generate Content for LFC';
}

function renderResults(items) {
  const cards = items.map(item => {
    const meta = platformMeta[item.platform] || { icon: '📣', cls: '', limit: '' };
    const safe = JSON.stringify(item).replace(/"/g, '&quot;');
    const keywords = (item.keywords || []).map(k => `<span class="keyword-tag">${k}</span>`).join('');
    const hashtags = (item.hashtags || []).map(h => `<span class="hashtag-tag">${h}</span>`).join('');
    return `
      <div class="result-card">
        <div class="result-header ${meta.cls}">
          <div class="platform-label">
            <span>${meta.icon}</span>
            <span>${item.platform}</span>
            ${meta.limit ? `<span class="char-badge">${meta.limit}</span>` : ''}
          </div>
          <button class="copy-btn primary" onclick="copyAll(this,${safe})">⎘ Copy all</button>
        </div>
        <div class="result-body">
          <div class="content-block">
            <div class="content-label">📌 Title / Headline</div>
            <div class="content-text">${item.title}</div>
          </div>
          <div class="content-block">
            <div class="content-label">✍️ Caption</div>
            <div class="content-text">${item.caption}</div>
          </div>
          <div class="content-block">
            <div class="content-label">🔗 Call to Action</div>
            <div class="content-text">${item.cta}</div>
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
            <button class="copy-btn" onclick="copyCaption(this,${safe})">Copy caption</button>
            <button class="copy-btn" onclick="copyHashtags(this,${safe})">Copy hashtags</button>
            <button class="copy-btn" onclick="copyKeywords(this,${safe})">Copy keywords</button>
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('results').innerHTML = `
    <hr class="divider">
    <div class="results-header">
      <div class="section-label" style="margin-bottom:0">Generated — ${items.length} platform${items.length > 1 ? 's' : ''}</div>
      <div class="time-saved">⏱ ~${items.length * 25} mins saved</div>
    </div>
    ${cards}`;
}

function flash(btn, label) {
  const orig = btn.textContent;
  btn.textContent = '✓ ' + label;
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2200);
}
function copyAll(btn, item) {
  const text = [item.title,'',item.caption,'',item.cta,'','Keywords: '+(item.keywords||[]).join(', '),'',(item.hashtags||[]).join(' ')].join('\n');
  navigator.clipboard.writeText(text).then(() => flash(btn,'Copied!'));
}
function copyCaption(btn, item) {
  navigator.clipboard.writeText(`${item.title}\n\n${item.caption}\n\n${item.cta}`).then(() => flash(btn,'Copied!'));
}
function copyHashtags(btn, item) {
  navigator.clipboard.writeText((item.hashtags||[]).join(' ')).then(() => flash(btn,'Copied!'));
}
function copyKeywords(btn, item) {
  navigator.clipboard.writeText((item.keywords||[]).join(', ')).then(() => flash(btn,'Copied!'));
}
function showError(msg) {
  const b = document.getElementById('errorBox');
  b.textContent = msg; b.style.display = 'block';
}
function hideError() {
  document.getElementById('errorBox').style.display = 'none';
}
