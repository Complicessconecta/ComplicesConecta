// Modal
var modalButton = document.getElementById('modal-btn');
var modal = document.getElementById('main-modal');
var modalClose = document.getElementById('close');

//on click show modal
modalButton.addEventListener('click', function() {
  modal.showModal();
});

// on click close modal
modalClose.addEventListener('click', function() {
  modal.close();
});