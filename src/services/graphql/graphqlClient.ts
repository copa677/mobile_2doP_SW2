/**
 * Cliente HTTP para consumo de endpoints GraphQL en los microservicios
 * (ms-gimnasio en puerto 8082 y ms-entrenamiento en puerto 8083)
 */
export async function fetchGraphQL<T>(
  url: string,
  query: string,
  variables: Record<string, any> = {},
  token?: string,
  timeoutMs: number = 10000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors.map((e: any) => e.message).join(' | '));
    }
    return json.data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

