// Cart helper functions

// Get cart items from localStorage
export const getCartItems = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
    return [];
  }
};

// Add item to cart
export const addToCart = (training) => {
  const cart = getCartItems();
  
  // Check if training is already in cart
  const existingItem = cart.find(item => item.id === training.id);
  
  if (!existingItem) {
    const updatedCart = [...cart, {
      id: training.id,
      title: training.title,
      price: training.price,
      image: training.image,
      addedAt: new Date().toISOString()
    }];
    
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    // Dispatch storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cart',
      newValue: JSON.stringify(updatedCart)
    }));
    return true;
  }
  return false;
};

// Remove item from cart
export const removeFromCart = (trainingId) => {
  const cart = getCartItems();
  const updatedCart = cart.filter(item => item.id !== trainingId);
  
  localStorage.setItem('cart', JSON.stringify(updatedCart));
  // Dispatch storage event for other tabs
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'cart',
    newValue: JSON.stringify(updatedCart)
  }));
  return true;
};

// Clear cart
export const clearCart = () => {
  localStorage.removeItem('cart');
  // Dispatch storage event for other tabs
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'cart',
    newValue: JSON.stringify([])
  }));
};

// Get cart total
export const getCartTotal = () => {
  const cart = getCartItems();
  return cart.reduce((total, item) => total + item.price, 0);
}; 