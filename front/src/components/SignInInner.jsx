"use client"; // This line marks the component as a Client Component
import React, { useState } from "react";
import axios from "axios";

const SignInInner = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      // Appel à l'API de login
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('Server response:', response.data);

      if (response.data && response.data.token) {
        console.log('User data:', response.data.user);

        // Stocker les informations dans localStorage
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("userRole", response.data.user.role);

        // Vérifiez que l'ID de l'utilisateur est bien stocké
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.id) {
          console.log('User ID stored:', user.id); // Pour le débogage
          console.log('Current role:', user.role); // Affichez le rôle de l'utilisateur
        } else {
          console.error('User ID not found in localStorage'); // Pour le débogage
        }

        // Vérifier le rôle via l'API
        const roleResponse = await axios.get(
          "http://localhost:5000/api/auth/check-role",
          {
            headers: {
              'Authorization': `Bearer ${response.data.token}`
            }
          }
        );

        console.log('Role verified:', roleResponse.data); // Pour le débogage

        // Redirection basée sur le rôle
        const userRole = response.data.user.role;
        if (userRole === 'student') {
          window.location.href = "/index-3";
        } else if (userRole === 'instructor') {
          window.location.href = "/index-2";
        } else if (userRole === 'admin') {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/"; // Page d'accueil par défaut
        }
      }
    } catch (error) {
      console.error('Complete error:', error);
      // Afficher un message d'erreur plus spécifique pour les comptes inactifs
      if (error.response && error.response.status === 403) {
        setErrorMessage(error.response.data.message || "Your account is inactive. Please contact the administrator.");
      } else {
        setErrorMessage(error.response?.data?.message || "Login error");
      }
    }
  };

  return (
    <div className="account py-120 position-relative">
      <div className="container">
        <div className="row gy-4 align-items-center">
          <div className="col-lg-6">
            <div className="bg-main-25 border border-neutral-30 rounded-8 p-32">
              <div className="mb-40">
                <h3 className="mb-16 text-neutral-500">Welcome Back!</h3>
                <p className="text-neutral-500">
                  Sign in to your account and join us
                </p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="mb-24">
                  <label
                    htmlFor="email"
                    className="fw-medium text-lg text-neutral-500 mb-16"
                  >
                    Enter Your Email ID
                  </label>
                  <input
                    type="email"
                    className="common-input rounded-pill"
                    id="email"
                    placeholder="Enter Your Email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-16">
                  <label
                    htmlFor="password"
                    className="fw-medium text-lg text-neutral-500 mb-16"
                  >
                    Enter Your Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      className="common-input rounded-pill pe-44"
                      id="password"
                      placeholder="Enter Your Password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span
                      className={`toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y ph-bold ${
                        passwordVisible ? "ph-eye" : "ph-eye-closed"
                      }`}
                      onClick={togglePasswordVisibility}
                    ></span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mb-16 text-danger">
                    <p>{errorMessage}</p>
                  </div>
                )}

                <div className="mb-16 text-end">
                  <a
                    href="/forgot-password"
                    className="text-warning-600 hover-text-decoration-underline"
                  >
                    Forgot password?
                  </a>
                </div>

                <div className="mb-16">
                  <p className="text-neutral-500">
                    Don't have an account?
                    <a
                      href="sign-up"
                      className="fw-semibold text-main-600 hover-text-decoration-underline"
                    >
                      Sign Up
                    </a>
                  </p>
                </div>

                <div className="mt-40">
                  <button
                    type="submit"
                    className="btn btn-main rounded-pill flex-center gap-8 mt-40"
                  >
                    Sign In
                    <i className="ph-bold ph-arrow-up-right d-flex text-lg" />
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="col-lg-6 d-lg-block d-none">
            <div className="account-img">
              <img src="assets/images/thumbs/Login-cuate.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInInner;