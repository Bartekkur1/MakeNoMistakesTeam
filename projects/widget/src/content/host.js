import paletteCss from '../../../../assets/scamerino_palette.css?raw';
import widgetCss from '../ui/widget.css?raw';

export const HOST_TAG = 'bezpieczna-aura-widget';
export function buildStyleText(palette, widget) {
  return palette.replace(':root', ':host') + '\n' + widget;
}
export const STYLE_TEXT = buildStyleText(paletteCss, widgetCss);
export function createHost(doc = document) {
  const host = doc.createElement(HOST_TAG);
  for (const [key, value] of Object.entries({ position: 'fixed', right: '24px', bottom: '96px', 'z-index': '2147483647', width: '64px', height: '64px', display: 'block' })) {
    host.style.setProperty(key, value, 'important');
  }
  const root = host.attachShadow({ mode: 'open' });
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLE_TEXT);
    root.adoptedStyleSheets = [sheet];
  } catch {
    const style = doc.createElement('style');
    style.textContent = STYLE_TEXT;
    root.append(style);
  }
  for (const type of ['keydown', 'keyup', 'keypress', 'beforeinput', 'input', 'paste', 'copy', 'cut']) {
    root.addEventListener(type, (event) => event.stopPropagation());
  }
  doc.documentElement.append(host);
  return { host, root };
}
