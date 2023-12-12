import loginRoutes from './login.js';
import logoutRoutes from './logout.js';
import postRoutes from './posts.js';
import registerRoutes from './register.js';
import userRoutes from './users.js';
import homeRoutes from './home.js';
import musicRoutes from './music.js';

const constructorMethod = (app) => {
  app.use('/login', loginRoutes);
  app.use('/logout', logoutRoutes);
  app.use('/register', registerRoutes);
  app.use('/posts', postRoutes);
  app.use('/users', userRoutes);
  app.use('/home', homeRoutes);
  app.use('/music', musicRoutes);
  // TODO need error routes

  app.use('*', (req, res) => {
    res.redirect('/home');
  });
}

export default constructorMethod;