const dCat = document.querySelector('.dCat');

function showPopUp(orderId, productId) {
	dCat.setAttribute('href', href=`/orderCancel/${orderId}/${productId}`);
	document.getElementById('confirmation-popup').style.display = 'block';
};

document.getElementById('confirm-btn').addEventListener('click', function() {
	document.getElementById('confirmation-popup').style.display = 'none';
});

document.getElementById('cancel-btn').addEventListener('click', function() {
	document.getElementById('confirmation-popup').style.display = 'none';
});

const aTag = document.querySelectorAll('.aTag');

aTag.forEach(element => {
  element.addEventListener('click', (e) => {
    e.stopPropagation();
  })
})
 


