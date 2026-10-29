import { REVISION } from 'three';
import { validateBlueprintProject } from './index';
import './style.css';
const project = validateBlueprintProject({});
const app = document.querySelector<HTMLElement>('#app');
if (app) {
  const title = document.createElement('h1'); title.textContent = project.title;
  const status = document.createElement('p'); status.textContent = 'Fase 0 preparada para revisión. Experiencia 3D pendiente de autorización.';
  const details = document.createElement('p'); details.textContent = 'Contrato v1 · Three.js r' + REVISION + ' · preset ' + project.art.preset;
  app.append(title, status, details);
}
