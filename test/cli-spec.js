'use strict'
const assert = require('assert')
const exec = require('child_process').exec
const fs = require('fs')
const os = require('os')
const path = require('path')
const rimraf = require('rimraf')

const compDirs = require('./util/compareDirectories')
const compFiles = require('./util/compareFiles')

describe('command line interface', function () {
  beforeEach(function () {
    rimraf.sync(path.join(__dirname, '..', 'tmp'))
  })
  it('should create archive from directory', function (done) {
    exec('node bin/ashar p test/input/packthis/ tmp/packthis-cli.ashar', function (error, stdout, stderr) {
      if (error != null) return done(error)
      done(compFiles('tmp/packthis-cli.ashar', 'test/expected/packthis.ashar'))
    })
  })
  it('should create archive from directory without hidden files', function (done) {
    exec('node bin/ashar p test/input/packthis/ tmp/packthis-without-hidden-cli.ashar --exclude-hidden', function (error, stdout, stderr) {
      if (error != null) return done(error)
      done(compFiles('tmp/packthis-without-hidden-cli.ashar', 'test/expected/packthis-without-hidden.ashar'))
    })
  })
  it('should create archive from directory with unpacked files', function (done) {
    exec('node bin/ashar p test/input/packthis/ tmp/packthis-unpack-cli.ashar --unpack *.png --exclude-hidden', function (error, stdout, stderr) {
      if (error != null) return done(error)
      assert.ok(fs.existsSync('tmp/packthis-unpack-cli.ashar.unpacked/dir2/file2.png'))
      done(compFiles('tmp/packthis-unpack-cli.ashar', 'test/expected/packthis-unpack.ashar'))
    })
  })
  it('should list files/dirs in archive', function (done) {
    exec('node bin/ashar l test/input/extractthis.ashar', function (error, stdout, stderr) {
      if (error != null) return done(error)
      const actual = stdout
      let expected = fs.readFileSync('test/expected/extractthis-filelist.txt', 'utf8') + '\n'
      // on windows replace slashes with backslashes and crlf with lf
      if (os.platform() === 'win32') {
        expected = expected.replace(/\//g, '\\').replace(/\r\n/g, '\n')
      }
      done(assert.equal(actual, expected))
    })
  })
  it('should list files/dirs in archive with unpacked files', function (done) {
    exec('node bin/ashar l test/input/extractthis-unpack.ashar', function (error, stdout, stderr) {
      if (error != null) return done(error)
      const actual = stdout
      let expected = fs.readFileSync('test/expected/extractthis-filelist.txt', 'utf8') + '\n'
      // on windows replace slashes with backslashes and crlf with lf
      if (os.platform() === 'win32') {
        expected = expected.replace(/\//g, '\\').replace(/\r\n/g, '\n')
      }
      done(assert.equal(actual, expected))
    })
  })
  it('should list files/dirs with multibyte characters in path', function (done) {
    exec('node bin/ashar l test/expected/packthis-unicode-path.ashar', function (error, stdout, stderr) {
      if (error != null) return done(error)
      const actual = stdout
      let expected = fs.readFileSync('test/expected/packthis-unicode-path-filelist.txt', 'utf8') + '\n'
      // on windows replace slashes with backslashes and crlf with lf
      if (os.platform() === 'win32') {
        expected = expected.replace(/\//g, '\\').replace(/\r\n/g, '\n')
      }
      done(assert.equal(actual, expected))
    })
  })
  // we need a way to set a path to extract to first, otherwise we pollute our project dir
  // or we fake it by setting our cwd, but I don't like that
  /*
  it('should extract a text file from archive', function(done) {
    exec('node bin/ashar ef test/input/extractthis.ashar dir1/file1.txt', function (error, stdout, stderr) {
      const actual = fs.readFileSync('tmp/file1.txt', 'utf8');
      let expected = fs.readFileSync('test/expected/extractthis/dir1/file1.txt', 'utf8');
      // on windows replace crlf with lf
      if (os.platform() === 'win32') {
        expected = expected.replace(/\r\n/g, '\n');
      }
      done(assert.equal(actual, expected));
    });
  });

    it('should extract a binary file from archive', function(done) {
      exec('node bin/ashar ef test/input/extractthis.ashar dir2/file2.png', function (error, stdout, stderr) {
        const actual = fs.readFileSync('tmp/file2.png', 'utf8');
        const expected = fs.readFileSync('test/expected/extractthis/dir2/file2.png', 'utf8');
        done(assert.equal(actual, expected));
      });
    });
  */
  it('should extract an archive', function (done) {
    exec('node bin/ashar e test/input/extractthis.ashar tmp/extractthis-cli/', function (error, stdout, stderr) {
      if (error != null) return done(error)
      compDirs('tmp/extractthis-cli/', 'test/expected/extractthis', done)
    })
  })
  it('should extract an archive with unpacked files', function (done) {
    exec('node bin/ashar e test/input/extractthis-unpack.ashar tmp/extractthis-unpack-cli/', function (error, stdout, stderr) {
      if (error != null) return done(error)
      compDirs('tmp/extractthis-unpack-cli/', 'test/expected/extractthis', done)
    })
  })
  it('should create archive from directory with unpacked dirs', function (done) {
    exec('node bin/ashar p test/input/packthis/ tmp/packthis-unpack-dir-cli.ashar --unpack-dir dir2 --exclude-hidden', function (error, stdout, stderr) {
      if (error != null) return done(error)
      assert.ok(fs.existsSync('tmp/packthis-unpack-dir-cli.ashar.unpacked/dir2/file2.png'))
      assert.ok(fs.existsSync('tmp/packthis-unpack-dir-cli.ashar.unpacked/dir2/file3.txt'))
      done(compFiles('tmp/packthis-unpack-dir-cli.ashar', 'test/expected/packthis-unpack-dir.ashar'))
    })
  })
  it('should create archive from directory with unpacked dirs specified by glob pattern', function (done) {
    const tmpFile = 'tmp/packthis-unpack-dir-glob-cli.ashar'
    const tmpUnpacked = 'tmp/packthis-unpack-dir-glob-cli.ashar.unpacked'
    exec('node bin/ashar p test/input/packthis-glob/ ' + tmpFile + ' --unpack-dir "{x1,x2}" --exclude-hidden', function (error, stdout, stderr) {
      if (error != null) return done(error)
      assert.ok(fs.existsSync(tmpUnpacked + '/x1/file1.txt'))
      assert.ok(fs.existsSync(tmpUnpacked + '/x2/file2.txt'))
      done(compFiles(tmpFile, 'test/expected/packthis-unpack-dir-glob.ashar'))
    })
  })
  it('should create archive from directory with unpacked dirs specified by globstar pattern', function (done) {
    const tmpFile = 'tmp/packthis-unpack-dir-globstar-cli.ashar'
    const tmpUnpacked = 'tmp/packthis-unpack-dir-globstar-cli.ashar.unpacked'
    exec('node bin/ashar p test/input/packthis-glob/ ' + tmpFile + ' --unpack-dir "**/{x1,x2}" --exclude-hidden', function (error, stdout, stderr) {
      if (error != null) return done(error)
      assert.ok(fs.existsSync(tmpUnpacked + '/x1/file1.txt'))
      assert.ok(fs.existsSync(tmpUnpacked + '/x2/file2.txt'))
      assert.ok(fs.existsSync(tmpUnpacked + '/y3/x1/file4.txt'))
      assert.ok(fs.existsSync(tmpUnpacked + '/y3/z1/x2/file5.txt'))
      done(compFiles(tmpFile, 'test/expected/packthis-unpack-dir-globstar.ashar'))
    })
  })
  it('should create archive from directory with unpacked dirs specified by foo/{bar,baz} style pattern', function (done) {
    const tmpFile = 'tmp/packthis-unpack-dir-globstar-cli.ashar'
    const tmpUnpacked = 'tmp/packthis-unpack-dir-globstar-cli.ashar.unpacked'
    exec('node bin/ashar p test/input/packthis-glob/ ' + tmpFile + ' --unpack-dir "y3/{x1,z1}" --exclude-hidden', function (error, stdout, stderr) {
      if (error != null) return done(error)
      assert.ok(fs.existsSync(tmpUnpacked + '/y3/x1/file4.txt'))
      assert.ok(fs.existsSync(tmpUnpacked + '/y3/z1/x2/file5.txt'))
      done()
    })
  })
  it('should list files/dirs in archive with unpacked dirs', function (done) {
    exec('node bin/ashar l test/expected/packthis-unpack-dir.ashar', function (error, stdout, stderr) {
      if (error != null) return done(error)
      const actual = stdout
      let expected = fs.readFileSync('test/expected/extractthis-filelist.txt', 'utf8') + '\n'
      // on windows replace slashes with backslashes and crlf with lf
      if (os.platform() === 'win32') {
        expected = expected.replace(/\//g, '\\').replace(/\r\n/g, '\n')
      }
      done(assert.equal(actual, expected))
    })
  })
  it('should extract an archive with unpacked dirs', function (done) {
    exec('node bin/ashar e test/input/extractthis-unpack-dir.ashar tmp/extractthis-unpack-dir/', function (error, stdout, stderr) {
      if (error != null) return done(error)
      compDirs('tmp/extractthis-unpack-dir/', 'test/expected/extractthis', done)
    })
  })
  it('should create archive from directory with unpacked dirs and files', function (done) {
    exec('node bin/ashar p test/input/packthis/ tmp/packthis-unpack-dir-file-cli.ashar --unpack *.png --unpack-dir dir2 --exclude-hidden', function (error, stdout, stderr) {
      if (error != null) return done(error)
      assert.ok(fs.existsSync('tmp/packthis-unpack-dir-file-cli.ashar.unpacked/dir2/file2.png'))
      assert.ok(fs.existsSync('tmp/packthis-unpack-dir-file-cli.ashar.unpacked/dir2/file3.txt'))
      done(compFiles('tmp/packthis-unpack-dir-file-cli.ashar', 'test/expected/packthis-unpack-dir.ashar'))
    })
  })
  it('should create archive from directory with unpacked subdirs and files', function (done) {
    exec('node bin/ashar p test/input/packthis-subdir/ tmp/packthis-unpack-subdir-cli.ashar --unpack *.txt --unpack-dir dir2/subdir --exclude-hidden', function (error, stdout, stderr) {
      if (error != null) return done(error)
      assert.ok(fs.existsSync('tmp/packthis-unpack-subdir-cli.ashar.unpacked/file0.txt'))
      assert.ok(fs.existsSync('tmp/packthis-unpack-subdir-cli.ashar.unpacked/dir1/file1.txt'))
      assert.ok(fs.existsSync('tmp/packthis-unpack-subdir-cli.ashar.unpacked/dir2/subdir/file2.png'))
      assert.ok(fs.existsSync('tmp/packthis-unpack-subdir-cli.ashar.unpacked/dir2/subdir/file3.txt'))
      done()
    })
  })
})
