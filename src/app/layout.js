import { RadioProvider } from "@/context/RadioProvider";
import "./globals.css";

export const metadata = {
  title: "CMG Laboratory",
  description: "Document processing app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RadioProvider>{children}</RadioProvider>
      </body>
    </html>
  );
}
