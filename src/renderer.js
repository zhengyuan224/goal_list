/* =============================================
   Goal Tracker — Renderer / Task Logic
   v2: electron-store persistence + HTML5 DnD
   ============================================= */

'use strict';

// ── State ─────────────────────────────────────
let tasks    = [];
let isPinned = true;

// Drag state
let dragSrcId  = null;   // id (number) of the row being dragged
let dragOverId = null;   // id (number) of the current drop target

// ── DOM refs ───────────────────────────────────
const taskList      = document.getElementById('task-list');
const taskInput     = document.getElementById('task-input');
const progressBar   = document.getElementById('progress-bar');
const progressCount = document.getElementById('progress-count');
const clearBar      = document.getElementById('clear-bar');
const pinBtn        = document.getElementById('pin-btn');

// ── Bootstrap (async — wait for store) ────────
(async () => {
  tasks = (await window.electronAPI.getTasks()) || [];
  renderAll();
  bindKeyboard();
  bindContainerDrop(); // Bind drop-to-bottom
})();

// ── Storage ────────────────────────────────────
async function saveTasks() {
  await window.electronAPI.setTasks(tasks);
}

// ── Core Actions ───────────────────────────────
async function addTask() {
  const text = taskInput.value.trim();
  if (!text) { taskInput.focus(); return; }

  const task = { id: Date.now(), text, done: false };
  tasks.unshift(task);
  await saveTasks();
  taskInput.value = '';
  prependTaskRow(task);
  updateMeta();
  taskInput.focus();
}

async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  await saveTasks();
  const row = getRow(id);
  if (row) {
    row.classList.toggle('done', task.done);
    const cb = row.querySelector('.task-checkbox');
    if (cb) cb.checked = task.done;
  }
  updateMeta();
}

async function deleteTask(id) {
  const row = getRow(id);
  if (!row) return;

  row.classList.add('removing');
  row.addEventListener('animationend', async () => {
    tasks = tasks.filter(t => t.id !== id);
    await saveTasks();
    row.remove();
    updateMeta();
    maybeShowEmpty();
  }, { once: true });
}

async function clearCompleted() {
  const doneIds = tasks.filter(t => t.done).map(t => t.id);
  // Remove all at once from data then update DOM
  doneIds.forEach(id => {
    const row = getRow(id);
    if (row) {
      row.classList.add('removing');
      row.addEventListener('animationend', () => {
        row.remove();
        maybeShowEmpty();
      }, { once: true });
    }
  });
  tasks = tasks.filter(t => !t.done);
  await saveTasks();
  updateMeta();
}

// ── Window Controls ───────────────────────────
async function togglePin() {
  if (!window.electronAPI) return;
  isPinned = await window.electronAPI.toggleAlwaysOnTop();
  pinBtn.classList.toggle('active', isPinned);
}

// ── Drag & Drop ───────────────────────────────
function onDragStart(e, id) {
  dragSrcId = id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(id));
  // Delay class so the drag ghost image is clean
  requestAnimationFrame(() => {
    const row = getRow(id);
    if (row) row.classList.add('dragging');
  });
}

function onDragOver(e, id) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (id === dragSrcId || id === dragOverId) return;

  // Clear old indicator
  if (dragOverId !== null) {
    const prev = getRow(dragOverId);
    if (prev) prev.classList.remove('drag-over');
  }
  dragOverId = id;
  const row = getRow(id);
  if (row) row.classList.add('drag-over');
}

function onDragLeave(e, id) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    const row = getRow(id);
    if (row) row.classList.remove('drag-over');
    if (dragOverId === id) dragOverId = null;
  }
}

async function onDrop(e, targetId) {
  e.preventDefault();
  e.stopPropagation();

  if (dragSrcId === null || dragSrcId === targetId) return;

  const srcIdx  = tasks.findIndex(t => t.id === dragSrcId);
  const destIdx = tasks.findIndex(t => t.id === targetId);
  if (srcIdx < 0 || destIdx < 0) return;

  // ── KEY FIX: splice the item out first, then insert at the
  // correct adjusted index. When dragging downward (srcIdx < destIdx)
  // the removal shifts every subsequent element up by 1, so the
  // effective insertion index is destIdx - 1.
  const [moved] = tasks.splice(srcIdx, 1);
  const insertAt = srcIdx < destIdx ? destIdx - 1 : destIdx;
  tasks.splice(insertAt, 0, moved);

  // Persist first, then sync DOM from source-of-truth
  await saveTasks();
  renderAll();
}

function onDragEnd(e, id) {
  // Clean up all state classes regardless of drop success
  taskList.querySelectorAll('.task-row').forEach(r =>
    r.classList.remove('dragging', 'drag-over')
  );
  dragSrcId  = null;
  dragOverId = null;
}

// ── Drop to Bottom (Container Drop) ───────────
function bindContainerDrop() {
  taskList.addEventListener('dragover', e => {
    // Only allow drop if we are dragging a task
    if (dragSrcId !== null) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });

  taskList.addEventListener('drop', async e => {
    // Only trigger if dropped directly on the container (ul padding) 
    // and not handled by an inner li (which stops propagation)
    if (e.target === taskList && dragSrcId !== null) {
      e.preventDefault();
      
      const srcIdx = tasks.findIndex(t => t.id === dragSrcId);
      if (srcIdx < 0) return;
      
      const [moved] = tasks.splice(srcIdx, 1);
      tasks.push(moved); // Move to end of array
      
      await saveTasks();
      renderAll();
      
      dragSrcId = null;
      dragOverId = null;
    }
  });
}

// ── Rendering ─────────────────────────────────
function renderAll() {
  taskList.innerHTML = '';
  if (tasks.length === 0) {
    showEmpty();
  } else {
    tasks.forEach(task => taskList.appendChild(createRow(task)));
  }
  updateMeta();
}

function prependTaskRow(task) {
  const empty = taskList.querySelector('.empty-state');
  if (empty) empty.remove();
  taskList.prepend(createRow(task));
}

function createRow(task) {
  const li = document.createElement('li');
  li.className = 'task-row' + (task.done ? ' done' : '');
  li.dataset.id = task.id;
  li.setAttribute('role', 'listitem');
  li.setAttribute('draggable', 'true');

  // DnD events
  li.addEventListener('dragstart', e => onDragStart(e, task.id));
  li.addEventListener('dragover',  e => onDragOver(e, task.id));
  li.addEventListener('dragleave', e => onDragLeave(e, task.id));
  li.addEventListener('drop',      e => onDrop(e, task.id));
  li.addEventListener('dragend',   e => onDragEnd(e, task.id));

  li.innerHTML = `
    <div class="drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
      ${iconGrip()}
    </div>
    <input
      type="checkbox"
      class="task-checkbox"
      ${task.done ? 'checked' : ''}
      aria-label="Mark task complete"
    />
    <span class="task-text">${escapeHtml(task.text)}</span>
    <div class="task-actions" role="group" aria-label="Task actions">
      <button class="action-btn delete-btn"
              data-tooltip="Delete" aria-label="Delete task">
        ${iconTrash()}
      </button>
    </div>
  `;

  // Prevent drag from starting unless on the grip handle
  li.addEventListener('mousedown', e => {
    const onHandle = e.target.closest('.drag-handle');
    li.setAttribute('draggable', onHandle ? 'true' : 'false');
  });

  // Checkbox
  li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
  // Delete
  li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

  return li;
}

function showEmpty() {
  taskList.innerHTML = `
    <li class="empty-state">
      <svg class="empty-icon" width="36" height="36" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="3"/>
        <path d="M8 3v4M16 3v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01"/>
      </svg>
      <p>No goals yet.<br/>Add something you want to achieve.</p>
    </li>
  `;
}

function maybeShowEmpty() {
  if (tasks.length === 0) showEmpty();
}

// ── Meta (progress + clear bar) ───────────────
function updateMeta() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  progressBar.style.width   = pct + '%';
  progressCount.textContent = `${done} / ${total}`;
  clearBar.classList.toggle('visible', done > 0);
}

// ── Helpers ───────────────────────────────────
function getRow(id) {
  return taskList.querySelector(`.task-row[data-id="${id}"]`);
}

function bindKeyboard() {
  taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
    if (e.key === 'Escape') taskInput.blur();
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── SVG Icon Helpers ──────────────────────────
function iconGrip() {
  // 6-dot grip icon (2×3 grid)
  return `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5" cy="4" r="1.5"/>
    <circle cx="11" cy="4" r="1.5"/>
    <circle cx="5" cy="8" r="1.5"/>
    <circle cx="11" cy="8" r="1.5"/>
    <circle cx="5" cy="12" r="1.5"/>
    <circle cx="11" cy="12" r="1.5"/>
  </svg>`;
}

function iconTrash() {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>`;
}
