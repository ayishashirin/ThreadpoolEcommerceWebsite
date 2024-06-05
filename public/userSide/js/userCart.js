
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
          alert(response.data.message); 
        }
      })
      .catch(error => {
        console.error(error); 
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
          alert(response.data.message); 
          
        }
      })
      .catch(error => {
        console.error(error); 
      });
  }

  function updateOrderSummary(res) {
    document.getElementById('totalAmt1').innerText = '$' + res.data.total;
    document.getElementById('discount1').innerText = '-' + res.data.discount;
    document.getElementById('subtotal1').innerText = '$' + (res.data.total + res.data.discount);
  }

  function updateTotalPrice(index) {
    console.log(`up ${index}`);
   
    const quantity = parseInt(document.getElementById(`quantity_${index}`).value);
    const unitPrice = parseFloat(document.getElementById(`unit_price_${index}`).innerText.replace('$', ''));
    const totalPrice = quantity * unitPrice;
   
    document.getElementById(`total_price_${index}`).innerText = '$' + totalPrice.toFixed(2);
  }
