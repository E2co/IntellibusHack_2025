import { getAuth } from 'firebase/auth';

const AuthUser = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json({ success: false, message: 'Not Authorized'});
  }

  try {
    const auth = getAuth();
    const decodedToken = auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    res.json({ success: false, message: 'Invalid token' });
  }
};

export default AuthUser;