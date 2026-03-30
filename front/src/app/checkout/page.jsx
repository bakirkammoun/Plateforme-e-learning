'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import HeaderStudent from '@/components/Header';
import { toast } from 'react-hot-toast';
import Breadcrumb from "@/components/Breadcrumb";
import Animation from "@/helper/Animation";

const CheckoutPage = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(items);
    if (items.length === 0) {
      router.push('/formations');
    }
  }, [router]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validation du nom
    if (formData.name.trim().length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }

    // Validation du numéro de carte
    const cardNumberRegex = /^[0-9]{16}$/;
    if (!cardNumberRegex.test(formData.cardNumber)) {
      newErrors.cardNumber = 'Le numéro de carte doit contenir 16 chiffres';
    }

    // Validation de la date d'expiration
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Format invalide (MM/YY)';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiry < new Date()) {
        newErrors.expiryDate = 'La carte a expiré';
      }
    }

    // Validation du CVV
    const cvvRegex = /^[0-9]{3}$/;
    if (!cvvRegex.test(formData.cvv)) {
      newErrors.cvv = 'Le CVV doit contenir 3 chiffres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatage en temps réel
    switch (name) {
      case 'cardNumber':
        formattedValue = value.replace(/\D/g, '').slice(0, 16);
        break;
      case 'expiryDate':
        formattedValue = value
          .replace(/\D/g, '')
          .slice(0, 4)
          .replace(/(\d{2})(\d{2})/, '$1/$2')
          .replace(/(\d{2})(\d{1})/, '$1/$2');
        break;
      case 'cvv':
        formattedValue = value.replace(/\D/g, '').slice(0, 3);
        break;
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Effacer l'erreur lors de la modification
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    // Reset form data immediately after validation
    setFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      name: ''
    });

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('You must be logged in to make a purchase');
        router.push('/login');
        return;
      }

      // Récupérer l'ID de l'utilisateur
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user._id || user.id;

      if (!userId) {
        toast.error('Cannot identify user');
        return;
      }

      // Create enrollments for each course
      for (const item of cartItems) {
        await axios.post(
          'http://localhost:5000/api/enrollments', 
          { 
            formationId: item._id,
            status: 'pending'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Créer une notification de paiement pour l'admin
      await axios.post(
        'http://localhost:5000/api/notifications',
        {
          type: 'payment_completed',
          message: `Nouveau paiement effectué pour ${cartItems.length} formation(s)`,
          recipientRole: 'admin',
          sender: userId,
          data: {
            courses: cartItems.map(item => ({
              id: item._id,
              title: item.title,
              price: item.price
            })),
            totalAmount: calculateTotal()
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Clear cart
      localStorage.setItem('cartItems', '[]');
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      // Success message
      toast.success(
        <div>
          <h4>Payment Successful!</h4>
          <p>{cartItems.length} course(s) have been added to your list.</p>
          <p>Wait for instructor approval to start.</p>
          <small>You will be notified by email.</small>
        </div>,
        {
          duration: 5000,
          style: {
            background: '#10B981',
            color: 'white',
          }
        }
      );

      // Reset form data
      setFormData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        name: ''
      });
      
      // Redirect with page reload
      setTimeout(() => {
        window.location.href = '/my-courses-list';
      }, 500);

    } catch (error) {
      console.error('Payment error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Payment error. Please try again.');
      
      if (error.response?.status === 401) {
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <HeaderStudent />
      <Animation />
      <Breadcrumb title="Checkout" />

      <div className="checkout-area section-padding bg-main-10">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-8">
              <div className="checkout-form bg-white rounded-4 overflow-hidden">
                <div className="checkout-steps mb-4 p-4 bg-main-25">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="step active">
                      <div className="step-icon">
                        <i className="ph-bold ph-shopping-cart"></i>
                      </div>
                      <span>Cart</span>
                    </div>
                    <div className="step-line active"></div>
                    <div className="step active">
                      <div className="step-icon">
                        <i className="ph-bold ph-credit-card"></i>
                      </div>
                      <span>Payment</span>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                      <div className="step-icon">
                        <i className="ph-bold ph-check-circle"></i>
                      </div>
                      <span>Confirmation</span>
                    </div>
                  </div>
                </div>

                <div className="checkout-form-content p-4">
                  <div className="section-title mb-4">
                    <h4 className="text-neutral-800 fw-bold mb-1">Payment Information</h4>
                    <p className="text-neutral-500 mb-0">Please enter your payment details to complete your purchase</p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="form-label fw-medium mb-2 text-neutral-700">Name on Card</label>
                      <div className="input-wrapper position-relative">
                        <input
                          type="text"
                          className={`common-input rounded-pill bg-main-25 pe-48 border-neutral-30 ${errors.name ? 'is-invalid' : ''}`}
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                        <span className="input-icon">
                          <i className="ph-bold ph-user"></i>
                        </span>
                      </div>
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-medium mb-2 text-neutral-700">Card Number</label>
                      <div className="input-wrapper position-relative">
                        <input
                          type="text"
                          className={`common-input rounded-pill bg-main-25 pe-48 border-neutral-30 ${errors.cardNumber ? 'is-invalid' : ''}`}
                          name="cardNumber"
                          value={formData.cardNumber.replace(/(\d{4})/g, '$1 ').trim()}
                          onChange={handleInputChange}
                          required
                          maxLength="19"
                        />
                        <span className="input-icon">
                          <i className="ph-bold ph-credit-card"></i>
                        </span>
                      </div>
                      {errors.cardNumber && <div className="invalid-feedback">{errors.cardNumber}</div>}
                    </div>

                    <div className="row g-4">
                      <div className="col-md-6">
                        <label className="form-label fw-medium mb-2 text-neutral-700">Expiry Date</label>
                        <div className="input-wrapper position-relative">
                          <input
                            type="text"
                            className={`common-input rounded-pill bg-main-25 pe-48 border-neutral-30 ${errors.expiryDate ? 'is-invalid' : ''}`}
                            name="expiryDate"
                            placeholder="MM/YY"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            required
                          />
                          <span className="input-icon">
                            <i className="ph-bold ph-calendar"></i>
                          </span>
                        </div>
                        {errors.expiryDate && <div className="invalid-feedback">{errors.expiryDate}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium mb-2 text-neutral-700">CVV</label>
                        <div className="input-wrapper position-relative">
                          <input
                            type="text"
                            className={`common-input rounded-pill bg-main-25 pe-48 border-neutral-30 ${errors.cvv ? 'is-invalid' : ''}`}
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            required
                            maxLength="3"
                          />
                          <span className="input-icon" title="The 3-digit security code on the back of your card">
                            <i className="ph-bold ph-shield"></i>
                          </span>
                        </div>
                        {errors.cvv && <div className="invalid-feedback">{errors.cvv}</div>}
                      </div>
                    </div>

                    <div className="mt-4">
                      <button 
                        type="submit"
                        className="btn btn-primary btn-lg w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
                        disabled={loading || isSubmitting}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <i className="ph-bold ph-lock"></i>
                            <span>Complete Payment</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="cart-summary bg-white rounded-4 overflow-hidden">
                <div className="cart-summary-header p-4 bg-main-25">
                  <h4 className="mb-0 text-neutral-800 fw-bold d-flex align-items-center gap-2">
                    <i className="ph-bold ph-shopping-bag text-main-600"></i>
                    Order Summary
                  </h4>
                </div>

                <div className="p-4">
                  <div className="cart-items">
                    {cartItems.map((item) => (
                      <div key={item._id} className="cart-item mb-4">
                        <div className="course-card-sm hover-card bg-main-25 rounded-4 p-3">
                          <div className="d-flex gap-3">
                            <div className="course-image rounded-4 overflow-hidden flex-shrink-0" style={{ width: '80px', height: '80px' }}>
                              <img
                                src={item.image || '/assets/images/thumbs/course-default.jpg'}
                                alt={item.title}
                                className="w-100 h-100 object-fit-cover"
                              />
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-2 text-truncate fw-bold text-neutral-800">{item.title}</h6>
                              <div className="d-flex align-items-center gap-2 text-neutral-500 mb-2">
                                <i className="ph-bold ph-folder-simple"></i>
                                <small>{item.category}</small>
                              </div>
                              <div className="price-tag fw-bold text-main-600">
                                {item.price} DT
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-summary-footer pt-4">
                    <div className="summary-item d-flex justify-content-between align-items-center mb-3">
                      <span className="text-neutral-500">Subtotal</span>
                      <span className="fw-bold text-neutral-800">{calculateTotal()} DT</span>
                    </div>
                    <div className="summary-item d-flex justify-content-between align-items-center mb-3">
                      <span className="text-neutral-500">VAT</span>
                      <span className="fw-bold text-neutral-800">0 DT</span>
                    </div>
                    <div className="summary-total d-flex justify-content-between align-items-center py-3 border-top">
                      <h5 className="mb-0 fw-bold text-neutral-800">Total</h5>
                      <h5 className="mb-0 text-main-600 fw-bold">{calculateTotal()} DT</h5>
                    </div>

                    <div className="secure-payment text-center mt-4">
                      <div className="d-flex align-items-center justify-content-center gap-2 text-neutral-500">
                        <i className="ph-bold ph-shield-check text-success"></i>
                        <small>Secure Payment</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-area {
          min-height: calc(100vh - 80px);
          padding: 120px 0;
        }

        .checkout-steps {
          border-radius: 12px;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 1;
        }

        .step-icon {
          width: 48px;
          height: 48px;
          background: white;
          border: 2px solid var(--neutral-30);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: var(--neutral-500);
          transition: all 0.3s ease;
        }

        .step.active .step-icon {
          background: var(--main-600);
          border-color: var(--main-600);
          color: white;
        }

        .step span {
          font-size: 14px;
          font-weight: 500;
          color: var(--neutral-500);
        }

        .step.active span {
          color: var(--main-600);
          font-weight: 600;
        }

        .step-line {
          flex: 1;
          height: 2px;
          background: var(--neutral-30);
          margin: 0 -20px;
          position: relative;
          z-index: 0;
        }

        .step-line.active {
          background: var(--main-600);
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--neutral-500);
          font-size: 20px;
          pointer-events: none;
        }

        .common-input {
          height: 52px;
          padding: 0 24px;
          font-size: 15px;
          transition: all 0.3s ease;
          width: 100%;
        }

        .common-input:focus {
          border-color: var(--main-600);
          box-shadow: none;
          outline: none;
        }

        .common-input:hover {
          border-color: var(--main-600);
        }

        .hover-card {
          transition: all 0.3s ease;
          border: 1px solid var(--border-1);
        }

        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border-color: var(--main-600);
        }

        .btn-primary {
          background: var(--main-600);
          border: none;
          font-weight: 600;
          padding: 12px 24px;
          transition: all 0.3s ease;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--main-700);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(var(--main-rgb), 0.2);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .summary-item {
          padding: 8px 0;
        }

        .summary-total {
          margin-top: 8px;
        }

        .invalid-feedback {
          font-size: 0.875rem;
          margin-top: 0.5rem;
          color: var(--danger);
        }

        @media (max-width: 991px) {
          .cart-summary {
            margin-top: 1rem;
          }
        }

        @media (max-width: 767px) {
          .step span {
            font-size: 12px;
          }

          .step-icon {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default CheckoutPage;
