import "./globals.css";

export const metadata = {
  title: "3-Day Rule | Command Center",
  description: "Ed Mylett's 3-Day Rule productivity system",
  manifest: "/manifest.json",
  themeColor: "#0a0f1a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
