#!/bin/sh
# main.js = the bright world (from ../style-bright) + this video's shots
cd "$(dirname "$0")" && cat web/world.part.js web/shots.part.js > web/main.js
python3 -c "import json;d=json.load(open('voice/timings.json'));open('web/timings.js','w').write('export default '+json.dumps(d)+';\n')"
