module.exports = {
  successGoogleLogin: (req, res) => {
    if (!req.user) {
      return res.redirect('/failure');
    }
    console.log(req.user);
    res.redirect("/");
  },

  failureGoogleLogin: (req, res) => {
    res.redirect("Error");
  }
};
