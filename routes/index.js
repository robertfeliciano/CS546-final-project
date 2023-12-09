import postRoutes from './posts.js';
import userRoutes from './users.js';
import songRoutes from './songs.js';
import albumRoutes from './albums.js';
import registerRoutes from './registerRoutes'
import path from 'path';

const constructorMethod = (app) => {
  app.use('/posts', postRoutes);
  app.use('/users', userRoutes);
  app.use('/songs', songRoutes);
  app.use('/albums', albumRoutes);
  app.use('/register', registerRoutes);
  app.use('/login', loginRoutes);
  app.use('/logout', logoutRoutes);
  app.use('/error', errorRoutes);
  app.use('*', (req, res) => {
    res.redirect('/error');
  });
};

export default constructorMethod;
