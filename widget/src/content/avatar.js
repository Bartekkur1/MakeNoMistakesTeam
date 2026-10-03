import { captureSelection } from './capture.js';
import avatarUrl from '../../../assets/widget-avatar/avatar-128.png?inline';

export function createAvatar({ host, root, doc = document, strings, onActivate }) {
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
  button.addEventListener('click', () => onActivate(captureSelection(doc)));
  return { el: button, rect: () => button.getBoundingClientRect(),
    setHidden(hidden) { host.style.setProperty('display', hidden ? 'none' : 'block', 'important'); } };
}
