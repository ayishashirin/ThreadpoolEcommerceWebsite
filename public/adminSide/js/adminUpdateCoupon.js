document.addEventListener('DOMContentLoaded', function () {

  const updateForm = document.querySelector('.addProductForm');
  const codeInput = document.querySelector('#codeInput');
  const discountInput = document.querySelector('input[name="discount"]');
  const countInput = document.querySelector('input[name="count"]');
  const minPriceInput = document.querySelector('input[name="minPrice"]');
  const expiryInput = document.querySelector('#expiryInput');
  const addBtn = document.querySelector('.addBtn');
  const errMessages = document.querySelectorAll('.err');

  function clearErrors() {
    errMessages.forEach(err => {
      err.textContent = '';
      err.parentElement.classList.remove('errDiv');
    });
  }

  // Form submission handler
  updateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    const data = {
      code: codeInput.value.trim(),
      discount: discountInput.value.trim(),
      count: countInput.value.trim(),
      minPrice: minPriceInput.value.trim(),
      expiry: expiryInput.value.trim(),
    };

    axios.put(updateForm.action, data)
      .then(response => {
        if (response.data.status) {
          window.location.href = response.data.url;
        }
      })
      .catch(err => {
        if (err.response.status === 401) {
          handleErrors(err.response.data.errors);
          window.location.href = window.location.href;
        } else {
          window.location.href = window.location.href;
        }
      });
  });

  function handleErrors(errors) {
    Object.keys(errors).forEach(key => {
      const inputField = document.querySelector(`input[name="${key}"]`);
      const errorField = inputField.nextElementSibling;
      errorField.textContent = errors[key];
      inputField.parentElement.classList.add('errDiv');
    });
  }

  // Function to generate a coupon code
  window.generateCouponCode = function () {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const couponLength = 8;
    let couponCode = '';

    for (let i = 0; i < couponLength; i++) {
      couponCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    codeInput.value = couponCode;
  };
});
