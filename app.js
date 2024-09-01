import Fastify from 'fastify'
import fastifyRange from 'fastify-range'
import fastifyFavicon from 'fastify-favicon'
import fs from 'node:fs'

const app = Fastify({ logger: true })

await app.register(fastifyRange)
await app.register(fastifyFavicon)

app.get('/', async () => {
  return fs.createReadStream('./index.html')
})

app.get('/video-streaming', async (request, reply) => {
  const videoPath = './video.mp4'

  const videoSize = fs.statSync(videoPath).size

  const range = request.range(videoSize)
  request.log.info({ range })
  if (!range) {
    const error = new Error('Range Not Satisfiable')
    error.statusCode = 416
    throw error
  }

  const { start } = range.ranges[0]
  const chunkSize = 1 * 1e6
  const end = Math.min(start + chunkSize - 1, videoSize - 1)
  const contentLength = end - start + 1

  reply.code(206)
  reply.headers({
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength
  })

  reply.type('video/mp4')

  const stream = fs.createReadStream(videoPath, { start, end })
  return stream
})

await app.listen({ port: 8080 })
