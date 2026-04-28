document.addEventListener('DOMContentLoaded', function () {
  var images = document.querySelectorAll('.gallery-item img');
  var box = document.createElement('div');
  var btn = document.createElement('button');
  var photo = document.createElement('img');

  box.className = 'gallery-lightbox';
  btn.type = 'button';
  btn.textContent = 'x';

  box.appendChild(btn);
  box.appendChild(photo);
  document.body.appendChild(box);

  images.forEach(function (image) {
    image.addEventListener('click', function () {
      photo.src = image.src;
      photo.alt = image.alt || 'Gallery image';
      box.classList.add('open');
    });
  });

  btn.addEventListener('click', function () {
    box.classList.remove('open');
    photo.src = '';
  });

  box.addEventListener('click', function (event) {
    if (event.target === box) {
      box.classList.remove('open');
      photo.src = '';
    }
  });
});
