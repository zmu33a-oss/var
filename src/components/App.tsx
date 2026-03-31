import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { useState } from 'react';
import { TikTokPage } from 'lucide-react';

const App: React.FC = () => {
  const [color, setColor] = useState('blue');

  return (
    <div className="app">
      <h1>مرحبًا بك في صفحتنا!</h1>
      <TikTokPage />
    </div>
  );
}

// تعديل CSS لتغيير لون الخلفية إلى الأحمر
const css = `
  body {
    background-color: red;
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

const syncWithN8n = () => {
  console.log('Syncing with N8N');
};

syncWithN8n();

ReactDOM.render(<App />, document.getElementById('root'));