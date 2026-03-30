"use client";
import { useState } from "react";
import axios from "axios";

const JoinCommunityOne = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [interests, setInterests] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");

  const sectors = {
    languages: {
      name: "Languages",
      options: ["Français", "Anglais", "Espagnol", "Allemand", "Italien"]
    },
    computerScience: {
      name: "Computer Science",
      options: [
        "IT Development",
        "Artificial Intelligence and Big Data",
        "Graphics and Digital Marketing",
        "Office automation"
      ]
    },
    competitions: {
      name: "Competitions and School Training",
      options: [
        "Preparation for Competitions",
        "Training for All Levels"
      ]
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSectorChange = (sectorKey) => {
    if (role === 'instructor') {
      setSelectedSector(selectedSector === sectorKey ? '' : sectorKey);
      setSpecialization('');
    } else {
      setSelectedSector(sectorKey);
    }
  };

  const handleSpecializationChange = (e) => {
    setSpecialization(e.target.value);
  };

  const handleInterestChange = (value) => {
    if (interests.includes(value)) {
      setInterests(interests.filter(i => i !== value));
    } else {
      setInterests([...interests, value]);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      if (role === 'instructor') {
        if (!selectedSector) {
          setError("Please select a sector");
          return;
        }
        if (!specialization) {
          setError("Please select a specialization");
          return;
        }
      }

      const response = await axios.post("http://localhost:5000/api/auth/signup", {
        firstName,
        lastName,
        email,
        password,
        role,
        specialization: role === 'instructor' ? specialization : undefined,
        interests: role === 'student' ? interests : undefined,
        sector: role === 'instructor' ? selectedSector : undefined,
      });

      setOtpSent(true);
      setSuccess(response.data.message || "OTP sent to your email.");
      setError("");
    } catch (err) {
      setError(err.response ? err.response.data.message : "An error occurred");
      setSuccess("");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
      });

      setSuccess(response.data.message || "OTP Verified! You can now log in.");
      setError("");
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 2000);
    } catch (err) {
      setError(err.response ? err.response.data.message : "Invalid OTP");
    }
  };

  return (
    <section className='join-community'>
      <div className='container container--lg'>
        <div className='bg-main-25 rounded-20 py-120 px-8'>
          <div className='container'>
            <div className='row gy-4 align-items-center'>
              <div className='col-lg-6'>
                <div className='join-community__content'>
                  <div className='mb-40'>
                    <h2 className='mb-24 wow bounceIn'>
                      Join the Smartech Community: Start Now
                    </h2>
                    <p className='text-neutral-500 text-line-2 wow bounceInUp'>
                      {otpSent 
                        ? "Please enter the verification code sent to your email"
                        : "Ready to explore our courses? Sign up now and start your learning journey!"
                      }
                    </p>
                  </div>

                  {otpSent ? (
                    <form onSubmit={handleVerifyOtp}>
                      <div className='mb-24 position-relative'>
                        <input
                          type='text'
                          className='bg-white text-black border border-transparent focus-border-main-600 h-48 rounded-pill px-16 ps-60 outline-0 w-100'
                          placeholder='Enter OTP...'
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                        />
                        <span className='bg-white text-neutral-200 text-2xl flex-center w-48 h-48 rounded-circle border border-main-25 border-4 position-absolute inset-inline-start-0 top-50 translate-middle-y'>
                          <i className='ph-bold ph-key' />
                        </span>
                      </div>
                      {error && <div className="alert alert-danger mb-3">{error}</div>}
                      {success && <div className="alert alert-success mb-3">{success}</div>}
                      <button type='submit' className='btn btn-main rounded-pill flex-align d-inline-flex gap-8'>
                        Verify OTP
                        <i className='ph-bold ph-arrow-right d-flex text-lg' />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignup}>
                      <div className='mb-24 position-relative'>
                        <input
                          type='text'
                          className='bg-white text-black border border-transparent focus-border-main-600 h-48 rounded-pill px-16 ps-60 outline-0 w-100'
                          placeholder='Enter First Name'
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                        <span className='bg-white text-neutral-200 text-2xl flex-center w-48 h-48 rounded-circle border border-main-25 border-4 position-absolute inset-inline-start-0 top-50 translate-middle-y'>
                          <i className='ph-bold ph-user-circle' />
                        </span>
                      </div>

                      <div className='mb-24 position-relative'>
                      <input
                        type='text'
                        className='bg-white text-black border border-transparent focus-border-main-600 h-48 rounded-pill px-16 ps-60 outline-0 w-100'
                          placeholder='Enter Last Name'
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                      />
                      <span className='bg-white text-neutral-200 text-2xl flex-center w-48 h-48 rounded-circle border border-main-25 border-4 position-absolute inset-inline-start-0 top-50 translate-middle-y'>
                        <i className='ph-bold ph-user-circle' />
                      </span>
                    </div>

                      <div className='mb-24 position-relative'>
                      <input
                        type='email'
                        className='bg-white text-black border border-transparent focus-border-main-600 h-48 rounded-pill px-16 ps-60 outline-0 w-100'
                        placeholder='Enter Email'
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                      />
                      <span className='bg-white text-neutral-200 text-2xl flex-center w-48 h-48 rounded-circle border border-main-25 border-4 position-absolute inset-inline-start-0 top-50 translate-middle-y'>
                        <i className='ph-bold ph-envelope-open' />
                      </span>
                    </div>

                      <div className='mb-24 position-relative'>
                        <input
                          type={passwordVisible ? "text" : "password"}
                          className='bg-white text-black border border-transparent focus-border-main-600 h-48 rounded-pill px-16 ps-60 outline-0 w-100'
                          placeholder='Enter Password'
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <span className='bg-white text-neutral-200 text-2xl flex-center w-48 h-48 rounded-circle border border-main-25 border-4 position-absolute inset-inline-start-0 top-50 translate-middle-y'>
                          <i className='ph-bold ph-lock' />
                        </span>
                        <span
                          className={`position-absolute top-50 end-0 me-16 translate-middle-y text-neutral-200 text-2xl cursor-pointer`}
                          onClick={togglePasswordVisibility}
                        >
                          <i className={`ph-bold ${passwordVisible ? "ph-eye" : "ph-eye-closed"}`} />
                        </span>
                      </div>

                      <div className='mb-24 position-relative'>
                        <select
                          className='bg-white text-black border border-transparent focus-border-main-600 h-48 rounded-pill px-16 ps-60 outline-0 w-100'
                          value={role}
                          onChange={(e) => {
                            setRole(e.target.value);
                            setSpecialization('');
                            setInterests([]);
                            setSelectedSector('');
                          }}
                          required
                        >
                          <option value="">Select Role</option>
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                        </select>
                        <span className='bg-white text-neutral-200 text-2xl flex-center w-48 h-48 rounded-circle border border-main-25 border-4 position-absolute inset-inline-start-0 top-50 translate-middle-y'>
                          <i className='ph-bold ph-user-gear' />
                        </span>
                      </div>

                      {role && (
                        <div className='mb-24'>
                          <div className="sector-buttons d-flex flex-wrap gap-3">
                            {Object.entries(sectors).map(([key, sector]) => (
                              <button
                                key={key}
                                type="button"
                                className={`btn ${selectedSector === key ? 'btn-main' : 'btn-outline-main'} rounded-pill flex-align d-inline-flex gap-8`}
                                onClick={() => handleSectorChange(key)}
                              >
                                <i className={`ph-bold ${
                                  key === 'languages' ? 'ph-translate' :
                                  key === 'computerScience' ? 'ph-desktop' :
                                  'ph-graduation-cap'
                                }`} />
                                {sector.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {role === 'instructor' && selectedSector && (
                        <div className='mb-24 position-relative'>
                          <select
                            className='bg-white text-black border border-transparent focus-border-main-600 h-48 rounded-pill px-16 ps-60 outline-0 w-100'
                            value={specialization}
                            onChange={handleSpecializationChange}
                            required
                          >
                            <option value="">Select Specialization</option>
                            {sectors[selectedSector].options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                      </select>
                      <span className='bg-white text-neutral-200 text-2xl flex-center w-48 h-48 rounded-circle border border-main-25 border-4 position-absolute inset-inline-start-0 top-50 translate-middle-y'>
                        <i className='ph-bold ph-book' />
                      </span>
                    </div>
                      )}

                      {role === 'student' && selectedSector && (
                        <div className='mb-24'>
                          <div className="interests-grid">
                            {sectors[selectedSector].options.map((option) => (
                              <div
                                key={option}
                                className={`interest-item ${interests.includes(option) ? 'active' : ''}`}
                                onClick={() => handleInterestChange(option)}
                              >
                                <i className='ph-bold ph-check-circle' />
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {error && <div className="alert alert-danger mb-3">{error}</div>}
                      {success && <div className="alert alert-success mb-3">{success}</div>}

                      <div className="d-flex align-items-center justify-content-between mb-24">
                        <p className="text-neutral-500 mb-0">
                          Have an account?{" "}
                          <a href="sign-in" className="text-main-600 hover-text-decoration-underline">
                            Sign In
                          </a>
                        </p>
                        <button type='submit' className='btn btn-main rounded-pill flex-align d-inline-flex gap-8'>
                        Join Now
                        <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                      </button>
                    </div>
                  </form>
                  )}
                </div>
              </div>
              <div className='col-lg-6'>
                <div className='join-community__thumb text-end position-relative'>
                  <img
                    src='assets/images/thumbs/join-community-img.png'
                    alt=''
                    className='wow bounceIn'
                    data-tilt=''
                    data-tilt-max={12}
                    data-tilt-speed={500}
                    data-tilt-perspective={5000}
                    data-tilt-full-page-listening=''
                  />
                  <div className='offer-message style-two px-24 py-12 rounded-12 bg-white fw-medium flex-align d-inline-flex gap-16 box-shadow-lg animation-upDown'>
                    <span className='banner-box__icon flex-shrink-0 w-48 h-48 bg-purple-400 text-white text-2xl flex-center rounded-circle'>
                      <i className='ph-bold ph-users' />
                    </span>
                    <div className='text-start'>
                      <h6 className='mb-4'>56K</h6>
                      <span className=''>All Students</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sector-buttons {
          margin: 0 -8px;
        }

        .sector-buttons .btn {
          margin: 8px;
          flex: 1;
          min-width: 150px;
          justify-content: center;
        }

        .interests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .interest-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border-radius: 50px;
          background: #F8FAFC;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .interest-item i {
          font-size: 20px;
          color: #64748B;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .interest-item span {
          color: #64748B;
          font-weight: 500;
        }

        .interest-item:hover {
          background: #EEF2FF;
        }

        .interest-item:hover i {
          opacity: 0.5;
        }

        .interest-item.active {
          background: var(--main-600);
        }

        .interest-item.active i {
          color: white;
          opacity: 1;
        }

        .interest-item.active span {
          color: white;
        }

        .alert {
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .alert-danger {
          background-color: #FEE2E2;
          color: #DC2626;
          border: 1px solid #FCA5A5;
        }

        .alert-success {
          background-color: #DCFCE7;
          color: #16A34A;
          border: 1px solid #86EFAC;
        }

        .btn-outline-main {
          border: 2px solid var(--main-600);
          color: var(--main-600);
          background: transparent;
        }

        .btn-outline-main:hover {
          background: var(--main-600);
          color: white;
        }
      `}</style>
    </section>
  );
};

export default JoinCommunityOne;
