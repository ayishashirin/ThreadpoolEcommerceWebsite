document.addEventListener('DOMContentLoaded', function () {
  console.log('hi')
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
        reloadPage();
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


async function returnOrder(orderItemId) {
  try {
    const response = await fetch(`/userOrderReturn/${orderItemId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Order item returned successfully',
      }).then((result) => {
        if (result.isConfirmed) {
          location.reload();
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to return order item',
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error returning order item',
    });
  }
}

document.getElementById('payAgainBtn').addEventListener('click', (event) => {
  const orderId = event.target.getAttribute('data-order-id');
  const productId = event.target.getAttribute('data-product-id');
  console.log("payagain clicked", orderId);
  payAgain('razorpay', orderId, productId);
});

// function payAgain(paymentMethode) {
// if (paymentMethode === 'razorpay') {
// console.log('hi')
// processRazorpayPayment();
// }
// }

async function payAgain(paymentMethode, orderid, productId) {


  try {


    const response = await axios.post('/payAgain', { orderid, paymentMethode, productId });

    console.log(response);

    // if (response.data.paymentMethode === "razorpay") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="3em" height="3em" viewBox="0 0 128 128">
  <path fill="none" stroke="#00796b" stroke-miterlimit="10" stroke-width="3" d="M26.96 39.45c-.75-5.68-2.02-15.69-1.18-21.2s3.04-10.59 7.63-12.6c3.97-1.73 8.92.1 11.78 4.38c1.63 2.44 2.56 5.45 3.35 8.43c1.35 5.12 2.64 12.12 3.29 17.39" />
  <path fill="#26a69a" d="M30.71 116.64L6.54 106.57l5.61-24.74l-1.2-56.38l61.16-7.18v5.34l14.55 1.84z" />
  <path fill="#61de9f" d="M91.85 107.44L30.7 116.7l-5.2-32.38V34.7l61.16-9.25v49.61z" />
  <path fill="#263238" d="M25.5 34.7v-5.58l-14.55-3.67l61.28-6.8l1.96 4.34l12.47 1.83z" />
  <path fill="#1c3334" d="M36.47 47.99c-.74-4.79-2-13.21-1.17-18.37c.81-5.16 2.97-8.94 7.42-10.65c3.86-1.68 8.66.09 11.44 4.27c1.58 2.38 2.47 5.31 3.23 8.23c1.3 4.99 2.54 11.8 3.16 16.91m.89 8.23c.95-6.77 2.54-18.53 2.68-25.02c.14-6.49-2.11-10.78-7.21-12.8c-4.86-1.94-10.93-.07-14.52 4.95c-2.27 3.09-3.42 7.3-4.54 10.89c-.91 2.91-2.36 6.55-2.74 9.63c-.48 3.94 2.26 22.84 1.35 27.63m5.48-5.94l-6.17 34.01L24 109.9l66.94-10.61v-8.68l9.75-1.42" />
</svg>`;
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    const options = {
      key: response.data.keyId,
      amount: response.data.order.amount,
      currency: 'INR',
      name: "Threadpool",
      description: "Threadpool.online offers you flexible and responsive shopping experience.",
      image: svgDataUrl,
      order_id: response.data.order.id,
      callback_url: `/onlinePaymentSuccessfull?orderId=${orderid}&productId=${productId}`,
      prefill: {
        name: response.data.failedOrder.fullName,
        email: response.data.failedOrder.email,
        contact: response.data.failedOrder.phoneNumber
      },
      notes: {
        address: "Razorpay Corporate Office"
      },
      theme: {
        color: "#f53f85"
      }
    };

    const rzp1 = new Razorpay(options);
    rzp1.open();

    // rzp1.on('payment.failed', async (response) => {
    // try {
    // await axios.post('/onlinePaymentFailed', {
    // orderId: response.error.metadata.order_id,
    // paymentId: response.error.metadata.payment_id
    // });
    // } catch (error) {
    // console.error('Error during payment failed handling:', error);
    // } finally {
    // setTimeout(() => {
    // rzp1.close();
    // window.location.href = "/orders";
    // }, 0);
    // }
    // });
    // }
  } catch (error) {
    // document.getElementById('loader').style.display = 'none'; // Hide loader in case of an error

    console.error('Error:', error);
    if (error.response && error.response.status === 400) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response.data.message || 'An error occurred while placing the order. Please try again later.',
        confirmButtonText: 'OK'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while placing the order. Please try again later.',
        confirmButtonText: 'OK'
      });
    }
  } finally {
    // document.getElementById('loader').style.display = 'none'; // Hide loader after completion
  }
}