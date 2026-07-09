export function formatPrice(price) {
  const value = Number(price) || 0;
  return `$${value.toLocaleString('en-US')}`;
}