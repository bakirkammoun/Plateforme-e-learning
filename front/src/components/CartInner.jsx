"use client";
import Link from "next/link";

const CartInner = ({ cartItems, total, removeFromCart }) => {
  return (
    <div className='py-120'>
      <div className='container'>
        <div className='row'>
          <div className='col-lg-8'>
            <div className='border border-neutral-30 rounded-12 bg-main-25 p-32'>
              <div className="d-flex align-items-center gap-3 mb-4">
                <i className="ph-fill ph-shopping-cart fs-1 text-main-600"></i>
                <div>
                  <h4 className='mb-0 d-flex align-items-center gap-2'>
                    My Cart
                    <span className='badge rounded-pill bg-main-600 fs-6 d-flex align-items-center gap-1'>
                      <i className="ph-fill ph-books text-white"></i>
                      {cartItems.length}
                    </span>
              </h4>
                  <p className="text-neutral-500 mb-0 mt-1">Manage your selected courses</p>
                </div>
              </div>
              <span className='d-block border border-neutral-30 my-24 border-dashed' />
              
              {cartItems.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ph-fill ph-shopping-cart-simple text-neutral-300" style={{ fontSize: '4rem' }}></i>
                  <p className="text-neutral-500 mt-3 mb-4">Your cart is empty</p>
                  <Link
                    href='/formations'
                    className='btn btn-outline-primary rounded-pill'
                  >
                    <i className='ph-fill ph-books me-2' />
                    Browse Courses
                  </Link>
                </div>
              ) : (
              <div className='table-responsive overflow-x-auto'>
                <table className='table min-w-max vertical-middle mb-0'>
                  <thead>
                    <tr>
                      <th className='text-neutral-500 fw-semibold px-24 py-20 border-0'>
                          <i className="ph-fill ph-graduation-cap me-2"></i>Course
                      </th>
                      <th className='text-neutral-500 fw-semibold px-24 py-20 border-0'>
                          <i className="ph-fill ph-currency-circle-dollar me-2"></i>Price
                      </th>
                      <th className='text-neutral-500 fw-semibold px-24 py-20 border-0' />
                    </tr>
                  </thead>
                  <tbody>
                      {cartItems.map((item) => (
                        <tr key={item._id}>
                      <td className='border-bottom border-dashed border-neutral-40 text-neutral-500 bg-transparent px-24 py-20'>
                        <div className='d-flex align-items-center gap-24'>
                              <div className='w-80 h-80 border border-neutral-40 rounded-8 overflow-hidden'>
                                <img
                                  src={item.image || 'assets/images/default-course.png'}
                                  alt={item.title}
                                  className='w-100 h-100 object-fit-cover'
                                />
                              </div>
                              <div>
                                <h6 className='text-md mb-2 text-line-1 text-dark'>
                                  {item.title}
                            </h6>
                                {item.instructorId && (
                                  <div className='text-neutral-500 text-sm d-flex align-items-center'>
                                    <i className="ph-fill ph-user-circle me-2"></i>
                                    {item.instructorId.firstName} {item.instructorId.lastName}
                              </div>
                                )}
                          </div>
                        </div>
                      </td>
                      <td className='border-bottom border-dashed border-neutral-40 text-neutral-500 bg-transparent px-24 py-20'>
                            <span className="fw-semibold text-main-600">{item.price} DT</span>
                      </td>
                      <td className='border-bottom border-dashed border-neutral-40 text-neutral-500 bg-transparent px-24 py-20'>
                            <button 
                              className='btn btn-icon btn-sm btn-outline-danger rounded-circle'
                              onClick={() => removeFromCart(item._id)}
                              title="Remove from cart"
                            >
                              <i className='ph-fill ph-trash' />
                        </button>
                      </td>
                    </tr>
                      ))}
                  </tbody>
                </table>
                <Link
                    href='/formations'
                    className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold mt-24 d-inline-flex align-items-center'
                >
                    <i className='ph-fill ph-arrow-left' />
                  Continue Shopping
                </Link>
              </div>
              )}
            </div>
          </div>
          <div className='col-lg-4'>
            <div className='border border-neutral-30 rounded-12 bg-main-25 p-24'>
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="ph-fill ph-receipt text-main-600 fs-3"></i>
                <span className='text-neutral-700 text-lg fw-semibold'>Order Summary</span>
              </div>
              <span className='d-block border border-neutral-30 my-24 border-dashed' />
              <div className='d-flex flex-column gap-24'>
                <div className='d-flex align-items-center justify-content-between gap-4 bg-white p-3 rounded-8'>
                  <span className='text-neutral-500 d-flex align-items-center gap-2'>
                    <i className="ph-fill ph-currency-circle-dollar text-main-600"></i>
                    Total Amount
                  </span>
                  <span className='text-main-600 fw-semibold fs-5'>{total} DT</span>
                </div>
              </div>
              {cartItems.length > 0 && (
              <Link
                href='/checkout'
                  className='btn btn-main rounded-pill w-100 mt-40 d-flex align-items-center justify-content-center gap-2'
              >
                  <i className="ph-fill ph-check-circle"></i>
                  Proceed to Checkout
              </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .btn-icon {
          width: 36px;
          height: 36px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .btn-icon:hover {
          transform: scale(1.1);
        }

        .badge {
          padding: 0.5rem 0.8rem;
        }

        .table th {
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .text-line-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default CartInner;
