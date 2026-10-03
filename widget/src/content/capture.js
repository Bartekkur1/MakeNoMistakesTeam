import { normalizeText, capCodePoints } from '../core/case.js';
import { HOST_TAG } from './host.js';

export function captureSelection(doc = document) {
  const ae = doc.activeElement;
  let raw;
  if (ae && (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && /^(text|search|url)$/i.test(ae.type)))) {
    raw = ae.value.slice(ae.selectionStart, ae.selectionEnd);
  } else if (ae?.tagName === 'INPUT' || ae?.tagName === 'IFRAME') {
    return { text: '', truncated: false };
  } else if (ae?.shadowRoot && ae.localName !== HOST_TAG) {
    return { text: '', truncated: false };
  } else {
    raw = doc.getSelection()?.toString() ?? '';
  }
  return capCodePoints(normalizeText(raw));
}
