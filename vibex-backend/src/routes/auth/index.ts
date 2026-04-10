import { Hono } from 'hono';
/**
 * @deprecated Auth routes have been migrated to App Router (app/api/auth/).
 * See: docs/migration/page-router-to-app-router.md
 */
import login from './login';
import register from './register';
import logout from './logout';

const auth = new Hono();

auth.route('/login', login);
auth.route('/register', register);
auth.route('/logout', logout);

export default auth;
