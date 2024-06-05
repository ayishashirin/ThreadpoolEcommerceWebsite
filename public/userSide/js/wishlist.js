
  document.addEventListener("DOMContentLoaded", function() {
    const addToCartButtons = document.querySelectorAll(".add-to-cart");

    addToCartButtons.forEach(function(button) {
      button.addEventListener("click", function(event) {
        event.stopPropagation();
        event.preventDefault();

        const productId = button.getAttribute('data-productId');

        axios.get(`/cartNow/${productId}`)
          .then(res => {
            console.log(res);
            if (res.data.success) {
              // Show success SweetAlert
              Swal.fire({
                  icon: 'success',
                  title: 'Success',
                  text: res.data.message,
                  timer: 3000, // Adjust the time (in milliseconds) the alert is displayed
                  timerProgressBar: true
                })
                .then(isTrue => {
                  console.log(isTrue);
                  if ((isTrue.isDismissed || isTrue.isConfirmed) && res.data.url) {
                    location.href = res.data.url;
                  }
                })
            } else {
              // Show error SweetAlert
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Product already exists in cart!'
              });
            }
          })
          .catch(error => {
            console.error("Error adding product to cart:", error);
            // Show error SweetAlert
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to add product to cart'
            });
          });
      });
    });
  });

