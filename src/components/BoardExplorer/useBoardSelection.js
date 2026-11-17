import {useEffect, useMemo, useRef, useState} from 'react';
import {useHistory, useLocation} from '@docusaurus/router';
import {getVisiblePorts, validateBoard} from './board-state.cjs';

export default function useBoardSelection({views, ports, initialFilter = '常用接口'}) {
  const portById = useMemo(() => {
    validateBoard(views, ports);
    return new Map(ports.map(port => [port.id, port]));
  }, [views, ports]);
  const history = useHistory();
  const location = useLocation();
  const defaultPort = views.front.defaultPort;
  const [selected, setSelected] = useState(defaultPort);
  const [filter, setFilter] = useState(initialFilter);
  const current = portById.get(selected);
  const restored = useRef(false);

  // Keep SSR deterministic, then restore links and browser navigation on the client.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('port');
    const next = portById.get(id)?.id || views[params.get('side')]?.defaultPort || defaultPort;
    if (!restored.current || next !== selected) {
      setSelected(next);
      setFilter(id === next ? '全部' : initialFilter);
      restored.current = true;
    }
  }, [location.search, portById, defaultPort, selected, initialFilter, views]);

  const select = id => {
    if (!portById.has(id)) return;
    const params = new URLSearchParams(location.search);
    params.delete('side');
    params.set('port', id);
    setSelected(id);
    history.replace({...location, search: '?' + params.toString()});
  };

  const browseSide = side => {
    if (!views[side]) return;
    const params = new URLSearchParams(location.search);
    params.delete('port');
    if (side === 'front') params.delete('side');
    else params.set('side', side);
    setSelected(views[side].defaultPort);
    history.replace({...location, search: params.toString()});
  };

  const changeSide = side => {
    if (side === current.side || !views[side]) return;
    setFilter(side === 'front' ? initialFilter : '全部');
    select(views[side].defaultPort);
  };

  const changeFilter = value => {
    setFilter(value);
    const next = ports.find(port => port.side === current.side && (value === '全部' || port.group === value));
    if (next) select(next.id);
  };

  return {
    selected, current, side: current.side, filter, setFilter, select, changeSide, changeFilter, browseSide,
    pinnedId: portById.get(new URLSearchParams(location.search).get('port'))?.id,
    visiblePorts: getVisiblePorts(ports, current.side, filter, selected),
  };
}
