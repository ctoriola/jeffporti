import './style.css';
import './reference.css';
document.querySelector('#year').textContent = new Date().getFullYear();
const plot = document.querySelector('.plot');
for (let i = 0; i < 50; i++) {
  const dot = document.createElement('i');
  const group = i % 2;
  dot.style.left = `${12 + ((i * 37) % 70)}%`;
  dot.style.top = `${15 + ((i * 23) % 65)}%`;
  dot.className = group ? 'dot light' : 'dot';
  plot.append(dot);
}
