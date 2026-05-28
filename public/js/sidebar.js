const sidebar = document.getElementById('sidebar');

if (sidebar) {
  let collapseTimer;

  const collapse = () => sidebar.classList.add('collapsed');
  const expand = () => {
    clearTimeout(collapseTimer);
    sidebar.classList.remove('collapsed');
  };

  sidebar.addEventListener('mouseenter', expand);
  sidebar.addEventListener('mouseleave', () => {
    collapseTimer = setTimeout(collapse, 350);
  });

  collapseTimer = setTimeout(collapse, 1200);
}
