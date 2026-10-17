type ApiHandler = (req: { method: string; headers: Record<string, string>; body?: string }, res: any) => unknown

// Preserve the existing API authorization and validation on Netlify's Web API runtime.
export function adaptApiHandler(handler: ApiHandler) {
  return async (request: Request): Promise<Response> => {
    let status = 200
    let response: Response | undefined
    const res = {
      status(code: number) { status = code; return res },
      json(body: unknown) {
        response = new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
        })
      },
    }
    try {
      const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text()
      if (body && new TextEncoder().encode(body).byteLength > 128 * 1024) {
        res.status(413).json({ error: 'Request is too large.' })
      } else {
        await handler({ method: request.method, headers: Object.fromEntries(request.headers.entries()), body }, res)
      }
    } catch {
      // Do not expose upstream errors, credentials or token-bearing URLs to clients.
      res.status(500).json({ error: 'The request could not be completed. Please try again.' })
    }
    return response || new Response('{"error":"No API response."}', { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  }
}
