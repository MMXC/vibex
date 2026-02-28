import { Hono } from 'hono';
import login from './login';
import register from './register';
import logout from './logout';

const auth = new Hono();

auth.route('/login', login);
auth.route('/register', register);
auth.route('/logout', logout);

export default auth;
