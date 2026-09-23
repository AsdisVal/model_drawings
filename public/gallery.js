async function loadDiary() {
  const res = await fetch('/diary.json');

  if (!res.ok) {
    throw new Error('Could not load diary');
  }

  return await res.json();
}

function cardHTML(entry, idx, medium) {
  const subtitle = entry.minutes ? `${entry.minutes} min · ${medium}` : medium;

  return `
    <div class="card">
      <img
        src="${entry.image}"
        alt="Gesture ${idx + 1}"
        class="card-img"
      />
      <h3>
        Gesture ${String(idx + 1).padStart(2, '0')}
      </h3>

        <span>${subtitle}</span>

        ${entry.comment ? `<p class="comment">${entry.comment}</p>` : ''}
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

  const diary = await loadDiary();

  for (const session of diary.sessions) {
    const cards =
      session.entries.length === 0
        ? `
          <p style="opacity:.7;padding:12px;">
            No drawings yet.
          </p>
        `
        : session.entries
            .map((entry, idx) => cardHTML(entry, idx, session.medium))
            .join('');

    root.insertAdjacentHTML(
      'beforeend',
      sessionHTML({
        title: session.title,
        date: session.date,
        cards,
      }),
    );
  }
}

render();
