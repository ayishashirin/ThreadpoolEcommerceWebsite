

const radio = document.querySelectorAll('.radio');

radio.forEach((element, index) => {
  element.addEventListener('change', () => {
    document.querySelector('.formDiv').submit();
  })
}); 




document.getElementById('confirm-btn').addEventListener('click', function() {
  console.log($('#form').serialize());
  $.ajax({
    url: '/cartCheckOut',
    data: $('#form').serialize(),
    method: "POST"
  })
  .then(res => {
    if(res.err){
      return location.href = res.url;
    }

    if(res.paymentMethode === "COD"){
      return location.href = res.url;
    }

    if(res.paymentMethode === "razorpay"){
      const options = {
        "key": res.keyId,
        "amount": res.order.amount,
        "currency": "USD",
        "name": "Threadpool",
        "description": "Test Transaction",
        // "image": "/userSide/images/header/logo.svg",
        "order_id": res.order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "callback_url": "/onlinePaymentSuccessfull", //after sucessful payment
        "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information especially their phone number
            "name": " Ayisha Shirin VP", 
            "email": "ayishashirinvp@gmail.com",
            "contact": "7594873872" //Provide the customer's phone number for better conversion rates 
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
      };
  
      const rzp1 = new Razorpay(options);
  
      rzp1.open();
    }
  })
  .catch(err => {
    console.err(err)
  })
	document.getElementById('confirmation-popup').style.display = 'none';
});

document.getElementById('cancel-btn').addEventListener('click', function() {
	document.getElementById('confirmation-popup').style.display = 'none';
});

document.querySelector('#form').addEventListener('submit', (e) => {
  e.preventDefault();
	document.getElementById('confirmation-popup').style.display = 'block';
});

const formAddNewAddress = document.querySelector('#addNewAddress');

formAddNewAddress.addEventListener('submit', (e) => {
  e.preventDefault();
  $.ajax({
    url: '/AddAddress?checkOut=true',
    method: 'POST',
    dataType: 'html',
    data: $('#addNewAddress').serialize(),
  })
  .then(data => {
    if (data === 'true') {
      return location.reload();
    }
    const newContent = $(data).find('.editBody').html();

    $('.editBody').html(newContent);
  })
  .catch(err => {
    console.log(err);
  });
});