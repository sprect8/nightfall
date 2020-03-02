const os = require('os');
const fs = require('fs');
// const path = require('path');
// const logger = require('../logger');

function keyExtractor(solFilePath) {
  const solData = fs
    .readFileSync(solFilePath)
    .toString('UTF8')
    .split(os.EOL);
  const jsonTxt = [];
  jsonTxt.push('{');
  solData.forEach(el => {
    let m;
    // eslint-disable-next-line no-cond-assign
    if ((m = el.trim().match(/^vk\..*/)) && !m[0].includes('new')) {
      jsonTxt.push(
        m[0]
          .replace(/Pairing\.G.Point/, '')
          .replace(/\);/, ']')
          .replace(/\(/, '[')
          .replace(/(0x[0-9a-f]*?)([,\]])/g, '"$1"$2')
          .replace(/^(vk\..*?) = /, '"$1": ')
          .replace(/$/, ',')
          .replace(/vk\./, '')
          .replace(/"IC\[0\]":/, '"IC": [')
          .replace(/"IC\[\d*?\]":/, '')
          .replace(/"query\[0\]":/, '"query": [') // added for GM17
          .replace(/"query\[\d*?\]":/, '') // added for GM17
          .replace(/uint256/g, '') // added for ZoKrates 0.4.10
          .replace(/\(/g, '"') // added for ZoKrates 0.4.10
          .replace(/\)/g, '"') // added for ZoKrates 0.4.10
          .replace('"h"', '"H"')
          .replace('g_alpha', 'Galpha')
          .replace('h_beta', 'Hbeta')
          .replace('g_gamma', 'Ggamma')
          .replace('h_gamma', 'Hgamma'),
      );
    }
  });
  const l = jsonTxt.length - 1;
  jsonTxt[l] = `${jsonTxt[l].substring(0, jsonTxt[l].length - 1)}]`; // remove last comma
  jsonTxt.push('}');
  return jsonTxt.join('\n');
}

describe('Json test', () => {
  test('Should create vk file', async () => {
    const codeFileDirectory = './code/gm17/ft-burn';
    const codeFile = 'ft-burn.zok';
    const vkJson = await keyExtractor(`${codeFileDirectory}/verifier.sol`, true);
    // Create a JSON with the file name but without .code
    fs.writeFileSync(`${codeFileDirectory}/${codeFile.split('.')[0]}-vk.json`, vkJson, err => {
      if (err) {
        console.log(err);
      }
    });
  });
});
