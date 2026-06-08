import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { get, post, put, del } from '../utils/api';
import { ulid } from 'ulid';

const MIN_LOAD_TIME = 1000;

export function useResource(resource) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async (signal) => {
    const applyMinLoad = isFirstLoad.current;
    const startedAt = Date.now();
    setLoading(true);
    try {
      const data = await get(`/${resource}`, signal);
      if (!mountedRef.current) return;
      isFirstLoad.current = false;
      if (applyMinLoad) {
        const remaining = MIN_LOAD_TIME - (Date.now() - startedAt);
        if (remaining > 0) {
          await new Promise(res => setTimeout(res, remaining));
          if (!mountedRef.current) return;
        }
      }
      setItems(data.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')));
      setLoading(false);
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (!mountedRef.current) return;
      setError(err.message);
      toast.error("Couldn't load data");
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function create(fields) {
    const id = ulid();
    const item = { id, created_at: new Date().toISOString(), ...fields };
    const saved = await post(`/${resource}`, item);
    if (mountedRef.current) setItems(prev => [saved, ...prev]);
    return saved;
  }

  async function update(id, fields) {
    const existing = items.find(i => i.id === id) || {};
    const item = { ...existing, ...fields, id };
    const saved = await put(`/${resource}/${id}`, item);
    if (mountedRef.current) setItems(prev => prev.map(i => i.id === id ? saved : i));
    return saved;
  }

  async function remove(id) {
    await del(`/${resource}/${id}`);
    if (mountedRef.current) setItems(prev => prev.filter(i => i.id !== id));
  }

  return { items, loading, error, create, update, remove, reload: load };
}
