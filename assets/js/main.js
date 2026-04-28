
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}
function encodeMessage(fields){
  return Object.entries(fields).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join('\n');
}
const booking = document.querySelector('#bookingForm');
if (booking) {
  booking.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(booking).entries());
    const msg = encodeMessage({
      Name:data.name, Phone:data.phone, Service:data.service,
      "Preferred date":data.date, "Preferred time":data.time,
      Details:data.details
    });
    window.location.href = `sms:?&body=${encodeURIComponent('Ravishing Beauté booking request\n\n' + msg)}`;
  });
}
const question = document.querySelector('#questionForm');
if (question) {
  question.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(question).entries());
    const msg = encodeMessage({Name:data.name, Question:data.message});
    window.location.href = `sms:?&body=${encodeURIComponent('Ravishing Beauté question\n\n' + msg)}`;
  });
}
