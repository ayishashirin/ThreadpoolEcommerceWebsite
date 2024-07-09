document.getElementById('updateForm').addEventListener('submit', function(event) {
	event.preventDefault();
  
	const data = {};
	const formData = new FormData(event.target);
	formData.forEach((value, key) => {
	  data[key] = value;
	});
  
	const actionUrl = event.target.getAttribute('action');
  
	axios.put(actionUrl, data)
	  .then(response => {
		if (response.data.status) {
		  window.location.href = '/adminCategoryManagement';
		}
	  })
	  .catch(error => {
		if (error.response && error.response.data.err) {
		  window.location.reload();
		} else {
		  console.error(error, 'form error');
		}
	  });
  });
  