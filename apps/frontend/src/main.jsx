import React from "react";
import ReactDOM from "react-dom/client";
import AppComponent from './app';

console.log('Application is starting to render...');
// Render application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppComponent />);
