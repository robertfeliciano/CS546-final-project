import loginRoutes from './login.js';
import logoutRoutes from './logout.js';
import postRoutes from './posts.js';
import registerRoutes from './register.js';

let userRoutes = 'cock';

const constructorMethod = (app) => {
  app.use('/login', loginRoutes);
  app.use('/logout', logoutRoutes);
  app.use('/register', registerRoutes);
  app.use('/posts', postRoutes);
  app.use('/users', userRoutes);

  app.use('*', (req, res) => {
    res.status(404).json({error: 'Route not found'});
  });
}

export default constructorMethod;