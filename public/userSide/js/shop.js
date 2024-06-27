//search

function searchProducts() {
    const searchTerm = document.getElementById('searchTerm').value;

    const searchUrl = `/search?query=${encodeURIComponent(searchTerm)}`;

    window.location.href = searchUrl;
  }

 // price

 document.addEventListener("DOMContentLoaded", function() {
    const priceRange = document.querySelector("#priceRange");
    const priceValue = document.querySelector(".priceValue");


    function updateQueryParams(param, value) {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set(param, value);
      window.location.search = urlParams.toString();
    }


    function setPrices(minPrice, maxPrice) {
      priceRange.min = minPrice;
      priceRange.max = maxPrice;
      priceValue.textContent = "$." + maxPrice;

      priceRange.addEventListener("input", (e) => {
        const selectedPrice = e.target.value;
        priceValue.textContent = "$." + selectedPrice;
        updateQueryParams('maxPrice', selectedPrice);
      });
    }


    const minPrice = 1;
    const maxPrice = 1000;
    setPrices(minPrice, maxPrice);
  });

  // color

  document.addEventListener("DOMContentLoaded", function() {
    var colorLinks = document.querySelectorAll('.color-list-row a');

    colorLinks.forEach(function(link) {
      var color = link.getAttribute('title');
      var currentColor = '<%= color %>';

      if (currentColor === color) {
        link.style.border = '1px solid black';
      }
    });
  });


  function updateQueryParams(param, value) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set(param, value);
    window.location.search = urlParams.toString();
  }

  document.querySelectorAll('.color-list-row a').forEach(anchor => {
    anchor.addEventListener('click', event => {
      event.preventDefault();
      updateQueryParams('color', event.target.getAttribute('title'));
    });
  });

  document.querySelectorAll('.size-list-row a').forEach(anchor => {
    anchor.addEventListener('click', event => {
      event.preventDefault();
      updateQueryParams('size', event.target.textContent);
    });
  });

//sort

  function handleSort() {
    var sortOrder = document.getElementById("sortOrder").value;

    var currentURL = window.location.href;
    var baseURL = currentURL.split('?')[0];
    var queryParams = new URLSearchParams(window.location.search);

    queryParams.set('sort', sortOrder);

    var newURL = baseURL + '?' + queryParams.toString();

    window.location.href = newURL;
  }

  //add to cart


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
            if (res.status === 200 && res.data.success) {
              Swal.fire({
                  icon: 'success',
                  title: 'Success',
                  text: res.data.message,
                  timer: 3000,
                  timerProgressBar: true
                })
                .then(isTrue => {
                  console.log(isTrue);
                  if ((isTrue.isDismissed || isTrue.isConfirmed) && res.data.url) {
                    location.href = res.data.url;
                  }
                })
            } else if (res.status === 401) {
              location.href = '/login';
            }else if(res.status === 402){
              Swal.fire({
                icon: 'info',
                title: 'already login',
                text: res.data.message,
                timer: 3000,
              });
            } else {
              Swal.fire({
                icon: 'info',
                title: 'please login',
                text: res.data.message,
                timer: 3000,
              });
              
             
            }
          })
          .catch(error => {
            console.error("Error adding product to cart:", error);
            if (error.response && error.response.status === 401) {
              location.href = '/login';
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Product already exists in cart'
              });
            }
          });
      });
    });
  });

  //add to wishlist

  document.addEventListener("DOMContentLoaded", function() {
    const addToWishlistButtons = document.querySelectorAll(".add-to-wishlist");

    addToWishlistButtons.forEach(function(button) {
      button.addEventListener("click", function(event) {
        event.stopPropagation();
        event.preventDefault();

        const productId = button.getAttribute('data-productId');

        axios.get(`/wishlistNow/${productId}`)
          .then(res => {
            console.log(res);
            if (res.data.success) {
              Swal.fire({
                  icon: 'success',
                  title: 'Success',
                  text: res.data.message,
                  timer: 3000,
                  timerProgressBar: true
                })
                .then(isTrue => {
                  console.log(isTrue);
                  if ((isTrue.isDismissed || isTrue.isConfirmed) && res.data.url) {
                    location.href = res.data.url;
                  }
                });
            } else {

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please Login first...!'
              });
            }
          })
          .catch(error => {
            console.error("Error adding product to wishlist:", error);

            if (error.response && error.response.status === 401) {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'User not logged in. Please log in to add products to your wishlist.'
              });
            } else {

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Product already exists in wishlist!'
              });
            }
          });
      });
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    const irsFromElement = document.querySelector('.irs-from');
    const value = getBeforeContent(irsFromElement);
    console.log(value);
  });



  document.addEventListener("DOMContentLoaded", function() {
    const addToCompareButtons = document.querySelectorAll(".compare-btn a");

    addToCompareButtons.forEach(function(button) {
        button.addEventListener("click", function(event) {
            event.stopPropagation();
            event.preventDefault();

            const productId = button.getAttribute('data-productId');

            axios.get(`/compareNow/${productId}`)
                .then(res => {
                    console.log(res);
                    if (res.data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: 'Product added to compare list',
                            timer: 3000,
                            timerProgressBar: true
                        }).then(isTrue => {
                            console.log(isTrue);
                            if ((isTrue.isDismissed || isTrue.isConfirmed) && res.data.url) {
                                location.href = res.data.url;
                            }
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Please login first...!'
                        });
                    }
                })
                .catch(error => {
                    console.error("Error adding product to compare list:", error);

                    if (error.response && error.response.status === 401) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'User not logged in. Please log in to add products to your compare list.'
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Product already exists in compare list!'
                        });
                    }
                });
        });
    });
});
