'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumb";
import CartInner from "@/components/CartInner";
import CertificateOne from "@/components/CertificateOne";
import FooterOne from "@/components/FooterOne";
import HeaderStudent from "@/components/Header";
import Animation from "@/helper/Animation";
import { toast } from 'react-hot-toast';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Load cart items from localStorage
    const savedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(savedCartItems);
    // Calculate total
    const cartTotal = savedCartItems.reduce((sum, item) => sum + (item.price || 0), 0);
    setTotal(cartTotal);
  }, []);

  const removeFromCart = (formationId) => {
    const updatedCartItems = cartItems.filter(item => item._id !== formationId);
    setCartItems(updatedCartItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
    // Update total
    const newTotal = updatedCartItems.reduce((sum, item) => sum + (item.price || 0), 0);
    setTotal(newTotal);
    // Dispatch event to update header cart
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    toast.success('Formation retirée du panier');
  };

  return (
    <>
      {/* Animation */}
      <Animation />

      {/* HeaderStudent */}
      <HeaderStudent />

      {/* Breadcrumb */}
      <Breadcrumb title={"Cart List"} />

      {/* CartInner */}
      <CartInner cartItems={cartItems} total={total} removeFromCart={removeFromCart} />

      {/* CertificateOne */}
      <CertificateOne />

      {/* FooterOne */}
      <FooterOne />
    </>
  );
};

export default CartPage;
