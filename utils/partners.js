const path = require('path')
const fs   = require('fs')

const FILE = path.join(__dirname, '../data/partners.json')

function readPartners()      { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return {} } }
function writePartners(data) { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)) }

module.exports = { readPartners, writePartners }
