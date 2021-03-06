const isUrl = require('./is-url')
const addAuth = require('./add-auth')
const path = require('path')
const s3urls = require('s3urls')

const getIo = (elasticdump, type) => {
  let EntryProto
  if (elasticdump.options[type] && !elasticdump.options[`${type}Transport`]) {
    if (isUrl(elasticdump.options[type])) {
      elasticdump[`${type}Type`] = 'elasticsearch'
      if (elasticdump.options.httpAuthFile) {
        elasticdump.options[type] = addAuth(elasticdump.options[type], elasticdump.options.httpAuthFile)
      }
    } else if (s3urls.valid(elasticdump.options[type])) {
      elasticdump[`${type}Type`] = 's3'
    } else {
      elasticdump[`${type}Type`] = 'file'
    }

    const inputOpts = {
      index: elasticdump.options[`${type}-index`],
      headers: elasticdump.options.headers,
      type
    }

    if (type === 'output') {
      Object.assign(inputOpts, {
        prefix: elasticdump.options.prefix,
        suffix: elasticdump.options.suffix
      })
    }

    try {
      //electron 开发模式
      EntryProto = global.require(path.join(__dirname, 'transports', elasticdump[`${type}Type`]).substr(13))[elasticdump[`${type}Type`]]
    }catch (e) {
      try {
        //electron 打包
        EntryProto = global.require(path.join(__dirname, '../../node_modules/elasticdump/lib/transports', elasticdump[`${type}Type`]))[elasticdump[`${type}Type`]]
      }catch (e) {
        //electron
        EntryProto = global.require(path.join(__dirname, 'transports', elasticdump[`${type}Type`]))[elasticdump[`${type}Type`]]
      }
    }

    elasticdump[type] = (new EntryProto(elasticdump, elasticdump.options[type], inputOpts))
  } else if (elasticdump.options[`${type}Transport`]) {
    elasticdump[`${type}Type`] = String(elasticdump.options[`${type}Transport`])
    EntryProto = global.require(elasticdump.options[`${type}Transport`])
    const EntryProtoKeys = Object.keys(EntryProto)
    elasticdump[type] = (new EntryProto[EntryProtoKeys[0]](elasticdump, elasticdump.options[type], elasticdump.options[`${type}-index`]))
  }
}

module.exports = getIo
