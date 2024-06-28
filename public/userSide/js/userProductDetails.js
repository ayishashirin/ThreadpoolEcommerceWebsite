
    document.addEventListener("DOMContentLoaded", function () {
        var size = "<%= products.variations[0].size %>"; 

        
        var lis = document.querySelectorAll('.products-size-wrapper ul li');
        lis.forEach(function (li) {
            li.classList.remove('active');
        });

       
        var activeSizeElement = document.getElementById("size" + size);
        if (activeSizeElement) {
            activeSizeElement.parentNode.classList.add('active');
        }
    });




    document.addEventListener("DOMContentLoaded", function () {
        var color = "<%= products.variations[0].color.toLowerCase() %>";

        function removeActiveClass() {
            var lis = document.querySelectorAll('.products-color-switch ul li');
            lis.forEach(function (li) {
                li.classList.remove('active');
            });
        }

 
        var activeColorElement = document.querySelector('.products-color-switch .color-' + color);
        if (activeColorElement) {
            activeColorElement.parentNode.classList.add('active');
        }

        var colorElements = document.querySelectorAll('.products-color-switch ul li a');
        colorElements.forEach(function (element) {
            element.addEventListener('click', function (event) {
                event.preventDefault(); 

                removeActiveClass(); 
                var clickedColorElement = event.target.parentNode;
                clickedColorElement.classList.add('active'); 
            });
        });
    });




    document.addEventListener('DOMContentLoaded', function () {
        function zoomIn(event, zoomFactor) {
            const image = event.target;
            image.style.transform = `scale(${zoomFactor})`;
            const boundingBox = image.getBoundingClientRect();
            const offsetX = (event.clientX - boundingBox.left) / boundingBox.width;
            const offsetY = (event.clientY - boundingBox.top) / boundingBox.height;
            image.style.transformOrigin = `${offsetX * 100}% ${offsetY * 100}%`;
        }

        function resetZoom(event) {
            const image = event.target;
            image.style.transform = 'scale(1)';
        }

        const productImages = document.querySelectorAll('.imageZoom img');

        productImages.forEach(img => {
            img.addEventListener('mouseover', function () {
                img.style.transform = 'scale(5)';
                img.style.transition = 'transform 0.3s ease';
            });

            img.addEventListener('mousemove', function (e) {
                zoomIn(e, 1.2);
            });

            img.addEventListener('mouseleave', function () {
                img.style.transform = 'scale(1)';
            });

            img.addEventListener('mouseout', resetZoom);
        });
    });

    
  
