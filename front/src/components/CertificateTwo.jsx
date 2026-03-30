const CertificateTwo = () => {
  return (
    <section className='certificate-two py-120 position-relative z-1 mash-bg-main mash-bg-main-two mash-reverse'>
      <div className='section-heading text-center'>
        <h2 className='mb-24 wow bounceIn'>
          Professional Certifications at Smartech
        </h2>
        <p className='wow bounceInUp'>
          Boost your career with internationally recognized certifications in languages and web development.
          Our certificates are valued by employers worldwide.
        </p>
      </div>
      <div className='position-relative'>
        <div className='container'>
          <div className='row align-items-center gy-4'>
            <div className='col-lg-6 pe-lg-5'>
              <div
                className='certificate-two-item animation-item border-bottom border-neutral-50 border-dashed border-0 mb-28 pb-28'
                data-aos='fade-up'
                data-aos-duration={200}
              >
                <div className='flex-align gap-20 mb-12'>
                  <span className='w-52 h-52 flex-center d-inline-flex bg-main-25 rounded-circle text-main-600 text-2xl'>
                    <i className='animate__wobble ph-bold ph-medal' />
                  </span>
                  <h5 className='mb-0'>Native Language Instructors</h5>
                </div>
                <p className='text-neutral-700 text-line-2'>
                  Learn languages from native speakers and web development from industry professionals with years of experience.
                </p>
              </div>
              <div
                className='certificate-two-item animation-item border-bottom border-neutral-50 border-dashed border-0 mb-28 pb-28'
                data-aos='fade-up'
                data-aos-duration={400}
              >
                <div className='flex-align gap-20 mb-12'>
                  <span className='w-52 h-52 flex-center d-inline-flex bg-main-25 rounded-circle text-main-600 text-2xl'>
                    <i className='animate__wobble ph-bold ph-clock' />
                  </span>
                  <h5 className='mb-0'>Flexible Learning Schedule</h5>
                </div>
                <p className='text-neutral-700 text-line-2'>
                  Choose from morning, evening, or weekend classes. Our flexible schedule allows you to learn at your own pace.
                </p>
              </div>
              <div
                className='certificate-two-item animation-item border-bottom border-neutral-50 border-dashed border-0 mb-28 pb-28'
                data-aos='fade-up'
                data-aos-duration={600}
              >
                <div className='flex-align gap-20 mb-12'>
                  <span className='w-52 h-52 flex-center d-inline-flex bg-main-25 rounded-circle text-main-600 text-2xl'>
                    <i className='animate__wobble ph-bold ph-star' />
                  </span>
                  <h5 className='mb-0'>Practical Projects & Resources</h5>
                </div>
                <p className='text-neutral-700 text-line-2'>
                  Get hands-on experience with real-world projects and access to premium learning resources and development tools.
                </p>
              </div>
              <div
                className='certificate-two-item animation-item'
                data-aos='fade-up'
                data-aos-duration={800}
              >
                <div className='flex-align gap-20 mb-12'>
                  <span className='w-52 h-52 flex-center d-inline-flex bg-main-25 rounded-circle text-main-600 text-2xl'>
                    <i className='animate__wobble ph-bold ph-chart-line-up' />
                  </span>
                  <h5 className='mb-0'>Career Support & Placement</h5>
                </div>
                <p className='text-neutral-700 text-line-2'>
                  Benefit from our career counseling services and job placement assistance after completing your certification.
                </p>
              </div>
            </div>
            <div className='col-lg-6'>
              <div className='certificate-two__thumb'>
                <img
                  src='assets/images/thumbs/certificate-two-img.png'
                  alt='Smartech Professional Certificates'
                  data-tilt=''
                  data-tilt-max={10}
                  data-tilt-speed={500}
                  data-tilt-perspective={5000}
                  data-tilt-full-page-listening=''
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CertificateTwo;
