
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
    const paymentMethode = document.querySelector('input[name="paymentMethode"]:checked').value;
    const adId = document.querySelector('input[name="adId"]').value;
    const coupon = document.getElementById("code").innerText;
    const offerPrice = document.querySelector("#offerPrice").textContent.replace("-$", "");

    // Example: You can fetch other input values similarly

    try {
      // Make an Axios POST request to send the data to the server
      console.log(paymentMethode, adId,coupon);
      const response = await axios.post('/cartCheckOut', {
        paymentMethode,
        adId,
        coupon,
        offerPrice
        // Add other input values as needed
      });

      // Handle the response from the server

      if(response.data.paymentMethode === "razorpay"){
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="3em" height="3em" viewBox="0 0 128 128"><path fill="none" stroke="#00796b" stroke-miterlimit="10" stroke-width="3" d="M26.96 39.45c-.75-5.68-2.02-15.69-1.18-21.2s3.04-10.59 7.63-12.6c3.97-1.73 8.92.1 11.78 4.38c1.63 2.44 2.56 5.45 3.35 8.43c1.35 5.12 2.64 12.12 3.29 17.39"/><path fill="#26a69a" d="M30.71 116.64L6.54 106.57l5.61-24.74l-1.2-56.38l61.16-7.18v5.34l14.55 1.84z"/><path fill="#61de9f" d="M91.85 107.44L30.7 116.7l-5.2-32.38V34.7l61.16-9.25v49.61z"/><path fill="#263238" d="M25.5 34.7v-5.58l-14.55-3.67l61.28-6.8l1.96 4.34l12.47 2.46z"/><path fill="#00796b" d="M6.54 106.57c.42 0 14.48-11.15 14.48-11.15l9.68 21.28l-2.08-33.93l-3.15-48.07l-4.09 51.95z"/><path fill="#26a69a" d="m72.05 19.29l1.48 3.42l.19.45l.47.12l7.45 1.91l-55.14 8.35v-5.2l-.76-.19l-9.28-2.34zm.63-1.08l-61.72 7.24l14.55 3.67v5.59l61.15-9.26l-12.21-3.14z"/><path fill="none" stroke="#61de9f" stroke-miterlimit="10" stroke-width="3" d="M43.95 38.45C43.2 32.78 35.39 11 50.34 8.22c11.3-2.1 16.29 21.97 16.95 27.25"/><path fill="#26a69a" d="M45.81 40.03c-.87-2.93-1.78-8.85-1.82-9.11l2.96-.45c.01.06 1.07 6.1 2.23 8.93zm23.32-3.55c-.87-2.93-1.78-8.85-1.82-9.11l2.96-.45c.01.06 1.24 6.2 2.27 8.94zm-22.29 77.78l8.4-14.55l-4.01-38.79l33.57-6.53l-18 56.89z"/><path fill="none" stroke="#d7578a" stroke-miterlimit="10" stroke-width="3" d="M73.07 57.05s-3.78-20.07 8.81-18.74c6.85.72 6.57 16.65 6.57 16.65"/><path fill="#d7578a" d="m74.46 123.99l-18.57-7.77l4.32-19.02l-.92-43.34l47-5.52v4.11l11.18 1.41z"/><path fill="#ff9f9f" d="m121.46 116.88l-47 7.12l-3.99-24.89V60.98l47-7.12V92z"/><path fill="#263238" d="m70.47 60.98l-3.76-2.88l-7.42-4.24l47-5.52l4.27 2.69l6.91 2.83z"/><path fill="#d7578a" d="m106.11 49.37l8.05 3.97l-43.48 6.58l-8.49-5.4zm.18-1.03l-47 5.52l11.18 7.12l47-7.12z"/><path fill="#d7578a" d="M86.36 64.81c-.67-2.24-1.36-6.79-1.39-6.98l2.64-.34c.01.05.68 4.63 1.3 6.74zm17.89-2.75c-.67-2.24-1.36-6.79-1.39-6.98l2.61-.33c.01.05.55 4.77 1.17 6.88z"/><path fill="none" stroke="#ff9f9f" stroke-miterlimit="10" stroke-width="3" d="M84.88 64.91c-.58-4.36-6.52-22.74 4.68-24.29c8.75-1.21 12.52 16.89 13.03 20.94"/><path fill="#ab2c5e" d="m55.89 116.22l9.49-8.04L74.46 124l-3.97-24.74l.04-38.16l-1.12-.46l-3.54 38.79z"/></svg>`;

          // Convert SVG data to a data URL
         const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
        const options = {
          "key": response.data.keyId, // Replace with your Razorpay Key ID
          "amount": response.data.order.amount, 
          "currency": response.data.order.currency,
          "name": "Threadpool", // Your business name
          "description": "Threadpool.online offers you flexible and responsive shopping experience.",
          "image":svgDataUrl,
          "order_id": response.data.order.id, // Replace with your order ID
          "callback_url": "http://localhost:3999/onlinePaymentSuccessfull", // Replace with your callback URL
          "prefill": {
            "name": response.data.order.fullName, // Customer name
            "email": response.data.order.email,
            "contact": response.data.order.phoneNumber // Customer phone number
          },
          "notes": {
            "address": "Razorpay Corporate Office"
          },
          "theme": {
            "color": "#f53f85"
          },
        }

      const rzp1 = new Razorpay(options);
      rzp1.open();
    }else{
      location.href = '/orderSuccessfull';
    }
      // Example: Redirect to a success page
      // window.location.href = '/orderSuccessfull'; // Redirect to a success page after successful order placement
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      // Example: Show an error message to the user
      alert('An error occurred while placing the order. Please try again later.');
    }
  });

// ---------------------------------------------------------------------------------------------------------------





