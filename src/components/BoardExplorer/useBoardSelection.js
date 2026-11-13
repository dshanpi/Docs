import {useEffect, useMemo, useRef, useState} from 'react';
import {useHistory, useLocation} from '@docusaurus/router';
import {getVisiblePorts, validateBoard} from './board-state.cjs';

export default function useBoardSelection({views, ports}) {
  const portById = useMemo(() => {
    validateBoard(views, ports);
    return new Map(ports.map(port => [port.id, port]));
  }, [views, ports]);
  const history = useHistory();
  const location = useLocation();
  const defaultPort = views.front.defaultPort;
  const [selected, setSelected] = useState(defaultPort);
  const [filter, setFilter] = useState('常用接口');
  const current = portById.get(selected);
  const restored = useRef(false);

  // Keep SSR deterministic, then restore links and browser navigation on the client.
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('port');
    const next = portById.get(id)?.id || defaultPort;
    if (!restored.current || next !== selected) {
      setSelected(next);
      setFilter(id === next ? '全部' : '常用接口');
      restored.current = true;
    }
  }, [location.search, portById, defaultPort, selected]);

  const select = id => {
    if (!portById.has(id)) return;
    const params = new URLSearchParams(location.search);
    params.set('port', id);
    setSelected(id);
    history.replace({...location, search: '?' + params.toString()});
  };

  const changeSide = side => {
    if (side === current.side || !views[side]) return;
    setFilter(side === 'front' ? '常用接口' : '全部');
    select(views[side].defaultPort);
  };

  const changeFilter = value => {
    setFilter(value);
    const next = ports.find(port => port.side === current.side && (value === '全部' || port.group === value));
    if (next) select(next.id);
  };

  return {
    selected, current, side: current.side, filter, setFilter, select, changeSide, changeFilter,
    visiblePorts: getVisiblePorts(ports, current.side, filter, selected),
  };
}
