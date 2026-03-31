import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <h1>مرحبًا بك في صفحتنا!</h1>
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

ReactDOM.render(<App />, document.getElementById('root'));