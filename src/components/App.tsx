import { useState } from "react";
import { ChevronDown, Home, Trophy, Users, User } from "lucide-react";
import "./App.scss";
import TikTokPage from "./TikTokPage";
import { syncWithN8n } from "../n8nService";

// تعريف الواجهة لحل مشكلة الـ TypeScript
interface N8nResponse {
  script?: string;
  actions?: any[];
  [key: string]: any;
}

function App() {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState("TikTok Mode");

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // دالة التعامل مع n8n مع حل مشكلة الـ void
  const handleN8nAction = async (source: string, payload: any) => {
    console.log(`Sending to n8n from: ${source}`);

    // تحويل النتيجة لـ unknown أولاً ثم للنوع المطلوب لحل خطأ الـ TypeScript
    const result = await syncWithN8n(source, payload);
    const instructions = result as unknown as N8nResponse;

    if (instructions && instructions.script) {
      if (instructions.script.includes("X Mode")) {
        setCurrentMode("X Mode");
      }
    }
  };

  const switchMode = (mode: string) => {
    setCurrentMode(mode);
    setIsMenuOpen(false);
    handleN8nAction("MainApp", { action: "switch_mode", new_mode: mode });
  };

  return (
    <div
      className={`app-container ${currentMode === "X Mode" ? "x-theme" : "tiktok-theme"}`}
    >
      <header className="top-switch">
        <div className="dropdown-container">
          <button className="dropdown-trigger" onClick={toggleMenu}>
            <ChevronDown
              size={18}
              className={`arrow ${isMenuOpen ? "rotate" : ""}`}
            />
            <span className="mode-label">{currentMode}</span>
          </button>

          {isMenuOpen && (
            <div className="dropdown-menu">
              <div
                className="menu-item"
                onClick={() =>
                  switchMode(
                    currentMode === "TikTok Mode" ? "X Mode" : "TikTok Mode",
                  )
                }
              >
                {currentMode === "TikTok Mode" ? "X Mode" : "TikTok Mode"}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="content-area">
        {currentMode === "TikTok Mode" ? (
          <TikTokPage />
        ) : (
          <div className="x-mode-placeholder">
            <h2>X Mode Content</h2>
            <p>تم التعديل بواسطة n8n</p>
          </div>
        )}

        {currentMode === "TikTok Mode" && (
          <div className={`side-actions ${isActionsOpen ? "active" : ""}`}>
            <div
              className="main-action-btn"
              onClick={() => {
                const newState = !isActionsOpen;
                setIsActionsOpen(newState);
                handleN8nAction("SideMenu", { plus_button_clicked: newState });
              }}
            >
              <span className="plus-icon">{isActionsOpen ? "×" : "+"}</span>
            </div>
            <div className="sub-actions">
              <div
                className="action-item"
                onClick={() => handleN8nAction("Actions", { type: "like" })}
              >
                ❤️
              </div>
              <div
                className="action-item"
                onClick={() => handleN8nAction("Actions", { type: "comment" })}
              >
                💬
              </div>
              <div
                className="action-item"
                onClick={() => handleN8nAction("Actions", { type: "magic" })}
              >
                ✨
              </div>
              <div
                className="action-item"
                onClick={() => handleN8nAction("Actions", { type: "share" })}
              >
                🚀
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <div
          className="nav-item"
          onClick={() => handleN8nAction("Navigation", { tab: "Account" })}
        >
          <User size={24} />
          <span>الحساب</span>
        </div>
        <div
          className="nav-item"
          onClick={() => handleN8nAction("Navigation", { tab: "Leagues" })}
        >
          <Trophy size={24} />
          <span>الدوريات</span>
        </div>
        <div
          className="nav-item"
          onClick={() => handleN8nAction("Navigation", { tab: "Union" })}
        >
          <Users size={24} />
          <span>الرابطة</span>
        </div>
        <div
          className="nav-item active"
          onClick={() => handleN8nAction("Navigation", { tab: "Home" })}
        >
          <Home size={24} />
          <span>الرئيسية</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
