import handler from '../../api/member-auth.js'
import { adaptApiHandler } from '../../server/netlify-adapter.js'

export default adaptApiHandler(handler)
