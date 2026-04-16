import loginStyle from "../pages-css/login.module.css";
import { useState, useEffect } from "react";

const LoginPage = () => {
  const phrases = [
    "نهكر الكوره ونهكر الملاعب .",
    "اذا متعصب لاتقرب .",
    "ابعد بعيد ولاتخرب .",
    "التعصب آآفه",
    "غير كذا ححححياك مليون .",
  ];

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isResetting) {
      const timer = setTimeout(() => {
        setDisplayedLines(["", "", "", "", ""]);
        setCurrentLineIndex(0);
        setIsResetting(false);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (currentLineIndex < phrases.length) {
      const full = phrases[currentLineIndex];
      const current = displayedLines[currentLineIndex];

      if (current.length < full.length) {
        const timer = setTimeout(() => {
          const newLines = [...displayedLines];
          newLines[currentLineIndex] = full.substring(0, current.length + 1);
          setDisplayedLines(newLines);
        }, 100);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setCurrentLineIndex((prev) => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      const timer = setTimeout(() => {
        setIsResetting(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [displayedLines, currentLineIndex, isResetting]);

  return (
    <div className={loginStyle.container}>
      <div className={loginStyle.overlay}></div>
      <div className={loginStyle.terminalHeader}>
        {displayedLines.map((line, index) => (
          <div key={index} className={loginStyle.line}>
            {line}
            {currentLineIndex === index && !isResetting && (
              <span className={loginStyle.cursor}></span>
            )}
          </div>
        ))}
      </div>

      <div className={loginStyle.inputWrapper}>
        <input
          type="text"
          placeholder="Username"
          className={loginStyle.inputField}
        />
      </div>

      <div className={loginStyle.inputWrapper}>
        <input
          type="password"
          placeholder="Password"
          className={loginStyle.inputField}
        />
      </div>

      <button className={loginStyle.loginBtn}>Login</button>
    </div>
  );
};

export default LoginPage;
