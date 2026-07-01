export function upsertCartItem(items, product) {
  const productId = product.id ?? product.name?.toLowerCase().replace(/\s+/g, '-');
  const normalizedProduct = {
    ...product,
    id: productId,
    quantity: 1,
  };

  const existingItemIndex = items.findIndex((item) => {
    if (item.id && normalizedProduct.id) {
      return item.id === normalizedProduct.id;
    }
    return item.name === normalizedProduct.name;
  });

  if (existingItemIndex > -1) {
    const updatedItems = [...items];
    updatedItems[existingItemIndex] = {
      ...updatedItems[existingItemIndex],
      ...normalizedProduct,
      quantity: updatedItems[existingItemIndex].quantity + 1,
    };
    return updatedItems;
  }

  return [...items, normalizedProduct];
}
