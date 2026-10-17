import handler from '../../api/telegram-events.js'
import { adaptApiHandler } from '../../server/netlify-adapter.js'

export default adaptApiHandler(handler)
