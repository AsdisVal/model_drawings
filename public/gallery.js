let COMMENTS = {};

const SESSIONS = [
  {
    title: '#1',
    date: '8-jan-2026',
    dir: '2025/jan/8',
    defaultMedium: 'Blýantur',
  },
  {
    title: '#2',
    date: '15-jan-2026',
    dir: '2025/jan/15',
    defaultMedium: 'Kol',
  },
  {
    title: '#3',
    date: '22-nov-2025',
    dir: '2025/nov/22',
    defaultMedium: 'Blýantur',
  },
  {
    title: '#4',
    date: '6-des-2025',
    dir: '2025/des/6',
    defaultMedium: 'Kol',
  },
];

async function loadComments() {
  try {
    const res = await fetch('/api/comments');
    COMMENTS = await res.json();
  } catch (e) {
    COMMENTS = {};
  }
}

async function saveComment(image) {
  const textarea = document.querySelector(`textarea[data-image="${image}"]`);

  if (!textarea) return;

  try {
    await fetch('/api/comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        comment: textarea.value,
      }),
    });
  } catch (e) {
    console.error('Failed to save comment', e);
  }
}

window.saveComment = saveComment;

function inferInfoFromFilename(url, fallbackMedium) {
  const file = url.split('/').pop() || '';
  const name = file.replace(/\.[^.]+$/, '');

  let minutes = null;

  const mm = name.match(/^(\d+)(m|min)/i);

  if (mm) {
    minutes = `${mm[1]} min`;
  }

  let medium = fallbackMedium || '';

  if (name.includes('_rb')) {
    medium = 'Rauður og blár litur';
  } else if (name.includes('_k')) {
    medium = 'Kol';
  } else if (name.includes('_b')) {
    medium = 'Blýantur';
  }

  return {
    minutes,
    medium,
  };
}

async function fetchImages(dir) {
  const res = await fetch(`/api/list?dir=${encodeURIComponent(dir)}`);

  if (!res.ok) {
    throw new Error('Could not list folder');
  }

  const data = await res.json();

  return data.files || [];
}

function cardHTML({ src, idx, date, defaultMedium }) {
  const { minutes, medium } = inferInfoFromFilename(src, defaultMedium);

  const subtitle =
    minutes && medium ? `${minutes} · ${medium}` : minutes || medium || '';

  const title = `Gesture ${String(idx + 1).padStart(2, '0')}`;

  const comment = COMMENTS[src]?.comment || '';

  return `
    <div class="card">

      ${src}"
        loading="lazy"
      />

      <div class="info">
        <h3>${title}</h3>
        <span>${subtitle}</span>

        <textarea
          class="comment-box"
          data-image="${src}"
          placeholder="Athugasemd..."
          onclick="event.stopPropagation()"
          onblur="saveComment('${src}')"
        >${comment}</textarea>
      </div>

    </div>
  `;
}

function sessionHTML({ title, date, cards }) {
  return `
    <section
      class="session"
      onclick="toggleSession(this)"
    >

      <div class="session-header">
        <h2 class="session-title">
          ${title}
        </h2>

        <div class="session-meta">
          <span>${date}</span>
          <span class="chev">›</span>
        </div>
      </div>

      <div class="session-body">
        <div class="gallery">
          ${cards}
        </div>
      </div>

    </section>
  `;
}

async function render() {
  const root = document.getElementById('sessions');

  root.innerHTML = '';

  for (const s of SESSIONS) {
    let files = [];

    try {
      files = await fetchImages(s.dir);
    } catch (e) {
      files = [];
    }

    const cards =
      files.length === 0
        ? `
          <p style="opacity:.7;padding:12px;">
            No images found in
            <code>/${s.dir}</code>
          </p>
        `
        : files
            .map((src, idx) =>
              cardHTML({
                src,
                idx,
                date: s.date,
                defaultMedium: s.defaultMedium,
              }),
            )
            .join('');

    root.insertAdjacentHTML(
      'beforeend',
      sessionHTML({
        ...s,
        cards,
      }),
    );
  }
}

async function init() {
  await loadComments();
  await render();
}

init();
