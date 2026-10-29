import { mountPlayground } from './playground/mountPlayground';
import './style.css';

const app = document.querySelector<HTMLElement>('#app');
if (app) void mountPlayground(app);
