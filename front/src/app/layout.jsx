import BootstrapInit from "@/helper/BootstrapInit";
import RouteScrollToTop from "@/helper/RouteScrollToTop";
import LoadPhosphorIcons from "@/helper/LoadPhosphorIcons";

import "./font.css";
import "./globals.scss";

export const metadata = {
  title: "Smartech - LMS, Tutors, Education & Online Course NEXT JS Template",
  description:
    "Smartech is a comprehensive and modern NEXT JS template designed for online education platforms, learning management systems (LMS), tutors, educational institutions, and online courses. It's the perfect solution for creating an engaging and interactive online learning experience for students, educators, and institutions. Whether you're offering online courses, running a tutoring platform, or managing an educational website, Smartech provides the tools to help you succeed. This template is tailored to meet the needs of educators, administrators, and students, providing a seamless and engaging user experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body suppressHydrationWarning={true}>
        <BootstrapInit />
        <LoadPhosphorIcons />

        <RouteScrollToTop />
        {children}
        <script src="//code.tidio.co/6llt3f02itoiycwhyomg2pzgggr6tr7n.js" async></script>
      </body>
    </html>
  );
}