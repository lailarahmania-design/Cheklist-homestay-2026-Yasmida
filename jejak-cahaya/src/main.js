import './styles/theme.css';
import './styles/home.css';
import './styles/teacher.css';
import './styles/play.css';
import { route, startRouter } from './core/router.js';
import { renderHome } from './home/home.js';
import { renderDashboard } from './teacher/dashboard.js';
import { renderEditor } from './teacher/editor.js';
import { renderPlay } from './student/play-page.js';

const app = document.getElementById('app');

route('/', () => renderHome(app));
route('/guru', () => renderDashboard(app));
route('/guru/edit/:id/:tab?', (p) => renderEditor(app, p));
route('/uji/:id', (p) => renderPlay(app, p));

startRouter();
