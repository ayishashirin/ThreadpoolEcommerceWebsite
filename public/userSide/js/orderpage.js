
    document.addEventListener('DOMContentLoaded', function () {
      let orderId, productId, cancelButton;

      function showPopUp(oid, pid, btn) {
        console.log('showPopUp called with orderId:', oid, 'productId:', pid);
        orderId = oid;
        productId = pid;
        cancelButton = btn;
        document.getElementById('confirmation-popup').classList.add('show');
      }

      function closePopUp() {
        document.getElementById('confirmation-popup').classList.remove('show');
      }

      function cancelOrder() {
        axios.post(`/orderCancel/${orderId}/${productId}`, {
          orderId: orderId,
          productId: productId
        })
          .then(response => {
            console.log('Order cancelled:', response.data);
            if (response.data.success) {
              cancelButton.innerText = 'Cancelled';
              cancelButton.disabled = true;
            }
            closePopUp();
            reloadPage(); // Call the reload function after the cancellation process is complete
          })
          .catch(error => {
            console.error('There was an error cancelling the order:', error);
          });
      }

      function reloadPage() {
        window.location.reload(); 
      }

      document.getElementById('confirm-btn').addEventListener('click', cancelOrder);
      document.getElementById('cancel-btn').addEventListener('click', closePopUp);

      const aTags = document.querySelectorAll('.aTag');
      aTags.forEach(element => {
        element.addEventListener('click', function (e) {
          e.preventDefault();
          const orderId = this.getAttribute('data-order-id');
          const productId = this.getAttribute('data-product-id');
          showPopUp(orderId, productId, this);
        });
      });
    });
  