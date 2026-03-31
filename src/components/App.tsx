import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { useState } from 'react'; // الحفاظ على وجود useState
import { TikTokPage } from 'lucide-react'; // الحفاظ على وجود lucide-react و TikTokPage

const App: React.FC = () => {
  const [color, setColor] = useState('blue'); // مثال على استخدام useState

  return (
    <div className="app">
      <h1>مرحبًا بك في صفحتنا!</h1>
      <TikTokPage /> {/* استخدام TikTokPage للتأكد من الحفاظ عليه */}
    </div>
  );
}

// تعديل CSS لتغيير لون الخلفية إلى الأزرق
const css = `
  body {
    background-color: blue;
  }
  .app {
    text-align: center;
    margin: 0 auto;
    padding: 20px;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

// إدراج نمط CSS في الرأس
const style = document.createElement("style");
style.appendChild(document.createTextNode(css));
document.head.appendChild(style);

// الحفاظ على وظيفة syncWithN8n
const syncWithN8n = () => {
  console.log('Syncing with N8N');
};

syncWithN8n();

ReactDOM.render(<App />, document.getElementById('root'));