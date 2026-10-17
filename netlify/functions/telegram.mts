import handler from '../../api/telegram.js'
import { adaptApiHandler } from '../../server/netlify-adapter.js'

export default adaptApiHandler(handler)
