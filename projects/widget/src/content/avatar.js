import { captureSelection } from './capture.js';
import avatarUrl from '../../../../assets/widget-avatar/avatar-128.png?inline';

export const DRAG_PX = 5;
export const AVATAR_SIZE = 64;
export const EDGE_MARGIN = 8;
export function isDrag(dx, dy) { return Math.hypot(dx, dy) > DRAG_PX; }
export function clampToViewport({ x, y }, { width, height }, size = AVATAR_SIZE, margin = EDGE_MARGIN) {
  const clamp = (v, extent) => Math.max(margin, Math.min(v, Math.max(margin, extent - size - margin)));
  return { x: clamp(x, width), y: clamp(y, height) };
}
export function createAvatar({ host, root, doc = document, strings, onActivate, onHide, onMove = () => {} }) {
  const wrap = doc.createElement('div');
  wrap.className = 'avatar-wrap';
  const button = doc.createElement('button');
  button.className = 'avatar';
  button.type = 'button';
  button.setAttribute('aria-label', strings.avatarLabel);
  button.title = strings.avatarTitle;
  const img = doc.createElement('img');
  img.src = avatarUrl;
  img.alt = '';
  img.width = 64;
  img.height = 64;
  img.draggable = false;
  button.append(img);
  wrap.append(button);
  root.append(wrap);
  button.addEventListener('mousedown', (event) => event.preventDefault());
  let start = null, offset = null, dragged = false, moved = false;
  const viewport = () => ({ width: doc.defaultView.innerWidth, height: doc.defaultView.innerHeight });
  function moveTo({ x, y }) {
    moved = true;
    for (const [key, value] of Object.entries({ left: x + 'px', top: y + 'px', right: 'auto', bottom: 'auto' })) host.style.setProperty(key, value, 'important');
    onMove(button.getBoundingClientRect());
  }
  button.addEventListener('pointerdown', e => {
    start = { x: e.clientX, y: e.clientY }; dragged = false;
    const rect = host.getBoundingClientRect(); offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    button.setPointerCapture?.(e.pointerId);
  });
  button.addEventListener('pointermove', e => {
    if (!start) return;
    if (isDrag(e.clientX - start.x, e.clientY - start.y)) dragged = true;
    if (dragged) { button.classList.add('dragging'); moveTo(clampToViewport({ x: e.clientX - offset.x, y: e.clientY - offset.y }, viewport())); }
  });
  for (const type of ['pointerup', 'pointercancel']) button.addEventListener(type, () => { start = null; button.classList.remove('dragging'); });
  button.addEventListener('click', () => {
    if (dragged) { dragged = false; return; }
    onActivate(captureSelection(doc));
  });
  const hide = doc.createElement('button'); hide.className = 'hide'; hide.type = 'button';
  hide.textContent = strings.closeSymbol; hide.setAttribute('aria-label', strings.hideLabel); hide.title = strings.hideTitle;
  hide.addEventListener('mousedown', e => e.preventDefault()); hide.addEventListener('click', () => onHide()); wrap.append(hide);
  return { el: button, rect: () => button.getBoundingClientRect(),
    reclamp(v) { if (moved) { const r = host.getBoundingClientRect(); moveTo(clampToViewport({ x: r.left, y: r.top }, v)); } },
    setHidden(hidden) { host.style.setProperty('display', hidden ? 'none' : 'block', 'important'); } };
}
