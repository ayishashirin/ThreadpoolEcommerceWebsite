
function increaseQuantity(index, productId) {
  axios.get(`/cartItemUpdate/${productId}/1`)
    .then(response => {
      if (response.data.result) {
        const input = document.getElementById(`quantity_${index}`);
        updateTotalPrice(index);
        updateOrderSummary(response);
      } else {
        const input = document.getElementById(`quantity_${index}`);
        input.value = parseInt(input.value) - 1;
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: response.data.message,
        });
      }
    })
    .catch(error => {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while updating the cart item.',
      });
    });
}

function decreaseQuantity(index, productId) {
  axios.get(`/cartItemUpdate/${productId}/-1`)
    .then(response => {
      if (response.data.result) {
        const input = document.getElementById(`quantity_${index}`);
        updateTotalPrice(index);
        updateOrderSummary(response);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: response.data.message,
        });
      }
    })
    .catch(error => {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while updating the cart item.',
      });
    });
}


  function updateOrderSummary(res) {
    const subtotal = res.data.total + res.data.discount;
    const shippingFee = subtotal < 1000 ? 10 : 0; 
  
    document.getElementById('subtotal1').innerText = '$' + subtotal.toFixed(2);
    document.getElementById('discount1').innerText = '-' + res.data.discount.toFixed(2);
    document.getElementById('shippingFee').innerText = shippingFee === 0 ? 'Free' : '$' + shippingFee.toFixed(2);
    document.getElementById('totalAmt1').innerText = '$' + (subtotal + shippingFee - res.data.discount).toFixed(2);
}

function updateTotalPrice(index) {
    console.log(`up ${index}`);
    
    const quantity = parseInt(document.getElementById(`quantity_${index}`).value);
    const unitPrice = parseFloat(document.getElementById(`unit_price_${index}`).innerText.replace('$', ''));
    const totalPrice = quantity * unitPrice;
    
    document.getElementById(`total_price_${index}`).innerText = '$' + totalPrice.toFixed(2);
}
 