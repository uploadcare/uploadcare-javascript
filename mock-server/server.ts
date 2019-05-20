import Koa from 'koa'
import * as route from 'koa-route'
import * as base from './controllers/base'
import * as fromUrl from './controllers/from_url'
import * as info from './controllers/info'
import addTrailingSlashes from 'koa-add-trailing-slashes'

// Middleware
// import auth from './middleware/auth'
// import multipart from './middleware/multipart'

import {PORT} from './config'

const app = new Koa()

// Use middleware
app.use(addTrailingSlashes())
// app.use(multipart)
// app.use(auth)

// Routes
app.use(route.post('/base', base.index))
app.use(route.post('/from_url', fromUrl.index))
app.use(route.get('/from_url/status', fromUrl.status))
app.use(route.get('/info', info.uuid))

// Handle errors
app.on('error', (err, ctx) => {
  console.error('💔 Server error:')
  console.error(err)
  console.error(ctx)
});

// Listen server
app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`)
})
