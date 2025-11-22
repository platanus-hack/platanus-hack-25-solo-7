import "./globals.css";


export const metadata = {
  title: "Eska",
  description: "Platanus Hack 25",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
