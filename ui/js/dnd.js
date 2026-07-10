function initDragDrop(container, items, onReorder) {
    if (!container) return;
    let dragIndex = null;

    container.querySelectorAll('.dnd-item').forEach((el) => {
        el.draggable = true;
        el.addEventListener('dragstart', (e) => {
            dragIndex = parseInt(el.dataset.index);
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            dragIndex = null;
            container.querySelectorAll('.dnd-item').forEach((x) => x.classList.remove('drag-over'));
        });
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            el.classList.add('drag-over');
        });
        el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
        el.addEventListener('drop', (e) => {
            e.preventDefault();
            el.classList.remove('drag-over');
            const dropIndex = parseInt(el.dataset.index);
            if (dragIndex === null || dragIndex === dropIndex) return;
            const moved = items.splice(dragIndex, 1)[0];
            items.splice(dropIndex, 0, moved);
            onReorder(items);
        });
    });
}
