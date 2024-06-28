const loadAuth = (req, res) => {
  res.redirect('/login');
};

const successGoogleLogin = (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  console.log(req.user);
  res.redirect("/");
};

const failureGoogleLogin = (req, res) => {
  res.redirect("/");
};

module.exports = {
  loadAuth,
  successGoogleLogin,
  failureGoogleLogin
};
