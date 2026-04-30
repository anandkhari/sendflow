export function trackPixel(url) {
  if (!url) return '';
  return `<img src="${url}" alt="" width="1" height="1" style="display:none;" />`;
}
