"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import $ from "jquery";
import { usePathname } from "next/navigation";

const HeaderOne = () => {
  let pathname = usePathname();
  const [scroll, setScroll] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("select2").then(() => {
        const selectElement = $(".js-example-basic-single");
        if (selectElement.length > 0) {
          selectElement.select2(); // Initialize Select2
        }
      });
    }

    // Initialize cart from localStorage
    const savedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(savedCartItems);

    // Listen for cart updates
    const handleCartUpdate = () => {
      const updatedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartItems(updatedCartItems);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    window.onscroll = () => {
      if (window.pageYOffset < 150) {
        setScroll(false);
      } else if (window.pageYOffset > 150) {
        setScroll(true);
      }
      return () => (window.onscroll = null);
    };

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.cart-wrapper')) {
        setIsCartDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const removeFromCart = (formationId) => {
    const updatedCartItems = cartItems.filter(item => item._id !== formationId);
    setCartItems(updatedCartItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  const toggleMenu = () => {
    setIsMenuActive(!isMenuActive);
    if (!isMenuActive) {
      document.body.classList.add("scroll-hide-sm");
    } else {
      document.body.classList.remove("scroll-hide-sm");
    }
  };

  const closeMenu = () => {
    setIsMenuActive(false);
    document.body.classList.remove("scroll-hide-sm");
  };

  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmenuClick = (index) => {
    if (windowWidth < 992) {
      setActiveSubmenu((prevIndex) => (prevIndex === index ? null : index));
    }
  };

  const menuItems = [
    {
      label: "Home",
      links: [
        { href: "/", label: "Home LMS" },
      ],
    },
    {
      label: "Courses",
      links: [
        { href: "/formations", label: "Courses Grid View" },
        { href: "/my-favorite-courses", label: "My Favorite Courses" },
      ],
    },
    {
      label: "Pages",
      links: [
        { href: "/events", label: "Events" },
        { href: "/faq", label: "FAQ" },
        { href: "/gallery", label: "Gallery" },
      ],
    },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <div className={`side-overlay ${isMenuActive ? "show" : ""}`}></div>
      <header className={`header ${scroll ? "fixed-header" : ""}`}>
        <div className='container container--xl'>
          <nav className='header-inner flex-between gap-8'>
            <div className='header-content-wrapper flex-align flex-grow-1'>
              {/* Logo Start */}
              <div className='logo'>
                <Link href='/' className='link'>
                  <img src='assets/images/logo/logo.png' alt='Logo'  width={100}/>
                </Link>
              </div>
              {/* Logo End  */}
              {/* Menu Start  */}
              <div className='header-menu d-lg-block d-none'>
                <ul className='nav-menu flex-align'>
                  {menuItems.map((item, index) =>
                    item.links ? (
                      <li
                        key={`menu-item-${index}`}
                        className='nav-menu__item has-submenu'
                      >
                        <Link href='#' className='nav-menu__link'>
                          {item.label}
                        </Link>
                        <ul className={`nav-submenu scroll-sm`}>
                          {item.links.map((link, linkIndex) => (
                            <li
                              key={`submenu-item-${linkIndex}`}
                              className={`nav-submenu__item ${
                                pathname == link.href && "activePage"
                              }`}
                            >
                              <Link
                                href={link.href}
                                className='nav-submenu__link hover-bg-neutral-30'
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ) : (
                      <li
                        key={`menu-contact-${index}`}
                        className={`nav-menu__item ${
                          pathname == item.href && "activePage"
                        }`}
                      >
                        <Link href={item.href} className='nav-menu__link'>
                          {item.label}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
              {/* Menu End  */}
            </div>
            {/* Header Right start */}
            <div className='header-right flex-align'>
              <form
                action='#'
                className='search-form position-relative d-xl-block d-none'
              >
                <input
                  type='text'
                  className='common-input rounded-pill bg-main-25 pe-48 border-neutral-30'
                  placeholder='Search...'
                />
                <button
                  type='submit'
                  className='w-36 h-36 bg-main-600 hover-bg-main-700 rounded-circle flex-center text-md text-white position-absolute top-50 translate-middle-y inset-inline-end-0 me-8'
                >
                  <i className='ph-bold ph-magnifying-glass' />
                </button>
              </form>
              <div className='cart-wrapper position-relative'>
                <button
                  onClick={() => setIsCartDropdownOpen(!isCartDropdownOpen)}
                  className='info-action w-52 h-52 bg-main-25 hover-bg-main-600 border border-neutral-30 rounded-circle flex-center text-2xl text-neutral-500 hover-text-white hover-border-main-600 position-relative'
                >
                  <i className='ph ph-shopping-cart' />
                  {cartItems.length > 0 && (
                    <span className="notification-badge" style={{ backgroundColor: '#ffcc00' }}>{cartItems.length}</span>
                  )}
                </button>
                {isCartDropdownOpen && (
                  <div className="notification-dropdown cart-dropdown">
                    <div className="notification-header">
                      <span className="notification-title">
                        <div className="notification-icon">
                          <i className="ph ph-shopping-cart"></i>
                        </div>
                        <span>My Cart</span>
                      </span>
                      <span className="notification-count">{cartItems.length}</span>
                    </div>
                    
                    <div className="notification-list">
                      {cartItems.length === 0 ? (
                        <div className="p-4 text-center text-neutral-500">
                          Your cart is empty
                        </div>
                      ) : (
                        cartItems.map((item) => (
                          <div key={item._id} className="cart-item">
                            <div className="cart-item-content">
                              <div className="cart-item-image">
                                <img src={item.image || 'assets/images/default-course.png'} alt={item.title} />
                              </div>
                              <div className="cart-item-details">
                                <h6>{item.title}</h6>
                                <p className="cart-item-price">{item.price} DT</p>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item._id);
                                }}
                                className="cart-item-remove"
                              >
                                <i className="ph ph-x"></i>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {cartItems.length > 0 && (
                      <div className="cart-footer">
                        <div className="cart-total">
                          <span>Total:</span>
                          <span>{calculateTotal()} DT</span>
                        </div>
                        <Link href="/sign-in" className="btn btn-primary w-100 text-white bg-main-600 hover-bg-main-700 border-0 rounded-pill py-3 h-48 d-flex align-items-center justify-content-center">
                          Checkout
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Link
                href='sign-in'
                className='info-action w-52 h-52 bg-main-25 hover-bg-main-600 border border-neutral-30 rounded-circle flex-center text-2xl text-neutral-500 hover-text-white hover-border-main-600'
              >
                <i className='ph ph-user-circle' />
              </Link>
              <button
                type='button'
                className='toggle-mobileMenu d-lg-none text-neutral-200 flex-center'
                onClick={toggleMenu}
              >
                <i className='ph ph-list' />
              </button>
            </div>
            {/* Header Right End  */}
          </nav>
        </div>
      </header>

      <div
        className={`mobile-menu scroll-sm d-lg-none d-block ${
          isMenuActive ? "active" : ""
        }`}
      >
        <button type='button' className='close-button' onClick={closeMenu}>
          <i className='ph ph-x' />{" "}
        </button>
        <div className='mobile-menu__inner'>
          <Link href='/' className='mobile-menu__logo'>
            <img src='assets/images/logo/logo.png' alt='Logo' />
          </Link>
          <div className='mobile-menu__menu'>
            <ul className='nav-menu flex-align nav-menu--mobile'>
              {menuItems.map((item, index) =>
                item.links ? (
                  <li
                    key={`menu-item-${index}`}
                    className={`nav-menu__item has-submenu ${
                      activeSubmenu === index ? "activePage" : ""
                    }`}
                    onClick={() => handleSubmenuClick(index)}
                  >
                    <Link href='#' className='nav-menu__link'>
                      {item.label}
                    </Link>
                    <ul className={`nav-submenu scroll-sm`}>
                      {item.links.map((link, linkIndex) => (
                        <li key={linkIndex} className='nav-submenu__item'>
                          <Link
                            href={link.href}
                            className='nav-submenu__link hover-bg-neutral-30'
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li
                    className={`nav-menu__item ${
                      pathname == item.href && "activePage"
                    }`}
                    key={index}
                  >
                    <Link href={item.href} className='nav-menu__link'>
                      {item.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .notification-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #ef4444;
          color: white;
          border-radius: 50%;
          min-width: 22px;
          height: 22px;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 15px);
          right: -10px;
          width: 380px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          z-index: 1050;
          opacity: 0;
          transform: translateY(10px);
          animation: slideIn 0.3s ease forwards;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .notification-header {
          padding: 16px 20px;
          background: #ffffff;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .notification-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .notification-icon {
          width: 32px;
          height: 32px;
          background: #f0f7ff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-icon i {
          color: #0d6efd;
          font-size: 16px;
        }

        .notification-count {
          background: #f0f7ff;
          color: #0d6efd;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .notification-list {
          max-height: 380px;
          overflow-y: auto;
          padding: 8px 0;
        }

        .cart-dropdown {
          width: 320px;
        }

        .cart-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .cart-item-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cart-item-image {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          overflow: hidden;
        }

        .cart-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-item-details {
          flex: 1;
        }

        .cart-item-details h6 {
          font-size: 14px;
          margin: 0 0 4px 0;
          color: #1a1a1a;
        }

        .cart-item-price {
          font-size: 13px;
          color: #25ace4;
          margin: 0;
          font-weight: 600;
        }

        .cart-item-remove {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 4px;
          font-size: 16px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .cart-item-remove:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .cart-footer {
          padding: 16px;
          background: #f8f9ff;
          border-top: 1px solid #f0f0f0;
        }

        .cart-footer a {
          height: 48px;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .cart-footer a:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .cart-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .cart-total span:last-child {
          color: #25ace4;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 576px) {
          .notification-dropdown {
            width: 320px;
            right: -50px;
          }
        }
      `}</style>
    </>
  );
};

export default HeaderOne;
