
  // Function to copy coupon code
  function copyCouponCode(code) {
    var tempInput = document.createElement("input");
    tempInput.setAttribute("value", code);
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    alert("Coupon code '" + code + "' copied to clipboard!");
  }

//   ----------------------------------------------------------------------------------------------------



  function applyCoupon() {
    // Get the order total value
    var orderTotal = document.getElementById("orderTotal").innerText.replace("$", "");
    
    // Get the coupon code
    var couponCode = document.getElementById("coupon").value;
    
    // Clear the input field after getting the coupon code
    document.getElementById("coupon").value = "";
    
    // Get the total amount
    var totalAmount = document.getElementById("totalAmount").innerText.replace("$", "");
    
    // Show the coupon row
    // document.getElementById("couponRow")?.classList?.remove("d-none");

    document.getElementById("couponRow").style.display = "block";
    
    // Send a request to check if the coupon is valid
    axios.post('/isCouponValidCart', {
        code: couponCode,
        total: totalAmount
      })
      .then(function(response) {
        console.log(response.data);

        // Calculate the discount amount
        var discountAmount = Math.round((response.data.total * response.data.coupon.discount) / 100);

        // Set the discount amount in the element
        document.getElementById("cDPrice").innerHTML = `-$${discountAmount.toFixed(2)}`;

        console.log("Total", response.data.total);
        console.log("Discount Percentage:", response.data.coupon.discount);

        // Display the discount amount and coupon code
        document.getElementById("cDPrice").style.display = "block";
        document.getElementById("code").innerHTML = response.data.coupon.code;
        document.getElementById("code").style.display = "block";

        alert(response.data.message);

        // Recalculate and update the order total
        calculateOrderTotal();
      })
      .catch(function(error) {
        console.error('Error:', error);
        alert('An error occurred while applying the coupon. Please try again later.');
      });

  }

// --------------------------------------------------------------------------------------------------------------

    // Function to remove the coupon row and cDPrice span element
    function removeCoupon() {
      // Find the coupon row and remove it
    //   var couponRow = document.getElementById("couponRow");
    //   couponRow.parentNode.removeChild(couponRow);
      document.getElementById("couponRow").style.display = "none";
  
      // Find the cDPrice span element and remove it
      var cDPrice = document.getElementById("cDPrice");
      cDPrice.innerText="-$00.00"
    }
//   -----------------------------------------------------------------------------------------------------------


  
  // Function to calculate and update the order total
  function calculateOrderTotal() {
    // Get the total amount
    var totalAmount = parseFloat(document.getElementById("totalAmount").innerText.replace("$", ""));
    
    // Get the discount price
    var discountPrice = parseFloat(document.getElementById("discountPrice").innerText.replace("-$", ""));
    
    // Get the cDPrice (coupon offer price)
    var cDPrice = parseFloat(document.getElementById("cDPrice").innerText.replace("-$", ""));
    
    // Get the offer price
    var offerPrice = parseFloat(document.getElementById("offerPrice").innerText.replace("-$", ""));
    console.log((document.getElementById("offerPrice").innerText).replace("-$", ""));
    
    // Calculate the order total
    var orderTotal = totalAmount - (discountPrice+cDPrice+offerPrice);51

    // Update the order total in the DOM
    document.getElementById("orderTotal").innerText = "$" + orderTotal.toFixed(2);
  }



//   --------------------------------------------------------------------------------------------------------------



  function handlePaymentSelection(paymentMethode) {
    const razorpayRadio = document.getElementById('razorpay');
    const codRadio = document.getElementById('COD');
    const walletRadio = document.getElementById('wallet');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    if (paymentMethode === 'razorpay') {
      // Enable razorpay and disable COD and Wallet
      razorpayRadio.checked = true;
      codRadio.checked = false;
      walletRadio.checked = false;
      placeOrderBtn.href = "/razorpayOrder";
    } else if (paymentMethode === 'cod') {
      // Enable COD and disable razorpay and Wallet
      codRadio.checked = true;
      razorpayRadio.checked = false;
      walletRadio.checked = false;
      placeOrderBtn.href = "/orderSuccessfull";
    } else if (paymentMethode === 'wallet') {
      // Enable Wallet and disable razorpay and COD
      walletRadio.checked =true;
      codRadio.checked = false;
      razorpayRadio.checked = false;
      
      placeOrderBtn.href = "/walletOrder";

    }

    
    placeOrderBtn.removeAttribute('disabled');
  }


//   -------------------------------------------------------------------------------------------------------------




  // Event listener for the "Place Order" button
  document.getElementById('placeOrderBtn').addEventListener('click', async function(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Fetch all input values
    const paymentMethode = document.querySelector('input[name="payMethode"]:checked').value;
    const adId = document.querySelector('input[name="adId"]').value;

    // Example: You can fetch other input values similarly

    try {
      // Make an Axios POST request to send the data to the server
      const response = await axios.post('/cartCheckOut', {
        paymentMethode,
        adId
        // Add other input values as needed
      });

      // Handle the response from the server
      console.log(response.data); // Log the response data
      // Example: Redirect to a success page
      window.location.href = '/orderSuccessfull'; // Redirect to a success page after successful order placement
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      // Example: Show an error message to the user
      alert('An error occurred while placing the order. Please try again later.');
    }
  });

// ---------------------------------------------------------------------------------------------------------------


{/* <button id="rzp-button1">Pay</button> */}

var options = {
    "key": "YOUR_KEY_ID", // Enter the Key ID generated from the Dashboard
    "amount": "50000", // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    "currency": "INR",
    "name": "Acme Corp", //your business name
    "description": "Test Transaction",
    "image": "https://example.com/your_logo",
    "order_id": "order_9A33XWu170gUtm", //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    "callback_url": "https://eneqd3r9zrjok.x.pipedream.net/",
    "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information especially their phone number
        "name": "Gaurav Kumar", //your customer's name
        "email": "gaurav.kumar@example.com",
        "contact": "9000090000" //Provide the customer's phone number for better conversion rates 
    },
    "notes": {
        "address": "Razorpay Corporate Office"
    },
    "theme": {
        "color": "#3399cc"
    }
};
var rzp1 = new Razorpay(options);
document.getElementById('razorpay').onclick = function(e){
    rzp1.open();
    e.preventDefault();
}
