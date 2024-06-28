module.exports = {
  successGoogleLogin: (req, res) => {
    if (!req.user) {
      return res.redirect('/failure');
    }
    console.log(req.user);
    res.send("Welcome " + req.user.email);
  },

  failureGoogleLogin: (req, res) => {
    res.redirect("Error");
  }
};
