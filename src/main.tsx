import { render } from 'preact';
import './index.css';
import { App } from './app.tsx';

const root = document.getElementById('app');
if (root === null) {
  throw new Error('Élément #app introuvable dans index.html');
}

render(<App />, root);
