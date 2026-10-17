import handler from '../../api/admin.js'
import { adaptApiHandler } from '../../server/netlify-adapter.js'

export default adaptApiHandler(handler)
