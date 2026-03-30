'use client';

import Link from "next/link";

const PageBanner = ({ title, pageName, bannerImage }) => {
  return (
    <section
      className="page-banner bg-neutral-900 position-relative z-1 overflow-hidden"
      style={{
        backgroundImage: `url(${bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="page-banner__content text-center">
              <h2 className="text-white mb-16">{title}</h2>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb justify-center">
                  <li className="breadcrumb-item">
                    <Link href="/" className="text-white">
                      Accueil
                    </Link>
                  </li>
                  <li className="breadcrumb-item active text-white" aria-current="page">
                    {pageName}
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className="page-banner__shape">
        <img
          src="/assets/images/shapes/shape3.png"
          alt="shape"
          className="shape shape3 position-absolute"
        />
      </div>
    </section>
  );
};

export default PageBanner; 