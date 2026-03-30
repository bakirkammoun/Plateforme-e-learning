"use client";
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const CheckoutInner = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    address: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  useEffect(() => {
    // Load cart items from localStorage
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(items);
    
    // Calculate total
    const sum = items.reduce((acc, item) => acc + parseFloat(item.price), 0);
    setTotal(sum);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCompletePurchase = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      
      if (cartItems.length === 0) {
        toast.error('Votre panier est vide');
        return;
      }

      // Envoyer la commande au serveur
      await axios.post('http://localhost:5000/api/orders/create', {
        items: cartItems
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Vider le panier après l'achat
      localStorage.removeItem('cart');
      
      // Afficher un message de succès
      toast.success('Achat complété avec succès!');
      
      // Rediriger vers la page my-courses-list
      router.push('/my-courses-list');
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'achat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='py-120'>
      <div className='container'>
        <form onSubmit={handleCompletePurchase}>
          <div className='row'>
            <div className='col-lg-8'>
              <div className='border border-neutral-30 rounded-12 bg-main-25 p-32'>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <i className="ph-fill ph-user-circle fs-1 text-main-600"></i>
                  <div>
                    <h4 className='mb-0'>Billing Information</h4>
                    <p className="text-neutral-500 mb-0 mt-1">Please enter your billing details</p>
                  </div>
                </div>
                <span className='d-block border border-neutral-30 my-24 border-dashed' />
                <div className='row gy-4'>
                  <div className='col-sm-6 col-xs-6'>
                    <label className="form-label">Full Name *</label>
                    <input
                      type='text'
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className='form-control bg-white rounded-pill border-neutral-40'
                      placeholder='Enter your full name'
                      required
                    />
                  </div>
                  <div className='col-sm-6 col-xs-6'>
                    <label className="form-label">Email Address *</label>
                    <input
                      type='email'
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className='form-control bg-white rounded-pill border-neutral-40'
                      placeholder='Enter your email'
                      required
                    />
                  </div>
                  <div className='col-sm-6 col-xs-6'>
                    <label className="form-label">Phone Number *</label>
                    <input
                      type='tel'
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className='form-control bg-white rounded-pill border-neutral-40'
                      placeholder='Enter your phone number'
                      required
                    />
                  </div>
                  <div className='col-sm-6 col-xs-6'>
                    <label className="form-label">Country</label>
                    <select 
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className='form-select bg-white rounded-pill border-neutral-40'
                    >
                      <option value="">Select your country</option>
                      <option value="TN">Tunisia</option>
                      <option value="FR">France</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                    </select>
                  </div>
                  <div className='col-sm-12'>
                    <label className="form-label">Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className='form-control bg-white rounded-24 border-neutral-40'
                      placeholder='Enter your address'
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className='border border-neutral-30 rounded-12 bg-main-25 p-32 mt-24'>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <i className="ph-fill ph-credit-card fs-1 text-main-600"></i>
                  <div>
                    <h4 className='mb-0'>Payment Details</h4>
                    <p className="text-neutral-500 mb-0 mt-1">Complete your purchase by providing your payment details</p>
                  </div>
                </div>
                <span className='d-block border border-neutral-30 my-24 border-dashed' />
                
                <div className='row gy-4'>
                  <div className='col-sm-12'>
                    <label className="form-label">Card Number *</label>
                    <input
                      type='text'
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className='form-control bg-white rounded-pill border-neutral-40'
                      placeholder='1234 5678 9012 3456'
                      required
                    />
                  </div>
                  <div className='col-sm-6 col-xs-6'>
                    <label className="form-label">Expiry Date *</label>
                    <input
                      type='text'
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className='form-control bg-white rounded-pill border-neutral-40'
                      placeholder='MM/YY'
                      required
                    />
                  </div>
                  <div className='col-sm-6 col-xs-6'>
                    <label className="form-label">CVV *</label>
                    <input
                      type='text'
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className='form-control bg-white rounded-pill border-neutral-40'
                      placeholder='123'
                      maxLength="4"
                      required
                    />
                  </div>
                  <div className='col-sm-12'>
                    <label className="form-label">Name on Card *</label>
                    <input
                      type='text'
                      name="nameOnCard"
                      value={formData.nameOnCard}
                      onChange={handleInputChange}
                      className='form-control bg-white rounded-pill border-neutral-40'
                      placeholder='Enter name as shown on card'
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className='col-lg-4'>
              <div className='border border-neutral-30 rounded-12 bg-main-25 p-24'>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="ph-fill ph-shopping-cart text-main-600 fs-3"></i>
                  <span className='text-neutral-700 text-lg fw-semibold'>Order Summary</span>
                </div>
                <span className='d-block border border-neutral-30 my-24 border-dashed' />
                
                <div className='d-flex flex-column gap-3'>
                  {cartItems.map((item) => (
                    <div key={item._id} className='d-flex align-items-center gap-3 bg-white p-3 rounded-8'>
                      <div className='w-60 h-60 border border-neutral-40 rounded-8 overflow-hidden'>
                        <img
                          src={item.image || 'assets/images/default-course.png'}
                          alt={item.title}
                          className='w-100 h-100 object-fit-cover'
                        />
                      </div>
                      <div className='flex-grow-1'>
                        <h6 className='mb-1 text-line-1'>{item.title}</h6>
                        <span className='text-main-600 fw-semibold'>{item.price} DT</span>
                      </div>
                    </div>
                  ))}
                </div>

                <span className='d-block border border-neutral-30 my-24 border-dashed' />
                
                <div className='d-flex align-items-center justify-content-between gap-4 bg-white p-3 rounded-8'>
                  <span className='text-neutral-500 d-flex align-items-center gap-2'>
                    <i className="ph-fill ph-currency-circle-dollar text-main-600"></i>
                    Total Amount
                  </span>
                  <span className='text-main-600 fw-semibold fs-5'>{total} DT</span>
                </div>

                <button
                  type='submit'
                  disabled={loading}
                  className='btn btn-main rounded-pill w-100 mt-40 d-flex align-items-center justify-content-center gap-2'
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="ph-fill ph-check-circle"></i>
                      Complete Purchase
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .text-line-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .form-label {
          font-weight: 500;
          color: var(--neutral-700);
          margin-bottom: 0.5rem;
        }

        .form-control:focus,
        .form-select:focus {
          border-color: var(--main-600);
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default CheckoutInner;
