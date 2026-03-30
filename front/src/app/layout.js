import { Inter } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <Script
          src="//code.tidio.co/6llt3f02itoiycwhyomg2pzgggr6tr7n.js"
          strategy="afterInteractive"
          async
        />
      </head>
      <body className={inter.className}>
        {children}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <script src="//code.tidio.co/6llt3f02itoiycwhyomg2pzgggr6tr7n.js" async></script>
      </body>
    </html>
  );
} 