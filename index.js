const actions = require('@actions/core');
const github = require('@actions/github');
const cache = require('@actions/tool-cache')
const semver = require('semver');
const os = require('os');
const path = require('path');

async function resolveLatest(version) {
  return '0.1.0';
}

async function downloadGyro(version) {
  const [ os_tag, ext ] = {
    linux: ["linux", "tar.gz"],
    darwin: ["macos", "tar.gz"],
    win32: ["windows", "zip"],
  }[os.platform()];

  const name = `gyro-${version}-${os_tag}-x86_64`;
  const dl_path = await cache.downloadTool(`https://github.com/mattnite/gyro/releases/download/${version}/${name}.${ext}`);
  const gyro_path = ext === 'zip'
    ? await cache.extractZip(dl_path)
    : await cache.extractTar(dl_path);
  const bin_path = path.join(gyro_path, name, 'bin');
  return await cache.cacheDir(bin_path, 'gyro', name)
}

async function main() {
  let version = actions.getInput('version') || 'latest';
  if (version === 'latest') {
    version = await resolveLatest(version);
  } else if (!semver.valid(version)) {
    actions.setFailed(`${version} is an invalid version`);
    return;
  }

  let gyro_path = cache.find('gyro', version);
  if (!gyro_path)
    gyro_path = await downloadGyro(version);

  actions.addPath(gyro_path);
}

main().catch((err) => {
  console.error(err.stack)
  actions.setFailed(err.message)
  process.exit(1)
})
