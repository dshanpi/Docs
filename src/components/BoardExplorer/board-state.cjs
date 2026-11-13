const FILTERS = ['常用接口', '扩展接口', '全部'];

function validateBoard(views, ports) {
  if (!views.front) throw new Error('Board views must include front.');
  const ids = new Set();
  for (const port of ports) {
    if (typeof port.id !== 'string' || !port.id || ids.has(port.id)) throw new Error('Board port IDs must be unique: ' + port.id);
    ids.add(port.id);
    const view = views[port.side];
    if (!view) throw new Error('Unknown board side: ' + port.side);
    const {rect} = port;
    if (!Array.isArray(rect) || rect.length !== 4 || !rect.every(Number.isFinite) || rect[2] <= 0 || rect[3] <= 0) {
      throw new Error('Invalid port rectangle: ' + port.id);
    }
    const [x, y, width, height] = rect;
    const crop = view.crop;
    if (x < crop.x || y < crop.y || x + width > crop.x + crop.width || y + height > crop.y + crop.height) {
      throw new Error('Port rectangle is outside the photograph crop: ' + port.id);
    }
    if (!FILTERS.slice(0, 2).includes(port.group)) throw new Error('Unknown port group: ' + port.id);
    if (!port.name || !port.href || !Array.isArray(port.supplies)) throw new Error('Incomplete port details: ' + port.id);
  }
  for (const [side, view] of Object.entries(views)) {
    if (!view.photo || !(view.imageWidth > 0) || !(view.crop.width > 0) || !(view.crop.height > 0)) {
      throw new Error('Invalid board photograph: ' + side);
    }
    if (view.crop.x < 0 || view.crop.y < 0 || view.crop.x + view.crop.width > view.imageWidth) {
      throw new Error('Invalid photograph crop: ' + side);
    }
    if (!ports.some(port => port.id === view.defaultPort && port.side === side)) {
      throw new Error('Default port must belong to its board side: ' + side);
    }
  }
}

function getVisiblePorts(ports, side, filter, selected, allowedIds) {
  return ports.filter(port =>
    port.id === selected ||
    (allowedIds ? allowedIds.includes(port.id) : port.side === side && (filter === '全部' || port.group === filter))
  );
}

module.exports = {FILTERS, validateBoard, getVisiblePorts};
